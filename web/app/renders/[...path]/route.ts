/**
 * Serves pipeline renders (drafts, finals, photo cards) from disk at REQUEST time.
 * Why a route and not web/public: Next production only serves public/ files that existed at startup, so anything
 * the worker renders during the demo (e.g. the final after Approve) would 404 from public/.
 * Source dir: RENDER_OUT_DIR (absolute) or <repo>/out/renders, same default as pipeline/moment.ts.
 * Supports HTTP Range so <video> can seek (Safari requires it).
 */
import { stat, open } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";
import { connection } from "next/server";

const ROOT = resolve(
  process.env.RENDER_OUT_DIR?.startsWith("/") ? process.env.RENDER_OUT_DIR : join(/*turbopackIgnore: true*/ process.cwd(), "..", process.env.RENDER_OUT_DIR ?? "out/renders"),
);
const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  await connection();
  const { path } = await ctx.params;
  const file = resolve(ROOT, ...path);
  const type = TYPES[extname(file).toLowerCase()];
  if (!type || !file.startsWith(ROOT + sep)) return new Response("not found", { status: 404 });
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
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
