/**
 * Live match mode, pure logic (no DB, no network, no media). Shared by the worker's live director, the producer
 * app and the tests.
 *
 * The match is a real full-match video in ScorePlay, played as if live: a session anchors "live edge" (the newest
 * second that has aired) to wall-clock time. The engine may only act on footage behind the live edge, exactly as it
 * would during a real broadcast. Match clock and score are derived from the video position (periods read off the
 * broadcast clock) and from the match-data feed events that have aired.
 */
// No imports: this module also runs in the browser (the live desk), so it must stay free of node-only code.
export interface Win { start: number; end: number }
/** overlap / shorter length (same formula as pipeline/watchlist.overlapRatio, duplicated to stay browser-safe) */
const overlapRatio = (a: Win, b: Win) => {
  const o = Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
  const short = Math.min(a.end - a.start, b.end - b.start);
  return short > 0 ? o / short : 0;
};
export type PeriodId = "pre" | "1H" | "HT" | "2H" | "FT";
export interface Period { id: PeriodId; label: string; from: number; clockStart?: number; regulationEnd?: number }
export interface FeedEvent {
  id: string; at: number; type: "kickoff" | "half_time" | "full_time" | "goal"; text: string;
  team?: "home" | "away"; player?: string; start?: number; end?: number; quietSec?: number; headline?: string;
}
export interface WatchQuery { query: string; label: string; headline: string }
export interface LiveMatch {
  id: string; name: string; competitionLabel: string; orgKey: string; competition: string;
  home: { short: string; name: string; kit: string }; away: { short: string; name: string; kit: string }; clubSide: "home" | "away";
  scorePlayMediaId: number; twelvelabs: { indexId: string; videoId: string; assetId: string }; teamSeasonId: number;
  durationSec: number; periods: Period[]; feed: FeedEvent[]; watchlist: WatchQuery[]; joinPresets: { label: string; videoSec: number; hint: string }[];
}

export interface LiveSession {
  id: string; matchId: string; orgId: string; status: "live" | "paused" | "ended";
  /** live edge = anchorVideoSec + (now - anchorAt) * speed while live; frozen at anchorVideoSec otherwise */
  anchorVideoSec: number; anchorAt: string; speed: number;
  joinedAtVideoSec: number; startedAt: string;
  stream?: { url: string; expiresAt: string; quality: string } | null;
}
export interface LiveLogEntry { at: number; wall: string; kind: "feed" | "clip" | "scan" | "skip" | "error"; text: string; detail?: string }
export interface LiveState {
  sessionId: string;
  firedFeed: string[];
  /** club goals that have aired but whose full passage (build-up + celebration) has not yet: clipped once it has */
  pending: { eventId: string; window: Win }[];
  /** every play the engine has already handled (clipped or deliberately not), so nothing is clipped twice */
  fired: (Win & { source: "feed" | "watchlist"; label: string })[];
  /** broadcast replays after a goal: watch-list hits before this second are ignored */
  quietUntil: number;
  lastScanAt: number | null;
  scans: number;
  log: LiveLogEntry[];
}

// ── tunables (documented, tested) ─────────────────────────────────────────────────────
export const SCAN_EVERY_SEC = 60; // watch-list re-runs every match minute
export const LOOKBACK_SEC = 180; // a watcher only clips the last 3 minutes, never the distant past
export const AIR_LAG_SEC = 2; // a moment must have fully aired (plus a beat) before it can be clipped
export const LIVE_RANK_MAX = 2; // only the best 2 hits for that search in the last LOOKBACK_SEC of play...
export const RAW_RANK_MAX = 40; // ...that are also in TwelveLabs' top 40 for the search (a quiet spell's best hit is still weak)
export const MIN_GAP_SEC = 20; // no two clips of the same passage
export const JOIN_BACKFILL_SEC = 30; // joining late: the last 30s before joining may still be clipped
export const LIVE_LANE = "live"; // worker lane for every job that touches the full match (the cloud worker never claims it)
export const LOG_MAX = 80;

/** Jobs for a live-match clip must stay in the live lane: only the live engine cuts windows from the full match. */
export const laneFor = (delivery: unknown): string | undefined => ((delivery as { live?: unknown } | null)?.live ? LIVE_LANE : undefined);

// ── clock + score ──────────────────────────────────────────────────────────────────────
export function periodAt(m: LiveMatch, v: number): Period {
  let p = m.periods[0];
  for (const x of m.periods) if (x.from <= v) p = x;
  return p;
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/** Broadcast-style clock at video second v: { label "91:20", minute "90+2'", period }. */
export function clockAt(m: LiveMatch, v: number): { period: PeriodId; label: string; minute: string; running: boolean } {
  const p = periodAt(m, v);
  if (p.clockStart === undefined) {
    const label = p.id === "HT" ? "HT" : p.id === "FT" ? "FT" : "Pre-match";
    return { period: p.id, label, minute: label === "Pre-match" ? "Pre" : label, running: false };
  }
  const c = p.clockStart + Math.max(0, v - p.from);
  const reg = p.regulationEnd ?? Infinity;
  const minute = c >= reg ? `${reg / 60}+${Math.floor((c - reg) / 60) + 1}'` : `${Math.floor(c / 60) + 1}'`;
  return { period: p.id, label: mmss(c), minute, running: true };
}

/** Score from the goal events that have aired by video second v. */
export function scoreAt(feed: FeedEvent[], v: number) {
  const goals = feed.filter((e) => e.type === "goal" && e.at <= v);
  return { home: goals.filter((g) => g.team === "home").length, away: goals.filter((g) => g.team === "away").length };
}

export function inPlay(m: LiveMatch, v: number) {
  const id = periodAt(m, v).id;
  return id === "1H" || id === "2H";
}

export function liveEdge(s: Pick<LiveSession, "status" | "anchorVideoSec" | "anchorAt" | "speed">, nowMs: number, durationSec: number) {
  const raw = s.status === "live" ? s.anchorVideoSec + ((nowMs - Date.parse(s.anchorAt)) / 1000) * s.speed : s.anchorVideoSec;
  return Math.min(durationSec, Math.max(0, raw));
}

/** Feed events the client may see: only what has aired (no spoilers, no peeking ahead). */
export const airedFeed = (feed: FeedEvent[], edge: number) => feed.filter((e) => e.at <= edge);

// ── viewer DVR ─────────────────────────────────────────────────────────────────────────
// The viewer can pause, rewind and scrub anywhere that has AIRED, never past the live edge. The engine always works on
// the live edge, whatever the viewer is watching: rewinding to the 10th minute never stops the 91st from being clipped.
/** within this many seconds of the edge the viewer counts as live (one poll of slack, so "Go live" never flickers) */
export const DVR_LIVE_SLACK_SEC = 2;
/** where a seek may land: inside what has aired */
export const dvrSeek = (targetSec: number, edge: number) => Math.min(edge, Math.max(0, targetSec));
export const isAtLive = (watchingSec: number, edge: number) => edge - watchingSec <= DVR_LIVE_SLACK_SEC;
/** "-2:43" behind live, for the badge */
export function behindLabel(watchingSec: number, edge: number) {
  const s = Math.max(0, Math.round(edge - watchingSec));
  return `-${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Restart (demo): a clip from an earlier live run is cleared only if nobody has acted on it yet. Approved, rejected,
 * published or referenced clips stay; clips that did not come from the live match are never touched. */
export function clearableOnRestart(o: { status: string; fromLiveMatch: boolean; referenced: boolean }) {
  return o.fromLiveMatch && !o.referenced && (o.status === "draft_pending" || o.status === "draft_ready");
}

// ── director decisions ─────────────────────────────────────────────────────────────────
export function emptyState(sessionId: string): LiveState {
  return { sessionId, firedFeed: [], pending: [], fired: [], quietUntil: 0, lastScanAt: null, scans: 0, log: [] };
}

export interface FeedStep {
  /** newly aired events, in order, with what the engine did about each */
  aired: { event: FeedEvent; action: "clip_when_aired" | "score_only" | "info" | "before_join" }[];
  /** club goals whose whole passage has now aired: cut these */
  clipNow: { eventId: string; window: Win }[];
  state: LiveState;
}

/** Advance the match-data feed to the live edge. Only the club's OWN goals become clips; an opponent goal updates
 * the score and is logged, never posted on the club's channels. Every goal (either side) blocks its passage and the
 * broadcast replays that follow from the watch-list. Events from before the producer joined are summarised, not
 * clipped. A club goal is cut only once its full window (build-up to celebration) has aired. */
export function stepFeed(m: LiveMatch, st: LiveState, edge: number, joinedAt: number): FeedStep {
  const aired: FeedStep["aired"] = [];
  let next: LiveState = { ...st, firedFeed: [...st.firedFeed], pending: [...st.pending], fired: [...st.fired] };
  for (const e of m.feed.filter((x) => x.at <= edge && !st.firedFeed.includes(x.id)).sort((a, b) => a.at - b.at)) {
    next.firedFeed.push(e.id);
    const isGoal = e.type === "goal" && e.start !== undefined && e.end !== undefined;
    if (isGoal) {
      next.fired.push({ start: e.start!, end: e.end!, source: "feed", label: e.text });
      next.quietUntil = Math.max(next.quietUntil, e.end! + (e.quietSec ?? 0));
    }
    if (e.at < joinedAt - JOIN_BACKFILL_SEC) aired.push({ event: e, action: "before_join" });
    else if (isGoal && e.team === m.clubSide) { aired.push({ event: e, action: "clip_when_aired" }); next.pending.push({ eventId: e.id, window: { start: e.start!, end: e.end! } }); }
    else aired.push({ event: e, action: isGoal ? "score_only" : "info" });
  }
  const clipNow = next.pending.filter((p) => p.window.end + AIR_LAG_SEC <= edge);
  next = { ...next, pending: next.pending.filter((p) => !clipNow.includes(p)) };
  return { aired, clipNow, state: next };
}

export interface SearchHit extends Win { rank: number }
export interface WatchHit extends Win { rank: number; liveRank: number; query: string; label: string; headline: string }

/** What a watcher can see at the live edge: hits that have fully aired within the lookback window, re-ranked among
 * themselves (liveRank 1 = best match for this search in the last few minutes of play). A real live index only holds
 * aired footage; restricting to aired hits and ranking them locally emulates that. `rank` stays TwelveLabs' own
 * relevance rank for the search and is the absolute confidence floor (RAW_RANK_MAX). */
export function liveRanked(hits: SearchHit[], edge: number): (SearchHit & { liveRank: number })[] {
  return [...hits].sort((a, b) => a.rank - b.rank)
    .filter((h) => h.end <= edge - AIR_LAG_SEC && h.start >= edge - LOOKBACK_SEC)
    .map((h, i) => ({ ...h, liveRank: i + 1 }));
}

/** Pick at most ONE new moment from a watch-list scan. Rules, in order: confident (top LIVE_RANK_MAX among aired
 * footage), recent (lookback, and not before the producer joined), during play (no studio/half-time), outside a
 * goal's replay window, and not the same passage as anything already handled. Best live rank first, then newest. */
export function pickWatchHit(m: LiveMatch, st: LiveState, hits: WatchHit[], edge: number, joinedAt: number): WatchHit | null {
  const floor = Math.max(edge - LOOKBACK_SEC, joinedAt - JOIN_BACKFILL_SEC);
  const near = (h: Win) => st.fired.some((f) => overlapRatio(f, h) > 0 || Math.abs(f.start - h.start) < MIN_GAP_SEC || Math.abs(f.end - h.end) < MIN_GAP_SEC);
  const ok = hits.filter((h) =>
    h.liveRank <= LIVE_RANK_MAX && h.rank <= RAW_RANK_MAX && h.end <= edge - AIR_LAG_SEC && h.start >= floor && inPlay(m, h.start) && inPlay(m, h.end)
    && h.start >= st.quietUntil && !near(h));
  ok.sort((a, b) => a.liveRank - b.liveRank || b.start - a.start);
  return ok[0] ?? null;
}

export const scanDue = (st: LiveState, edge: number) => st.lastScanAt === null || edge - st.lastScanAt >= SCAN_EVERY_SEC;

/** Between the minute scans, the engine also looks again as soon as a strong moment finishes airing (at most every
 * EARLY_SCAN_MIN_SEC), so a chance is flagged seconds after it airs, not up to a minute later. Only a hit the last scan
 * could NOT have seen counts (it was still airing then): this never re-picks what a scan already passed over. */
export const EARLY_SCAN_MIN_SEC = 10;
export const earlyScanAllowed = (st: LiveState, edge: number) => st.lastScanAt !== null && edge - st.lastScanAt >= EARLY_SCAN_MIN_SEC;
export const airedSinceLastScan = (h: Win, st: LiveState) => st.lastScanAt === null || h.end > st.lastScanAt - AIR_LAG_SEC;

export function pushLog(st: LiveState, e: Omit<LiveLogEntry, "wall">, now = new Date()): LiveState {
  return { ...st, log: [{ ...e, wall: now.toISOString() }, ...st.log].slice(0, LOG_MAX) };
}

/** Caption facts for a moment at video second v (score includes a goal that happens inside the moment). */
export function captionFacts(m: LiveMatch, v: number, scoreSec = v) {
  const s = scoreAt(m.feed, scoreSec);
  const minute = clockAt(m, v).minute;
  return { kicker: `${m.home.name} ${s.home} · ${m.away.name} ${s.away} · ${minute}`, minute };
}

// ── verification (what Pegasus confirmed) -> whether and how the club posts it ──────────
export const VERIFY_TYPES = ["goal", "shot_saved", "woodwork", "big_chance", "card", "celebration", "none"] as const;
export type VerifyType = (typeof VERIFY_TYPES)[number];
export interface Verification { isHighlight: boolean; type: VerifyType; team: "home" | "away" | "unclear"; description: string; confidence: number; actionX?: number }
export const VERIFY_MIN_CONFIDENCE = 0.6;

/** Turn a confirmed moment into a club post, or say why not. `team` = the ATTACKING side (who had the shot, chance
 * or goal; for a card, the booked player's side). Rules: only real, confident highlights; a "goal" the match data
 * never recorded is not a goal (disallowed / offside), so it becomes a chance; the club never posts the opponent's
 * goals, celebrations, chances or woodwork, and bookings are never posted. */
export function liveHeadline(m: LiveMatch, v: Verification, goalRecorded: boolean): { post: true; headline: string; label: string } | { post: false; reason: string } {
  if (!v.isHighlight || v.type === "none") return { post: false, reason: "not a highlight on a closer look" };
  if (v.confidence < VERIFY_MIN_CONFIDENCE) return { post: false, reason: `not sure enough (${Math.round(v.confidence * 100)}%)` };
  const type: VerifyType = v.type === "goal" && !goalRecorded ? "big_chance" : v.type;
  const ours = v.team === m.clubSide, theirs = v.team !== "unclear" && !ours;
  switch (type) {
    case "goal": return ours ? { post: true, headline: "GOAL", label: "Goal" } : { post: false, reason: theirs ? "opponent goal" : "goal, team unclear" };
    case "celebration": return ours ? { post: true, headline: "SCENES", label: "Celebration" } : { post: false, reason: "opponent celebration" };
    // our attack saved = our near miss; their attack saved = our keeper's highlight
    case "shot_saved": return ours ? { post: true, headline: "SO CLOSE", label: "Chance saved" } : theirs ? { post: true, headline: "WHAT A STOP", label: "Big save" } : { post: false, reason: "save, team unclear" };
    case "woodwork": return ours ? { post: true, headline: "OFF THE WOODWORK", label: "Off the woodwork" } : { post: false, reason: theirs ? "opponent hit the woodwork" : "woodwork, team unclear" };
    case "big_chance": return ours ? { post: true, headline: "SO CLOSE", label: "Big chance" } : { post: false, reason: theirs ? "opponent chance" : "chance, team unclear" };
    case "card": return { post: false, reason: "bookings are not posted" };
    default: return { post: false, reason: "not a highlight on a closer look" };
  }
}
