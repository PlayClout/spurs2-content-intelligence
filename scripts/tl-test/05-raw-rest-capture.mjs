#!/usr/bin/env node
/**
 * Capture RAW REST responses (bypassing the SDK) for the three fixture files,
 * matching exactly what shared/clients/twelvelabs.ts's api() helper receives
 * on the wire: x-api-key header, plain fetch, JSON body.
 */
import { readFileSync, writeFileSync } from "node:fs";

const key = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")).key;
const BASE = "https://api.twelvelabs.io/v1.3";
const INDEX_ID = "6ad81a01030b76724d10dc67";

const report = JSON.parse(readFileSync("data/fallback-assets/fixtures/_raw-index-task-report.json", "utf8"));
const basketballAssetId = report.basketball.assetId;
const soccerAssetId = report.soccer.assetId;

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "x-api-key": key, "Content-Type": "application/json", ...init.headers },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

// --- 1. Raw search (matches searchMoments() call shape in twelvelabs.ts) ---
console.log("=== raw POST /search ===");
const searchRes = await api("/search", {
  method: "POST",
  body: JSON.stringify({
    index_id: INDEX_ID,
    query_text: "ball in motion",
    search_options: ["visual", "audio"],
  }),
});
console.log(`status=${searchRes.status}`);
console.log(JSON.stringify(searchRes.json, null, 2));
writeFileSync("data/fallback-assets/fixtures/twelvelabs-search.json", JSON.stringify(searchRes.json, null, 2));

// --- 2. Raw analyze (matches analyzeStructured() call shape) ---
console.log("\n=== raw POST /analyze (json_schema) ===");
const jsonSchema = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
          start_time: { type: "timestamp", format: "seconds" },
          end_time: { type: "timestamp", format: "seconds" },
        },
        required: ["label", "description", "start_time", "end_time"],
      },
    },
  },
  required: ["events"],
};
const analyzeRes = await api("/analyze", {
  method: "POST",
  body: JSON.stringify({
    model_name: "pegasus1.6",
    video: { type: "asset_id", asset_id: soccerAssetId },
    prompt:
      "Identify distinct visual events or actions in this video. For each, provide a short label, a one-sentence description, and the start and end time in seconds.",
    response_format: { type: "json_schema", json_schema: jsonSchema },
    stream: false,
  }),
});
console.log(`status=${analyzeRes.status}`);
console.log(JSON.stringify(analyzeRes.json, null, 2));
writeFileSync("data/fallback-assets/fixtures/twelvelabs-analyze.json", JSON.stringify(analyzeRes.json, null, 2));

// --- 3. Raw "index task" shape — v1.3 current path is assets + indexed-assets,
//     not the legacy /tasks endpoint. Record BOTH calls that constitute that flow
//     for the fixture, keyed so the client's taskStatus()/indexVideo() stand-ins
//     have something to replay. ---
console.log("\n=== raw GET /indexes/{id}/indexed-assets/{id} (post-indexing state) ===");
const indexedAssetRes = await api(`/indexes/${INDEX_ID}/indexed-assets/${report.basketball.indexedAssetId}`);
console.log(`status=${indexedAssetRes.status}`);
console.log(JSON.stringify(indexedAssetRes.json, null, 2));
writeFileSync(
  "data/fallback-assets/fixtures/twelvelabs-index-task.json",
  JSON.stringify(
    {
      note: "v1.3 current path is POST /assets (upload) -> POST /indexes/{id}/indexed-assets (index) -> poll GET .../indexed-assets/{id}. Legacy one-shot POST /tasks still exists in some docs but this is the verified-working flow as of 2026-10-20. This fixture captures the indexed-asset resource once status=ready.",
      index_id: INDEX_ID,
      asset_id: report.basketball.assetId,
      indexed_asset_id: report.basketball.indexedAssetId,
      response: indexedAssetRes.json,
    },
    null,
    2
  )
);

console.log("\nDone. Fixtures written to data/fallback-assets/fixtures/");
