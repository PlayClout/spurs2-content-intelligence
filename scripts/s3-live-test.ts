/**
 * Live S3 proof (real AWS, real bucket): render a moment with RENDER_STORAGE=s3, then
 *  1. list the bucket: drafts landed under renders/<slug>/
 *  2. presign + GET the reel: 200, video/mp4, real bytes; Range request -> 206 (video seek works)
 *  3. negative control: the same object WITHOUT a signature is denied (bucket is private)
 *   npx tsx --env-file=.env scripts/s3-live-test.ts
 */
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

process.env.RENDER_STORAGE = "s3";
process.env.MOCK_MODE = "1"; // TwelveLabs recorded response: this test is about storage, not analysis
let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };

const { processMoment } = await import("../pipeline/moment");
const { signedRenderUrl, s3ConfigComplete } = await import("../shared/storage");
check(s3ConfigComplete(), "s3 config complete from .env");

const slug = `s3live-${Date.now()}`;
const input = {
  orgKey: "san-antonio-spurs", competition: "NBA Regular Season", scorePlayMediaId: 46000301, startSec: 6, endSec: 12,
  headline: "Castle at the buzzer", kicker: "Spurs 112 · Thunder 110", statLine: "Game-winning dunk · SIMULATED",
  trigger: { kind: "game_event", text: "s3 live test", simulated: true },
  manifestFixture: "data/fallback-assets/fixtures/twelvelabs-manifest.json",
} as never;

// IAM keys can take a few seconds to propagate after creation: retry the first upload briefly
let p;
for (let i = 0; i < 6; i++) {
  try { p = await processMoment(input, slug); break; } catch (e) {
    if (i === 5 || !/InvalidAccessKeyId|SignatureDoesNotMatch|AccessDenied/.test(String(e))) throw e;
    console.log(`  (key not propagated yet: ${String(e).slice(0, 60)}; retry ${i + 1})`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}
check(!!p, "processMoment completed in s3 mode");

const s3 = new S3Client({ region: process.env.RENDER_S3_REGION, credentials: { accessKeyId: process.env.RENDER_S3_ACCESS_KEY_ID!, secretAccessKey: process.env.RENDER_S3_SECRET_ACCESS_KEY! } });
const listed = await s3.send(new ListObjectsV2Command({ Bucket: process.env.RENDER_S3_BUCKET, Prefix: `renders/${slug}/` }));
const keys = (listed.Contents ?? []).map((o) => o.Key!.split("/").pop());
check(keys.includes("reel.instagram_reel.draft.mp4") && keys.includes("card.instagram_feed.jpg"), `drafts landed in bucket (${keys.join(", ")})`);

const url = await signedRenderUrl(slug, "reel.instagram_reel.draft.mp4", 600);
const full = await fetch(url!);
const buf = await full.arrayBuffer();
check(full.status === 200 && full.headers.get("content-type") === "video/mp4" && buf.byteLength > 100_000, `presigned GET: ${full.status} ${full.headers.get("content-type")} ${(buf.byteLength / 1e6).toFixed(1)}MB`);
const ranged = await fetch(url!, { headers: { Range: "bytes=0-1023" } });
check(ranged.status === 206 && (await ranged.arrayBuffer()).byteLength === 1024, `Range request -> ${ranged.status} (video seek works)`);

const unsigned = await fetch(url!.split("?")[0]);
check(unsigned.status === 403, `unsigned GET denied (${unsigned.status}) = bucket is private`);

console.log(`\nslug ${slug}\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
