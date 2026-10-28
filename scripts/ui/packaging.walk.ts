/** Hot-clip alerts + channel packaging: 9 real renditions, per-channel edits, fan-app step (ported from the session's Chrome walk; run via `npm run test:ui`). */
import { BASE, sql, openBrowser, runWorkerOnce, reporter } from "./harness";

export async function packagingWalk() {
  const r = reporter("packagingWalk");
  const { browser, page, errors } = await openBrowser();

  try {
  const [org] = await sql`select id from orgs where name='Tottenham Hotspur'`;
  await page.goto(`${BASE}/?org=${org.id}&status=all`, { waitUntil: "networkidle" });

  // ── hot-clip alerts (inline in the queue) ──────────────────────────────────────
  const reels = await sql`select o.id, o.headline, count(distinct s.id)::int n from opportunities o join signals s on s.id = any(select jsonb_array_elements_text(o.signal_ids)::uuid) where o.org_id=${org.id} and o.content_type='reel' group by 1,2 order by n desc`;
  const solanke = reels.find((x) => /SOLANKE/.test(x.headline));
  if (!solanke) throw new Error("no Solanke reel in the replay");
  r.check(solanke?.n === 2, `Solanke card really has 2 linked signals in the DB (goal + reaction) (${solanke?.n})`);
  const hotRows = page.locator('section[aria-label="Queue"] a[href*="opp="]').filter({ hasText: /Act now|Rising/ });
  r.check(await hotRows.count() >= 1, `replayed signals surface as hot clips in the queue (${await hotRows.count()})`);
  r.check(/Replay/.test(await page.locator("header").innerText()), "replay is labelled in the top bar, never shown as live");
  await page.goto(`${BASE}/?org=${org.id}&opp=${solanke.id}`, { waitUntil: "networkidle" });
  // ── packaging workspace ────────────────────────────────────────────────────────
  await page.goto(`${BASE}/?org=${org.id}&status=all&opp=${solanke.id}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^approve$/i }).click();
  await page.waitForURL((u) => u.searchParams.get("tab") === "channels", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  runWorkerOnce(); // final render + held write-back
  await page.goto(`${BASE}/?org=${org.id}&opp=${solanke.id}&tab=channels`, { waitUntil: "networkidle" });
  const pk = page.getByLabel("Channel packaging");
  const pkText = await pk.innerText();
  r.check(/Instagram Reel/.test(pkText) && /TikTok/.test(pkText) && /YouTube Short/.test(pkText) && /X \(Twitter\)/.test(pkText) && /Fan app/.test(pkText), "workspace lists every destination incl. the fan app");
  r.check(/9:16 · 1080×1920/.test(pkText) && /16:9 · 1920×1080/.test(pkText) && /4:5 · 1080×1350/.test(pkText), "each destination shows its own aspect and size");
  const boxes = pk.getByRole("checkbox", { name: /^Include /i });
  const n = await boxes.count();
  r.check(n === 9, `9 destination checkboxes (${n})`);
  // edit TikTok copy before approving
  const tik = pk.locator("div.rounded-lg", { has: page.getByRole("checkbox", { name: "Include TikTok" }) }).first();
  await tik.getByRole("button", { name: /^edit$/i }).click();
  await pk.getByLabel("TikTok copy").fill("Solanke. Old Trafford. Late. #COYS");
  await pk.getByRole("button", { name: /save tiktok/i }).click();
  await page.waitForTimeout(1500);
  const [ov] = await sql`select delivery->'packaging'->'overrides'->'tiktok'->>'copy' c from opportunities where id=${solanke.id}`;
  r.check(ov.c === "Solanke. Old Trafford. Late. #COYS", "TikTok copy edit saved as a per-destination override");
  // approve all eligible + render
  await page.goto(`${BASE}/?org=${org.id}&opp=${solanke.id}&tab=channels`, { waitUntil: "networkidle" });
  const pk2 = page.getByLabel("Channel packaging");
  for (const b of await pk2.getByRole("checkbox", { name: /^Include /i }).all()) if (!(await b.isChecked()) && await b.isEnabled()) await b.check();
  await pk2.getByRole("button", { name: /^render \d+ channels?$/i }).click();
  await page.waitForTimeout(1500);
  const [appr] = await sql`select delivery->'packaging'->'approved' a from opportunities where id=${solanke.id}`;
  r.check(Object.keys(appr.a ?? {}).length === 9, `9 destinations approved at exact revisions (${Object.keys(appr.a ?? {}).length})`);
  const wlog = runWorkerOnce();
  const [v] = await sql`select delivery->'packaging'->'variants' v, final_paths fp from opportunities where id=${solanke.id}`;
  const done = Object.entries((v.v ?? {}) as Record<string, { status: string }>).filter(([, x]) => x.status === "done");
  r.check(done.length === 9, `worker rendered all 9 destinations from real Tottenham footage (${done.length}; ${wlog.match(/render_package[^\n]*/)?.[0] ?? ""})`);
  // the UI shows them ready with playable previews
  await page.goto(`${BASE}/?org=${org.id}&opp=${solanke.id}&tab=channels`, { waitUntil: "networkidle" });
  const pk3 = page.getByLabel("Channel packaging");
  r.check(/9 of 9 ready\./.test(await pk3.innerText()), "Channels tab reports 9 of 9 ready");
  const tikVideo = pk3.getByLabel("TikTok rendition");
  const meta = await tikVideo.evaluate((el: HTMLVideoElement) => new Promise<{ w: number; h: number; d: number } | null>((res) => { if (el.readyState >= 1) res({ w: el.videoWidth, h: el.videoHeight, d: el.duration }); else el.addEventListener("loadedmetadata", () => res({ w: el.videoWidth, h: el.videoHeight, d: el.duration }), { once: true }); setTimeout(() => res(null), 8000); }));
  r.check(!!meta && meta.w === 1080 && meta.h === 1920, `TikTok preview decodes at 1080x1920 in the browser (${JSON.stringify(meta)})`);
  const xEl = pk3.getByAltText("X (photo) rendition");
  await xEl.scrollIntoViewIfNeeded();
  await page.waitForFunction((el) => !!el && (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0, await xEl.elementHandle(), { timeout: 10000 });
  const xImg = await xEl.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight]);
  r.check(xImg[0] === 1600 && xImg[1] === 900, `X photo card preview is 1600x900 (${xImg})`);
  // edit one destination after rendering -> only it goes back to needing approval
  const yt = pk3.locator("div.rounded-lg", { has: page.getByRole("checkbox", { name: "Include YouTube Short" }) }).first();
  await yt.getByRole("button", { name: /^edit$/i }).click();
  await pk3.getByLabel("YouTube Short copy").fill("Edited after render");
  await pk3.getByRole("button", { name: /save youtube short/i }).click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle");
  r.check(/8 of 9 ready\./.test(await page.getByLabel("Channel packaging").innerText()), "editing YouTube Short after render -> 8 of 9 ready (only that one needs re-approval)");
  // fan app publish is separate and still explicit
  await page.getByRole("tab", { name: "Fan app" }).click();
  r.check(await page.getByRole("button", { name: /publish to fan app/i }).count() === 1, "fan-app publish remains a separate explicit step");

  r.check(errors.length === 0, `zero page/console errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`);
  } catch (e) {
    r.check(false, `walk threw: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
  }
  return r.summary();
}
