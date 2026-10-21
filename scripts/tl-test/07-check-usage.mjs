#!/usr/bin/env node
// Check consumed free-tier usage via rate-limit response headers after a cheap call.
import { readFileSync } from "node:fs";
const key = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")).key;

const res = await fetch("https://api.twelvelabs.io/v1.3/indexes", { headers: { "x-api-key": key } });
console.log("status:", res.status);
for (const [k, v] of res.headers.entries()) {
  if (k.toLowerCase().includes("ratelimit") || k.toLowerCase().includes("usage")) {
    console.log(`${k}: ${v}`);
  }
}
console.log("\nAll headers:");
for (const [k, v] of res.headers.entries()) console.log(`  ${k}: ${v}`);
