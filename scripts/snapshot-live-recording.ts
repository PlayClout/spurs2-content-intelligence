/**
 * Freeze one recorded live-match session into data/live/recorded-session.json, so the hosted demo can replay it
 * (the /live replay desk). Read-only on the DB.
 *
 * What it keeps, exactly as the live engine wrote it: the engine's activity log for the session (every watch-list
 * look, Pegasus verdict and clip, with its trigger-to-draft time) and the clips the session made (cut points in the
 * full match, headline, poster, reel). The goal the session started cutting at the end is completed with the clip an
 * earlier live run rendered for the SAME cut window, if there is one.
 *
 *   npx tsx --env-file=.env scripts/snapshot-live-recording.ts [sessionId]
 * Default session: the one with the longest engine log.
 */
import { writeFileSync } from "node:fs";
import postgres from "postgres";
import type { LiveLogEntry } from "../shared/live-match";
import type { RecordedClip, RecordedSession } from "../shared/live-replay";
import liveMatch from "../data/live/mnu-tot-full-match.json" with { type: "json" };

const OUT = "data/live/recorded-session.json";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

type Delivery = { live?: { sessionId?: string; cut?: { start: number; end: number }; label?: string; happenedAt?: string | null } };
const states = await sql<{ key: string; value: { log?: LiveLogEntry[] } }[]>`select key, value from app_settings where key like 'live_state:%'`;
if (!states.length) throw new Error("no recorded live sessions (live_state:*) in this database");
const wanted = process.argv[2];
const pick = wanted ? states.find((s) => s.key === `live_state:${wanted}`) : [...states].sort((a, b) => (b.value.log?.length ?? 0) - (a.value.log?.length ?? 0))[0];
if (!pick) throw new Error(`no live_state for session ${wanted}`);
const sessionId = pick.key.slice("live_state:".length);
const log = [...(pick.value.log ?? [])].reverse(); // stored newest first; keep it in the order it was written

const [ses] = await sql<{ value: { id: string; startedAt: string; joinedAtVideoSec: number } }[]>`select value from app_settings where key = 'live_session'`;
const rows = await sql<{ id: string; headline: string; content_type: string; status: string; delivery: Delivery; draft_paths: Record<string, string> | null; created_at: Date }[]>`
  select id, headline, content_type, status, delivery, draft_paths, created_at from opportunities where delivery ? 'live' order by created_at`;

const toClip = (o: (typeof rows)[number]): RecordedClip => {
  const l = o.delivery.live!;
  const paths = Object.values(o.draft_paths ?? {});
  const poster = paths.find((p) => p.endsWith(".jpg")) ?? null;
  const video = o.content_type === "reel" ? (paths.find((p) => p.endsWith(".mp4")) ?? poster?.replace(/\.poster\.jpg$/, ".mp4") ?? null) : null;
  return { id: o.id, headline: o.headline, contentType: o.content_type, status: o.status, label: l.label ?? "", at: l.cut!.start, end: l.cut!.end, poster, video, createdAt: o.created_at.toISOString(), happenedAt: l.happenedAt ?? null };
};
const clips = rows.filter((o) => o.delivery.live?.sessionId === sessionId && o.delivery.live?.cut).map(toClip);

// the session logged "Cutting the goal" for a window but its clip is not in the DB: use an earlier run's clip of the same window
for (const e of log.filter((x) => x.kind === "clip" && x.text.startsWith("Cutting the goal"))) {
  const m = /(\d+)s to (\d+)s/.exec(e.detail ?? "");
  if (!m) continue;
  const [start, end] = [Number(m[1]), Number(m[2])];
  if (clips.some((c) => Math.abs(c.at - start) < 1 && Math.abs(c.end - end) < 1)) continue;
  const same = rows.filter((o) => Math.abs((o.delivery.live?.cut?.start ?? -9) - start) < 1 && Math.abs((o.delivery.live?.cut?.end ?? -9) - end) < 1).map(toClip);
  for (const c of same) clips.push({ ...c, fromEarlierRun: true });
}

const rec: RecordedSession = {
  matchId: (liveMatch as { id: string }).id,
  sessionId,
  recordedAt: ses?.value.id === sessionId ? ses.value.startedAt : (clips[0]?.createdAt ?? new Date().toISOString()),
  joinedAtVideoSec: ses?.value.id === sessionId ? ses.value.joinedAtVideoSec : Math.min(...log.map((e) => e.at)),
  log,
  clips: clips.sort((a, b) => a.at - b.at || (a.contentType === "reel" ? -1 : 1)),
};
writeFileSync(OUT, JSON.stringify(rec, null, 1) + "\n");
console.log(`wrote ${OUT}: session ${sessionId}, ${log.length} log entries, ${rec.clips.length} clips (${rec.clips.filter((c) => c.contentType === "reel").length} reels), joined at ${rec.joinedAtVideoSec}s, recorded ${rec.recordedAt}`);
await sql.end();
