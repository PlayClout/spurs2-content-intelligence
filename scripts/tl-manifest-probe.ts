/**
 * ONE live TwelveLabs call: does Pegasus 1.6 accept our moment-manifest json_schema on a WINDOWED analyze,
 * and does the response validate against MomentManifestSchema? Uses Nova's already-uploaded basketball asset.
 *   npx tsx scripts/tl-manifest-probe.ts [--record]
 * Cost: one analyze call on <= 8s of video (well inside the free allowance).
 */
import { writeFile } from "node:fs/promises";
import { MANIFEST_PROMPT, PEGASUS_MANIFEST_SCHEMA, parseManifest } from "../shared/moment-manifest";

const key = process.env.TWELVELABS_API_KEY;
if (!key) { console.error("TWELVELABS_API_KEY not set"); process.exit(2); }
const ASSET = "6ad81fcb030b76724d10e3c5"; // basketball-broll.mp4 asset (docs/twelvelabs-empirical-test.md)
const winArg = process.argv.find((a) => /^--window=/.test(a));
const [WIN_START, WIN_END] = winArg ? winArg.slice(9).split("-").map(Number) : [5, 13];
const body = {
  model_name: "pegasus1.6",
  video: { type: "asset_id", asset_id: ASSET },
  prompt: MANIFEST_PROMPT,
  response_format: { type: "json_schema", json_schema: PEGASUS_MANIFEST_SCHEMA },
  start_time: WIN_START,
  end_time: WIN_END,
  temperature: 0.1,
  max_tokens: 2048,
  stream: false,
};
const t0 = performance.now();
const res = await fetch("https://api.twelvelabs.io/v1.3/analyze", { method: "POST", headers: { "x-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
const ms = Math.round(performance.now() - t0);
const text = await res.text();
console.log(`HTTP ${res.status} in ${ms}ms`);
if (!res.ok) { console.log(text.slice(0, 1200)); process.exit(1); }
const json = JSON.parse(text);
console.log("finish_reason:", json.finish_reason, "usage:", JSON.stringify(json.usage));
const rel = parseManifest(json);
const m = parseManifest(json, WIN_START);
console.log("VALID manifest (absolute times):", JSON.stringify(m, null, 2));
const winDur = WIN_END - WIN_START;
const maxEnd = Math.max(...rel.moments.map((x) => x.end));
const minStart = Math.min(...rel.moments.map((x) => x.start));
console.log(`window ${WIN_START}-${WIN_END}s (dur ${winDur}s); raw moments span ${minStart}-${maxEnd}s`);
console.log(maxEnd <= winDur + 0.5 && minStart < WIN_START ? "-> raw is WINDOW-RELATIVE (parseManifest shifts by window start)" : "-> raw looks ABSOLUTE: re-check parseManifest windowStartSec usage!");
if (process.argv.includes("--record")) {
  await writeFile("data/fallback-assets/fixtures/twelvelabs-manifest.json", JSON.stringify({ $provenance: `RECORDED ${new Date().toISOString()} live POST /v1.3/analyze, pegasus1.6, asset ${ASSET}, window ${WIN_START}-${WIN_END}s`, request: { ...body, prompt: "(MANIFEST_PROMPT)" }, elapsedMs: ms, response: json }, null, 2));
  console.log("recorded -> data/fallback-assets/fixtures/twelvelabs-manifest.json");
}
