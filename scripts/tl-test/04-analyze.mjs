#!/usr/bin/env node
/**
 * Empirical test: Pegasus 1.6 analyze with response_format=json_schema.
 * Schema syntax per docs.twelvelabs.io/v1.3/api-reference/analyze-videos/analyze:
 * - `timestamp` type requires `format`: seconds | hh:mm:ss | hh:mm:ss.fff
 * - timestamp fields allowed at top level or one level nested inside an array's items
 * - object type: first property must be required (or platform promotes first required prop)
 * - string type: no minLength/maxLength (422 error)
 */
import { TwelveLabs } from "twelvelabs-js";
import { readFileSync, writeFileSync } from "node:fs";

const key = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")).key;
const client = new TwelveLabs({ apiKey: key });

// Use the basketball asset uploaded in step 02 (asset_id, NOT indexed-asset id —
// /analyze works directly on an asset, no indexing required).
const report = JSON.parse(readFileSync("data/fallback-assets/fixtures/_raw-index-task-report.json", "utf8"));
const ASSET_ID = report.basketball.assetId;

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

const prompt =
  "Identify distinct visual events or actions in this video. For each, provide a short label, a one-sentence description, and the start and end time in seconds.";

console.log(`Analyzing asset ${ASSET_ID} (basketball-broll.mp4) with Pegasus 1.6 json_schema...`);
const t0 = Date.now();

let result;
let attempt = "json_schema";
try {
  result = await client.analyze({
    modelName: "pegasus1.6",
    video: { type: "asset_id", assetId: ASSET_ID },
    prompt,
    responseFormat: {
      type: "json_schema",
      jsonSchema,
    },
    stream: false,
  });
} catch (err) {
  console.error("json_schema analyze FAILED:", err.message ?? err);
  attempt = "json_schema_failed";
  result = { error: String(err) };
}

const elapsedMs = Date.now() - t0;
console.log(`Elapsed: ${elapsedMs}ms`);
console.log(JSON.stringify(result, null, 2));

writeFileSync(
  "data/fallback-assets/fixtures/_raw-analyze-jsonschema.json",
  JSON.stringify({ attempt, elapsedMs, assetId: ASSET_ID, prompt, jsonSchema, result }, null, 2)
);
