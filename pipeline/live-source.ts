/**
 * Live match sources. A live clip never downloads the whole match (a 1h45m broadcast is 2.6-8 GB): ffmpeg reads
 * just the needed window straight off ScorePlay's presigned proxy URL (HTTP range requests; the proxies are
 * faststart MP4s, verified) and writes a short TRANSIENT working copy named source-<media>-<start>.mp4. Callers
 * release it in `finally` exactly like a normal source (releaseSource), so club footage never outlives the render.
 *
 * Times stay ABSOLUTE (full-match video seconds) everywhere in the app: ScorePlay logs, captions, trims. Only the
 * ffmpeg call subtracts `offsetSec`, the second of the full match where the working copy starts.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as sp from "../shared/clients/scoreplay";
import { FFMPEG, HAS_VIDEOTOOLBOX, probeDuration } from "./render-local";
import type { LiveMatch, Win } from "../shared/live-match";

const run = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));

export async function loadLiveMatch(matchId: string): Promise<LiveMatch> {
  if (!/^[a-z0-9-]+$/.test(matchId)) throw new Error("invalid live match id");
  for (const f of (await readdir(join(REPO_ROOT, "data/live"))).filter((x) => x.endsWith(".json"))) {
    const m = JSON.parse(await readFile(join(REPO_ROOT, "data/live", f), "utf8")) as LiveMatch;
    if (m.id === matchId) return m;
  }
  throw new Error(`unknown live match ${matchId}`);
}

/** The proxy a live cut reads from: 720p is plenty for a 9:16 reel (the sharp footage band is 1080x608) and cuts
 * about twice as fast as 1080p over the network. */
export async function liveProxy(mediaId: number) {
  const fm = await sp.downloadFormats(mediaId);
  const files = Object.values(fm.data.items).flat().filter((f) => f.file_url && f.size !== -1);
  const f = files.find((x) => x.type === "video_medium") ?? sp.bestSource(fm.data, "video");
  if (!f?.file_url) throw new Error(`ScorePlay media ${mediaId}: no streamable proxy (check can_do_media_download)`);
  const url = f.file_url.startsWith("file:") ? fileURLToPath(f.file_url) : f.file_url;
  return { url, type: f.type, mode: fm.mode };
}

/** Cut [win.start, win.end] (absolute seconds) out of the full match into a transient working copy. Frame-accurate
 * (re-encoded, not stream-copied: a copy snaps to keyframes up to ~6 s away on these proxies, measured). */
export async function cutLiveSource(mediaId: number, win: Win, outDir: string) {
  if (!Number.isFinite(win.start) || !Number.isFinite(win.end) || win.start < 0 || win.end <= win.start || win.end - win.start > 120) throw new Error("live cut needs a window of at most 120s");
  const media = (await sp.getMedia(mediaId)).data;
  const proxy = await liveProxy(mediaId);
  await mkdir(outDir, { recursive: true });
  const start = Math.floor(win.start * 1000) / 1000;
  const local = join(outDir, `source-${mediaId}-${Math.round(start * 1000)}.mp4`);
  const venc = HAS_VIDEOTOOLBOX && process.env.RENDER_FORCE_SW !== "1" ? ["-c:v", "h264_videotoolbox", "-b:v", "6M"] : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"];
  const args = ["-v", "error", "-y", "-ss", start.toFixed(3), "-i", proxy.url, "-t", (win.end - start).toFixed(3),
    "-map", "0:v:0", "-map", "0:a:0?", ...venc, "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", local];
  for (let attempt = 1; ; attempt++) {
    try {
      if (!existsSync(local)) await run(FFMPEG, args, { maxBuffer: 16 * 1024 * 1024, timeout: 180_000 });
      const dur = await probeDuration(local);
      if (!(dur > 0.5)) throw new Error(`live cut produced ${dur}s`);
      return { media, mode: proxy.mode, local, downloaded: true as const, offsetSec: start, durationSec: dur, proxy: proxy.type };
    } catch (e) {
      await rm(local, { force: true });
      if (attempt >= 2) throw new Error(`live cut ${mediaId} ${win.start}-${win.end}: ${(e as Error).message.slice(0, 300)}`);
    }
  }
}

/** Low-bitrate analysis copy of part of a working copy (Pegasus gets ~4 MB instead of ~20 MB; same frames). */
export async function analysisCopy(local: string, relStart: number, relEnd: number, out: string) {
  await run(FFMPEG, ["-v", "error", "-y", "-ss", Math.max(0, relStart).toFixed(3), "-i", local, "-t", (relEnd - Math.max(0, relStart)).toFixed(3),
    "-vf", "scale=-2:480", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", out], { timeout: 120_000 });
  return out;
}

/** The live working window stored on a clip (absolute seconds), if it came from a live match. */
export function sourceWindowOf(delivery: unknown): Win | undefined {
  const c = (delivery as { live?: { cut?: Win } } | null)?.live?.cut;
  return c && Number.isFinite(c.start) && Number.isFinite(c.end) ? c : undefined;
}
