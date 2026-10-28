/**
 * Live replay unit tests (no DB, no network): the recorded session replays at the right match seconds, never shows
 * what has not happened yet, and re-runs match data through the engine's own feed step for each join point.
 *   npx tsx scripts/live-replay-test.ts
 */
import { scoreAt, AIR_LAG_SEC, JOIN_BACKFILL_SEC, type LiveMatch } from "../shared/live-match";
import { planReplay, replayView, replayPresets, draftSecOf, type RecordedSession } from "../shared/live-replay";
import liveMatch from "../data/live/mnu-tot-full-match.json" with { type: "json" };
import recording from "../data/live/recorded-session.json" with { type: "json" };

const M = liveMatch as unknown as LiveMatch;
const R = recording as unknown as RecordedSession;
let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };

// ── the recording itself ──────────────────────────────────────────────────────────────
check(R.matchId === M.id, "recording is of this match");
check(R.log.length > 0 && R.clips.some((c) => c.contentType === "reel"), `recording has an engine log (${R.log.length}) and clips (${R.clips.length})`);
check(R.clips.every((c) => c.poster?.startsWith("/renders/")), "every recorded clip has a poster under /renders/");
check(R.clips.filter((c) => c.contentType === "reel").every((c) => c.video?.endsWith(".mp4")), "every recorded reel has a video");
check(draftSecOf("21s from trigger to draft (cut 6s, Pegasus 12s)") === 21 && draftSecOf(undefined) === 20, "trigger-to-draft time read from the log line");

// ── join points ───────────────────────────────────────────────────────────────────────
const presets = replayPresets(M, R);
check(presets.length > 0 && presets.every((p) => p.videoSec >= R.joinedAtVideoSec), "replay offers only join points the recording covers");
check(!presets.some((p) => p.videoSec < R.joinedAtVideoSec), `no join point before the recorded session joined (${R.joinedAtVideoSec}s)`);

// ── joining where the recorded session joined ────────────────────────────────────────
const P = planReplay(M, R, R.joinedAtVideoSec);
const at = (edge: number) => replayView(M, P, edge);
const start = at(R.joinedAtVideoSec);
check(start.clips.length === 0, "nothing clipped at the moment you join");
check(start.log.length === 1 && start.log[0].text === "Before you joined: Kick-off at Old Trafford", `kick-off is summarised as before-join (${start.log.map((e) => e.text).join(" | ")})`);
const firstReel = P.clips.find((c) => c.contentType === "reel")!;
check(firstReel.revealAt >= firstReel.end + AIR_LAG_SEC, `first clip lands only after its play has fully aired (${firstReel.end}s -> ${firstReel.revealAt}s)`);
check(at(firstReel.revealAt - 0.01).clips.length === 0 && at(firstReel.revealAt).clips.some((c) => c.id === firstReel.id), "a clip appears exactly at its landing second, not before");
const firstFind = P.log.find((e) => e.kind === "scan")!;
check(firstFind.revealAt < firstReel.revealAt, "the watch-list find is shown before the clip it led to");
check(P.log.every((e, i) => i === 0 || P.log[i - 1].revealAt <= e.revealAt), "the activity log plays in time order");
// spoiler-free: nothing in the view lies after the edge
let spoiler = false;
for (let e = R.joinedAtVideoSec; e <= M.durationSec; e += 37) {
  const v = at(e);
  if (v.log.some((x) => x.revealAt > e) || v.clips.some((c) => c.revealAt > e) || v.feed.some((f) => f.at > e)) spoiler = true;
}
check(!spoiler, "no spoilers at any second: log, clips and match data only up to the edge");
// monotonic: a later edge shows everything an earlier one did
let shrink = false;
for (let e = R.joinedAtVideoSec; e < M.durationSec; e += 53) if (at(e + 53).log.length < at(e).log.length || at(e + 53).clips.length < at(e).clips.length) shrink = true;
check(!shrink, "the log and clips only grow as the match plays");
const ht = at(3001);
check(ht.feed.some((f) => f.type === "half_time") && scoreAt(ht.feed, 3001).home === 0 && scoreAt(ht.feed, 3001).away === 0, "half-time 0-0 from match data");
const firstHalfReels = at(3000).clips.filter((c) => c.contentType === "reel").length;
check(firstHalfReels === R.clips.filter((c) => c.contentType === "reel" && c.at < 3000).length, `all ${firstHalfReels} first-half clips of the recorded run have landed by half-time`);
// the opponent goal is logged, never clipped; the club goal is cut once the celebration has aired
const g1 = at(4678).log.find((e) => e.text.startsWith("Goal Man Utd"));
check(!!g1 && g1.text.endsWith("Opponent goal: score updated, not clipped"), "Man Utd goal: score updated, not clipped");
const goal = M.feed.find((e) => e.id === "g2")!;
const cut = P.goalCuts.find((g) => g.start === goal.start)!;
check(!!cut && cut.cutAt === goal.end! + AIR_LAG_SEC, `Spurs goal is cut once its passage has aired (${cut?.cutAt}s)`);
check(at(goal.at).pending === 1, "while the goal's celebration airs, the desk says a goal is being cut");
const goalReel = P.clips.find((c) => c.contentType === "reel" && Math.abs(c.at - goal.start!) < 1);
check(!!goalReel && goalReel.revealAt > cut.cutAt, "the goal clip lands after the cut starts");
check(!!goalReel && at(goalReel.revealAt).pending === 0 && at(goalReel.revealAt).latest?.id === goalReel.id, "once it lands: nothing pending, and it is the newest clip on screen");
const ft = at(M.durationSec);
check(scoreAt(ft.feed, M.durationSec).home === 1 && scoreAt(ft.feed, M.durationSec).away === 1, "full time 1-1");
check(ft.log.filter((e) => e.kind === "feed").length === M.feed.length, "every match-data event is logged by full time");
check(ft.lastScanAt !== null && (ft.lastScanAt - R.joinedAtVideoSec) % 60 === 0, "watch-list looks every match minute from the join point");

// ── joining later: only what a producer joining there would have ──────────────────────
const late = M.joinPresets.find((p) => p.label === "67'")!;
const L = planReplay(M, R, late.videoSec);
const lv = replayView(M, L, late.videoSec);
check(L.clips.every((c) => c.at >= late.videoSec - JOIN_BACKFILL_SEC), "joining at 67': no clips from before you joined");
check(lv.log.some((e) => e.text === "Before you joined: Half-time: Man Utd 0, Spurs 0"), "joining at 67': half-time is summarised as before-join");
check(!L.log.some((e) => e.kind !== "feed" && e.at < late.videoSec - JOIN_BACKFILL_SEC), "joining at 67': no engine decisions from before you joined");
check(L.clips.some((c) => Math.abs(c.at - goal.start!) < 1), "joining at 67': the late equaliser is still clipped");

process.exit(fail ? 1 : 0);
