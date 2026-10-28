/**
 * Range-capable local file serving shared by /renders (editor) and /fan/media (fan playback,
 * which additionally re-checks publication state). Files never leave the worker laptop: no redirect, no cloud.
 */
import { stat, open } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";
import { storageMode } from "@shared/storage";

export const RENDER_ROOT = resolve(
  process.env.RENDER_OUT_DIR?.startsWith("/") ? process.env.RENDER_OUT_DIR : join(/*turbopackIgnore: true*/ process.cwd(), "..", process.env.RENDER_OUT_DIR ?? "out/renders"),
);

const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/** "/renders/a/b.mp4" -> ["a","b.mp4"]; anything else -> null. */
export function renderSegments(publicPath: string): string[] | null {
  if (!publicPath.startsWith("/renders/")) return null;
  const parts = publicPath.slice("/renders/".length).split("/").filter(Boolean).map(decodeURIComponent);
  return parts.length ? parts : null;
}

export async function serveRenderFile(req: Request, segments: string[]): Promise<Response> {
  storageMode(); // throws if a legacy cloud storage setting is present
  const file = resolve(RENDER_ROOT, ...segments);
  const type = TYPES[extname(file).toLowerCase()];
  if (!type || !file.startsWith(RENDER_ROOT + sep)) return new Response("not found", { status: 404 });
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response("not found", { status: 404 });
  }

  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0;
  let end = size - 1;
  if (range) {
    if (range[1]) start = Number(range[1]);
    if (range[2]) end = Math.min(Number(range[2]), size - 1);
    if (!range[1] && range[2]) { start = Math.max(0, size - Number(range[2])); end = size - 1; }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const len = end - start + 1;
  const fh = await open(file, "r");
  const buf = Buffer.alloc(len);
  try {
    await fh.read(buf, 0, len, start);
  } finally {
    await fh.close();
  }
  return new Response(buf, {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(len),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
