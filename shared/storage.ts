/**
 * Render-file storage seam. Two modes, chosen by env, same public path contract (`/renders/<slug>/<file>`):
 *
 *   local (default)  — files live on disk under RENDER_OUT_DIR; the Next /renders route streams them.
 *                      Used on the M5 and in tests. No cloud deps required.
 *   s3               — after ffmpeg writes locally, outputs are uploaded to an S3-compatible bucket; the
 *                      /renders route 302-redirects to a short-lived presigned URL. Works with BOTH AWS S3
 *                      and Supabase Storage (S3-compatible) with no code change — only env differs.
 *
 * Why upload-after-write (not write-straight-to-S3): ffmpeg needs a real filesystem to render into, and the
 * worker + UI can run on different machines, so the shared source of truth for finished files is the bucket.
 * The DB never stores a bucket URL — only the stable `/renders/<slug>/<file>` path — so switching modes (or
 * failing back to the M5) needs zero data migration.
 *
 * Env (all required together to enable s3; absence => local):
 *   RENDER_STORAGE=s3
 *   RENDER_S3_BUCKET, RENDER_S3_REGION, RENDER_S3_ENDPOINT (optional; set for Supabase/MinIO),
 *   RENDER_S3_ACCESS_KEY_ID, RENDER_S3_SECRET_ACCESS_KEY
 *   RENDER_S3_PREFIX (optional key prefix, default "renders")
 */
import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";

export type StorageMode = "local" | "s3";

export function storageMode(): StorageMode {
  return process.env.RENDER_STORAGE === "s3" ? "s3" : "local";
}

const PREFIX = () => (process.env.RENDER_S3_PREFIX ?? "renders").replace(/^\/+|\/+$/g, "");
const keyFor = (slug: string, file: string) => `${PREFIX()}/${slug}/${basename(file)}`;

const MIME: Record<string, string> = { mp4: "video/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const mimeOf = (f: string) => MIME[f.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

// Lazy S3 client so `local` mode never needs the AWS SDK installed (keeps the test path dependency-free).
let _client: unknown;
async function s3() {
  if (!_client) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    _client = new S3Client({
      region: process.env.RENDER_S3_REGION ?? "us-east-1",
      endpoint: process.env.RENDER_S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.RENDER_S3_ENDPOINT, // Supabase/MinIO need path-style
      credentials: {
        accessKeyId: process.env.RENDER_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.RENDER_S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client as import("@aws-sdk/client-s3").S3Client;
}

/** Upload every file in a finished render dir to the bucket. No-op in local mode. Returns uploaded keys. */
export async function uploadRenderDir(slug: string, dir: string): Promise<string[]> {
  if (storageMode() !== "s3") return [];
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3();
  const bucket = process.env.RENDER_S3_BUCKET!;
  const files = (await readdir(dir)).filter((f) => f in MIME || f.split(".").pop()!.toLowerCase() in MIME);
  const keys: string[] = [];
  for (const f of files) {
    const key = keyFor(slug, f);
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: await readFile(join(dir, f)), ContentType: mimeOf(f), CacheControl: "public, max-age=31536000, immutable" }));
    keys.push(key);
  }
  return keys;
}

/** Presigned GET URL for one render file (s3 mode only). Short TTL; the browser does Range requests against it. */
export async function signedRenderUrl(slug: string, file: string, expiresInSec = 3600): Promise<string | null> {
  if (storageMode() !== "s3") return null;
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(await s3(), new GetObjectCommand({ Bucket: process.env.RENDER_S3_BUCKET!, Key: keyFor(slug, file) }), { expiresIn: expiresInSec });
}

/** True when a full s3 config is present; used to fail fast on misconfig rather than silently falling back. */
export function s3ConfigComplete(): boolean {
  return ["RENDER_S3_BUCKET", "RENDER_S3_REGION", "RENDER_S3_ACCESS_KEY_ID", "RENDER_S3_SECRET_ACCESS_KEY"].every((k) => !!process.env[k]);
}
