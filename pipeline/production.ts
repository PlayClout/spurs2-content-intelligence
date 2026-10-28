import { createHash } from "node:crypto";
import { mkdir, rm, mkdtemp } from "node:fs/promises";
import { join, isAbsolute } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import profiles from "./channel-profiles.json" with { type: "json" };
import { LocalFfmpegBackend, FFMPEG, probeDuration, probeSize, type LocalRenderRequest } from "./render-local";
import type { RenderChannel, RenderResult } from "./render-backend";
import { storageMode } from "../shared/storage";

export interface VariantManifest {
  id: string;
  sourcePath: string;
  sourceMediaId: number;
  startSec: number;
  endSec: number;
  channel: RenderChannel;
  club: string;
  context: Record<string, unknown>;
  policyVersion: string;
  cropXOffset: number;
  muteAudio: boolean;
  caption?: { headline: string; kicker?: string };
  approvedHash: string;
}
const recipeHash = (v: object) => {
  const { approvedHash: _, ...recipe } = v as Record<string, unknown>;
  // Stable recipe key order; contexts arrive as JSON with arbitrary key order.
  const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)])) : value;
  return createHash("sha256").update(JSON.stringify(stable(recipe))).digest("hex");
};
export const variantHash = (v: Omit<VariantManifest, "approvedHash"> | VariantManifest) => recipeHash(v);
function validate(v: VariantManifest) {
  if (!/^[a-zA-Z0-9_-]+$/.test(v.id) || !isAbsolute(v.sourcePath)) throw new Error("Variant requires a safe id and local absolute source path");
  if (!Number.isSafeInteger(v.sourceMediaId) || v.sourceMediaId <= 0 || !v.policyVersion || !Object.keys(v.context).length) throw new Error("Variant requires source lineage, destination context and policy version");
  const p = profiles[v.channel] as { kind?: string; maxDurationSec: number };
  if (!p || !Number.isFinite(v.startSec) || !Number.isFinite(v.endSec) || v.startSec < 0 || v.endSec <= v.startSec || (!p.kind && v.endSec - v.startSec > p.maxDurationSec)) throw new Error("Invalid variant profile/window/duration");
  if (!Number.isFinite(v.cropXOffset) || v.cropXOffset < 0 || v.cropXOffset > 1) throw new Error("Invalid crop position");
  if (variantHash(v) !== v.approvedHash) throw new Error("Variant changed since approval");
}
export type RenderAuthorization = (variant: VariantManifest) => Promise<boolean>;
/** Authorize each exact recipe at render start. Failures are isolated; caller retries only failed variants. */
export async function renderVariants(variants: VariantManifest[], outDir: string, authorize: RenderAuthorization) {
  storageMode();
  if (new Set(variants.map((v) => v.id)).size !== variants.length) throw new Error("Duplicate variant ids");
  const backend = new LocalFfmpegBackend();
  return Promise.all(variants.map(async (v) => {
    try {
      validate(v);
      if (!await authorize(v)) throw new Error("Variant not currently authorized");
      const still = /\.(jpe?g|png|webp)$/i.test(v.sourcePath); // a ScorePlay photo: render the card from the still itself
      if (!still && v.endSec > await probeDuration(v.sourcePath)) throw new Error("Variant exceeds source duration");
      const result = await backend.render({ orgId: "local", sourcePath: v.sourcePath, startSec: v.startSec, endSec: v.endSec,
        channel: v.channel, mode: "final", cropXOffset: v.cropXOffset, club: v.club, outDir, slug: v.id,
        captionText: v.caption, renderActions: v.muteAudio ? ["mute_audio"] : [], ...(still ? { stillPath: v.sourcePath } : {}),
      } as LocalRenderRequest);
      const [width, height] = await probeSize(result.outPath);
      const p = profiles[v.channel];
      if (width !== p.width || height !== p.height || (!("kind" in p) && Math.abs(result.durationSec - (v.endSec - v.startSec)) > 0.15)) throw new Error("Rendered dimensions/duration do not match approved recipe");
      return { id: v.id, status: "done" as const, hash: v.approvedHash, ...result };
    } catch (e) { return { id: v.id, status: "failed" as const, error: (e as Error).message }; }
  }));
}

export interface CompilationManifest {
  approvedHash: string;
  id: string;
  entries: VariantManifest[]; // order is the saved timeline; ranges/context/approval stay per entry
  targetDurationSec: number;
  channel: RenderChannel;
}
export const compilationHash = (m: Omit<CompilationManifest, "approvedHash"> | CompilationManifest) => recipeHash(m);

/** P0 supports straight cuts with explicitly approved muted audio; other effects/audio are deferred. */
export async function renderCompilation(manifest: CompilationManifest, outDir: string, authorize: RenderAuthorization, authorizeCompilation: (manifest: CompilationManifest) => Promise<boolean>): Promise<RenderResult> {
  storageMode();
  if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id) || !manifest.entries.length || !Number.isFinite(manifest.targetDurationSec) || manifest.targetDurationSec <= 0) throw new Error("Invalid compilation manifest");
  if (manifest.approvedHash !== compilationHash(manifest) || !await authorizeCompilation(manifest)) throw new Error("Compilation requires approval of its exact ordered revision");
  const seconds = manifest.entries.reduce((n, e) => n + e.endSec - e.startSec, 0);
  if (seconds > manifest.targetDurationSec || manifest.entries.some((e) => e.channel !== manifest.channel || !e.muteAudio || "kind" in profiles[e.channel])) throw new Error("Compilation exceeds budget or contains unsupported profiles/audio");
  await mkdir(outDir, { recursive: true });
  const work = await mkdtemp(join(outDir, ".compilation-"));
  const outPath = join(outDir, `${manifest.id}.${manifest.channel}.mp4`);
  const started = performance.now();
  try {
    const results = await renderVariants(manifest.entries, work, authorize);
    if (results.some((r) => r.status === "failed")) throw new Error("Compilation entry failed approval/render validation");
    // Recheck after intermediate rendering; permissions can change while rendering.
    if (!await authorizeCompilation(manifest)) throw new Error("Compilation approval changed");
    for (const entry of manifest.entries) if (!await authorize(entry)) throw new Error("Compilation authorization changed");
    const inputs = results.map((r) => (r as Extract<(typeof results)[number], { status: "done" }>).outPath);
    await promisify(execFile)(FFMPEG, ["-v", "error", "-y", ...inputs.flatMap((f) => ["-i", f]), "-filter_complex",
      inputs.map((_, i) => `[${i}:v]`).join("") + `concat=n=${inputs.length}:v=1:a=0[v]`, "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-movflags", "+faststart", outPath]);
    const durationSec = await probeDuration(outPath);
    if (Math.abs(durationSec - seconds) > 0.15) throw new Error("Compilation output duration mismatch");
    const posterPath = join(outDir, `${manifest.id}.poster.jpg`);
    await promisify(execFile)(FFMPEG, ["-v", "error", "-y", "-i", outPath, "-frames:v", "1", posterPath]);
    return { outPath, posterPath, durationSec, renderMs: Math.round(performance.now() - started), backend: "local-ffmpeg" };
  } catch (error) { await rm(outPath, { force: true }); throw error; }
  finally { await rm(work, { recursive: true, force: true }); }
}
