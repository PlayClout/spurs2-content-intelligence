/**
 * Real-footage proof (no DB): every game/social event in the real timeline -> processMoment against LIVE ScorePlay
 * (presigned proxy download) + LIVE TwelveLabs (official index) -> drafts on disk; then confirm the club-footage
 * copy was deleted. Also proves the watch-list query lands on watched real footage.
 *   npx tsx --env-file=.env scripts/real-footage-proof.ts [--only=<n>]
 */
import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { processMoment, renderDir } from "../pipeline/moment";
import { search, pickNew } from "../pipeline/watchlist";
import type { Timeline } from "../pipeline/replay";
import * as sp from "../shared/clients/scoreplay";

delete process.env.MOCK_MODE;
process.env.RENDER_STORAGE = "local";
process.env.RENDER_OUT_DIR = "out/real-proof";
let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
/** Content checks ask Pegasus a closed question at temperature 0 (stable), never regex its free-text summary (phrasing
 * varies run to run). Returns the answer's first word, upper-cased. */
const ask = async (assetId: string, start: number, end: number, question: string) => {
  const res = await fetch("https://api.twelvelabs.io/v1.3/analyze", {
    method: "POST", headers: { "x-api-key": process.env.TWELVELABS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: "pegasus1.6", video: { type: "asset_id", asset_id: assetId }, start_time: Math.max(0, start), end_time: end, prompt: question, temperature: 0, max_tokens: 512, stream: false }),
  });
  const text = String((await res.json()).data ?? "");
  return { first: text.trim().match(/^[\W_]*([A-Za-z]+(?:\s+GOAL)?)/)?.[1]?.toUpperCase() ?? "", text };
};
const GOAL_Q = "Does the ball end up in the back of the net? Answer GOAL or NO GOAL first, then one sentence.";

const tl = JSON.parse(readFileSync("data/replays/thfc-mnu-week6.json", "utf8")) as Timeline;
check(sp.mode() === "live" && !!process.env.TWELVELABS_API_KEY, "ScorePlay live + TwelveLabs key present");
check(!sp.writesEnabled(), "ScorePlay writes held (no SCOREPLAY_WRITES): this proof writes nothing to ScorePlay");

const only = Number(process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] ?? -1);
const watchOnly = process.argv.includes("--watchlist-only");
const events = tl.events.filter((e) => e.kind !== "ai_watchlist").filter((_, i) => !watchOnly && (only < 0 || i === only));
for (const ev of events) {
  const f = tl.footage[ev.footage as string];
  const slug = `real-${f.scorePlayMediaId}-${Math.round(ev.start!)}`;
  const t0 = performance.now();
  try {
    const p = await processMoment({
      orgKey: f.orgKey, competition: f.competition, scorePlayMediaId: f.scorePlayMediaId, twelvelabsAssetId: f.twelvelabsAssetId,
      startSec: ev.start!, endSec: ev.end!, headline: ev.headline, kicker: ev.kicker, statLine: ev.statLine,
      trigger: { kind: ev.kind, text: ev.text!, simulated: true },
    }, slug);
    const files = readdirSync(renderDir(slug));
    check(p.manifestMode === "live" && p.scoreplay.mode === "live", `[${ev.clock}] ${ev.headline}: live TwelveLabs + live ScorePlay (company ${p.scoreplay.companyId})`);
    check(p.variants.length === 2 && files.some((x) => x.endsWith(".draft.mp4")) && files.some((x) => x.endsWith(".jpg")), `   drafts rendered in ${Math.round(performance.now() - t0)}ms: ${files.filter((x) => /\.(mp4|jpg)$/.test(x)).join(", ")}`);
    check(!files.some((x) => x.startsWith("source-")), "   club footage copy deleted after render");
    console.log(`      Pegasus: "${p.manifest.summary.slice(0, 160)}"  window ${p.tightWindow.start.toFixed(1)}-${p.tightWindow.end.toFixed(1)}s  rights ${p.content.verdict}`);
    if (ev.text?.startsWith("Goal")) { const a = await ask(f.twelvelabsAssetId, ev.start!, ev.end!, GOAL_Q); check(a.first === "GOAL", `   Pegasus (closed question, temp 0) confirms the goal is in this window: ${a.text.slice(0, 120)}`); }
  } catch (e) { check(false, `[${ev.clock}] ${ev.headline}: ${(e as Error).message.slice(0, 300)}`); }
}

const wl = tl.events.find((e) => e.kind === "ai_watchlist")!;
const pool = (wl.footage as string[]).map((k) => tl.footage[k]);
const { hits, mode } = await search(tl.indexId, wl.query!, pool.map((f) => f.twelvelabsVideoId));
const fired = events.map((e) => ({ mediaId: tl.footage[e.footage as string].scorePlayMediaId, window: { start: e.start!, end: e.end! } }));
const pick = pickNew(hits, pool, fired);
const key = pick && Object.entries(tl.footage).find(([, v]) => v === pick.footage)?.[0];
check(mode === "live" && !!pick, `watch-list "${wl.query}" (live): ${hits.length} hits; picks ${pick ? `${key} ${pick.hit.start.toFixed(1)}-${pick.hit.end.toFixed(1)}s (not a moment already fired)` : "none on watched footage"}`);
if (pick && only < 0) {
  const p = await processMoment({
    orgKey: pick.footage.orgKey, competition: pick.footage.competition, scorePlayMediaId: pick.footage.scorePlayMediaId, twelvelabsAssetId: pick.footage.twelvelabsAssetId,
    startSec: pick.hit.start, endSec: pick.hit.end, headline: wl.headline, kicker: wl.kicker, statLine: wl.statLine,
    trigger: { kind: "ai_watchlist", text: wl.query!, simulated: false },
  }, `real-wl-${pick.footage.scorePlayMediaId}`);
  check(p.manifestMode === "live" && p.variants.length === 2, `   watch-list moment rendered live`);
  // content check, not just plumbing: "the chance nobody logged" must NOT be a goal (that would duplicate the goal we
  // already produced). Closed question at temp 0 over the hit window.
  const a = await ask(pick.footage.twelvelabsAssetId, pick.hit.start - 3, pick.hit.end, GOAL_Q);
  check(a.first === "NO GOAL", `   Pegasus (closed question, temp 0) confirms a chance, not a goal: ${a.text.slice(0, 120)}`);
  console.log(`      moments: ${p.manifest.moments.map((x) => `${x.label} ${x.start.toFixed(1)}-${x.end.toFixed(1)}s: ${x.description.slice(0, 90)}`).join(" || ")}`);
  console.log(`      Pegasus: "${p.manifest.summary.slice(0, 200)}"`);
}

if (existsSync("out/real-proof")) rmSync("out/real-proof", { recursive: true, force: true });
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
