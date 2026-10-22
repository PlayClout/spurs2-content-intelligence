/**
 * Storage seam unit tests (no network, no AWS): mode selection, key shaping, config-completeness, and that
 * local mode is a strict no-op (so the M5 / test path never needs the AWS SDK or a bucket).
 *   npx tsx scripts/storage-test.ts
 */
import { storageMode, uploadRenderDir, signedRenderUrl, s3ConfigComplete, uploadableFiles } from "../shared/storage";

let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
const save = { ...process.env };
const reset = () => { for (const k of Object.keys(process.env)) if (k.startsWith("RENDER_")) delete process.env[k]; };

// ── mode selection ────────────────────────────────────────────────────────────────────
reset();
check(storageMode() === "local", "default mode is local (no env)");
process.env.RENDER_STORAGE = "s3";
check(storageMode() === "s3", "RENDER_STORAGE=s3 selects s3");
process.env.RENDER_STORAGE = "anything-else";
check(storageMode() === "local", "any other value falls back to local (fail safe)");

// ── local mode is a strict no-op (no SDK import, no throw) ───────────────────────────────
reset();
const up = await uploadRenderDir("m-1-6", "/tmp/does-not-matter-local-noop");
check(Array.isArray(up) && up.length === 0, "local uploadRenderDir is a no-op returning []");
check((await signedRenderUrl("m-1-6", "reel.instagram_reel.final.mp4")) === null, "local signedRenderUrl returns null (route serves from disk)");

// ── content rule: club footage (source-*) never leaves the machine, only our outputs do ─────
const picked = uploadableFiles(["source-46000301.mp4", "source-46000302.mov", "reel.instagram_reel.draft.mp4", "reel.instagram_reel.draft.poster.jpg", "card.instagram_feed.jpg", "manifest.json", "card.grab.png"]);
check(!picked.some((f) => f.startsWith("source-")), `source copies are never uploaded (uploadable: ${picked.join(", ")})`);
check(picked.includes("reel.instagram_reel.draft.mp4") && picked.includes("card.instagram_feed.jpg") && !picked.includes("manifest.json"), "our rendered outputs ARE uploaded; non-media files are not");

// ── config completeness gate ────────────────────────────────────────────────────────────
reset();
process.env.RENDER_STORAGE = "s3";
check(!s3ConfigComplete(), "s3 config incomplete when creds/bucket missing");
Object.assign(process.env, {
  RENDER_S3_BUCKET: "clout-ci-renders", RENDER_S3_REGION: "us-east-1",
  RENDER_S3_ACCESS_KEY_ID: "AKIAnotreal", RENDER_S3_SECRET_ACCESS_KEY: "secretnotreal",
});
check(s3ConfigComplete(), "s3 config complete when all four present");

// ── key shaping (prefix + slug + basename, default prefix 'renders') ────────────────────
// signedRenderUrl builds the key internally; prove the prefix override is read without hitting the network
// by checking the module's keyFor behavior indirectly through a presign attempt against a fake endpoint.
reset();
Object.assign(process.env, {
  RENDER_STORAGE: "s3", RENDER_S3_BUCKET: "b", RENDER_S3_REGION: "us-east-1",
  RENDER_S3_ENDPOINT: "https://example-fake-endpoint.invalid", RENDER_S3_PREFIX: "renders",
  RENDER_S3_ACCESS_KEY_ID: "AKIAnotreal", RENDER_S3_SECRET_ACCESS_KEY: "secretnotreal",
});
const signed = await signedRenderUrl("m-46000301-6", "/abs/ignored/reel.instagram_reel.final.mp4", 900);
check(!!signed && signed.includes("renders/m-46000301-6/reel.instagram_reel.final.mp4"), `presigned URL carries prefix/slug/basename key (${signed?.slice(0, 90)}…)`);
check(!!signed && /X-Amz-Expires=900/.test(signed), "presigned URL honors the TTL");
check(!!signed && /X-Amz-Signature=/.test(signed), "presigned URL is actually signed (SigV4)");

Object.assign(process.env, save);
console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
