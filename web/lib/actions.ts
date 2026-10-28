"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import type { Compliance } from "@shared/schemas";
import { getPublishBackend } from "@shared/clients/publish";
import { configureWriteStore, enqueueWrite } from "@shared/clients/writeback";
import { createDbWriteStore } from "@shared/write-store";
import { approvalRevision, sourceLogRequest } from "@shared/approval";
import { smartTrimFor, trimModeOf } from "@shared/smart-trim";
import { laneFor } from "@shared/live-match";
import { clearLive } from "@/lib/live";
import { channelProfiles } from "@/lib/channels";
import timeline from "../../data/replays/thfc-mnu-week6.json" with { type: "json" };
import themes from "../../pipeline/club-themes.json" with { type: "json" };
import { search, pickNew, type Footage, type Window } from "@pipeline/watchlist";
import type { MomentInput } from "@pipeline/moment";
import type { Timeline } from "@pipeline/replay";

export type OpportunityRow = typeof s.opportunities.$inferSelect;
export type SignalRow = typeof s.signals.$inferSelect;
export type OrgRow = typeof s.orgs.$inferSelect;
export type JobRow = typeof s.jobs.$inferSelect;

export interface QueueFilters {
  status?: string; // "active" | specific status | "all"
  audience?: string;
  sport?: string;
}

const demoTimeline = timeline as Timeline;
const orgKeyToDisplayName = (key: string) => (themes as Record<string, { displayName?: string }>)[key]?.displayName ?? key;
const DEMO_LANE = "default";

function inputFromTimelineEvent(ev: Timeline["events"][number], f: Footage, trigger: MomentInput["trigger"], start: number, end: number): MomentInput {
  return {
    orgKey: f.orgKey,
    competition: f.competition,
    scorePlayMediaId: f.scorePlayMediaId,
    twelvelabsAssetId: f.twelvelabsAssetId,
    teamSeasonId: f.teamSeasonId,
    manifestFixture: demoTimeline.manifestFixture,
    startSec: start,
    endSec: end,
    headline: ev.headline,
    kicker: ev.kicker,
    statLine: ev.statLine,
    trigger,
  };
}

export async function listOrgs(): Promise<OrgRow[]> {
  return db.select().from(s.orgs).orderBy(s.orgs.name);
}

export async function listOpportunities(
  orgId: string,
  filters: QueueFilters = {}
): Promise<(OpportunityRow & { surfacedAfterSec: number | null })[]> {
  const conds = [eq(s.opportunities.orgId, orgId)];
  if (filters.status && filters.status !== "all") {
    if (filters.status === "active") {
      // Ready lane = destination-cleared drafts only (B2.2). Blocked compliance lives in its own lane.
      conds.push(inArray(s.opportunities.status, ["draft_pending", "draft_ready"]));
      conds.push(sql`coalesce(${s.opportunities.compliance}->>'status', 'unknown') <> 'blocked'`);
    } else if (filters.status === "blocked") {
      conds.push(sql`${s.opportunities.compliance}->>'status' = 'blocked'`);
      conds.push(sql`${s.opportunities.status} not in ('rejected')`);
    } else {
      conds.push(eq(s.opportunities.status, filters.status));
    }
  }
  if (filters.audience && filters.audience !== "all")
    conds.push(eq(s.opportunities.audience, filters.audience));
  if (filters.sport && filters.sport !== "all")
    conds.push(eq(s.opportunities.sport, filters.sport));

  const rows = await db
    .select()
    .from(s.opportunities)
    .where(and(...conds))
    .orderBy(desc(s.opportunities.score));

  // "surfaced Ns after the play": opportunity.createdAt - earliest contributing signal occurredAt
  const allSignalIds = rows.flatMap((r) => (r.signalIds as string[]) ?? []);
  const sigs = allSignalIds.length
    ? await db.select().from(s.signals).where(inArray(s.signals.id, allSignalIds))
    : [];
  const sigById = new Map(sigs.map((x) => [x.id, x]));

  return rows.map((r) => {
    const times = ((r.signalIds as string[]) ?? [])
      .map((id) => sigById.get(id)?.occurredAt)
      .filter(Boolean) as Date[];
    const earliest = times.length ? Math.min(...times.map((t) => t.getTime())) : null;
    const surfacedAfterSec = earliest
      ? Math.max(0, Math.round((r.createdAt.getTime() - earliest) / 1000))
      : null;
    return { ...r, surfacedAfterSec };
  });
}

export async function getOpportunityDetail(id: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return null;
  const [moment] = await db.select().from(s.moments).where(eq(s.moments.id, opp.momentId));
  const sigIds = (opp.signalIds as string[]) ?? [];
  const sigs = sigIds.length
    ? await db.select().from(s.signals).where(inArray(s.signals.id, sigIds))
    : [];
  return { opp, moment: moment ?? null, signals: sigs };
}

export async function getQueueStats(orgId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where status in ('draft_pending','draft_ready') and coalesce(compliance->>'status','unknown') <> 'blocked')::int`,
      needsReview: sql<number>`count(*) filter (where status = 'needs_review')::int`,
      blocked: sql<number>`count(*) filter (where compliance->>'status' = 'blocked' and status <> 'rejected')::int`,
      approved: sql<number>`count(*) filter (where status in ('approved','rendering','rendered','exported'))::int`,
      avgScore: sql<number>`coalesce(round(avg(score) filter (where status in ('draft_pending','draft_ready')))::int, 0)`,
    })
    .from(s.opportunities)
    .where(eq(s.opportunities.orgId, orgId));
  return row;
}

export async function approveOpportunity(id: string, overrideReason?: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };

  // Compliance hard gate — blocked content cannot be approved.
  const compliance = opp.compliance as Compliance;
  if (compliance?.status === "blocked") {
    return { ok: false as const, error: `Blocked by compliance: ${compliance.reasons?.join("; ")}` };
  }
  // Needs-review approval is an explicit override and must carry a reason (A2.7/B2.11).
  const reason = overrideReason?.trim() ?? "";
  if (opp.status === "needs_review" && reason.length < 5) {
    return { ok: false as const, error: "This clip needs review: enter an override reason (at least 5 characters) to approve" };
  }

  // Smart trim unless the editor set a manual cut. Stored on the row, so the final render, the ScorePlay log and the
  // approval revision all use exactly the cut shown on the review screen. trimMode keeps per-channel packaging smart.
  const d = (opp.delivery ?? {}) as Record<string, unknown>;
  const manual = trimModeOf(opp.delivery, opp.trimOverride) === "manual";
  const trim = manual ? opp.trimOverride : (await smartCutFor(opp)) ?? opp.trimOverride;
  await db
    .update(s.opportunities)
    .set({ status: "approved", rejectReason: null, trimOverride: trim, delivery: { ...d, trimMode: manual ? "manual" : "smart" } })
    .where(eq(s.opportunities.id, id));

  await db.insert(s.jobs).values({
    type: "render_final",
    payload: { opportunityId: id, channels: opp.channels, trimOverride: trim, ...(laneFor(opp.delivery) ? { lane: laneFor(opp.delivery) } : {}) },
    status: "queued",
  });

  // Approval queues the ScorePlay source log automatically (B10.4): same durable job + idempotency key the worker uses,
  // so the worker's send after render can never create a second one. Held by default until taxonomy sign-off.
  const approvedRow = { ...opp, status: "approved", trimOverride: trim };
  const revision = approvalRevision(approvedRow);
  const req = sourceLogRequest(approvedRow, revision, "editor");
  let writeBack: string = req.ok ? "queued" : `skipped: ${req.reason}`;
  if (req.ok) {
    try {
      configureWriteStore(createDbWriteStore(db));
      await enqueueWrite(req.request);
    } catch (e) {
      writeBack = `queue failed: ${(e as Error).message}`;
    }
  }
  await db.insert(s.approvalAudits).values({
    orgId: opp.orgId, opportunityId: id, actor: "editor", action: opp.status === "needs_review" ? "approve_override" : "approve",
    reasonCode: reason || null, payload: { revision, writeBack, priorStatus: opp.status },
  });

  revalidatePath("/");
  return { ok: true as const };
}

export async function rejectOpportunity(id: string, reason: string) {
  const [opp] = await db.select({ orgId: s.opportunities.orgId }).from(s.opportunities).where(eq(s.opportunities.id, id));
  await db
    .update(s.opportunities)
    .set({ status: "rejected", rejectReason: reason || "No reason given" })
    .where(eq(s.opportunities.id, id));
  if (opp) await db.insert(s.approvalAudits).values({ orgId: opp.orgId, opportunityId: id, actor: "editor", action: "reject", reasonCode: reason || "no_reason", payload: {} });
  revalidatePath("/");
  return { ok: true as const };
}

export async function saveTrim(id: string, startSec: number, endSec: number) {
  if (!(endSec > startSec)) return { ok: false as const, error: "End must be after start" };
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };
  // A trim edit after approval invalidates that approval (B2.5): back to draft, re-approval required.
  const wasApproved = ["approved", "rendering", "rendered", "exported"].includes(opp.status);
  await db
    .update(s.opportunities)
    .set({ trimOverride: { startSec, endSec }, delivery: { ...((opp.delivery ?? {}) as object), trimMode: "manual" }, ...(wasApproved ? { status: "draft_ready" } : {}) })
    .where(eq(s.opportunities.id, id));
  await db.insert(s.approvalAudits).values({ orgId: opp.orgId, opportunityId: id, actor: "editor", action: "trim", payload: { startSec, endSec, invalidatedApproval: wasApproved } });
  revalidatePath("/");
  return { ok: true as const, invalidatedApproval: wasApproved };
}

/** Back to smart trim: drop the manual cut. Like any trim edit, this invalidates an existing approval. */
export async function resetToSmartTrim(id: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };
  const d = (opp.delivery ?? {}) as Record<string, unknown>;
  if (trimModeOf(opp.delivery, opp.trimOverride) === "smart") return { ok: true as const, invalidatedApproval: false };
  const wasApproved = ["approved", "rendering", "rendered", "exported"].includes(opp.status);
  await db.update(s.opportunities).set({ trimOverride: null, delivery: { ...d, trimMode: "smart" }, ...(wasApproved ? { status: "draft_ready" } : {}) }).where(eq(s.opportunities.id, id));
  await db.insert(s.approvalAudits).values({ orgId: opp.orgId, opportunityId: id, actor: "editor", action: "trim_smart", payload: { invalidatedApproval: wasApproved } });
  revalidatePath("/");
  return { ok: true as const, invalidatedApproval: wasApproved };
}

/** Smart cut for a clip's lead channel, from its stored beats. Null when there is nothing to trim (photo / no window). */
async function smartCutFor(opp: OpportunityRow) {
  const [m] = await db.select({ raw: s.moments.raw }).from(s.moments).where(eq(s.moments.id, opp.momentId));
  const t = smartTrimFor(m?.raw ?? null, opp.delivery, channelProfiles[(opp.channels as string[])[0]]);
  return t ? { startSec: t.start, endSec: t.end } : null;
}

export async function saveCopy(id: string, channel: string, copy: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };
  const max = channelProfiles[channel]?.copy.maxChars ?? 0;
  if (max > 0 && copy.length > max) return { ok: false as const, error: `Caption is ${copy.length}/${max} characters` };
  const generatedCopy = { ...(opp.generatedCopy as Record<string, string>), [channel]: copy };
  // Like a trim edit (B2.5): editing an approved clip's caption invalidates that approval.
  const wasApproved = ["approved", "rendering", "rendered", "exported"].includes(opp.status);
  await db.update(s.opportunities).set({ generatedCopy, ...(wasApproved ? { status: "draft_ready" } : {}) }).where(eq(s.opportunities.id, id));
  await db.insert(s.approvalAudits).values({ orgId: opp.orgId, opportunityId: id, actor: "editor", action: "copy", payload: { channel, invalidatedApproval: wasApproved } });
  revalidatePath("/");
  return { ok: true as const, invalidatedApproval: wasApproved };
}

export async function publishOpportunity(
  id: string,
  channel: string,
) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };

  const compliance = opp.compliance as Compliance;
  if (compliance?.status === "blocked") {
    return { ok: false as const, error: "Blocked by compliance — cannot publish" };
  }

  const backend = getPublishBackend();
  const copy = (opp.generatedCopy as Record<string, string>)[channel] ?? opp.headline;
  const finalPaths = opp.finalPaths as Record<string, string>;
  const draftPaths = opp.draftPaths as Record<string, string>;

  const result = await backend.publish({
    orgId: opp.orgId,
    opportunityId: opp.id,
    channel: channel as never,
    copy,
    assetPath: finalPaths[channel] ?? draftPaths[channel] ?? null,
  });

  if (!result.ok) return { ok: false as const, error: result.error ?? "Publish failed" };

  await db.insert(s.publishedAssets).values({
    orgId: opp.orgId,
    opportunityId: opp.id,
    channel,
    publishedAt: new Date(),
    externalRef: result.externalRef,
  });
  await db
    .update(s.opportunities)
    .set({ status: "exported" })
    .where(eq(s.opportunities.id, id));

  revalidatePath("/published");
  revalidatePath("/");
  return { ok: true as const, mode: result.mode, externalRef: result.externalRef };
}

export async function listPublished(orgId: string) {
  const rows = await db
    .select({
      pub: s.publishedAssets,
      opp: s.opportunities,
    })
    .from(s.publishedAssets)
    .innerJoin(s.opportunities, eq(s.publishedAssets.opportunityId, s.opportunities.id))
    .where(eq(s.publishedAssets.orgId, orgId))
    .orderBy(desc(s.publishedAssets.publishedAt));
  return rows;
}

export async function listJobs(limit = 30): Promise<JobRow[]> {
  return db.select().from(s.jobs).orderBy(desc(s.jobs.queuedAt)).limit(limit);
}

/** Lightweight health probe for the live-engine status dot / connection indicator. */
export async function engineStatus() {
  try {
    const t0 = performance.now();
    await db.execute(sql`select 1`);
    return { ok: true as const, latencyMs: Math.round(performance.now() - t0) };
  } catch {
    return { ok: false as const, latencyMs: null };
  }
}

export async function resetDemo() {
  // Demo reset is intentionally DB-only. It never touches ScorePlay, TwelveLabs, S3 objects or external posts.
  try {
    await db.execute(sql`delete from performance_snapshots`);
    await db.execute(sql`delete from published_assets`);
    await db.execute(sql`delete from opportunities`);
    await db.execute(sql`delete from signals`);
    await db.execute(sql`delete from moments`);
    await db.execute(sql`delete from assets`);
    await db.execute(sql`delete from jobs`);
    await clearLive();
    revalidatePath("/");
    revalidatePath("/published");
    return { ok: true as const, message: "Demo reset: queue cleared; ScorePlay untouched" };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function replayDemo(selectedOrgId?: string) {
  try {
    const orgs = await db.select().from(s.orgs);
    const orgByName = new Map(orgs.map((o) => [o.name, o]));
    const selected = orgs.find((o) => o.id === selectedOrgId) ?? null;
    const now = Date.now();
    const events = [...demoTimeline.events].sort((a, b) => a.at - b.at);
    const fired: { mediaId: number; window: Window }[] = [];
    let queued = 0;
    let skipped = 0;

    for (const ev of events) {
      const keys = Array.isArray(ev.footage) ? ev.footage : [ev.footage];
      const pool = keys.map((k) => demoTimeline.footage[k]);
      if (ev.kind !== "ai_watchlist") {
        const f = pool[0];
        const org = orgByName.get(orgKeyToDisplayName(f.orgKey));
        if (!org) throw new Error(`Org ${orgKeyToDisplayName(f.orgKey)} not found`);
        const input = inputFromTimelineEvent(ev, f, { kind: ev.kind, text: `${ev.text} (simulated feed)`, simulated: true }, ev.start!, ev.end!);
        const scheduledAt = new Date(now + ev.at * 1000);
        await db.insert(s.jobs).values({ type: "process_moment", payload: { orgId: org.id, input, lane: DEMO_LANE }, status: "queued", queuedAt: scheduledAt });
        fired.push({ mediaId: input.scorePlayMediaId, window: { start: input.startSec, end: input.endSec } });
        queued++;
        continue;
      }

      const { hits, mode } = await search(demoTimeline.indexId, ev.query!, pool.map((f) => f.twelvelabsVideoId));
      const pick = pickNew(hits, pool, fired);
      if (!pick) { skipped++; continue; }
      const org = orgByName.get(orgKeyToDisplayName(pick.footage.orgKey));
      if (!org) throw new Error(`Org ${orgKeyToDisplayName(pick.footage.orgKey)} not found`);
      const input = inputFromTimelineEvent(
        ev,
        pick.footage,
        { kind: "ai_watchlist", text: `TwelveLabs watch-list "${ev.query}" hit #${pick.hit.rank} at ${pick.hit.start.toFixed(1)}-${pick.hit.end.toFixed(1)}s (${mode === "live" ? "live search" : "recorded live search"})`, simulated: false },
        pick.hit.start,
        pick.hit.end,
      );
      const scheduledAt = new Date(now + ev.at * 1000);
      await db.insert(s.jobs).values({ type: "process_moment", payload: { orgId: org.id, input, lane: DEMO_LANE }, status: "queued", queuedAt: scheduledAt });
      fired.push({ mediaId: input.scorePlayMediaId, window: { start: input.startSec, end: input.endSec } });
      queued++;
    }

    revalidatePath("/");
    const selectedName = selected ? ` · viewing ${selected.name}` : "";
    return { ok: true as const, message: `Replay queued ${queued} moment${queued === 1 ? "" : "s"}${skipped ? `, ${skipped} skipped` : ""}${selectedName}` };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
