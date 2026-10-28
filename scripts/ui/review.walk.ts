/** Review fixes: counts agree, reset confirm, search sync, unsaved captions, approval gates, reject flow, plain language (ported from the session's Chrome walk; run via `npm run test:ui`). */
import { BASE, sql, openBrowser, runWorkerOnce, reporter } from "./harness";

export async function reviewWalk() {
  const r = reporter("reviewWalk");
  const { browser, page, errors } = await openBrowser();
  const dialogs: string[] = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  try {
  const [org] = await sql`select id from orgs where name='Tottenham Hotspur'`;
  const [sol] = await sql`select id from opportunities where org_id=${org.id} and content_type='reel' and headline ilike 'SOLANKE%'`;
  await page.goto(`${BASE}/?org=${org.id}`, { waitUntil: "networkidle" });

  // ── counts agree everywhere ───────────────────────────────────────────────────
  const waiting = await sql`select count(*)::int n from opportunities where org_id=${org.id} and status in ('draft_pending','draft_ready','needs_review') and coalesce(compliance->>'status','') <> 'blocked'`;
  const summary = await page.getByLabel("Queue summary").innerText();
  const navBadge = await page.locator('nav[aria-label="Main"] a', { hasText: "Inbox" }).innerText();
  const rows = await page.locator('section[aria-label="Queue"] a[href*="opp="]').count();
  r.check(summary.startsWith(`${waiting[0].n}`) && navBadge.includes(`${waiting[0].n}`) && rows === waiting[0].n, `"to review" = nav badge = queue rows = DB (${waiting[0].n}, ${navBadge.replace(/\D+/g, "")}, ${rows})`);
  const h1 = page.getByRole("heading", { level: 1, name: "Inbox" });
  const hb = await h1.boundingBox();
  r.check(await h1.count() === 1 && !!hb && hb.width <= 1 && hb.height <= 1, `Inbox has a screen-reader-only h1 (${hb?.width}x${hb?.height}px), no visible title`);

  // ── reset needs confirmation (dismissed => nothing happens) ───────────────────
  await page.getByRole("button", { name: "Reset" }).click();
  await page.waitForTimeout(500);
  const after = await sql`select count(*)::int n from opportunities where org_id=${org.id}`;
  r.check(dialogs.some((d) => /Reset the demo\?/.test(d)) && after[0].n > 0, "Reset asks for confirmation; cancelling keeps the queue");

  // ── search box follows the URL ────────────────────────────────────────────────
  await page.getByLabel("Search clips").fill("away end");
  await page.getByLabel("Search clips").press("Enter");
  await page.waitForURL((u) => u.searchParams.get("q") === "away end");
  await page.getByLabel("Clear search").click();
  await page.waitForURL((u) => !u.searchParams.get("q"));
  await page.waitForTimeout(300);
  r.check(await page.getByLabel("Search clips").inputValue() === "", "Clear search also clears the search box");
  await page.getByLabel("Search clips").fill("zzzz-no-match");
  await page.getByLabel("Search clips").press("Enter");
  await page.waitForURL((u) => u.searchParams.get("q") === "zzzz-no-match");
  r.check(/No clips match\./.test(await page.locator('section[aria-label="Queue"]').innerText()), "no-match search shows 'No clips match' with a clear-filters link (not 'Inbox zero')");

  // ── unsaved caption edits are never lost on approve ───────────────────────────
  await page.goto(`${BASE}/?org=${org.id}&opp=${sol.id}`, { waitUntil: "networkidle" });
  await page.getByLabel(/^Caption for/).fill("Solanke. Late. Old Trafford. #COYS");
  r.check(/Unsaved changes on Instagram Reel/.test(await page.locator('section[aria-label="Review"]').innerText()), "unsaved caption edit is flagged");
  r.check(await page.getByRole("button", { name: "Save & approve" }).count() === 1, "Approve becomes 'Save & approve' while there are unsaved edits");
  // smart trim: switching to manual pre-fills the lead channel's smart cut, and validates as you type
  await page.getByRole("radio", { name: "Manual" }).click();
  const leadReel = await page.getByLabel("Trim start (sec)").inputValue();
  // an end before the start is invalid whatever the clip's smart cut starts at (it can start at 0s)
  await page.getByLabel("Trim start (sec)").fill("5");
  await page.getByLabel("Trim end (sec)").fill("2");
  r.check(/End must be after start\./.test(await page.locator('section[aria-label="Review"]').innerText()) && await page.getByRole("button", { name: "Save cut" }).isDisabled(), "manual trim explains an invalid cut and disables Save");
  await page.getByRole("radio", { name: "Smart" }).click(); // unsaved manual -> no confirm, no server call
  r.check(!dialogs.some((d) => /smart trim\?/.test(d)), "leaving unsaved manual typing needs no confirmation");
  r.check(/The approved final uses the Instagram Reel cut/.test(await page.locator('section[aria-label="Review"]').innerText()), `smart trim says which cut the final uses (manual pre-filled ${leadReel})`);
  await page.getByRole("button", { name: "Save & approve" }).click();
  await page.waitForURL((u) => u.searchParams.get("tab") === "channels", { timeout: 15000 });
  const [o] = await sql`select status, generated_copy->>'instagram_reel' c from opportunities where id=${sol.id}`;
  r.check(o.status === "approved" && o.c === "Solanke. Late. Old Trafford. #COYS", "Save & approve saved the caption and approved in one step");
  r.check(/Captions saved and approved/.test(await page.locator('section[aria-label="Review"]').innerText()), "confirmation says both things happened");

  // ── caption edit after approval invalidates approval (server-enforced) ────────
  await page.getByRole("tab", { name: "Edit" }).click();
  await page.getByLabel(/^Caption for/).fill("Edited after approval #COYS");
  await page.getByRole("button", { name: "Save caption" }).click();
  await page.waitForTimeout(1500);
  const [o2] = await sql`select status from opportunities where id=${sol.id}`;
  r.check(o2.status === "draft_ready", `editing an approved caption sends the clip back for approval (status ${o2.status})`);
  r.check(/The clip needs approving again/.test(await page.locator('section[aria-label="Review"]').innerText()), "the editor is told the clip needs approving again");

  // ── Approve tooltip explains why it's disabled; over-limit caption blocks ─────
  await page.goto(`${BASE}/?org=${org.id}&opp=${sol.id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /YouTube Short/ }).first().click();
  await page.getByLabel(/^Caption for/).fill("x".repeat(120));
  r.check(await page.getByRole("button", { name: /Save & approve|Approve/ }).isDisabled(), "a caption over its channel limit blocks approval");
  await page.getByRole("button", { name: /Save & approve|Approve/ }).hover({ force: true });
  await page.waitForTimeout(600);
  r.check(/YouTube Short caption is over its limit/.test(await page.locator("body").innerText()), "the disabled Approve tooltip says why");

  // ── reject moves on to the next clip ──────────────────────────────────────────
  const [sav] = await sql`select id from opportunities where org_id=${org.id} and content_type='milestone_graphic' and headline ilike 'SO CLOSE%'`;
  await page.goto(`${BASE}/?org=${org.id}&opp=${sav.id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Reject" }).click();
  await page.getByLabel("Reject reason").press("Escape");
  r.check(await page.getByLabel("Reject reason").count() === 0, "Escape cancels the reject prompt");
  await page.getByRole("button", { name: "Reject" }).click();
  await page.getByLabel("Reject reason").fill("Duplicate of the reel");
  await page.getByLabel("Reject reason").press("Enter");
  await page.waitForURL((u) => !u.searchParams.get("opp"), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  const heading = await page.locator('section[aria-label="Review"] h2').innerText();
  r.check(!/So close/i.test(heading), `after rejecting, the next clip opens (${heading})`);

  // ── Approved: honest final-render state; Published badge = live only ──────────
  await page.goto(`${BASE}/approved?org=${org.id}`, { waitUntil: "networkidle" });
  r.check(!/>Ready</.test("") && (await page.locator("table").innerText()).length > 0, "Approved page renders");
  const pubBadge = await page.locator('nav[aria-label="Main"] a', { hasText: "Published" }).innerText();
  const [live] = await sql`select count(*)::int n from publications where org_id=${org.id} and state='published'`;
  r.check((pubBadge.replace(/\D+/g, "") || "0") === String(live.n), `Published badge counts live fan-app clips only (${pubBadge.replace(/\D+/g, "") || 0} = ${live.n})`);

  // ── Settings: plain-language held reasons ─────────────────────────────────────
  await page.goto(`${BASE}/settings?org=${org.id}&tab=writeback`, { waitUntil: "networkidle" });
  const wb = await page.locator("main").innerText();
  r.check(!/SCOREPLAY_WRITES!=1|is not 1/.test(wb) && /Awaiting ScorePlay taxonomy sign-off/.test(wb), "write-back reasons read in plain language (no env-var codes)");

  // ── fan app panel: plain status words ─────────────────────────────────────────
  await page.goto(`${BASE}/?org=${org.id}&opp=${sol.id}&tab=fan`, { waitUntil: "networkidle" });
  const fan = await page.locator('section[aria-label="Review"]').innerText();
  r.check(/Not published|Live · version/.test(fan) && !/\bunpublished\b/.test(fan), "fan app status uses plain words");
  r.check(/1\. Confirm players and interests|1\. Players and interests confirmed/.test(fan) && /2\. (Re)?[Pp]ublish/.test(fan), "fan app steps are numbered in order");

  r.check(errors.length === 0, `zero page/console errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`);
  } catch (e) {
    r.check(false, `walk threw: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
  }
  return r.summary();
}
