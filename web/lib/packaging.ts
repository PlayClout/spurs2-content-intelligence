"use server";

/**
 * Channel packaging workspace server layer (A3b.1-A3b.5). The plan is always rebuilt server-side from the live row
 * (planPackaging), so the browser can never approve a recipe the server did not compute. Edits are stored as
 * per-destination overrides; approval records each destination's exact revision and queues one render_package job.
 */
import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { planPackaging, packagingSourceFromRow, DESTINATIONS, type PackagingSource } from "@shared/packaging";
import { laneFor } from "@shared/live-match";

async function sourceFor(opportunityId: string) {
  const [o] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!o) return null;
  const d = (o.delivery ?? {}) as { packaging?: { overrides?: PackagingSource["overrides"]; variants?: Record<string, VariantState>; approved?: Record<string, string> } };
  const [m] = await db.select({ raw: s.moments.raw }).from(s.moments).where(eq(s.moments.id, o.momentId));
  return { o, d, src: packagingSourceFromRow(o, m?.raw ?? null) };
}

export interface VariantState { status: "done" | "failed" | "held"; revision?: string; path?: string; durationSec?: number; error?: string; at: string }

export async function packagingWorkspace(opportunityId: string) {
  const r = await sourceFor(opportunityId);
  if (!r) return null;
  const plan = planPackaging(r.src);
  const variants = r.d.packaging?.variants ?? {};
  const approved = r.d.packaging?.approved ?? {};
  const [pending] = await db.select({ n: sql<number>`count(*)::int` }).from(s.jobs)
    .where(and(eq(s.jobs.type, "render_package"), inArray(s.jobs.status, ["queued", "running"]), sql`${s.jobs.payload}->>'opportunityId' = ${opportunityId}`));
  return {
    analysedWindow: r.src.analysedWindow,
    destinations: plan.map((p) => {
      const v = variants[p.channel];
      const approvedRev = approved[p.channel];
      return {
        ...p,
        approvedRevision: approvedRev ?? null,
        approvalCurrent: !!approvedRev && approvedRev === p.revision,
        rendered: v?.status === "done" && v.revision === p.revision ? { path: v.path!, durationSec: v.durationSec ?? null } : null,
        lastStatus: v ? { status: v.status, error: v.error ?? null, stale: !!v.revision && v.revision !== p.revision } : null,
      };
    }),
    rendering: (pending?.n ?? 0) > 0,
  };
}

/** Save one destination's edits (cut / crop / copy / mute). Changes only that destination's revision. */
export async function saveVariantOverride(opportunityId: string, channel: string, o: { startSec?: number; endSec?: number; cropXOffset?: number; copy?: string; muteAudio?: boolean }) {
  if (!DESTINATIONS.includes(channel)) return { ok: false as const, error: "Unknown destination" };
  const r = await sourceFor(opportunityId);
  if (!r) return { ok: false as const, error: "Opportunity not found" };
  const clean: Record<string, unknown> = {};
  for (const k of ["startSec", "endSec", "cropXOffset"] as const) if (o[k] !== undefined) {
    if (!Number.isFinite(o[k])) return { ok: false as const, error: `${k} must be a number` };
    clean[k] = Math.round(o[k]! * 1000) / 1000;
  }
  if (o.copy !== undefined) clean.copy = String(o.copy).slice(0, 5000);
  if (o.muteAudio !== undefined) clean.muteAudio = !!o.muteAudio;
  const overrides = { ...(r.d.packaging?.overrides ?? {}), [channel]: clean };
  // validate before saving: the server-computed plan must accept the edit
  const check = planPackaging({ ...r.src, overrides }).find((p) => p.channel === channel)!;
  if (!check.eligible) return { ok: false as const, error: check.reasons.join("; ") };
  await db.update(s.opportunities).set({ delivery: { ...(r.o.delivery as object), packaging: { ...(r.d.packaging ?? {}), overrides } } }).where(eq(s.opportunities.id, opportunityId));
  await db.insert(s.approvalAudits).values({ orgId: r.o.orgId, opportunityId, actor: "editor", action: "edit_variant", payload: { channel, ...clean, revision: check.revision } });
  revalidatePath("/");
  return { ok: true as const };
}

export async function resetVariantOverride(opportunityId: string, channel: string) {
  const r = await sourceFor(opportunityId);
  if (!r) return { ok: false as const, error: "Opportunity not found" };
  const overrides = { ...(r.d.packaging?.overrides ?? {}) };
  delete overrides[channel];
  await db.update(s.opportunities).set({ delivery: { ...(r.o.delivery as object), packaging: { ...(r.d.packaging ?? {}), overrides } } }).where(eq(s.opportunities.id, opportunityId));
  revalidatePath("/");
  return { ok: true as const };
}

/** Approve the selected destinations at their CURRENT server-computed revisions and queue one render job. */
export async function approveAndRenderVariants(opportunityId: string, channels: string[]) {
  const r = await sourceFor(opportunityId);
  if (!r) return { ok: false as const, error: "Opportunity not found" };
  const plan = planPackaging(r.src);
  const picked = plan.filter((p) => channels.includes(p.channel));
  const blocked = picked.filter((p) => !p.eligible);
  if (!picked.length) return { ok: false as const, error: "Select at least one destination" };
  if (blocked.length) return { ok: false as const, error: `${blocked.map((b) => `${b.label}: ${b.reasons[0]}`).join("; ")}` };
  const approvedNow = Object.fromEntries(picked.map((p) => [p.channel, p.revision!]));
  const approved = { ...(r.d.packaging?.approved ?? {}), ...approvedNow };
  await db.update(s.opportunities).set({ delivery: { ...(r.o.delivery as object), packaging: { ...(r.d.packaging ?? {}), approved } } }).where(eq(s.opportunities.id, opportunityId));
  const lane = laneFor(r.o.delivery);
  await db.insert(s.jobs).values({ type: "render_package", status: "queued", payload: { opportunityId, approved: approvedNow, ...(lane ? { lane } : {}) } });
  await db.insert(s.approvalAudits).values({ orgId: r.o.orgId, opportunityId, actor: "editor", action: "approve_variants", payload: { approved: approvedNow } });
  revalidatePath("/");
  return { ok: true as const, message: `Approved ${picked.length} destination${picked.length === 1 ? "" : "s"}; rendering` };
}
