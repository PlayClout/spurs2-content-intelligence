import assert from "node:assert/strict";
import * as sp from "../shared/clients/scoreplay";
import { configureWriteStore, enqueueWrite, sendWrite, dryRun, type WriteJob, type WriteStore, type RightsWriteRequest } from "../shared/clients/writeback";

const saved = { ...process.env };
const jobs = new Map<string, WriteJob>(), owners = new Map<number, number[]>();
let killed = false, current = true, canEdit = true;
let providerTags = [99], logs: sp.SPVideoLogEntry[] = [], mutations: { method: string; path: string; body: any }[] = [];
let lock: Promise<unknown> = Promise.resolve();
const jobLocks = new Map<string, Promise<unknown>>();
const store: WriteStore = {
  withJobLock: async (id, work) => { const task = (jobLocks.get(id) ?? Promise.resolve()).then(work); jobLocks.set(id, task.catch(() => {})); return task; },
  insertOnce: async (id, request) => { if (!jobs.has(id)) jobs.set(id, { id, request, attempts: 0, state: "pending" }); return structuredClone(jobs.get(id)!); },
  get: async (id) => structuredClone(jobs.get(id) ?? null),
  update: async (id, change) => { Object.assign(jobs.get(id)!, change); },
  getKillSwitch: async () => killed,
  setKillSwitch: async (on) => { killed = on; },
  getOwnedTags: async (_org, mediaId) => owners.get(mediaId) ?? [],
  saveOwnedTags: async (_org, mediaId, ids) => { owners.set(mediaId, [...ids]); },
  isCurrent: async () => current,
  withMediaLock: async (_org, _media, work) => { const result = lock.then(work); lock = result.catch(() => {}); return result; },
};
const make = (revision: string): RightsWriteRequest => ({ orgId: "org", kind: "rights_record", revision: revision.repeat(64), source: "live", confirmedBy: "reviewer", confirmedAt: "2026-10-22T12:00:00Z",
  log: { mediaId: 1, companyId: 2, startSec: 10, endSec: 20, ref: "unused", label: "A2 supplied confirmed record" },
  rights: { tags: ["rights: needs review", "rights: inferred", "rights: partial coverage"], complete: false,
    ruleSetVersion: "v1", engineVersion: "engine1", runId: "run1", policyLabel: "illustrative policy v0",
    elements: [{ kind: "brand", value: "Example on kit", startSec: 11, endSec: 12 }], provenanceCounts: { inferred: 1, existing_scoreplay: 2 } },
});
try {
  Object.assign(process.env, { SCOREPLAY_API_KEY: "test", SCOREPLAY_WRITES: "1", SCOREPLAY_WRITE_KILL_SWITCH: "0",
    SCOREPLAY_RIGHTS_TAG_IDS: JSON.stringify({ "rights: needs review": 10, "rights: cleared": 11, "rights: inferred": 12, "rights: partial coverage": 13 }) });
  delete process.env.MOCK_MODE;
  configureWriteStore(store);
  let reads = 0;
  sp.__setFetch((async (url, init) => {
    const path = new URL(String(url)).pathname.replace(/^\/v1/, "");
    const method = init?.method ?? "GET";
    if (method === "GET") {
      reads++;
      if (path === "/whoami") return Response.json({ rights: canEdit ? ["can_do_media_edit"] : [] });
      if (path === "/media/1") return Response.json({ ID: 1, company_id: 2, tag_option_ids: providerTags });
      if (path === "/media/1/logs") return Response.json({ items: logs, page: 1, limit: 200 });
      throw new Error(`Unexpected read ${path}`);
    }
    const body = JSON.parse(String(init?.body)); mutations.push({ path, method, body });
    if (path === "/media/1/tags") {
      providerTags = method === "DELETE" ? providerTags.filter((id) => !body.tag_option_ids.includes(id)) : [...new Set([...providerTags, ...body.tag_option_ids])];
      return new Response(null, { status: 204 });
    }
    if (path === "/video/logs") { logs.push({ id: logs.length + 1, media_id: 1, comment: body.video_logs[0].log.comment }); return Response.json(true); }
    throw new Error(`Unexpected mutation ${path}`);
  }) as typeof fetch);
  const req = make("a");
  const dry = await dryRun(req);
  assert.equal(reads, 0); assert.equal(mutations.length, 0);
  const comment = dry.body.video_logs[0].log.comment;
  for (const field of ["ruleSetVersion", "engineVersion", "run1", "illustrative policy v0", "provenanceCounts", "reviewer", "11", "12", "[clout:rights:1:aaaaaaaa]"]) assert(comment.includes(field));
  assert.equal(dry.body.video_logs[0].log.start_offset, 10);
  await assert.rejects(dryRun({ ...req, rights: { ...req.rights, tags: ["rights: cleared"] } }), /Incomplete/);
  const job = await enqueueWrite(req);
  killed = true; await sendWrite(job.id); assert.equal(mutations.length, 0);
  killed = false; await sendWrite(job.id); await sendWrite(job.id);
  assert.equal(jobs.get(job.id)!.state, "synced");
  assert.deepEqual(providerTags.sort((a, b) => a - b), [10, 12, 13, 99]);
  assert.equal(mutations.filter((m) => m.path === "/video/logs").length, 1);
  // Replacing a confirmed record only removes IDs this store owns; unrelated 99 stays.
  const replacement = make("b"); replacement.rights.complete = true; replacement.rights.tags = ["rights: cleared"];
  const next = await enqueueWrite(replacement); await sendWrite(next.id);
  assert.deepEqual(providerTags.sort((a, b) => a - b), [11, 99]);
  assert.deepEqual(owners.get(1), [11]);
  const n = mutations.length;
  const fixture = await enqueueWrite({ ...make("c"), source: "fixture" }); await sendWrite(fixture.id);
  assert.equal(mutations.length, n);
  // A different existing human state is never removed or overwritten.
  providerTags = [10, 99]; owners.set(1, []);
  const conflict = await enqueueWrite({ ...replacement, revision: "d".repeat(64) }); await sendWrite(conflict.id);
  assert.equal(mutations.length, n); assert.match(jobs.get(conflict.id)!.error!, /human rights tag/);
  // No edit permission means log-only, preserving the media tags entirely.
  canEdit = false;
  const logOnly = await enqueueWrite(make("e")); await sendWrite(logOnly.id);
  assert.deepEqual(providerTags, [10, 99]); assert.equal(mutations.at(-1)!.path, "/video/logs");
  current = false;
  const stale = await enqueueWrite(make("f")); const before = mutations.length; await sendWrite(stale.id);
  assert.equal(mutations.length, before);
  console.log("PASS confirmed rights audit, own-tag replacement, logs-only permission fallback, dry run, dedupe, fixture isolation and stale-record gate");
} finally {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
}
