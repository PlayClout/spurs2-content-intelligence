/**
 * Durable WriteStore for the single ScorePlay write path (B10.4/B10.6/B10.9), over write_back_jobs + app_settings.
 *  - insertOnce: unique idempotency_key => a retry or re-approval can never create a second job.
 *  - withJobLock: Postgres advisory transaction lock per job id => two workers cannot send the same job at once.
 *  - kill switch: app_settings 'scoreplay_writes_killed' (default ON when the row is missing: fail closed).
 *  - isCurrent: re-derives the approval revision from the live opportunity; any edit since approval => held.
 * Rights-tag ownership is not supported here yet; writeback.ts fails closed on rights writes without it.
 */
import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as s from "./db-schema";
import { approvalRevision } from "./approval";
import type { WriteJob, WriteRequest, WriteState, WriteStore } from "./clients/writeback";

export const KILL_SWITCH_KEY = "scoreplay_writes_killed";

type Db = PostgresJsDatabase<typeof s>;
type Row = typeof s.writeBackJobs.$inferSelect;

function toJob(r: Row): WriteJob {
  const p = r.payload as { request: WriteRequest; result?: unknown };
  return { id: r.id, request: p.request, state: r.status as WriteState, attempts: r.attempts, result: p.result, error: r.error ?? undefined };
}

export function createDbWriteStore(db: Db): WriteStore {
  return {
    async insertOnce(key, request) {
      const [inserted] = await db.insert(s.writeBackJobs).values({
        orgId: request.orgId, idempotencyKey: key, kind: request.kind, subjectType: "media", subjectId: String(request.log.mediaId),
        payload: { request }, status: "pending",
      }).onConflictDoNothing({ target: s.writeBackJobs.idempotencyKey }).returning();
      if (inserted) return toJob(inserted);
      const [existing] = await db.select().from(s.writeBackJobs).where(eq(s.writeBackJobs.idempotencyKey, key));
      return toJob(existing);
    },
    async get(id) {
      const [r] = await db.select().from(s.writeBackJobs).where(eq(s.writeBackJobs.id, id));
      return r ? toJob(r) : null;
    },
    async update(id, change) {
      const [r] = await db.select().from(s.writeBackJobs).where(eq(s.writeBackJobs.id, id));
      if (!r) throw new Error(`write job ${id} not found`);
      const payload = r.payload as { request: WriteRequest; result?: unknown };
      const result = "result" in change ? change.result : payload.result;
      const ref = (result as { data?: { entry?: { id?: number } | null } } | undefined)?.data?.entry?.id;
      await db.update(s.writeBackJobs).set({
        ...(change.state ? { status: change.state } : {}),
        ...(change.attempts !== undefined ? { attempts: change.attempts } : {}),
        ...("error" in change ? { error: change.error ?? null } : {}),
        payload: { ...payload, result },
        ...(ref ? { externalRef: String(ref) } : {}),
        updatedAt: new Date(),
      }).where(eq(s.writeBackJobs.id, id));
    },
    async getKillSwitch() {
      const [r] = await db.select().from(s.appSettings).where(eq(s.appSettings.key, KILL_SWITCH_KEY));
      return r ? (r.value as { on?: boolean }).on !== false : true;
    },
    async setKillSwitch(on) {
      await db.insert(s.appSettings).values({ key: KILL_SWITCH_KEY, value: { on } })
        .onConflictDoUpdate({ target: s.appSettings.key, set: { value: { on }, updatedAt: new Date() } });
    },
    async isCurrent(request) {
      if (request.kind !== "source_log") return false; // rights records need the confirmation store (not wired yet)
      const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, request.log.ref));
      if (!opp || !["approved", "rendering", "rendered", "exported"].includes(opp.status)) return false;
      return approvalRevision(opp) === request.revision;
    },
    async withJobLock(id, work) {
      return db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
        return work();
      });
    },
  };
}

/**
 * Jobs that should (re)try: new ones immediately; failed/held ones with backoff (held jobs resume automatically once
 * writes are enabled, B10.6). Held/dry-run evaluation is local (no network), so a re-check costs one DB read.
 */
export async function sendableJobIds(db: Db, limit = 10) {
  const rows = await db.select({ id: s.writeBackJobs.id }).from(s.writeBackJobs)
    .where(and(
      sql`${s.writeBackJobs.attempts} < 5`,
      sql`(${s.writeBackJobs.status} = 'pending' or (${s.writeBackJobs.status} in ('failed','held') and ${s.writeBackJobs.updatedAt} < now() - make_interval(secs => least(300, 15 * power(2, ${s.writeBackJobs.attempts})))))`,
    ))
    .orderBy(s.writeBackJobs.updatedAt).limit(limit);
  return rows.map((r) => r.id);
}
