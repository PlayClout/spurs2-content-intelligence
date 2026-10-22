import assert from "node:assert/strict";
import { configureWriteStore, canWrite, dryRun, enqueueWrite, sendWrite, writeStatus, setKillSwitch, filterTags, type WriteJob, type WriteRequest, type WriteStore } from "../shared/clients/writeback";
import * as sp from "../shared/clients/scoreplay";

const saved = { ...process.env };
const jobs = new Map<string, WriteJob>(); let killed = false;
const adapter: WriteStore = {
  insertOnce: async (key, request) => { if (!jobs.has(key)) jobs.set(key, { id: key, request, state: "pending", attempts: 0 }); return structuredClone(jobs.get(key)!); },
  get: async (key) => structuredClone(jobs.get(key) ?? null),
  update: async (key, change) => { Object.assign(jobs.get(key)!, change); },
  getKillSwitch: async () => killed,
  setKillSwitch: async (value) => { killed = value; },
};
const request: WriteRequest = { orgId: "org", kind: "source_log", revision: "revision-1", source: "live", confirmedBy: "editor", confirmedAt: "2026-10-22T12:00:00Z",
  log: { mediaId: 1, companyId: 2, startSec: 1, endSec: 2, ref: "clip-1", label: "Reviewed clip", tags: ["producer approved", "clout-approved", "rights: cleared"] } };
try {
  process.env.SCOREPLAY_API_KEY = "test"; delete process.env.MOCK_MODE;
  delete process.env.SCOREPLAY_WRITES;
  assert.equal((await canWrite()).allowed, false);
  process.env.SCOREPLAY_WRITES = "1";
  assert.equal((await canWrite()).allowed, false); // env kill switch defaults ON
  process.env.SCOREPLAY_WRITE_KILL_SWITCH = "0";
  assert.equal((await canWrite()).allowed, false); // no durable settings store
  configureWriteStore(adapter);
  assert.equal((await canWrite()).allowed, true);
  assert.deepEqual(filterTags(["producer approved", "clout-approved", "rights: cleared"]).allowed, ["producer approved"]);
  assert.throws(() => sp.buildVideoLogPayload({ ...request.log, accessible_until: 0 } as sp.MomentLog), /allow-list/);
  const mutations: string[] = [];
  let logs: sp.SPVideoLogEntry[] = [];
  sp.__setFetch((async (url, init) => {
    if (init?.method === "POST") {
      mutations.push(String(url));
      const body = JSON.parse(String(init.body));
      logs = [{ id: 10, media_id: 1, comment: body.video_logs[0].log.comment }];
      return Response.json(true);
    }
    return Response.json({ items: logs, page: 1, limit: 200 });
  }) as typeof fetch);
  await dryRun(request); assert.equal(mutations.length, 0);
  const first = await enqueueWrite(request);
  assert.equal((await enqueueWrite(request)).id, first.id);
  await setKillSwitch(true); await sendWrite(first.id);
  assert.equal((await writeStatus(first.id))!.state, "held"); assert.equal(mutations.length, 0);
  await setKillSwitch(false); await sendWrite(first.id); await sendWrite(first.id);
  assert.equal((await writeStatus(first.id))!.state, "synced"); assert.equal(mutations.length, 1);
  // New worker retries an ambiguous result: provider marker prevents a second POST.
  await adapter.update(first.id, { state: "failed" }); await sendWrite(first.id);
  assert.equal(mutations.length, 1);
  const fixture = await enqueueWrite({ ...request, revision: "fixture", source: "fixture" });
  await sendWrite(fixture.id); assert.equal((await writeStatus(fixture.id))!.state, "held"); assert.equal(mutations.length, 1);
  const race = await enqueueWrite({ ...request, revision: "kill-at-send", log: { ...request.log, ref: "new" } });
  let gates = 0; adapter.getKillSwitch = async () => ++gates > 1;
  await sendWrite(race.id); assert.equal(mutations.length, 1); assert.equal((await writeStatus(race.id))!.state, "held");
  console.log("PASS dry run, allow-list, dedupe, provider reconciliation, fixture isolation and send-time kill switch");
} finally {
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
}
