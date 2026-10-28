/**
 * Serves pipeline renders (drafts, finals, photo cards) from local disk at REQUEST time.
 * Why a route and not web/public: Next production only serves public/ files that existed at startup, so anything
 * the worker renders during the demo (e.g. the final after Approve) would 404 from public/.
 * Supports HTTP Range so <video> can seek (Safari requires it). No cloud redirect exists (B14.2/B14.3).
 */
import { connection } from "next/server";
import { serveRenderFile } from "@/lib/serve-file";

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  await connection();
  const { path } = await ctx.params;
  return serveRenderFile(req, path);
}
