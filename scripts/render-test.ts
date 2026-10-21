/**
 * Render smoke test: real recorded TwelveLabs Pegasus timestamps -> both demo asset types.
 *   npx tsx scripts/render-test.ts
 * Output: out/render-test/ (gitignored). Exits non-zero on any failed check.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { getRenderBackend } from "../pipeline/render-backend";
import { paddedWindow, probeDuration, FFPROBE } from "../pipeline/render-local";

type Ev = { label: string; description: string; start_time: number; end_time: number };

const OUT = "out/render-test";
const cases = [
  {
    slug: "spurs-hoop",
    club: "san-antonio-spurs",
    source: "data/fallback-assets/basketball-broll.mp4",
    fixture: "data/fallback-assets/fixtures/raw-capture/_raw-analyze-jsonschema.json", // basketball run
    pick: (evs: Ev[]) => evs[evs.length - 1],
    caption: { kicker: "Spurs 112 · Thunder 110 · Q4 0:00.3", headline: "Castle at the buzzer" },
    photoChannel: "instagram_feed",
    stat: "Game-winning dunk with 0.3 left · SIMULATED game data",
  },
  {
    slug: "thfc-keeper",
    club: "tottenham-hotspur",
    source: "data/fallback-assets/soccer-broll.mp4",
    fixture: "data/fallback-assets/fixtures/twelvelabs-analyze.json", // soccer run
    pick: (evs: Ev[]) => evs[1],
    caption: { kicker: "Spurs 2 · Arsenal 1 · 88'", headline: "North London is white" },
    photoChannel: "x_photo",
    stat: "Late winner in the derby · SIMULATED game data",
  },
];

function events(fixturePath: string): Ev[] {
  const j = JSON.parse(readFileSync(fixturePath, "utf8"));
  const data = j.result?.data ?? j.data;
  return JSON.parse(data).events;
}

function probe(path: string) {
  const out = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "stream=codec_type,width,height", "-of", "json", path]).toString();
  return JSON.parse(out).streams as { codec_type: string; width?: number; height?: number }[];
}

let fail = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) fail++;
};

const backend = await getRenderBackend();
for (const c of cases) {
  const ev = c.pick(events(c.fixture));
  const srcDur = await probeDuration(c.source);
  const w = paddedWindow(ev.start_time, ev.end_time, srcDur);
  console.log(`\n[${c.slug}] TwelveLabs event "${ev.label}" ${ev.start_time}-${ev.end_time}s -> padded ${w.start}-${w.end}s (source ${srcDur.toFixed(2)}s)`);

  for (const mode of ["draft", "final"] as const) {
    const r = await backend.render({
      orgId: "test", sourcePath: c.source, startSec: w.start, endSec: w.end, channel: "instagram_reel",
      caption: c.caption.headline, mode,
      // LocalRenderRequest extras
      ...({ club: c.club, captionText: c.caption, outDir: OUT, slug: c.slug } as object),
    } as never);
    const s = probe(r.outPath);
    const v = s.find((x) => x.codec_type === "video");
    console.log(`  reel ${mode}: ${r.outPath} ${r.durationSec.toFixed(2)}s in ${r.renderMs}ms, caption ${(r as { captionPlacement?: string }).captionPlacement}`);
    check(v?.width === 1080 && v?.height === 1920, `${c.slug} reel ${mode} is 1080x1920`);
    check(Math.abs(r.durationSec - (w.end - w.start)) < 0.25, `${c.slug} reel ${mode} duration matches padded window`);
    check((r as { captionPlacement?: string }).captionPlacement !== "over-footage-edge", `${c.slug} reel ${mode} caption does not cover the footage`);
  }

  const p = await backend.render({
    orgId: "test", sourcePath: c.source, startSec: ev.start_time, endSec: ev.end_time, channel: c.photoChannel, mode: "final",
    ...({ club: c.club, captionText: c.caption, outDir: OUT, slug: c.slug, statLine: c.stat } as object),
  } as never);
  const ps = probe(p.outPath)[0];
  console.log(`  photo card: ${p.outPath} ${ps.width}x${ps.height} in ${p.renderMs}ms`);
  const want = c.photoChannel === "instagram_feed" ? [1080, 1350] : [1600, 900];
  check(ps.width === want[0] && ps.height === want[1], `${c.slug} photo card is ${want.join("x")}`);
}

console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
