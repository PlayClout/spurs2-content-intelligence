/** Producer UI: layout, smart trim from live beats, approval, channels, settings, redirects, search (ported from the session's Chrome walk; run via `npm run test:ui`). */
import { BASE, sql, openBrowser, runWorkerOnce, reporter } from "./harness";

export async function producerWalk() {
  const r = reporter("producerWalk");
  const { browser, page, errors } = await openBrowser();
  const { smartTrim, beatsFrom, targetFor } = await import("../../shared/smart-trim");
  type Profile = { label: string; targetDurationSec: number[]; maxDurationSec: number };
  type Beat = { label: string; start: number; end: number };
  const PROFILES = (await import("../../pipeline/channel-profiles.json", { with: { type: "json" } })).default as unknown as Record<string, Profile>;
  try {
  const [org] = await sql`select id from orgs where name='Tottenham Hotspur'`;
  const [sol] = await sql`select id from opportunities where org_id=${org.id} and content_type='reel' and headline ilike 'SOLANKE%'`;
  await page.goto(`${BASE}/?org=${org.id}`, { waitUntil: "networkidle" });

  // ── inbox layout ────────────────────────────────────────────────────────────────
  const ih = await page.locator("main h1").boundingBox();
  r.check(!!ih && ih.width <= 1 && ih.height <= 1, "inbox has no visible page title (screen-reader h1 only)");
  const nav = await page.locator('nav[aria-label="Main"] a').allInnerTexts();
  r.check(JSON.stringify(nav.map((t) => t.replace(/\d+$/, "").trim())) === JSON.stringify(["Live match", "Inbox", "Library", "Approved", "Published", "Montages", "Settings"]), `sidebar: ${nav.map((t) => t.replace(/\s+/g, " ")).join(" | ")}`);
  r.check(!(await page.getByRole("link", { name: /write-back/i }).count()), "write-back is not a main menu item");
  const rows = page.locator('section[aria-label="Queue"] a[href*="opp="]');
  r.check(await rows.count() >= 6, `queue lists the open clips (${await rows.count()})`);
  const first = await rows.first().innerText();
  r.check(/(Act now|Rising)/.test(first) && /Snooze/.test(first), `a hot clip leads the queue, with its why-now line (${first.split("\n")[0]})`);
  r.check(/Snooze/.test(first), "hot row carries an inline Snooze");
  const titlesAll = await page.locator('section[aria-label="Queue"] a p.line-clamp-2').allInnerTexts();
  r.check(titlesAll.includes("So close from Sávio"), `headlines read in sentence case with proper names (${titlesAll.find((t) => /close/.test(t))})`);
  await page.goto(`${BASE}/?org=${org.id}&opp=${sol.id}`, { waitUntil: "networkidle" });
  const approveBtn = page.getByRole("button", { name: /^Approve$/ });
  const box = await approveBtn.boundingBox();
  r.check(!!box && box.y + box.height <= 900, "Approve is visible without scrolling");
  
  // ── smart trim on the real stored beats ─────────────────────────────────────────
  // beat labels come from the live TwelveLabs analysis of this replay: read them, never hard-code them
  const [mm] = await sql`select m.raw->'moments' b from opportunities o join moments m on m.id=o.moment_id where o.id=${sol.id}`;
  const liveBeats = mm.b as Beat[];
  const beatLabels = liveBeats.map((x) => x.label);
  const [dw] = await sql`select delivery->'window' w from opportunities where id=${sol.id}`;
  const beatsLive = beatsFrom({ moments: mm.b }, dw.w);
  const exp = (ch: string) => smartTrim({ beats: beatsLive, analysed: dw.w, focus: null, target: targetFor(PROFILES[ch]) });
  const reelCut = exp("instagram_reel"), ytCut = exp("youtube_short");
  console.log(`  live beats: ${liveBeats.map((x) => `${x.label} ${x.start}-${x.end}`).join(" | ")}; expected Reel ${reelCut.start}-${reelCut.end}`);
  const reason = await page.getByTestId("trim-reason").innerText();
  r.check(reason === reelCut.reason, `smart trim reason from real beats: "${reason}"`);
  const beatsText = await page.getByLabel("Beats detected in the footage").innerText();
  r.check(beatLabels.every((l: string) => beatsText.includes(l)), `beat bar shows the TwelveLabs beats (${beatLabels.join(" | ")})`);
  const head = await page.locator("text=/\\d+\\.\\ds to \\d+\\.\\ds · \\d+\\.\\ds/").first().innerText();
  r.check(head.includes(`${reelCut.start.toFixed(1)}s to ${reelCut.end.toFixed(1)}s · ${reelCut.lengthSec.toFixed(1)}s`), `Instagram Reel cut matches shared smartTrim on the live beats: ${head}`);
  await page.getByRole("button", { name: new RegExp(`YouTube Short ${ytCut.lengthSec.toFixed(1)}s`) }).click();
  await page.waitForTimeout(200);
  r.check(!ytCut.note || (await page.getByTestId("trim-reason").innerText()).includes(ytCut.note), `YouTube Short shows its own cut and note (${ytCut.lengthSec}s${ytCut.note ? ", " + ytCut.note : ""})`);
  await page.getByRole("radio", { name: "Manual" }).click();
  r.check(await page.getByLabel("Trim start (sec)").count() === 1, "Manual mode shows start/end inputs");
  await page.getByRole("radio", { name: "Smart" }).click();

  // ── approve uses the smart cut ──────────────────────────────────────────────────
  await page.getByRole("button", { name: /Instagram Reel/ }).first().click();
  await approveBtn.click();
  await page.waitForTimeout(1500);
  const [o] = await sql`select status, trim_override t, delivery->>'trimMode' m from opportunities where id=${sol.id}`;
  r.check(o.status === "approved" && o.t?.startSec === reelCut.start && o.t?.endSec === reelCut.end && o.m === "smart", `approval stores the smart cut (${JSON.stringify(o.t)}, ${o.m})`);
  const [job] = await sql`select payload->'trimOverride' t from jobs where type='render_final' and payload->>'opportunityId'=${sol.id} order by queued_at desc limit 1`;
  r.check(job?.t?.startSec === reelCut.start && job?.t?.endSec === reelCut.end, "final render job uses the smart cut");
  const [wb] = await sql`select payload->'request'->'log' l from write_back_jobs where subject_id=${sol.id} or payload::text like ${"%" + sol.id + "%"} limit 1`;
  r.check(wb?.l?.startSec === reelCut.start && wb?.l?.endSec === reelCut.end, "ScorePlay log records the same cut");
  r.check(await page.getByRole("tab", { name: /Channels/ }).getAttribute("aria-selected") === "true", "after approval the Channels tab opens");
  runWorkerOnce();
  
  // ── channels: per-channel smart cuts ────────────────────────────────────────────
  await page.goto(`${BASE}/?org=${org.id}&opp=${sol.id}&tab=channels`, { waitUntil: "networkidle" });
  const pk = page.getByLabel("Channel packaging");
  const pkText = await pk.innerText();
  r.check(pkText.includes(`9:16 · 1080×1920 · ${reelCut.lengthSec.toFixed(1)}s`) && pkText.includes(`${ytCut.lengthSec.toFixed(1)}s`), "Channels show each channel's own smart length");
  r.check(await pk.getByRole("checkbox", { name: /^Include / }).count() === 9, "9 destinations listed");

  // ── needs-review clip: override reason required ─────────────────────────────────
  const [away] = await sql`select id, status from opportunities where org_id=${org.id} and content_type='reel' and headline ilike 'THE AWAY END%'`;
  await sql`update opportunities set status='needs_review' where id=${away.id}`;
  await page.goto(`${BASE}/?org=${org.id}&opp=${away.id}`, { waitUntil: "networkidle" });
  r.check(/Rights need a decision\./.test(await page.locator("body").innerText()), "needs-review clip shows the amber rights callout");
  r.check(await page.getByRole("button", { name: /^Approve$/ }).isDisabled(), "Approve disabled until an override reason is entered");
  await page.getByLabel("Override reason").fill("Club-owned channels only, fans not identifiable");
  r.check(!(await page.getByRole("button", { name: /^Approve$/ }).isDisabled()), "Approve enabled once the reason is entered");
    await sql`update opportunities set status=${away.status} where id=${away.id}`;

  // ── Approved, Published, Montages, Settings ─────────────────────────────────────
  await page.goto(`${BASE}/approved?org=${org.id}`, { waitUntil: "networkidle" });
  r.check(/Solanke rescues a point/.test(await page.locator("table").innerText()), "Approved lists the approved Solanke clip");
  await page.getByRole("link", { name: "Publish", exact: true }).first().click();
  await page.waitForURL((u) => u.searchParams.get("tab") === "fan", { timeout: 10000 }).catch(() => {});
  await page.getByText("Publish to the fan app").waitFor({ timeout: 10000 }).catch(() => {});
  r.check(new URL(page.url()).searchParams.get("tab") === "fan" && /Publish to the fan app/.test(await page.locator("body").innerText()), "Approved → Publish opens the clip on its Fan app tab");
  for (const [path, re] of [["/published", /Published/], ["/montages", /Montages/], ["/settings", /Settings/]] as const) {
    await page.goto(`${BASE}${path}?org=${org.id}`, { waitUntil: "networkidle" });
    r.check(re.test(await page.locator("main h1").innerText()), `${path} renders`);
  }
  await page.getByRole("link", { name: "Write-back history" }).click();
  await page.waitForURL((u) => u.searchParams.get("tab") === "writeback", { timeout: 10000 }).catch(() => {});
  await page.getByRole("heading", { name: "History" }).waitFor({ timeout: 10000 }).catch(() => {});
  const wbText = await page.locator("main").innerText();
  r.check(/History/.test(wbText) && /Solanke rescues a point/.test(wbText) && /Held/.test(wbText), "Settings → Write-back history shows the held Solanke log");
  r.check(wbText.includes(`${reelCut.start.toFixed(1)}s to ${reelCut.end.toFixed(1)}s`), "history shows the exact window that was written");
  r.check(await page.getByRole("switch", { name: "Pause write-back" }).count() === 1, "pause switch lives under the history");
    await page.getByRole("link", { name: "Rights rules" }).click();
  await page.waitForURL((u) => u.searchParams.get("tab") === "rules", { timeout: 10000 }).catch(() => {});
  await page.getByText("Active version").waitFor({ timeout: 10000 }).catch(() => {});
  r.check(/Active version/.test(await page.locator("main").innerText()), "Settings → Rights rules renders");
  
  // old URLs redirect
  await page.goto(`${BASE}/admin?org=${org.id}`, { waitUntil: "networkidle" });
  r.check(new URL(page.url()).pathname === "/settings", "/admin redirects to Settings");
  await page.goto(`${BASE}/admin/rules?org=${org.id}`, { waitUntil: "networkidle" });
  r.check(new URL(page.url()).searchParams.get("tab") === "rules", "/admin/rules redirects to Settings → Rights rules");
  // fan app keeps its own dark look (producer theme is scoped)
  await page.goto(`${BASE}/fan?org=${org.id}`, { waitUntil: "networkidle" });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  r.check(!(await page.locator(".producer").count()) && bg !== "rgb(246, 247, 249)", `fan app is untouched by the producer theme (body ${bg})`);
  // search filters the inbox
  await page.goto(`${BASE}/?org=${org.id}`, { waitUntil: "networkidle" });
  await page.getByLabel("Search clips").fill("sávio");
  await page.getByLabel("Search clips").press("Enter");
  await page.waitForURL((u) => !!u.searchParams.get("q"), { timeout: 10000 }).catch(() => {});
  await page.getByLabel("Clear search").waitFor({ timeout: 10000 }).catch(() => {});
  const titles = await page.locator('section[aria-label="Queue"] a p.line-clamp-2').allInnerTexts();
  r.check(titles.length > 0 && titles.every((t) => /sávio/i.test(t)), `search filters the queue (${titles.join(", ")})`);
  await page.locator('section[aria-label="Queue"] a[href*="opp="]').first().getByRole("button", { name: "Snooze" }).click();
  await page.waitForTimeout(1200);
  const [sn] = await sql`select count(*)::int n from opportunities where org_id=${org.id} and delivery->'alert'->>'snoozedUntil' is not null`;
  r.check(sn.n >= 1, "Snooze on a hot row persists the snooze");

  r.check(errors.length === 0, `zero page/console errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`);
  } catch (e) {
    r.check(false, `walk threw: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
  }
  return r.summary();
}
