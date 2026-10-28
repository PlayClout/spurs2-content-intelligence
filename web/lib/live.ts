"use server";

/**
 * Live match desk (server). The session lives in app_settings "live_session" (written here); the engine's state and
 * activity log in "live_state:<id>" (written only by the live worker). The stream is ScorePlay's own presigned proxy
 * URL for the full match: the browser plays it straight from ScorePlay's CDN, nothing is copied.
 */
import { revalidatePath } from "next/cache";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import * as sp from "@shared/clients/scoreplay";
import { liveEdge, airedFeed, clockAt, clearableOnRestart, type LiveMatch, type LiveSession, type LiveState } from "@shared/live-match";
import liveMatch from "../../data/live/mnu-tot-full-match.json" with { type: "json" };

const MATCH = liveMatch as unknown as LiveMatch;
const SESSION_KEY = "live_session";
const ENGINE_STALE_MS = 10_000;

async function readSession(): Promise<LiveSession | null> {
  const [r] = await db.select().from(s.appSettings).where(eq(s.appSettings.key, SESSION_KEY));
  return (r?.value as LiveSession | undefined)?.id ? (r!.value as LiveSession) : null;
}
async function writeSession(v: LiveSession) {
  await db.insert(s.appSettings).values({ key: SESSION_KEY, value: v }).onConflictDoUpdate({ target: s.appSettings.key, set: { value: v, updatedAt: new Date() } });
}

/** A fresh presigned URL for ScorePlay's 720p proxy of the full match (valid 24h). */
async function streamFor(mediaId: number) {
  const fm = await sp.downloadFormats(mediaId);
  const files = Object.values(fm.data.items).flat().filter((f) => f.file_url && f.size !== -1);
  const f = files.find((x) => x.type === "video_medium") ?? files.find((x) => x.type === "video_large");
  if (!f?.file_url) throw new Error("ScorePlay returned no streamable proxy for the full match");
  const exp = Number(new URL(f.file_url).searchParams.get("X-Amz-Expires") ?? 3600);
  return { url: f.file_url, expiresAt: new Date(Date.now() + (exp - 300) * 1000).toISOString(), quality: f.type === "video_medium" ? "720p" : "1080p" };
}

/** Everything the desk renders. `match` never includes feed events that have not aired yet (no spoilers). */
export async function liveDesk(orgId: string) {
  let ses = await readSession();
  // the presigned stream URL lasts 24h: renew it on the server before it can reach the player expired (a session
  // left running overnight would otherwise load a dead link, and the browser's error fires before React listens)
  if (ses?.stream && Date.parse(ses.stream.expiresAt) <= Date.now()) {
    try {
      ses = { ...ses, stream: await streamFor(MATCH.scorePlayMediaId) };
      await writeSession(ses);
    } catch (e) {
      // never take the page down over the stream link: the desk still shows the clips, log and score
      console.error(`live: could not renew the ScorePlay stream link: ${(e as Error).message}`);
    }
  }
  const session = ses && ses.orgId === orgId ? ses : null;
  const [st] = session ? await db.select().from(s.appSettings).where(eq(s.appSettings.key, `live_state:${session.id}`)) : [];
  const state = (st?.value as (LiveState & { engineAt?: string }) | undefined) ?? null;
  const edge = session ? liveEdge(session, Date.now(), MATCH.durationSec) : 0;
  // the live engine writes its state every tick (1s) while a session runs
  const engineOk = !!state?.engineAt && Date.now() - Date.parse(state.engineAt) < ENGINE_STALE_MS;
  const clips = session
    ? (await db.select({ id: s.opportunities.id, headline: s.opportunities.headline, contentType: s.opportunities.contentType, status: s.opportunities.status, delivery: s.opportunities.delivery, draftPaths: s.opportunities.draftPaths, createdAt: s.opportunities.createdAt })
      .from(s.opportunities).where(eq(s.opportunities.orgId, orgId)))
      .filter((o) => (o.delivery as { live?: { sessionId?: string } })?.live?.sessionId === session.id)
      .map((o) => {
        const l = (o.delivery as { live: { cut: { start: number; end: number }; label: string; happenedAt?: string | null } }).live;
        return { id: o.id, headline: o.headline, contentType: o.contentType, status: o.status, label: l.label, at: l.cut.start, end: l.cut.end, poster: Object.values(o.draftPaths as Record<string, string>)[0] ?? null, createdAt: o.createdAt.toISOString(), happenedAt: l.happenedAt ?? null };
      })
      .sort((a, b) => b.at - a.at || (a.contentType === "reel" ? -1 : 1))
    : [];
  return {
    match: { ...MATCH, feed: airedFeed(MATCH.feed, edge) },
    session, edge, engineOk, engineAt: state?.engineAt ?? null, serverNow: Date.now(),
    log: state?.log ?? [], scans: state?.scans ?? 0, lastScanAt: state?.lastScanAt ?? null, pending: state?.pending.length ?? 0, clips,
  };
}
export type LiveDesk = Awaited<ReturnType<typeof liveDesk>>;

export async function startLive(orgId: string, joinAtSec: number) {
  try {
    if (!Number.isFinite(joinAtSec) || joinAtSec < 0 || joinAtSec >= MATCH.durationSec) return { ok: false as const, error: "Pick a point inside the match" };
    const now = new Date().toISOString();
    const session: LiveSession = {
      id: `s${Date.now().toString(36)}`, matchId: MATCH.id, orgId, status: "live",
      anchorVideoSec: joinAtSec, anchorAt: now, speed: 1, joinedAtVideoSec: joinAtSec, startedAt: now,
      stream: await streamFor(MATCH.scorePlayMediaId),
    };
    await writeSession(session);
    revalidatePath("/live");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

/** Pause / resume freeze and re-anchor the live edge, so the engine and the player stay on the same second. */
export async function setLivePaused(paused: boolean) {
  const ses = await readSession();
  if (!ses || ses.status === "ended") return { ok: false as const, error: "No live match" };
  const edge = liveEdge(ses, Date.now(), MATCH.durationSec);
  await writeSession({ ...ses, status: paused ? "paused" : "live", anchorVideoSec: edge, anchorAt: new Date().toISOString() });
  revalidatePath("/live");
  return { ok: true as const };
}

export async function endLive() {
  const ses = await readSession();
  if (!ses) return { ok: true as const };
  await writeSession({ ...ses, status: "ended", anchorVideoSec: liveEdge(ses, Date.now(), MATCH.durationSec), anchorAt: new Date().toISOString() });
  revalidatePath("/live");
  return { ok: true as const };
}

/** The presigned stream URL expires after 24h; refresh it without touching the live clock. */
export async function refreshLiveStream() {
  const ses = await readSession();
  if (!ses) return { ok: false as const, error: "No live match" };
  try {
    await writeSession({ ...ses, stream: await streamFor(MATCH.scorePlayMediaId) });
  } catch (e) {
    return { ok: false as const, error: `ScorePlay won't serve the match video right now: ${(e as Error).message}` };
  }
  return { ok: true as const };
}

/**
 * Restart the simulated live match (for demos): end the current session, clear the clips earlier live runs made that
 * nobody has acted on yet (approved, rejected, published or referenced clips stay; library, replay and manual clips are
 * never touched), drop the engine's per-session state, then go live again at `joinAtSec`. ScorePlay, TwelveLabs and
 * files on disk are not touched: these are rows of demo state.
 */
export async function restartLive(orgId: string, joinAtSec: number) {
  try {
    if (!Number.isFinite(joinAtSec) || joinAtSec < 0 || joinAtSec >= MATCH.durationSec) return { ok: false as const, error: "Pick a point inside the match" };
    const old = await readSession();
    if (old && old.status !== "ended") await writeSession({ ...old, status: "ended", anchorVideoSec: liveEdge(old, Date.now(), MATCH.durationSec), anchorAt: new Date().toISOString() });

    const rows = await db.select({ id: s.opportunities.id, status: s.opportunities.status, delivery: s.opportunities.delivery })
      .from(s.opportunities).where(eq(s.opportunities.orgId, orgId));
    const live = rows.filter((o) => !!(o.delivery as { live?: unknown } | null)?.live);
    const ids = live.map((o) => o.id);
    const refs = new Set<string>();
    if (ids.length) {
      for (const t of [s.publishedAssets, s.publications, s.approvalAudits]) {
        for (const r of await db.select({ id: t.opportunityId }).from(t).where(inArray(t.opportunityId, ids))) if (r.id) refs.add(r.id);
      }
    }
    const clear = live.filter((o) => clearableOnRestart({ status: o.status, fromLiveMatch: true, referenced: refs.has(o.id) })).map((o) => o.id);
    if (clear.length) await db.delete(s.opportunities).where(inArray(s.opportunities.id, clear));
    await db.delete(s.appSettings).where(like(s.appSettings.key, "live_state:%"));
    // a live-lane job still queued from the old session would cut the old match into the new run
    await db.delete(s.jobs).where(and(eq(s.jobs.status, "queued"), like(sql`${s.jobs.payload}->>'slug'`, "live-%")));

    const r = await startLive(orgId, joinAtSec);
    if (!r.ok) return r;
    revalidatePath("/");
    const kept = live.length - clear.length;
    return { ok: true as const, message: `Restarted at ${clockAt(MATCH, joinAtSec).minute}: cleared ${clear.length} earlier live clip${clear.length === 1 ? "" : "s"}${kept ? `, kept ${kept} you approved or rejected` : ""}` };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

/** Is there a live (or paused) match for the nav dot? Cheap read. */
export async function liveStatus(orgId: string) {
  const ses = await readSession();
  return ses && ses.orgId === orgId && ses.status !== "ended" ? ses.status : null;
}

/** Demo reset clears every live session and engine state too (no club footage involved: these are rows of state). */
export async function clearLive() {
  await db.delete(s.appSettings).where(like(s.appSettings.key, "live_%"));
}
