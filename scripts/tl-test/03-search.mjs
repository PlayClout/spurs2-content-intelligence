#!/usr/bin/env node
/**
 * Empirical test: run Marengo searches against the index, record full JSON responses.
 */
import { TwelveLabs } from "twelvelabs-js";
import { readFileSync, writeFileSync } from "node:fs";

const key = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")).key;
const client = new TwelveLabs({ apiKey: key });

const INDEX_ID = "6ad81a01030b76724d10dc67";

const queries = [
  "player celebrating",
  "ball in motion",
  "people running on field",
];

const allResults = {};

for (const q of queries) {
  console.log(`\n=== query: "${q}" ===`);
  const t0 = Date.now();
  const pager = await client.search.query({
    indexId: INDEX_ID,
    queryText: q,
    searchOptions: ["visual", "audio"],
  });
  const hits = [];
  for await (const clip of pager) {
    hits.push(clip);
  }
  const elapsedMs = Date.now() - t0;
  console.log(`  ${hits.length} hits in ${elapsedMs}ms`);
  for (const h of hits.slice(0, 5)) {
    console.log(`  - video_id=${h.videoId ?? h.video_id} rank=${h.rank} start=${h.start} end=${h.end} score=${h.score}`);
  }
  allResults[q] = { elapsedMs, hits };
}

writeFileSync("data/fallback-assets/fixtures/_raw-search-all.json", JSON.stringify(allResults, null, 2));
console.log("\nSaved to data/fallback-assets/fixtures/_raw-search-all.json");
