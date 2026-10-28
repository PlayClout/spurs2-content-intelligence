/** Live match desk, REPLAY mode (what the hosted demo shows at /live): replays the recorded live session of Man Utd v
 * Tottenham second by second. Read-only: no engine, no stream, no DB writes. Run via `npm run test:ui -- --only=live-replay`. */
import { readFileSync } from "node:fs";
import { BASE, REPO, sql, openBrowser, reporter } from "./harness";

const REC = JSON.parse(readFileSync(`${REPO}/data/live/recorded-session.json`, "utf8")) as { sessionId: string; clips: { contentType: string; headline: string; at: number }[] };

export async function liveReplayWalk() {
  const r = reporter("liveReplayWalk");
  const { browser, page, errors } = await openBrowser();
  try {
    const [org] = await sql`select id from orgs where name = 'Tottenham Hotspur'`;
    await page.goto(`${BASE}/live?org=${org.id}&mode=replay`, { waitUntil: "networkidle" });
    r.check(await page.getByRole("heading", { name: "Man Utd v Spurs · live session replay" }).isVisible(), "start panel names the match and says it is a replay");
    const joins = await page.locator('input[name="join"]').count();
    r.check(joins === 4 && !(await page.getByText("Kick-off", { exact: true }).count()), `join points start where the recording does (2'), no Kick-off option (${joins} options)`);
    await page.getByText("First chance", { exact: true }).click();
    await page.locator("label", { hasText: "20×" }).click();
    await page.getByTestId("start-replay").click();

    const bug = page.getByTestId("live-scorebug");
    await bug.waitFor({ timeout: 10000 });
    r.check(/MNU\s*0\s*–\s*0\s*TOT/.test(await bug.innerText()), `scorebug at 0-0 on joining: "${(await bug.innerText()).replace(/\s+/g, " ")}"`);
    r.check((await page.getByTestId("replay-badge").innerText()) === "REPLAY", "badge says REPLAY (not LIVE)");
    r.check(await page.getByText("Replaying", { exact: true }).isVisible(), "engine panel says Replaying");
    r.check(await page.getByText("Venue broadcast feed").isVisible(), "before the first clip: honest venue-feed placeholder, no fake video");

    // the first find, then its clip, appear as the replay clock passes them (20x: ~2s)
    const clip = page.getByTestId("replay-latest-clip");
    await clip.waitFor({ timeout: 15000 });
    await page.waitForFunction(() => { const v = document.querySelector('[data-testid="replay-latest-clip"]') as HTMLVideoElement | null; return !!v && v.readyState >= 2 && !v.paused; }, null, { timeout: 20000 });
    const src = (await clip.getAttribute("src")) ?? "";
    r.check(src.startsWith(`/renders/live-${REC.sessionId}-`) && src.endsWith(".mp4"), `the newest clip the recorded engine cut plays on screen (${src})`);
    const t1 = await clip.evaluate((v: HTMLVideoElement) => v.currentTime); await page.waitForTimeout(1500);
    const t2 = await clip.evaluate((v: HTMLVideoElement) => v.currentTime);
    r.check(t2 > t1, `the clip is playing, not a still (${t1.toFixed(1)}s -> ${t2.toFixed(1)}s)`);
    const engine = (await page.getByRole("complementary", { name: "Live engine" }).innerText()).replace(/\s+/g, " ");
    r.check(/found a possible/i.test(engine) && /New clip in the inbox/.test(engine), "engine log shows the watch-list find and the clip landing");
    r.check(/Before you joined: Kick-off at Old Trafford/.test(engine), "match data logged as the engine would (kick-off before you joined)");
    const clipsPanel = page.getByRole("region", { name: "Clips from this match" });
    r.check((await clipsPanel.locator("img").count()) >= 1, "clip appears in the Clips from this match panel");

    // pause freezes the replay clock
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    const c1 = await bug.innerText(); await page.waitForTimeout(1500); const c2 = await bug.innerText();
    r.check(c1 === c2 && (await page.getByTestId("replay-badge").innerText()) === "PAUSED", `Pause freezes the clock (${c1.replace(/\s+/g, " ")}) and the badge says PAUSED`);
    await page.getByRole("button", { name: "Play", exact: true }).click();

    // restart at 89': the Spurs equaliser is cut and lands on screen, score goes to 1-1
    await page.getByRole("button", { name: "Match controls" }).click();
    await page.getByRole("menuitem", { name: /89'/ }).click();
    await page.locator('[role="group"][aria-label="Replay speed"] button', { hasText: "20×" }).click();
    await page.waitForFunction(() => /1\s*–\s*1/.test(document.querySelector('[data-testid="live-scorebug"]')?.textContent ?? ""), null, { timeout: 30000 });
    r.check(true, "scorebug goes to 1-1 when the equaliser airs");
    const goal = REC.clips.find((c) => c.contentType === "reel" && c.headline.startsWith("SOLANKE"))!;
    await page.waitForFunction((h) => (document.querySelector('[data-testid="replay-latest-clip"]')?.getAttribute("aria-label") ?? "").toLowerCase().includes(h), goal.headline.toLowerCase().slice(0, 12), { timeout: 30000 });
    const engine2 = (await page.getByRole("complementary", { name: "Live engine" }).innerText()).replace(/\s+/g, " ");
    r.check(/Cutting the goal \(90\+2'\)/.test(engine2) && /New clip in the inbox: Solanke rescues a point/.test(engine2), "the goal is cut once the celebration airs and the Solanke clip lands");
    r.check(!/New clip in the inbox: So close/.test(engine2.split("Before you joined")[0] ?? ""), "joining at 89' shows no first-half clips");
    r.check(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ")})`);
  } catch (e) {
    r.check(false, `walk crashed: ${(e as Error).message.split("\n")[0]}`);
    await page.screenshot({ path: "/tmp/live-replay-walk-fail.png" }).catch(() => undefined);
  } finally {
    await browser.close();
  }
  return r.summary();
}
