"use server";

/**
 * Operator/admin server layer (A4.3 integration status, A4.4 taxonomy readiness, A4.11 write-back + kill switch,
 * A4.2/A4.5 job status + safe requeue). Reads env MODES only, never values: no secret ever leaves the server.
 */
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { storageMode } from "@shared/storage";
import { KILL_SWITCH_KEY } from "@shared/write-store";
import footageMap from "../../data/footage-map.json" with { type: "json" };

const fm = footageMap as { twelvelabsIndexId?: string; scorePlayVideos?: number; twelvelabsVideos?: number; matched?: number; generatedAt?: string };

export interface IntegrationStatus {
  scoreplay: { mode: "live" | "fixture"; note: string };
  twelvelabs: { mode: "live" | "fixture"; note: string };
  storage: { mode: string; note: string };
  writes: { state: "held" | "enabled"; reasons: string[] };
  footage: { matched: number; scorePlayVideos: number; twelvelabsVideos: number; generatedAt: string | null };
}

async function killSwitchOn(): Promise<boolean> {
  try {
    const [r] = await db.select().from(s.appSettings).where(eq(s.appSettings.key, KILL_SWITCH_KEY));
    return r ? (r.value as { on?: boolean }).on !== false : true;
  } catch {
    return true; // settings unreadable => report held, never enabled
  }
}

export async function integrationStatus(): Promise<IntegrationStatus> {
  const mock = process.env.MOCK_MODE === "1";
  const spLive = !!process.env.SCOREPLAY_API_KEY && !mock;
  const tlLive = !!process.env.TWELVELABS_API_KEY && !mock;
  const reasons: string[] = [];
  if (!spLive) reasons.push("ScorePlay in fixture mode");
  if (process.env.SCOREPLAY_WRITES !== "1") reasons.push("SCOREPLAY_WRITES is not 1 (taxonomy sign-off pending)");
  if (process.env.SCOREPLAY_WRITE_KILL_SWITCH !== "0") reasons.push("Environment kill switch on (default)");
  if (await killSwitchOn()) reasons.push("Admin kill switch on");
  let storage = "local";
  try { storage = storageMode(); } catch (e) { storage = `misconfigured: ${(e as Error).message}`; }
  return {
    scoreplay: { mode: spLive ? "live" : "fixture", note: spLive ? "Reads live from the team workspace" : "ScorePlay-shaped fixtures" },
    twelvelabs: { mode: tlLive ? "live" : "fixture", note: tlLive ? `Official index ${fm.twelvelabsIndexId ?? ""}` : "Recorded live responses" },
    storage: { mode: storage, note: "Renders stay on this laptop; no cloud upload path exists" },
    writes: { state: reasons.length ? "held" : "enabled", reasons },
    footage: { matched: fm.matched ?? 0, scorePlayVideos: fm.scorePlayVideos ?? 0, twelvelabsVideos: fm.twelvelabsVideos ?? 0, generatedAt: fm.generatedAt ?? null },
  };
}

export async function setWriteKillSwitch(on: boolean) {
  await db.insert(s.appSettings).values({ key: KILL_SWITCH_KEY, value: { on } })
    .onConflictDoUpdate({ target: s.appSettings.key, set: { value: { on }, updatedAt: new Date() } });
  await db.insert(s.approvalAudits).values({ orgId: (await db.select({ id: s.orgs.id }).from(s.orgs).limit(1))[0].id, actor: "operator", action: on ? "write_kill_switch_on" : "write_kill_switch_off", payload: {} });
  revalidatePath("/settings");
  return { ok: true as const, on };
}

export async function listWriteBackJobs(limit = 50, orgId?: string) {
  const rows = await db.select().from(s.writeBackJobs).where(orgId ? eq(s.writeBackJobs.orgId, orgId) : undefined).orderBy(desc(s.writeBackJobs.updatedAt)).limit(limit);
  return rows.map((r) => {
    const p = r.payload as { request?: { kind: string; log?: { mediaId: number; startSec: number; endSec: number; label: string; tags?: string[] } }; result?: { mode?: string; method?: string; path?: string; body?: unknown } };
    return {
      id: r.id, orgId: r.orgId, kind: r.kind, status: r.status, attempts: r.attempts, error: r.error, externalRef: r.externalRef,
      updatedAt: r.updatedAt.toISOString(), createdAt: r.createdAt.toISOString(), subjectId: r.subjectId, tags: p.request?.log?.tags ?? [], mediaId: p.request?.log?.mediaId ?? null, label: p.request?.log?.label ?? "",
      window: p.request?.log ? `${p.request.log.startSec.toFixed(1)}-${p.request.log.endSec.toFixed(1)}s` : "",
      startSec: p.request?.log?.startSec ?? null, endSec: p.request?.log?.endSec ?? null,
      dryRun: p.result?.mode === "dry_run" ? { method: p.result.method ?? "POST", path: p.result.path ?? "", body: p.result.body } : null,
    };
  });
}

/** Safe requeue (A4.5/B6.2): only FAILED jobs, only known types, reset in place (no duplicate job, attempts kept). */
export async function requeueFailedJob(jobId: string) {
  const [j] = await db.select().from(s.jobs).where(eq(s.jobs.id, jobId));
  if (!j) return { ok: false as const, error: "Job not found" };
  if (j.status !== "failed") return { ok: false as const, error: `Only failed jobs can be requeued (this one is ${j.status})` };
  if (!["process_moment", "render_final"].includes(j.type)) return { ok: false as const, error: `Unknown job type ${j.type}` };
  await db.update(s.jobs).set({ status: "queued", error: null, queuedAt: new Date(), startedAt: null, finishedAt: null })
    .where(and(eq(s.jobs.id, jobId), eq(s.jobs.status, "failed")));
  revalidatePath("/settings"); revalidatePath("/");
  return { ok: true as const };
}

export async function jobSummary() {
  const rows = await db.select({ status: s.jobs.status, n: sql<number>`count(*)::int` }).from(s.jobs).groupBy(s.jobs.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
}

export async function recentJobs(limit = 25) {
  return db.select().from(s.jobs).where(inArray(s.jobs.status, ["queued", "running", "failed", "done"])).orderBy(desc(s.jobs.queuedAt)).limit(limit);
}
