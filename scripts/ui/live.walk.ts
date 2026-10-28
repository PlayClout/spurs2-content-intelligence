/** Live match desk: join the real full match at 89' from ScorePlay, the live engine watches it, the equaliser lands in
 * the inbox (needs the live engine: the harness starts one in the live lane). Run via `npm run test:ui`. */
import { readdirSync, readFileSync } from "node:fs";
import { BASE, REPO, RENDER_DIR, sql, openBrowser, reporter } from "./harness";

const MATCH = JSON.parse(readFileSync(`${REPO}/data/live/mnu-tot-full-match.json`, "utf8")) as { durationSec: number; periods: { id: string; from: number }[] };
const KICKOFF_FRAC = MATCH.periods.find((p) => p.id === "1H")!.from / MATCH.durationSec;

export async function liveWalk() {
  const r = reporter("liveWalk");
  const { browser, page, errors } = await openBrowser();
  try {
  const [org] = await sql`select id from orgs where name = 'Tottenham Hotspur'`;
  await page.goto(`${BASE}/live?org=${org.id}`, { waitUntil: "networkidle" });
  r.check(await page.getByRole("link", { name: /Live match/ }).first().isVisible(), "sidebar has a Live match entry");
  r.check(await page.getByRole("heading", { name: "Man Utd v Spurs" }).isVisible(), "start panel names the real match");
  await page.getByText("89'", { exact: true }).click();
  await page.getByRole("button", { name: /Go live/ }).click();
  await page.getByTestId("live-scorebug").waitFor({ timeout: 20000 });
  const v = page.locator("video");
  await page.waitForFunction(() => { const x = document.querySelector("video"); return !!x && x.readyState >= 2 && !x.paused; }, null, { timeout: 45000 });
  const t1 = await v.evaluate((x: HTMLVideoElement) => x.currentTime);
  await page.waitForTimeout(5000);
  const t2 = await v.evaluate((x: HTMLVideoElement) => x.currentTime);
  r.check(t1 > 5680 && t1 < 5710 && t2 - t1 > 3.5, `ScorePlay stream plays from 89' and advances in real time (${t1.toFixed(1)}s -> ${t2.toFixed(1)}s)`);
  r.check(/scoreplay.*amazonaws\.com/.test(await v.getAttribute("src") ?? ""), "the player streams straight from ScorePlay's presigned URL (nothing copied)");
  const bug1 = await page.getByTestId("live-scorebug").innerText();
  r.check(/MNU\s*1\s*–\s*0\s*TOT/.test(bug1), `scorebug shows the live score before the equaliser: "${bug1.replace(/\s+/g, " ")}"`);
  r.check(await page.getByText("Running").first().isVisible({ timeout: 15000 }), "the live engine reports Running");

  // DVR (before the goal airs): pause holds the frame, rewind to the first half, the engine keeps the live edge
  const now = () => v.evaluate((x: HTMLVideoElement) => x.currentTime);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const p1 = await now(); await page.waitForTimeout(2500); const p2 = await now();
  const badge = (await page.locator('section[aria-label="Match stream"]').innerText()).replace(/\s+/g, " ");
  r.check(Math.abs(p2 - p1) < 0.3 && /PAUSED/.test(badge), `Pause holds the picture (${p1.toFixed(1)}s -> ${p2.toFixed(1)}s) and the badge says PAUSED ("${badge.match(/PAUSED[^A-Z]*/)?.[0]?.trim()}")`);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const bar = page.getByRole("slider", { name: /Match timeline/ });
  const box = (await bar.boundingBox())!;
  await page.mouse.click(box.x + box.width * (600 / MATCH.durationSec), box.y + box.height / 2); // ~6' of the match
  await page.waitForTimeout(2500);
  const rew = await now();
  const bugRew = (await page.getByTestId("live-scorebug").innerText()).replace(/\s+/g, " ");
  r.check(rew > 500 && rew < 720, `clicking the timeline rewinds into what has aired (${rew.toFixed(0)}s)`);
  r.check(/MNU\s*0\s*–\s*0\s*TOT/.test(bugRew) && await page.getByTestId("dvr-behind").isVisible(), `rewound: the scorebug shows that moment ("${bugRew}") and a REPLAY -m:ss badge`);
  await page.mouse.click(box.x + box.width * 0.995, box.y + box.height / 2); // past the live edge: not aired
  await page.waitForTimeout(1500);
  const ahead = await now();
  const edgeNow = await page.evaluate(() => Number(document.querySelector('[role="slider"]')?.getAttribute("aria-valuemax")));
  r.check(ahead <= edgeNow + 1, `scrubbing past the live edge stops at live (${ahead.toFixed(0)}s, edge ${edgeNow}s): no peeking at what has not aired`);
  await page.mouse.click(box.x + box.width * (600 / MATCH.durationSec), box.y + box.height / 2);
  await page.waitForTimeout(1000);
  await page.getByTestId("go-live").click();
  await page.waitForTimeout(2500);
  const back = await now();
  r.check(Math.abs(back - edgeNow) < 15 && await page.getByText("LIVE", { exact: true }).first().isVisible(), `Go live jumps back to the live edge (${back.toFixed(0)}s) and the badge says LIVE`);
  // the goal airs ~142s after joining; then it is cut + analysed + rendered (~40s)
  await page.getByText(/Goal Spurs: Solanke equalises/).first().waitFor({ timeout: 200000 });
  const bug2 = await page.getByTestId("live-scorebug").innerText();
  r.check(/1\s*–\s*1/.test(bug2), `scorebug updates to 1-1 when the goal airs: "${bug2.replace(/\s+/g, " ")}"`);
    await page.getByText(/New clip in the inbox: Solanke rescues a point/).waitFor({ timeout: 150000 });
  r.check(true, "activity log announces the new clip");
  await page.locator('section[aria-label="Clips from this match"] li').first().waitFor({ timeout: 10000 });
  r.check(await page.locator('section[aria-label="Clips from this match"] li').count() >= 1, "the clip shows in Clips from this match");
  // design pass: the desk fits the screen (no page scroll), phase labels sit under the right points of the bar
  for (const [w, h] of [[1440, 900], [1280, 800]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(400);
    const fit = await page.evaluate(`(() => {
      const main = document.querySelector("main");
      const tl = document.querySelector('section[aria-label="Match timeline"]');
      const bar = tl.querySelector('[role="slider"]').getBoundingClientRect();
      const ko = tl.querySelector("div.relative.h-4 span").getBoundingClientRect();
      const aside = document.querySelector('aside[aria-label="Live engine"]').getBoundingClientRect();
      return { scrolls: main.scrollHeight > main.clientHeight + 2, asideBottom: aside.bottom, vh: innerHeight, koOff: Math.abs(ko.left + ko.width / 2 - (bar.left + bar.width * ${KICKOFF_FRAC})) };
    })()`) as { scrolls: boolean; asideBottom: number; vh: number; koOff: number };
    r.check(!fit.scrolls && fit.asideBottom <= fit.vh, `live desk fits a ${w}x${h} screen with no page scroll`);
    r.check(fit.koOff < 6, `${w}x${h}: "Kick-off" label sits under kick-off on the bar (${fit.koOff.toFixed(1)}px off)`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
    const all = await sql`select headline, content_type, status, delivery->'live'->>'label' label, delivery->'live'->'verification' v, delivery->'inputs'->'footageCut'->>'source' src from opportunities where delivery->'live' is not null`;
  const rows = all.filter((r) => r.label === "Goal");
  r.check(rows.length === 2 && rows.every((r) => r.headline === "SOLANKE RESCUES A POINT") && new Set(rows.map((r) => r.content_type)).size === 2, `the goal produced a reel + photo card (${rows.map((r) => `${r.content_type}:${r.status}`).join(", ")})`);
  const others = all.filter((r) => r.label !== "Goal");
  r.check(others.every((r) => r.v && r.v.isHighlight === true), `every watch-list clip was confirmed by Pegasus first (${others.map((r) => `${r.label}: ${r.v?.type}/${r.v?.team}`).join("; ") || "none in this window"})`);
  r.check(rows.every((r) => /cut 5814s to 5840s/.test(r.src ?? "")), `provenance records the cut off the full match: ${rows[0]?.src}`);
  await page.locator('section[aria-label="Clips from this match"] li a').first().click();
  await page.waitForURL(/opp=/, { timeout: 15000 });
  await page.getByRole("tab", { name: /Why this clip/ }).click().catch(() => undefined);
  await page.waitForTimeout(800);
  const why = await page.locator('section[aria-label="Review"]').innerText();
  r.check(/footage cut/i.test(why) && /cut 5814s to 5840s/.test(why), "the inbox review pane explains the live cut under Sources");

  // Restart (demo): approve one live clip, restart from 89'; the approved clip stays, untouched live drafts are cleared,
  // non-live clips are never touched, and the new run starts fresh at 89'
  const [keep] = await sql`select id from opportunities where delivery->'live' is not null and status = 'draft_ready' order by created_at limit 1`;
  await sql`update opportunities set status = 'approved' where id = ${keep.id}`;
  // a non-live clip next to the live ones: a copy of a live clip with its live marker removed (all required columns real)
  await sql`insert into opportunities (org_id, moment_id, sport, audience, content_type, score, score_breakdown, headline, compliance, expires_at, status, dedupe_key, delivery)
    select org_id, moment_id, sport, audience, content_type, score, score_breakdown, 'NOT FROM THE LIVE MATCH', compliance, expires_at, 'draft_ready', ${`walk-not-live-${Date.now()}`}, delivery - 'live'
    from opportunities where id = ${keep.id}`;
  const [{ liveBefore }] = await sql`select count(*)::int "liveBefore" from opportunities where delivery->'live' is not null`;
  // the live desk polls every 2s, so the network never goes idle: wait for the controls instead
  await page.goto(`${BASE}/live?org=${org.id}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Match controls" }).click({ timeout: 30000 });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("menuitem", { name: /89'/ }).click();
  // a restart fetches a fresh ScorePlay stream link and reloads the player: allow for a slow network
  await page.waitForFunction(() => { const x = document.querySelector("video"); return !!x && x.readyState >= 2 && x.currentTime > 5680 && x.currentTime < 5710; }, null, { timeout: 90000 });
  const after = await sql`select id, status, headline, delivery->'live' is not null live from opportunities`;
  const liveAfter = after.filter((o) => o.live);
  r.check(liveAfter.length === 1 && liveAfter[0].id === keep.id && liveAfter[0].status === "approved",
    `Restart from 89' cleared ${liveBefore - liveAfter.length} untouched live drafts and kept the approved one`);
  r.check(after.some((o) => o.headline === "NOT FROM THE LIVE MATCH"), "Restart never touches clips that did not come from the live match");
  const bug3 = (await page.getByTestId("live-scorebug").innerText()).replace(/\s+/g, " ");
  r.check(/MNU\s*1\s*–\s*0\s*TOT/.test(bug3) && (await page.locator('section[aria-label="Clips from this match"] li').count()) === 0,
    `the restarted match is back at 89' (1-0, "${bug3}") with a fresh clip list`);
  await sql`delete from opportunities where headline = 'NOT FROM THE LIVE MATCH'`;
    const left = readdirSync(`${REPO}/${RENDER_DIR}`, { recursive: true }).filter((f) => String(f).includes("source-"));
  r.check(left.length === 0, `no club footage working copy left on disk (${left.length})`);
  r.check(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ")})`);
  } catch (e) {
    r.check(false, `walk threw: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
  }
  return r.summary();
}
