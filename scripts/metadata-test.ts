import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseManifest } from "../shared/moment-manifest";
import * as sp from "../shared/clients/scoreplay";
const rec = JSON.parse(readFileSync("data/fallback-assets/fixtures/twelvelabs-manifest.json", "utf8")).response;
const data = JSON.parse(rec.data);
data.detectedSponsors = [{ name: "Example", category: "apparel", location: "kit", start: 1, end: 2 }];
data.onScreenText = [{ text: "Example", kind: "sponsor", start: 2, end: 3 }];
const complete = { data: JSON.stringify(data), finish_reason: "stop" };
assert.equal(parseManifest(complete, 10).detectedSponsors[0].start, 11);
assert.equal(parseManifest(complete, 10).onScreenText![0].end, 13);
assert.equal(parseManifest(complete).analysisStatus, "checked");
assert.equal(parseManifest({ ...complete, finish_reason: "length" }).analysisStatus, "not_checked");
assert.equal(parseManifest({ ...complete, finish_reason: undefined }).analysisStatus, "not_checked");
assert.equal(parseManifest(rec).analysisStatus, "not_checked"); // legacy schema lacks checked text coverage
assert.throws(() => parseManifest({ data: "{", finish_reason: "length" }), /not checked/);
const saved = { ...process.env };
try {
  delete process.env.MOCK_MODE; process.env.SCOREPLAY_API_KEY = "test";
  let calls = 0;
  sp.__setFetch((async (url) => {
    calls++;
    return Response.json(String(url).includes("/players?") ? [{ ID: 1, full_name: "Example" }] : String(url).includes("/external-groups?") ? { items: [], total: 0 } : { ID: 10, company_id: 20, accessible_until: 5 });
  }) as typeof fetch);
  const a = await sp.getRightsInputs(10, { teamSeasonId: 1 });
  assert.equal(a.status, "available"); assert.equal(calls, 3);
  await sp.getRightsInputs(10, { teamSeasonId: 1 }); assert.equal(calls, 3);
  assert.equal((await sp.getRightsInputs(10)).status, "needs_review");
  sp.__setFetch(async () => Response.json({ message: "no access" }, { status: 401 }));
  assert.equal((await sp.getRightsInputs(10, { teamSeasonId: 1, refresh: true })).status, "needs_review");
  assert.equal((await sp.getRightsInputs(10, { teamSeasonId: 1 })).status, "needs_review");
  console.log("PASS manifest source clocks, text/brand evidence, truncation coverage, scoped rights cache and failed-read review");
} finally {
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
}
