"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import type { Compliance } from "@shared/schemas";
import { getPublishBackend } from "@shared/clients/publish";

export type OpportunityRow = typeof s.opportunities.$inferSelect;
export type SignalRow = typeof s.signals.$inferSelect;
export type OrgRow = typeof s.orgs.$inferSelect;
export type JobRow = typeof s.jobs.$inferSelect;

export interface QueueFilters {
  status?: string; // "active" | specific status | "all"
  audience?: string;
  sport?: string;
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
      conds.push(inArray(s.opportunities.status, ["draft_pending", "draft_ready"]));
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
      active: sql<number>`count(*) filter (where status in ('draft_pending','draft_ready'))::int`,
      approved: sql<number>`count(*) filter (where status in ('approved','rendering','rendered','exported'))::int`,
      avgScore: sql<number>`coalesce(round(avg(score) filter (where status in ('draft_pending','draft_ready')))::int, 0)`,
    })
    .from(s.opportunities)
    .where(eq(s.opportunities.orgId, orgId));
  return row;
}

export async function approveOpportunity(id: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };

  // Compliance hard gate — blocked content cannot be approved.
  const compliance = opp.compliance as Compliance;
  if (compliance?.status === "blocked") {
    return { ok: false as const, error: `Blocked by compliance: ${compliance.reasons?.join("; ")}` };
  }

  await db
    .update(s.opportunities)
    .set({ status: "approved", rejectReason: null })
    .where(eq(s.opportunities.id, id));

  await db.insert(s.jobs).values({
    type: "render_final",
    payload: { opportunityId: id, channels: opp.channels, trimOverride: opp.trimOverride },
    status: "queued",
  });

  revalidatePath("/");
  return { ok: true as const };
}

export async function rejectOpportunity(id: string, reason: string) {
  await db
    .update(s.opportunities)
    .set({ status: "rejected", rejectReason: reason || "No reason given" })
    .where(eq(s.opportunities.id, id));
  revalidatePath("/");
  return { ok: true as const };
}

export async function saveTrim(id: string, startSec: number, endSec: number) {
  if (!(endSec > startSec)) return { ok: false as const, error: "End must be after start" };
  await db
    .update(s.opportunities)
    .set({ trimOverride: { startSec, endSec } })
    .where(eq(s.opportunities.id, id));
  revalidatePath("/");
  return { ok: true as const };
}

export async function saveCopy(id: string, channel: string, copy: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };
  const generatedCopy = { ...(opp.generatedCopy as Record<string, string>), [channel]: copy };
  await db.update(s.opportunities).set({ generatedCopy }).where(eq(s.opportunities.id, id));
  revalidatePath("/");
  return { ok: true as const };
}

export async function publishOpportunity(
  id: string,
  channel: string,
  mode: "simulated" | "live"
) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, id));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };

  const compliance = opp.compliance as Compliance;
  if (compliance?.status === "blocked") {
    return { ok: false as const, error: "Blocked by compliance — cannot publish" };
  }

  const backend = getPublishBackend(mode);
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
    const t0 = Date.now();
    await db.execute(sql`select 1`);
    return { ok: true as const, latencyMs: Date.now() - t0 };
  } catch {
    return { ok: false as const, latencyMs: null };
  }
}
