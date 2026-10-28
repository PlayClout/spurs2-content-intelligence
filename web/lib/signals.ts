"use server";

/**
 * Hot-clip rail server layer (A0.2, A0.6, B13.3-B13.5). Urgency is computed at request time from the real signals
 * rows linked to each card (occurredAt, kind, simulated flag); nothing is stored as a precomputed score, so the rail
 * can never show a stale or invented number. Claim / snooze / dismiss live on the opportunity's delivery.alert.
 */
import { revalidatePath } from "next/cache";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import type { Compliance } from "@shared/schemas";
import { scoreUrgency, alertVisible, weightFromText, providerStatuses, type AlertState, type Lane, type SignalKind } from "@shared/signals";

const KIND: Record<string, SignalKind> = { game_event: "game_event", social_reaction: "social_reaction", context: "ai_watchlist" };

export interface HotClip {
  opportunityId: string; headline: string; lane: Lane; score: number; why: string[]; ageSec: number;
  momentum: { recent: number; baseline: number; ratio: number }; coverage: number; draftReady: boolean;
  rightsBlocked: boolean; claimedBy: string | null; reopened: boolean; simulated: boolean; latestSignal: string;
}

export async function hotClips(orgId: string, now = new Date()) {
  const opps = await db.select().from(s.opportunities)
    .where(and(eq(s.opportunities.orgId, orgId), notInArray(s.opportunities.status, ["rejected", "expired"])));
  const sigIds = [...new Set(opps.flatMap((o) => (o.signalIds as string[]) ?? []))];
  const sigs = sigIds.length ? await db.select().from(s.signals).where(inArray(s.signals.id, sigIds)) : [];
  const byId = new Map(sigs.map((x) => [x.id, x]));
  // one alert per PLAY: the casual reel and superfan card of the same moment share signals; show the reel
  const seenMoment = new Set<string>();
  const ordered = [...opps].sort((a, b) => (a.contentType === "reel" ? -1 : 1) - (b.contentType === "reel" ? -1 : 1));
  const out: HotClip[] = [];
  // Replay clock: a replay compresses match time (50x = the whole half in ~1s), so wall-clock age is meaningless for
  // replayed signals. Age replayed signals against the replay itself: "now" = 30 match-seconds after the newest
  // replayed signal. Live (non-simulated) signals always use real wall-clock time. The rail labels these REPLAY.
  const replayNow = sigs.filter((x) => x.simulated).reduce((m, x) => Math.max(m, x.occurredAt.getTime()), 0);
  const clockFor = (simulatedOnly: boolean) => (simulatedOnly && replayNow ? new Date(replayNow + 30_000) : now);
  for (const o of ordered) {
    if (seenMoment.has(o.momentId)) continue;
    seenMoment.add(o.momentId);
    const linked = ((o.signalIds as string[]) ?? []).map((id) => byId.get(id)).filter(Boolean) as (typeof sigs)[number][];
    if (!linked.length) continue;
    const d = (o.delivery ?? {}) as { alert?: AlertState };
    const state = d.alert ?? {};
    const draftReady = ["draft_ready", "needs_review", "approved", "rendering", "rendered", "exported"].includes(o.status);
    const clock = clockFor(linked.every((x) => x.simulated));
    const u = scoreUrgency({
      signals: linked.map((x) => ({ kind: KIND[x.kind] ?? "news", observedAt: x.occurredAt, weight: weightFromText(x.eventText, KIND[x.kind] ?? "news"), mode: x.simulated ? "replay" as const : "live" as const })),
      now: clock, matchConfidence: 1, // signals are linked to this card by the pipeline's same-media + overlapping-window merge
      draftReady, previousLane: state.lastLane ?? null,
    });
    const vis = alertVisible(state, u, now);
    if (!vis.visible) continue;
    const newest = linked.reduce((a, b) => (a.occurredAt > b.occurredAt ? a : b));
    out.push({
      opportunityId: o.id, headline: o.headline, lane: u.lane, score: u.score, why: u.why, ageSec: u.ageSec, momentum: u.momentum,
      coverage: u.coverage, draftReady, rightsBlocked: (o.compliance as Compliance)?.status === "blocked",
      claimedBy: state.claimedBy ?? null, reopened: vis.reason.startsWith("re-opened"), simulated: linked.every((x) => x.simulated), latestSignal: newest.eventText,
    });
  }
  const rank: Record<Lane, number> = { act_now: 0, rising: 1, watch: 2 };
  out.sort((a, b) => rank[a.lane] - rank[b.lane] || b.score - a.score);
  return { clips: out, providers: providerStatuses({ TWELVELABS_API_KEY: process.env.TWELVELABS_API_KEY, MOCK_MODE: process.env.MOCK_MODE, X_BEARER_TOKEN: process.env.X_BEARER_TOKEN }) };
}

async function patchAlert(opportunityId: string, change: (cur: AlertState) => AlertState, action: string) {
  const [o] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!o) return { ok: false as const, error: "Opportunity not found" };
  const d = (o.delivery ?? {}) as Record<string, unknown> & { alert?: AlertState };
  const next = change(d.alert ?? {});
  await db.update(s.opportunities).set({ delivery: { ...d, alert: next } }).where(eq(s.opportunities.id, opportunityId));
  await db.insert(s.approvalAudits).values({ orgId: o.orgId, opportunityId, actor: "editor", action, payload: next });
  revalidatePath("/");
  return { ok: true as const };
}

export async function claimAlert(opportunityId: string, editor = "editor") {
  return patchAlert(opportunityId, (c) => ({ ...c, claimedBy: c.claimedBy === editor ? null : editor }), "alert_claim");
}
export async function snoozeAlert(opportunityId: string, minutes = 10) {
  const until = new Date(Date.now() + Math.max(1, Math.min(120, minutes)) * 60_000).toISOString();
  return patchAlert(opportunityId, (c) => ({ ...c, snoozedUntil: until }), "alert_snooze");
}
export async function dismissAlert(opportunityId: string, score: number) {
  return patchAlert(opportunityId, (c) => ({ ...c, dismissedAt: new Date().toISOString(), dismissedScore: Math.round(score) }), "alert_dismiss");
}
/** Persist the lane each alert was last shown in, so hysteresis applies across refreshes. */
export async function rememberLanes(orgId: string, lanes: { opportunityId: string; lane: Lane }[]) {
  for (const { opportunityId, lane } of lanes) {
    const [o] = await db.select({ delivery: s.opportunities.delivery, orgId: s.opportunities.orgId }).from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
    if (!o || o.orgId !== orgId) continue;
    const d = (o.delivery ?? {}) as Record<string, unknown> & { alert?: AlertState };
    if (d.alert?.lastLane === lane) continue;
    await db.update(s.opportunities).set({ delivery: { ...d, alert: { ...(d.alert ?? {}), lastLane: lane } } }).where(eq(s.opportunities.id, opportunityId));
  }
}
