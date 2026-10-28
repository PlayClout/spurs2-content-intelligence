/**
 * Live director: runs inside a worker started in the live lane (`npm run live`). Every second it advances the live
 * match (shared/live-match), and:
 *   - match-data feed: logs kick-off / half-time / goals as they air; the club's own goals are cut once the whole
 *     passage (build-up to celebration) has aired. Opponent goals update the score and are never clipped.
 *   - AI watch-list: every match minute, TwelveLabs Marengo searches for saves, woodwork and chances. Only footage that
 *     has aired (in the last few minutes) is eligible; the best new hit is queued for Pegasus to confirm.
 * Queued moments are ordinary process_moment jobs in the live lane, so they produce ordinary clips in the inbox.
 *
 * State: the session (written by the web app) lives in app_settings "live_session"; the director's own state (what
 * aired, what was clipped or skipped, the activity log) in "live_state:<sessionId>", written only by this process
 * (serialised by `withState`), so the two writers never clobber each other.
 */
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as s from "../shared/db-schema";
import {
  clockAt, emptyState, inPlay, liveEdge, liveRanked, pickWatchHit, pushLog, scanDue, earlyScanAllowed, airedSinceLastScan, stepFeed, LIVE_LANE,
  type LiveLogEntry, type LiveMatch, type LiveSession, type LiveState, type SearchHit, type Win,
} from "../shared/live-match";
import { loadLiveMatch } from "./live-source";
import type { MomentInput } from "./moment";

type Db = PostgresJsDatabase<typeof s>;
export const SESSION_KEY = "live_session";
export const stateKey = (sessionId: string) => `live_state:${sessionId}`;
const PAD_BEFORE = 6, PAD_AFTER = 6; // context around a watch-list hit (build-up + reaction)

export async function readSession(db: Db): Promise<LiveSession | null> {
  const [r] = await db.select().from(s.appSettings).where(eq(s.appSettings.key, SESSION_KEY));
  return (r?.value as LiveSession | undefined)?.id ? (r!.value as LiveSession) : null;
}
export async function readState(db: Db, sessionId: string): Promise<(LiveState & { engineAt?: string }) | null> {
  const [r] = await db.select().from(s.appSettings).where(eq(s.appSettings.key, stateKey(sessionId)));
  return (r?.value as LiveState | undefined)?.sessionId === sessionId ? (r!.value as LiveState & { engineAt?: string }) : null;
}
async function writeState(db: Db, st: LiveState) {
  const value = { ...st, engineAt: new Date().toISOString() };
  await db.insert(s.appSettings).values({ key: stateKey(st.sessionId), value })
    .onConflictDoUpdate({ target: s.appSettings.key, set: { value, updatedAt: new Date() } });
}

// one writer per process: the tick and the job handler both go through here
let chain: Promise<unknown> = Promise.resolve();
export function withState<T>(db: Db, sessionId: string, fn: (st: LiveState) => Promise<{ state: LiveState; result?: T }> | { state: LiveState; result?: T }): Promise<T | undefined> {
  const next = chain.then(async () => {
    const st = (await readState(db, sessionId)) ?? emptyState(sessionId);
    const { state, result } = await fn(st);
    await writeState(db, state);
    return result;
  });
  chain = next.catch(() => undefined);
  return next;
}

/** Record what happened to a queued moment (called by the worker when the job finishes). */
export function logMoment(db: Db, sessionId: string, entry: Omit<LiveLogEntry, "wall">) {
  return withState(db, sessionId, (st) => ({ state: pushLog(st, entry) }));
}

// ── TwelveLabs: every hit for a query across the indexed match, fetched once per match and query ──────────────────
const hitCache = new Map<string, SearchHit[]>();
async function allHits(m: LiveMatch, query: string): Promise<SearchHit[]> {
  const key = `${m.id}|${query}`;
  const cached = hitCache.get(key);
  if (cached) return cached;
  const headers = { "x-api-key": process.env.TWELVELABS_API_KEY ?? "" };
  const f = new FormData();
  f.append("index_id", m.twelvelabs.indexId); f.append("query_text", query);
  f.append("search_options", "visual"); f.append("search_options", "audio");
  f.append("filter", JSON.stringify({ id: [m.twelvelabs.videoId] })); f.append("page_limit", "50");
  let res = await fetch("https://api.twelvelabs.io/v1.3/search", { method: "POST", headers, body: f });
  if (!res.ok) throw new Error(`TwelveLabs search -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  let page = await res.json() as { data?: SearchHit[]; page_info?: { next_page_token?: string } };
  const hits = [...(page.data ?? [])];
  for (let n = 0; page.page_info?.next_page_token && n < 30; n++) {
    res = await fetch(`https://api.twelvelabs.io/v1.3/search/${page.page_info.next_page_token}`, { headers });
    if (!res.ok) break;
    page = await res.json();
    hits.push(...(page.data ?? []));
  }
  const out = hits.map((h) => ({ rank: h.rank, start: h.start, end: h.end }));
  hitCache.set(key, out);
  return out;
}

function liveInput(m: LiveMatch, ses: LiveSession, o: { trigger: MomentInput["trigger"]; startSec: number; endSec: number; cut: Win; verify: boolean; scoreSec: number; headline: string; statLine: string; happenedAt: string; label: string }): MomentInput & { live: NonNullable<MomentInput["live"]> & { happenedAt: string; label: string } } {
  return {
    orgKey: m.orgKey, competition: m.competition, scorePlayMediaId: m.scorePlayMediaId, twelvelabsAssetId: m.twelvelabs.assetId, teamSeasonId: m.teamSeasonId,
    startSec: o.startSec, endSec: o.endSec, headline: o.headline, statLine: o.statLine, trigger: o.trigger,
    live: { sessionId: ses.id, matchId: m.id, cut: o.cut, verify: o.verify, scoreSec: o.scoreSec, happenedAt: o.happenedAt, label: o.label },
  };
}

async function enqueue(db: Db, ses: LiveSession, input: MomentInput) {
  const slug = `live-${ses.id}-${Math.round(input.startSec)}`;
  await db.insert(s.jobs).values({ type: "process_moment", status: "queued", payload: { orgId: ses.orgId, input, slug, lane: LIVE_LANE } });
}

/** Wall-clock time when video second v aired, given the live edge now. */
const airedAt = (ses: LiveSession, edge: number, v: number, now: number) => new Date(now - ((edge - v) / (ses.speed || 1)) * 1000).toISOString();

let ticking = false;
export async function tickLive(db: Db, log: (...a: unknown[]) => void) {
  if (ticking) return;
  ticking = true;
  try {
    const ses = await readSession(db);
    if (!ses || ses.status === "ended") return;
    const m = await loadLiveMatch(ses.matchId);
    const now = Date.now();
    const edge = liveEdge(ses, now, m.durationSec);
    await withState(db, ses.id, async (st0) => {
      let st = st0;
      const f = stepFeed(m, st, edge, ses.joinedAtVideoSec);
      st = f.state;
      for (const a of f.aired) {
        const e = a.event;
        const text = a.action === "before_join" ? `Before you joined: ${e.text}`
          : a.action === "score_only" ? `${e.text}. Opponent goal: score updated, not clipped`
          : a.action === "clip_when_aired" ? `${e.text}. Clipping it once the celebration has aired`
          : e.text;
        st = pushLog(st, { at: e.at, kind: "feed", text, detail: "Match data (replayed from the real match)" });
      }
      for (const c of f.clipNow) {
        const e = m.feed.find((x) => x.id === c.eventId)!;
        const minute = clockAt(m, e.at).minute;
        await enqueue(db, ses, liveInput(m, ses, {
          trigger: { kind: "game_event", text: `${e.text} (match data replay)`, simulated: true, mode: "replay" },
          startSec: c.window.start, endSec: c.window.end, cut: c.window, verify: false, scoreSec: e.at + 1,
          headline: e.headline ?? "GOAL", statLine: `${minute} · ${e.player ?? ""} goal`.replace(/ {2}/g, " "), happenedAt: airedAt(ses, edge, c.window.end, now), label: "Goal",
        }));
        st = pushLog(st, { at: c.window.start, kind: "clip", text: `Cutting the goal (${minute}) from the ScorePlay stream`, detail: `${c.window.start}s to ${c.window.end}s of the full match` });
        log(`live: goal ${e.id} queued (${c.window.start}-${c.window.end})`);
      }
      // the minute scan, plus an early look as soon as a strong moment has finished airing (seconds, not a minute)
      const regular = scanDue(st, edge);
      const early = !regular && earlyScanAllowed(st, edge);
      if (ses.status === "live" && inPlay(m, edge) && (regular || early)) {
        const cands = (await Promise.all(m.watchlist.map(async (w) => liveRanked(await allHits(m, w.query), edge).map((h) => ({ ...h, query: w.query, label: w.label, headline: w.headline }))))).flat();
        const found = pickWatchHit(m, st, cands, edge, ses.joinedAtVideoSec);
        const pick = found && (regular || airedSinceLastScan(found, st)) ? found : null;
        if (regular || pick) st = { ...st, lastScanAt: edge, scans: st.scans + 1 };
        if (pick) {
          const period = m.periods.filter((p) => p.from <= pick.start).pop()!;
          const nextFrom = m.periods.find((p) => p.from > pick.start)?.from ?? m.durationSec;
          const cut = { start: Math.max(period.from, Math.floor(pick.start - PAD_BEFORE)), end: Math.min(nextFrom, edge - 1, Math.ceil(pick.end + PAD_AFTER)) };
          st = { ...st, fired: [...st.fired, { start: pick.start, end: pick.end, source: "watchlist", label: pick.label }] };
          const minute = clockAt(m, pick.start).minute;
          await enqueue(db, ses, liveInput(m, ses, {
            trigger: { kind: "ai_watchlist", text: `TwelveLabs watch-list "${pick.query}": best match in the last 3 minutes, at ${minute}`, simulated: false, mode: "live" },
            startSec: pick.start, endSec: pick.end, cut, verify: true, scoreSec: edge,
            headline: pick.headline, statLine: `${minute} · ${pick.label}`, happenedAt: airedAt(ses, edge, pick.end, now), label: pick.label,
          }));
          st = pushLog(st, { at: pick.start, kind: "scan", text: `Watch-list found a possible ${pick.label.toLowerCase()} at ${minute}. Checking it with Pegasus`, detail: `"${pick.query}", top ${pick.liveRank} in the last 3 minutes (rank ${pick.rank} across the match)` });
          log(`live: watch-list ${pick.label} ${pick.start}-${pick.end} queued`);
        }
      }
      return { state: st };
    });
  } catch (e) {
    log(`live tick error: ${(e as Error).message}`);
  } finally {
    ticking = false;
  }
}
