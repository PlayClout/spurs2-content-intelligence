/** A1-owned write contract. A2 supplies the durable store/settings adapter; without it, live writes fail closed. */
import { createHash } from "node:crypto";
import type { MomentLog } from "./scoreplay";

export const ALLOW_LIST = {
  tags: [
    "soccer", "basketball", "tottenham hotspur fc", "san antonio spurs (sas)", "opponent",
    "highlights", "social media", "video", "photo", "premier league", "nba",
    "pass", "corner", "penalty", "assist", "head", "dribble", "yellow card", "red card",
    "3pt", "2pt", "free throw", "goal", "big chance", "dunk", "buzzer beater", "celebration",
    "crowd reaction", "key defensive play", "skill moment", "ai recommended", "producer approved",
    "audience: casual fan", "audience: superfan", "signal: game event", "signal: fan reaction", "signal: ai watch-list",
    "rights: cleared", "rights: needs remediation", "rights: needs review", "rights: blocked", "rights: expired",
    "rights: inferred", "rights: partial coverage",
  ],
  fields: ["company_id", "video_logs", "media_id", "log", "start_offset", "end_offset", "comment", "raw_tags", "player_ids"],
} as const;

/** Unknown raw tags are dropped and reported; raw_tags can auto-create remote tag options. */
export function filterTags(tags: string[] = [], rights = false): { allowed: string[]; dropped: string[] } {
  const allowed: string[] = [], dropped: string[] = [];
  for (const tag of new Set(tags)) {
    if ((ALLOW_LIST.tags as readonly string[]).includes(tag) && (rights || !tag.startsWith("rights:"))) allowed.push(tag);
    else dropped.push(tag);
  }
  return { allowed, dropped };
}

export type WriteState = "pending" | "synced" | "held" | "failed";
export interface WriteRequest {
  orgId: string;
  kind: "source_log"; // rights payload adapter is added when A2's RightsRecord contract is available
  log: MomentLog;
  revision: string;
  source: "live" | "cache" | "fixture" | "seeded";
  confirmedBy: string;
  confirmedAt: string;
}
export interface WriteJob {
  id: string;
  request: WriteRequest;
  state: WriteState;
  attempts: number;
  result?: unknown;
  error?: string;
}
/** insertOnce must enforce a unique key atomically; claims/locks belong to A2's DB job implementation. */
export interface WriteStore {
  insertOnce(key: string, request: WriteRequest): Promise<WriteJob>;
  get(id: string): Promise<WriteJob | null>;
  update(id: string, change: Partial<Pick<WriteJob, "state" | "attempts" | "result" | "error">>): Promise<void>;
  getKillSwitch(): Promise<boolean>;
  setKillSwitch(on: boolean): Promise<void>;
}
let store: WriteStore | undefined;
export function configureWriteStore(adapter: WriteStore) { store = adapter; }

export async function canWrite(): Promise<{ allowed: boolean; reason?: string }> {
  if (process.env.MOCK_MODE === "1" || !process.env.SCOREPLAY_API_KEY) return { allowed: false, reason: "fixture mode" };
  if (process.env.SCOREPLAY_WRITES !== "1") return { allowed: false, reason: "SCOREPLAY_WRITES!=1; DRY RUN" };
  if (process.env.SCOREPLAY_WRITE_KILL_SWITCH !== "0") return { allowed: false, reason: "env kill switch on (default)" };
  if (!store) return { allowed: false, reason: "durable settings store not configured" };
  try {
    if (await store.getKillSwitch()) return { allowed: false, reason: "database kill switch on" };
  } catch { return { allowed: false, reason: "database kill switch unavailable" }; }
  return { allowed: true };
}
export async function setKillSwitch(on: boolean): Promise<void> {
  if (!store) throw new Error("Write store not configured");
  await store.setKillSwitch(on);
}
export async function writeStatus(id: string): Promise<WriteJob | null> {
  if (!store) throw new Error("Write store not configured");
  return store.get(id);
}
export async function dryRun(request: WriteRequest) {
  const sp = await import("./scoreplay");
  return { mode: "dry_run" as const, method: "POST", path: "/video/logs", body: sp.buildVideoLogPayload(request.log) };
}
export async function enqueueWrite(request: WriteRequest): Promise<WriteJob> {
  if (!store) throw new Error("Write store not configured; A2 must supply the durable queue adapter");
  if (request.kind !== "source_log") throw new Error("Unsupported write kind; confirmed rights payload awaits A2 contract");
  if (!request.orgId || !request.revision || !request.confirmedBy || !Number.isFinite(Date.parse(request.confirmedAt))) throw new Error("Write requires org, exact revision and human confirmation");
  await dryRun(request); // validate before enqueue
  const key = createHash("sha256").update(JSON.stringify([request.orgId, request.kind, request.log.mediaId, request.revision, request.log.ref])).digest("hex");
  return store.insertOnce(key, structuredClone(request));
}
/** Caller must hold the durable job claim. Recheck settings at send time, never only at enqueue. */
export async function sendWrite(id: string): Promise<void> {
  if (!store) throw new Error("Write store not configured");
  const job = await store.get(id);
  if (!job) throw new Error("Write job not found");
  if (job.state === "synced") return;
  const gate = await canWrite();
  if (!gate.allowed || !["live", "cache"].includes(job.request.source)) {
    await store.update(id, { state: "held", error: gate.reason ?? "fixture/seeded records never write live", result: await dryRun(job.request) });
    return;
  }
  try {
    const sp = await import("./scoreplay");
    await store.update(id, { attempts: job.attempts + 1 });
    const result = await sp.writeMomentAsVideoLog(job.request.log, job.request, job.attempts > 0);
    await store.update(id, { state: result.wouldSend ? "held" : "synced", attempts: result.wouldSend && !result.data.created ? job.attempts : job.attempts + 1, result, error: result.wouldSend ? "send held" : undefined });
  } catch (e) {
    await store.update(id, { state: "failed", error: (e as Error).message });
  }
}
