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
  fields: ["company_id", "video_logs", "media_id", "log", "start_offset", "end_offset", "comment", "raw_tags", "player_ids", "tag_option_ids"],
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
interface WriteBase {
  orgId: string;
  log: MomentLog;
  revision: string;
  source: "live" | "cache" | "fixture" | "seeded";
  confirmedBy: string;
  confirmedAt: string;
}
/** Wire envelope supplied by A2's confirmed-record builder; this is not a rights evaluator or RightsRecord. */
export interface RightsWritePayload {
  tags: string[];
  complete: boolean;
  ruleSetVersion: string;
  engineVersion: string;
  policyLabel: "illustrative policy v0";
  runId: string;
  elements: { kind: string; value: string; startSec: number; endSec: number }[];
  provenanceCounts: Record<string, number>;
}
export type WriteRequest = WriteBase & (
  { kind: "source_log" } | { kind: "rights_record"; rights: RightsWritePayload }
);
export type RightsWriteRequest = Extract<WriteRequest, { kind: "rights_record" }>;

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
  // Required for rights tags. Persist ownership separately from the current request or browser payload.
  getOwnedTags?(orgId: string, mediaId: number): Promise<number[]>;
  saveOwnedTags?(orgId: string, mediaId: number, ids: number[]): Promise<void>;
  isCurrent?(request: WriteRequest): Promise<boolean>;
  withJobLock?<T>(id: string, work: () => Promise<T>): Promise<T>;
  withMediaLock?<T>(orgId: string, mediaId: number, work: () => Promise<T>): Promise<T>;

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
  const log = request.kind === "rights_record" ? rightsLog(request) : sourceLog(request);
  return { mode: "dry_run" as const, method: "POST", path: "/video/logs", body: sp.buildVideoLogPayload(log, request.kind === "rights_record"),
    ...(request.kind === "rights_record" ? { sourceTags: { mediaId: request.log.mediaId, tags: request.rights.tags,
      note: "Tag IDs are resolved from SCOREPLAY_RIGHTS_TAG_IDS; only persisted own-tag IDs may be removed" } } : {}),
  };
}
export async function enqueueWrite(request: WriteRequest): Promise<WriteJob> {
  if (!store) throw new Error("Write store not configured; A2 must supply the durable queue adapter");
  if (!["source_log", "rights_record"].includes(request.kind)) throw new Error("Unsupported write kind");
  if (!request.orgId || !request.revision || !request.confirmedBy || !Number.isFinite(Date.parse(request.confirmedAt))) throw new Error("Write requires org, exact revision and human confirmation");
  await dryRun(request); // validate before enqueue
  const key = createHash("sha256").update(JSON.stringify([request.orgId, request.kind, request.log.mediaId, request.revision, request.log.ref])).digest("hex");
  return store.insertOnce(key, structuredClone(request));
}
/** Caller must hold the durable job claim. Recheck settings at send time, never only at enqueue. */
export async function sendWrite(id: string): Promise<void> {
  if (!store?.withJobLock) throw new Error("Durable job claim/lock required before sending");
  await store.withJobLock(id, () => sendClaimedWrite(id));
}
async function sendClaimedWrite(id: string): Promise<void> {
  if (!store) throw new Error("Write store not configured");
  const job = await store.get(id);
  if (!job) throw new Error("Write job not found");
  if (job.state === "synced") return;
  const gate = await canWrite();
  if (!gate.allowed || !["live", "cache"].includes(job.request.source)) {
    await store.update(id, { state: "held", error: gate.reason ?? "fixture/seeded records never write live", result: await dryRun(job.request) });
    return;
  }
  if (!store.isCurrent || !await store.isCurrent(job.request)) {
    await store.update(id, { state: "held", error: "Current human approval cannot be verified" });
    return;
  }
  try {
    const sp = await import("./scoreplay");
    await store.update(id, { attempts: job.attempts + 1 });
    const result = job.request.kind === "rights_record"
      ? await sendRightsRecord(job)
      : await sp.writeMomentAsVideoLog(sourceLog(job.request), job.request, job.attempts > 0, () => store!.isCurrent!(job.request));
    await store.update(id, { state: result.wouldSend ? "held" : "synced", attempts: result.wouldSend && !result.data.created ? job.attempts : job.attempts + 1, result, error: result.wouldSend ? "send held" : undefined });
  } catch (e) {
    await store.update(id, { state: "failed", error: (e as Error).message });
  }
}

function sourceLog(request: WriteRequest): MomentLog {
  const revision = createHash("sha256").update(request.revision).digest("hex").slice(0, 8);
  return { ...request.log, ref: `${request.log.ref}:${revision}` };
}

/** An exact reviewed record, not a destination-specific recommendation, supplies these rights tags. */
function rightsLog(request: RightsWriteRequest): MomentLog {
  const r = request.rights;
  const tags = filterTags(r.tags, true);
  const states = tags.allowed.filter((t) => ["rights: cleared", "rights: needs remediation", "rights: needs review", "rights: blocked", "rights: expired"].includes(t));
  if (tags.dropped.length || tags.allowed.some((t) => !t.startsWith("rights:")) || states.length !== 1) throw new Error("Rights write needs one allow-listed state and rights provenance tags only");
  if (states[0] === "rights: cleared" && !r.complete) throw new Error("Incomplete rights record cannot write cleared");
  if (!/^[a-f0-9]{64}$/.test(request.revision) || !r.ruleSetVersion || !r.engineVersion || !r.runId || r.policyLabel !== "illustrative policy v0") throw new Error("Rights audit requires record hash, versions, run and policy label");
  if (Object.values(r.provenanceCounts).some((n) => !Number.isSafeInteger(n) || n < 0)) throw new Error("Invalid provenance counts");
  for (const e of r.elements) if (!Number.isFinite(e.startSec) || !Number.isFinite(e.endSec) || e.startSec < request.log.startSec || e.endSec > request.log.endSec || e.startSec > e.endSec) throw new Error("Rights element outside analysed source window");
  return { ...request.log, tags: tags.allowed, ref: `rights:${request.log.mediaId}:${request.revision.slice(0, 8)}`,
    label: JSON.stringify({ ...r, tags: undefined, confirmedBy: request.confirmedBy, confirmedAt: request.confirmedAt }),
  };
}

/** Human-configured, already-created tag options; never create provider options on a record write. */
export function rightsTagIds(): Record<string, number> {
  const mapping = JSON.parse(process.env.SCOREPLAY_RIGHTS_TAG_IDS ?? "{}");
  if (!mapping || Array.isArray(mapping) || typeof mapping !== "object") throw new Error("Invalid rights tag mapping");
  const ids = Object.values(mapping);
  if (new Set(ids).size !== ids.length || Object.entries(mapping).some(([name, id]) => !name.startsWith("rights:") || !filterTags([name], true).allowed.length || !Number.isSafeInteger(id) || Number(id) <= 0)) throw new Error("Rights tag mapping is outside allow-list");
  return mapping;
}

async function sendRightsRecord(job: WriteJob) {
  const request = job.request as RightsWriteRequest;
  const priorAudit = (job.result as { auditAttempted?: boolean } | undefined)?.auditAttempted === true;
  const sp = await import("./scoreplay");
  const log = rightsLog(request);
  if (!store?.isCurrent || !await store.isCurrent(request)) throw new Error("Confirmed rights revision is not current or cannot be verified");
  const writeAudit = async () => {
    // Persist BEFORE the non-idempotent POST. A crash retries marker lookup, never another blind POST.
    await store!.update(job.id, { result: { auditAttempted: true } });
    const result = await sp.writeMomentAsVideoLog(log, request, priorAudit, () => store!.isCurrent!(request));
    return { ...result, auditAttempted: priorAudit || result.data.created || !result.wouldSend };
  };
  const permission = await sp.whoami();
  if (!permission.data.rights.includes("can_do_media_edit")) return writeAudit();
  if (!store.withMediaLock || !store.getOwnedTags || !store.saveOwnedTags) throw new Error("Durable tag ownership and per-media lock are required");
  return store.withMediaLock(request.orgId, log.mediaId, async () => {
    const mapping = rightsTagIds();
    const desired = request.rights.tags.map((name) => { if (!mapping[name]) throw new Error(`Missing approved tag option: ${name}`); return mapping[name]; });
    const media = (await sp.getMedia(log.mediaId)).data;
    if (media.company_id !== log.companyId || !Array.isArray(media.tag_option_ids)) throw new Error("Source company/tag evidence unavailable");
    let owned = await store!.getOwnedTags!(request.orgId, log.mediaId);
    if (owned.some((id) => !Object.values(mapping).includes(id))) throw new Error("Stored tag ownership is outside configured rights mapping");
    const humanConflict = Object.entries(mapping).some(([tag, id]) => media.tag_option_ids!.includes(id) && !owned.includes(id) && !desired.includes(id) && !["rights: inferred", "rights: partial coverage"].includes(tag));
    if (humanConflict) throw new Error("Existing human rights tag conflicts; reviewer must reconcile the record");
    const current = new Set(media.tag_option_ids);
    for (const [method, ids] of [
      ["DELETE", owned.filter((id) => current.has(id) && !desired.includes(id))],
      ["POST", desired.filter((id) => !current.has(id))],
    ] as const) {
      if (!ids.length) continue;
      if (!await store!.isCurrent!(request)) throw new Error("Rights approval changed before tag send");
      const result = await sp.writeRightsTagOptions(log.mediaId, method, [...ids], owned, request, () => store!.isCurrent!(request));
      if (!result.sent) return { mode: sp.mode(), data: { created: false, entry: null }, wouldSend: result, auditAttempted: priorAudit };
      owned = method === "DELETE" ? owned.filter((id) => !ids.includes(id)) : [...new Set([...owned, ...ids])];
      await store!.saveOwnedTags!(request.orgId, log.mediaId, owned);
    }
    if (!await store!.isCurrent!(request)) throw new Error("Rights approval changed before audit send");
    return writeAudit();
  });
}
