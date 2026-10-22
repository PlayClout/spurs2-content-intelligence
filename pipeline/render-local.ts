/**
 * LocalFfmpegBackend — demo-local profile of RenderBackend (M5).
 *
 * Video (draft + final share one path; "draft" just uses faster encoder settings):
 *   fast-seek to the padded window -> 9:16 (or channel) frame with blurred fill of the same footage
 *   (never hard-crops action out) -> composite the PNG caption overlay -> poster frame.
 * Photo: frame grab at the moment's peak (or a supplied still) -> renderPhotoCard (canvas).
 *
 * Captions are PNG overlays (pipeline/overlay.ts), not drawtext. ffmpeg-full is preferred when
 * present; the filters used here (scale/crop/gblur/overlay) exist in the default build too.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { mkdir, stat, rm } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import type { RenderBackend, RenderRequest, RenderResult } from "./render-backend";
import { channelGeom, renderCaptionOverlay, renderPhotoCard, type CaptionText } from "./overlay";
import profiles from "./channel-profiles.json" with { type: "json" };

const run = promisify(execFile);

export const FFMPEG = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg"
  : "ffmpeg";
export const FFPROBE = existsSync("/opt/homebrew/opt/ffmpeg-full/bin/ffprobe")
  ? "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe"
  : "ffprobe";

/** Boundary pad around TwelveLabs timestamps (precision unverified; producer trims tighter). */
export const PAD_SEC = 1.5;

// Detect hardware encode once: present on macOS (M-series), absent in a Linux container -> libx264.
import { execFileSync } from "node:child_process";
export const HAS_VIDEOTOOLBOX = (() => {
  try {
    return execFileSync(FFMPEG, ["-hide_banner", "-encoders"], { encoding: "utf8" }).includes("h264_videotoolbox");
  } catch {
    return false;
  }
})();

export async function probeDuration(path: string): Promise<number> {
  const { stdout } = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]);
  return Number(stdout.trim());
}

export async function probeSize(path: string): Promise<[number, number]> {
  const { stdout } = await run(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path]);
  const [w, h] = stdout.trim().split(",").map(Number);
  return [w, h];
}

export function paddedWindow(startSec: number, endSec: number, sourceDuration: number, pad = PAD_SEC) {
  const s = Math.max(0, startSec - pad);
  // Keep the end a hair (50ms, invisible) inside the measured duration. Different ffprobe builds report the same
  // file differently (M5 ffmpeg 9: 13.972331s; Debian ffmpeg 5.1: 13.973000s), and TwelveLabs 400s on an end
  // past ITS duration. Flooring alone can't undo a measurement that was already rounded up, so leave margin.
  const e = Math.min(sourceDuration - END_MARGIN_SEC, endSec + pad);
  return { start: Number(s.toFixed(3)), end: Math.floor(e * 1000) / 1000 };
}
export const END_MARGIN_SEC = 0.05;

type Profile = { kind?: string; width: number; height: number; encode: { crf: number; abitrate: string } };
function profile(channel: string): Profile {
  return (profiles as Record<string, unknown>)[channel] as Profile;
}

export interface LocalRenderRequest extends RenderRequest {
  club: string; // club-themes.json key, e.g. "san-antonio-spurs"
  captionText?: CaptionText;
  outDir: string;
  slug: string;
  /** photo channels only: still to use instead of a frame grab */
  stillPath?: string;
  /** photo channels only: second within the source to grab (default = window midpoint) */
  grabAtSec?: number;
  statLine?: string;
  /** from content rules, e.g. ["mute_audio"] (MUSIC-SYNC-VERIFY) */
  renderActions?: string[];
}

export class LocalFfmpegBackend implements RenderBackend {
  async render(req: RenderRequest): Promise<RenderResult> {
    const r = req as LocalRenderRequest;
    if (!r.club || !r.outDir || !r.slug) throw new Error("LocalFfmpegBackend needs club, outDir, slug");
    await mkdir(r.outDir, { recursive: true });
    const t0 = performance.now();
    const p = profile(r.channel);
    const res = p.kind === "photo" ? await this.renderPhoto(r) : await this.renderVideo(r, p);
    return { ...res, renderMs: Math.round(performance.now() - t0), backend: "local-ffmpeg" };
  }

  private async renderVideo(r: LocalRenderRequest, p: Profile) {
    const g = channelGeom(r.channel);
    const W = g.width;
    const H = g.height;
    const dur = Math.max(0.5, r.endSec - r.startSec);
    const outPath = join(r.outDir, `${r.slug}.${r.channel}.${r.mode}.mp4`);
    const posterPath = join(r.outDir, `${r.slug}.${r.channel}.${r.mode}.poster.jpg`);
    const overlayPath = join(r.outDir, `${r.slug}.${r.channel}.caption.png`);

    const hasCaption = !!r.captionText && g.captions.burnIn;
    let placement: string | undefined;
    if (hasCaption) {
      // where the sharp, aspect-fitted footage sits in the frame -> caption must not cover it
      const [sw, sh] = await probeSize(r.sourcePath);
      const k = Math.min(W / sw, H / sh);
      const fgH = Math.round(sh * k);
      const band = { top: Math.round((H - fgH) / 2), bottom: Math.round((H + fgH) / 2) };
      placement = (await renderCaptionOverlay(overlayPath, r.channel, r.club, r.captionText!, band)).placement;
    }

    // cropXOffset: 0..1 subject position from analysis; 0.5 = center. Used to bias the foreground
    // when the source is wider than the target after fit (keeps the action in frame).
    const fx = r.cropXOffset ?? 0.5;
    const fg = `scale=${W}:${H}:force_original_aspect_ratio=decrease`;
    const bg = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}:(iw-${W})*${fx.toFixed(3)}:(ih-${H})/2,gblur=sigma=28,eq=brightness=-0.08`;
    let graph = `[0:v]split=2[a][b];[a]${bg}[bg];[b]${fg}[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[base]`;
    graph += hasCaption ? `;[base][1:v]overlay=0:0[v]` : `;[base]null[v]`;

    const draft = r.mode === "draft";
    const mute = r.renderActions?.includes("mute_audio") ?? false;
    // h264_videotoolbox is macOS-only hardware encode (fast drafts on the M5); in a Linux container it is
    // absent, so fall back to libx264. RENDER_FORCE_SW=1 forces software even on macOS (parity testing).
    const useHw = draft && HAS_VIDEOTOOLBOX && process.env.RENDER_FORCE_SW !== "1";
    const venc = useHw
      ? ["-c:v", "h264_videotoolbox", "-b:v", "6M"]
      : ["-c:v", "libx264", "-preset", draft ? "veryfast" : "fast", "-crf", String(draft ? 23 : p.encode.crf || 20)];
    const args = [
      "-y", "-hide_banner", "-loglevel", "error",
      "-ss", String(r.startSec), "-t", dur.toFixed(3), "-i", r.sourcePath,
      ...(hasCaption ? ["-i", overlayPath] : []),
      "-filter_complex", graph, "-map", "[v]",
      ...(mute ? ["-an"] : ["-map", "0:a?", "-c:a", "aac", "-b:a", p.encode.abitrate || "128k"]),
      ...venc, "-r", "30",
      "-movflags", "+faststart", outPath,
    ];
    await run(FFMPEG, args, { maxBuffer: 16 * 1024 * 1024 });
    await run(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-ss", (dur * 0.5).toFixed(2), "-i", outPath, "-frames:v", "1", "-q:v", "3", posterPath]);
    return { outPath, posterPath, durationSec: await probeDuration(outPath), captionPlacement: placement, audioMuted: mute };
  }

  private async renderPhoto(r: LocalRenderRequest) {
    const outPath = join(r.outDir, `${r.slug}.${r.channel}.jpg`);
    let still = r.stillPath;
    const temporary = !still;
    try {
      if (!still) {
        still = join(r.outDir, `${r.slug}.grab.png`);
        const at = r.grabAtSec ?? (r.startSec + r.endSec) / 2;
        await run(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-ss", at.toFixed(3), "-i", r.sourcePath, "-frames:v", "1", still]);
      }
      await renderPhotoCard(outPath, still, r.channel, r.club, {
        ...(r.captionText ?? { headline: "" }),
        statLine: r.statLine,
        focusX: r.cropXOffset,
      });
      const sz = (await stat(outPath)).size;
      if (!sz) throw new Error(`photo card empty: ${outPath}`);
      return { outPath, posterPath: outPath, durationSec: 0 };
    } finally {
      if (temporary && still) await rm(still, { force: true });
    }
  }
}

export function outputName(path: string) {
  return `${basename(dirname(path))}/${basename(path)}`;
}
