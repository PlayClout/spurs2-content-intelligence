/**
 * Live match REPLAY, pure logic (no DB, no network, no media). Browser-safe: the /live replay desk runs it client-side.
 *
 * The hosted demo cannot stream the full match (the venue feed was time-boxed to the event, and a public demo may not
 * redistribute a broadcast anyway) and cannot run the live engine (a long-running worker). What it CAN do is replay a
 * recorded live session second by second: everything the engine decided during a real live run of this match (each
 * TwelveLabs watch-list look, each Pegasus verdict, each clip, with its real trigger-to-draft time) appears at the
 * match second it happened, against the same match clock, score and timeline as the live desk.
 *
 * Match data (kick-off, goals, the goal cut) is NOT taken from the recording: it is re-run through the engine's own
 * `stepFeed` for whatever point the viewer joins at, exactly as the live engine would. Engine decisions before the
 * join point (minus the engine's own backfill window) are not shown, because a producer joining there would not have
 * had them.
 */
import { stepFeed, emptyState, clockAt, airedFeed, AIR_LAG_SEC, JOIN_BACKFILL_SEC, SCAN_EVERY_SEC, type LiveMatch, type LiveLogEntry } from "./live-match";

export interface RecordedClip {
  id: string; headline: string; contentType: string; status: string; label: string;
  /** cut window in the full match, seconds */
  at: number; end: number;
  poster: string | null; video: string | null; createdAt: string; happenedAt: string | null;
  /** the session started this cut; the clip itself was rendered by an earlier live run of the same window */
  fromEarlierRun?: boolean;
}
export interface RecordedSession { matchId: string; sessionId: string; recordedAt: string; joinedAtVideoSec: number; log: LiveLogEntry[]; clips: RecordedClip[] }

/** `revealAt` = the match second at which the entry appears (the live edge when the engine wrote it). */
export interface ReplayEntry extends LiveLogEntry { revealAt: number }
export interface ReplayClip extends RecordedClip { revealAt: number }
export interface GoalCut { start: number; end: number; airedAt: number; cutAt: number; clipAt: number | null }
export interface ReplayPlan { joinedAt: number; log: ReplayEntry[]; clips: ReplayClip[]; goalCuts: GoalCut[] }

/** trigger-to-draft time when the log line does not say (it always does for the engine's own clips) */
export const DRAFT_SEC_DEFAULT = 20;
/** a Pegasus "no" lands about this long after the watch-list find (the recorded verdicts took 9-25s) */
export const VERDICT_SEC = 12;
/** a watch-list find with no clip to read its window from: assume the play ran this long past its logged second */
const HIT_TAIL_SEC = 10;

export const draftSecOf = (detail?: string) => {
  const m = /(\d+)s from trigger to draft/.exec(detail ?? "");
  return m ? Number(m[1]) : DRAFT_SEC_DEFAULT;
};
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Join points the recording can honestly replay: none earlier than the point the recorded session joined. */
export const replayPresets = (m: LiveMatch, rec: Pick<RecordedSession, "joinedAtVideoSec">) =>
  m.joinPresets.filter((p) => p.videoSec >= rec.joinedAtVideoSec);

export function planReplay(m: LiveMatch, rec: RecordedSession, joinedAt: number): ReplayPlan {
  const floor = joinedAt - JOIN_BACKFILL_SEC;
  const log: ReplayEntry[] = [];

  // 1. match data, through the engine's own feed step for this join point (same wording as the live director)
  const step = stepFeed(m, emptyState(rec.sessionId), m.durationSec, joinedAt);
  for (const { event: e, action } of step.aired) {
    const text = action === "before_join" ? `Before you joined: ${e.text}`
      : action === "score_only" ? `${e.text}. Opponent goal: score updated, not clipped`
      : action === "clip_when_aired" ? `${e.text}. Clipping it once the celebration has aired`
      : e.text;
    log.push({ at: e.at, wall: "", kind: "feed", text, detail: "Match data (replayed from the real match)", revealAt: Math.max(e.at, joinedAt) });
  }
  const goalCuts: GoalCut[] = step.aired.filter((a) => a.action === "clip_when_aired").map(({ event: e }) => ({
    start: e.start!, end: e.end!, airedAt: Math.max(e.at, joinedAt), cutAt: Math.max(e.end! + AIR_LAG_SEC, joinedAt), clipAt: null,
  }));
  for (const g of goalCuts) {
    log.push({ at: g.start, wall: "", kind: "clip", text: `Cutting the goal (${clockAt(m, g.start).minute}) from the ScorePlay stream`, detail: `${g.start}s to ${g.end}s of the full match`, revealAt: g.cutAt });
  }

  // 2. the engine's recorded decisions (watch-list finds, Pegasus verdicts, clips), from the join point on
  const reels = rec.clips.filter((c) => c.contentType === "reel");
  const windowOf = (at: number) => reels.find((c) => c.at <= at && at <= c.end);
  const clipAt = new Map<string, number>(); // "start-end" -> match second the clip landed
  let lastFind = joinedAt;
  for (const e of rec.log) {
    if (e.kind === "feed" || (e.kind === "clip" && e.text.startsWith("Cutting the goal"))) continue; // re-run above
    if (e.at < floor) continue;
    let revealAt: number;
    if (e.kind === "scan") {
      const w = windowOf(e.at);
      revealAt = Math.max(joinedAt, (w ? w.end : e.at + HIT_TAIL_SEC) + AIR_LAG_SEC);
      lastFind = revealAt;
    } else if (e.kind === "clip") {
      revealAt = lastFind + draftSecOf(e.detail);
      const w = windowOf(e.at);
      if (w) clipAt.set(`${w.at}-${w.end}`, revealAt);
    } else {
      revealAt = lastFind + VERDICT_SEC; // skip / error: Pegasus looked and said no
    }
    log.push({ ...e, revealAt });
  }

  // 3. the clips, landing when the engine logged them (goal clips: a draft after the goal cut started)
  const sameWindow = (a: { start: number; end: number }, c: RecordedClip) => Math.abs(a.start - c.at) < 1 && Math.abs(a.end - c.end) < 1;
  const clips: ReplayClip[] = [];
  for (const c of rec.clips) {
    if (c.at < floor) continue;
    const key = `${c.at}-${c.end}`;
    const goal = goalCuts.find((g) => sameWindow(g, c));
    let revealAt = clipAt.get(key);
    if (revealAt === undefined && goal) {
      revealAt = goal.cutAt + DRAFT_SEC_DEFAULT;
      if (goal.clipAt === null && c.contentType === "reel") {
        goal.clipAt = revealAt;
        log.push({ at: c.at, wall: "", kind: "clip", text: `New clip in the inbox: ${sentence(c.headline)}`,
          detail: c.fromEarlierRun ? "Same cut window, rendered on the engine's earlier live run of this match" : undefined, revealAt });
      }
    }
    // a clip with no log line of its own: it landed a draft-time after its window aired
    clips.push({ ...c, revealAt: revealAt ?? c.end + AIR_LAG_SEC + DRAFT_SEC_DEFAULT });
  }
  for (const g of goalCuts) g.clipAt ??= clips.find((c) => sameWindow(g, c))?.revealAt ?? null;

  log.sort((a, b) => a.revealAt - b.revealAt);
  clips.sort((a, b) => a.revealAt - b.revealAt);
  return { joinedAt, log, clips, goalCuts };
}

/** What the desk shows with the replay's live edge at `edge`: only what had happened by then (no spoilers). */
export function replayView(m: LiveMatch, plan: ReplayPlan, edge: number) {
  const log = plan.log.filter((e) => e.revealAt <= edge).reverse(); // newest first, like the live desk
  const landed = plan.clips.filter((c) => c.revealAt <= edge);
  const clips = [...landed].sort((a, b) => b.at - a.at || (a.contentType === "reel" ? -1 : 1));
  const latest = [...landed].reverse().find((c) => c.contentType === "reel" && c.video) ?? null;
  return {
    feed: airedFeed(m.feed, edge),
    log,
    clips,
    latest,
    scans: log.filter((e) => e.kind === "scan").length,
    // the watch-list looks every match minute from the join point (it only logs a look that found something)
    lastScanAt: edge < plan.joinedAt ? null : plan.joinedAt + Math.floor((edge - plan.joinedAt) / SCAN_EVERY_SEC) * SCAN_EVERY_SEC,
    // a club goal has aired and is being cut
    pending: plan.goalCuts.filter((g) => g.airedAt <= edge && (g.clipAt === null || edge < g.clipAt)).length,
  };
}
export type ReplayView = ReturnType<typeof replayView>;
