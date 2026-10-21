#!/usr/bin/env node
/**
 * Smoke-test the CORRECTED shared/clients/twelvelabs.ts functions against the real API,
 * to prove the fix (not just assert it). Uses tsx to run the .ts file directly.
 */
process.env.TWELVELABS_API_KEY = JSON.parse(
  (await import("node:fs")).readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")
).key;

const { searchMoments, analyzeStructured } = await import("../../shared/clients/twelvelabs.ts");

const INDEX_ID = "6ad81a01030b76724d10dc67";
const reportJson = JSON.parse(
  (await import("node:fs")).readFileSync("data/fallback-assets/fixtures/_raw-index-task-report.json", "utf8")
);

console.log("=== searchMoments() via corrected client ===");
const searchResult = await searchMoments(INDEX_ID, "ball in motion");
console.log(`data.length=${searchResult.data?.length}, first hit:`, JSON.stringify(searchResult.data?.[0]));

console.log("\n=== analyzeStructured() via corrected client ===");
const schema = {
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
const analyzeResult = await analyzeStructured(
  reportJson.basketball.assetId,
  "List 1-2 distinct visual events with label, description, start_time, end_time in seconds.",
  schema
);
console.log("finish_reason:", analyzeResult.finish_reason);
console.log("parsed events:", JSON.parse(analyzeResult.data).events.length);
console.log("\nBOTH CORRECTED CLIENT FUNCTIONS WORK AGAINST THE REAL API.");
