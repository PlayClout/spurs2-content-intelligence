"use server";

/**
 * Compilation tray server layer (A3.1/A3.2/A3.3/A3.5). The editor's ordered selection is re-validated server-side
 * (planCompilation) and approved as ONE exact ordered revision; the worker re-checks that revision before rendering.
 */
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import type { Compliance } from "@shared/schemas";
import { planCompilation, suggestCompilation, COMPILATION_LIMITS, type CompilationCandidate } from "@shared/compilation";
import { laneFor, LIVE_LANE } from "@shared/live-match";

async function candidatesFor(orgId: string): Promise<CompilationCandidate[]> {
  const rows = await db.select().from(s.opportunities)
    .where(and(eq(s.opportunities.orgId, orgId), inArray(s.opportunities.status, ["approved", "rendering", "rendered", "exported"])))
    .orderBy(desc(s.opportunities.score));
  return rows.map((o) => {
    const d = (o.delivery ?? {}) as { requiresReview?: boolean; scoreplay?: { mediaId?: number }; tightWindow?: { start: number; end: number } };
    const t = o.trimOverride as { startSec: number; endSec: number } | null;
    return {
      opportunityId: o.id, headline: o.headline, status: o.status, complianceStatus: (o.compliance as Compliance)?.status ?? "unknown",
      requiresReview: !!d.requiresReview, mediaId: d.scoreplay?.mediaId ?? null, window: t ? { start: t.startSec, end: t.endSec } : d.tightWindow ?? null, score: o.score,
    };
  });
}

export async function compilationTrayData(orgId: string) {
  const candidates = await candidatesFor(orgId);
  const recent = await db.select().from(s.jobs).where(and(eq(s.jobs.type, "render_compilation"), sql`${s.jobs.payload}->>'orgId' = ${orgId}`)).orderBy(desc(s.jobs.queuedAt)).limit(5);
  return {
    limits: COMPILATION_LIMITS,
    candidates: candidates.map((c) => ({ ...c, durationSec: c.window ? +(c.window.end - c.window.start).toFixed(1) : 0, eligible: !!c.mediaId && !!c.window && c.complianceStatus !== "blocked" && !c.requiresReview })),
    suggested: suggestCompilation(candidates).map((c) => c.opportunityId),
    recent: recent.map((j) => {
      const r = (j.payload as { result?: { outPath: string; posterPath: string; durationSec: number; entries: { headline: string; role: string }[] } }).result;
      return { id: j.id, status: j.status, error: j.error, queuedAt: j.queuedAt.toISOString(), result: r ?? null };
    }),
  };
}

/** Approve the exact ordered selection and queue the montage render. */
export async function approveAndRenderCompilation(orgId: string, orderedIds: string[]) {
  const all = await candidatesFor(orgId);
  const byId = new Map(all.map((c) => [c.opportunityId, c]));
  const missing = orderedIds.filter((id) => !byId.has(id));
  if (missing.length) return { ok: false as const, errors: ["One or more clips are no longer approved for this club"] };
  const plan = planCompilation(orderedIds.map((id) => byId.get(id)!));
  if (!plan.ok) return { ok: false as const, errors: plan.errors };
  const compilationId = `c${Date.now().toString(36)}`;
  // a montage with any live-match clip renders in the live lane (only the live engine cuts windows off the full match)
  const live = (await db.select({ d: s.opportunities.delivery }).from(s.opportunities).where(inArray(s.opportunities.id, orderedIds))).some((r) => laneFor(r.d));
  await db.insert(s.jobs).values({ type: "render_compilation", status: "queued", payload: { orgId, compilationId, entries: orderedIds.map((opportunityId) => ({ opportunityId })), revision: plan.revision, ...(live ? { lane: LIVE_LANE } : {}) } });
  await db.insert(s.approvalAudits).values({ orgId, actor: "editor", action: "approve_compilation", payload: { compilationId, revision: plan.revision, entries: plan.entries.map((e) => ({ id: e.opportunityId, role: e.role, startSec: e.startSec, endSec: e.endSec })) } });
  revalidatePath("/");
  return { ok: true as const, message: `Approved ${plan.entries.length}-clip montage (${plan.totalSec.toFixed(1)}s); render queued` };
}
