/**
 * Fan playback (U5.2/U5.4). Media is served ONLY for the current, published, viewable version; the publication
 * state is re-checked on every request (including each Range request), so a withdrawal stops new playback at once.
 */
import { connection } from "next/server";
import { playbackPathFor } from "@/lib/fan";
import { renderSegments, serveRenderFile } from "@/lib/serve-file";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not available", { status: 404 });
  const path = await playbackPathFor(id);
  if (!path) return new Response("not available", { status: 404, headers: { "Cache-Control": "no-store" } });
  // Hosted demo (Vercel): the publication's clip is bundled as a static asset under /renders and served by the
  // CDN. The publication-state gate above still runs on every request; we only hand off the byte-serving.
  if (process.env.VERCEL) return Response.redirect(new URL(path, req.url), 307);
  const segs = renderSegments(path);
  if (!segs) return new Response("not available", { status: 404, headers: { "Cache-Control": "no-store" } });
  return serveRenderFile(req, segs);
}
