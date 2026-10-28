#!/usr/bin/env node
// Empirical test step 1: list existing indexes.
import { TwelveLabs } from "twelvelabs-js";
import { readFileSync, writeFileSync } from "node:fs";

const key = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")).key;
const client = new TwelveLabs({ apiKey: key });

const indexes = [];
for await (const idx of await client.indexes.list()) {
  indexes.push(idx);
}
console.log(JSON.stringify(indexes, null, 2));
writeFileSync("data/fallback-assets/fixtures/_raw-indexes-list.json", JSON.stringify(indexes, null, 2));
