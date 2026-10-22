import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { FFMPEG, FFPROBE } from "../pipeline/render-local";
import { renderVariants, renderCompilation, variantHash, compilationHash, type VariantManifest } from "../pipeline/production";

const root = await mkdtemp(join(tmpdir(), "spursx2-production-"));
try {
  const sourcePath = join(root, "synthetic.mp4");
  execFileSync(FFMPEG, ["-v", "error", "-f", "lavfi", "-i", "testsrc2=s=320x180:r=30:d=2", "-c:v", "libx264", sourcePath]);
  const recipe = { id: "app", sourcePath, sourceMediaId: 1, startSec: 0, endSec: 0.5, channel: "fan_app" as const, club: "san-antonio-spurs", context: { territory: "US", use: "owned_web" }, policyVersion: "test-illustrative", cropXOffset: 0.5, muteAudio: true };
  const approved: VariantManifest = { ...recipe, approvedHash: variantHash(recipe) };
  const results = await renderVariants([approved, { ...approved, id: "changed" }], root, async () => true);
  assert.equal(results[0].status, "done"); assert.equal(results[1].status, "failed");
  const denied = await renderVariants([approved], root, async () => false);
  assert.equal(denied[0].status, "failed");
  const socialRecipe = { ...recipe, id: "social", channel: "instagram_reel" as const };
  const social = { ...socialRecipe, approvedHash: variantHash(socialRecipe) };
  assert.equal((await renderVariants([social], root, async () => true))[0].status, "done");
  const entries = [0, 0.5, 1].map((startSec, i) => { const r = { ...recipe, id: `part${i}`, startSec, endSec: startSec + 0.5 }; return { ...r, approvedHash: variantHash(r) }; });
  const montage = { id: "story", entries, targetDurationSec: 2, channel: "fan_app" as const };
  const approvedMontage = { ...montage, approvedHash: compilationHash(montage) };
  const compilation = await renderCompilation(approvedMontage, root, async () => true, async () => true);
  assert(Math.abs(compilation.durationSec - 1.5) < 0.15);
  const streams = JSON.parse(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "stream=codec_type,width,height", "-of", "json", compilation.outPath], { encoding: "utf8" })).streams;
  assert(!streams.some((s: { codec_type: string }) => s.codec_type === "audio"));
  assert(!(await readdir(root)).some((n) => n.startsWith(".compilation-")));
  await assert.rejects(renderCompilation({ ...approvedMontage, entries: [...entries].reverse() }, root, async () => true, async () => true), /exact ordered revision/);
  const over = { ...montage, targetDurationSec: 1 };
  await assert.rejects(renderCompilation({ ...over, approvedHash: compilationHash(over) }, root, async () => true, async () => true), /budget/);
  // Demo-length composition and pixel checks prove actual order, not just total duration.
  const storySource = join(root, "story-source.mp4");
  execFileSync(FFMPEG, ["-v", "error", "-f", "lavfi", "-i", "color=red:s=320x180:r=30:d=7",
    "-f", "lavfi", "-i", "color=green:s=320x180:r=30:d=7", "-f", "lavfi", "-i", "color=blue:s=320x180:r=30:d=7",
    "-filter_complex", "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]", "-map", "[v]", "-c:v", "libx264", storySource]);
  const storyEntries = [0, 7, 14].map((startSec, i) => {
    const entry = { ...recipe, id: `story-part${i}`, sourcePath: storySource, startSec, endSec: startSec + 7 };
    return { ...entry, approvedHash: variantHash(entry) };
  });
  const story = { id: "demo-story", entries: storyEntries, targetDurationSec: 25, channel: "fan_app" as const };
  const demo = await renderCompilation({ ...story, approvedHash: compilationHash(story) }, root, async () => true, async () => true);
  assert(demo.durationSec >= 20 && demo.durationSec <= 45);
  for (const [second, dominant] of [[3, 0], [10, 1], [17, 2]]) {
    const rgb = execFileSync(FFMPEG, ["-v", "error", "-ss", String(second), "-i", demo.outPath,
      "-vf", "crop=2:2:960:540,format=rgb24", "-frames:v", "1", "-f", "rawvideo", "-"]);
    assert(rgb[dominant] > rgb[(dominant + 1) % 3] + 50 && rgb[dominant] > rgb[(dominant + 2) % 3] + 50);
  }
  console.log("PASS real social/app renditions, per-variant failure isolation, exact hash gates and ordered muted compilation with temporary cleanup");
} finally { await rm(root, { recursive: true, force: true }); }
