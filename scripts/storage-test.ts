import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { storageMode, signedRenderUrl } from "../shared/storage";

const original = process.env.RENDER_STORAGE;
try {
  delete process.env.RENDER_STORAGE;
  assert.equal(storageMode(), "local");
  process.env.RENDER_STORAGE = "local";
  assert.equal(await signedRenderUrl("clip", "final.mp4"), null);
  for (const mode of ["s3", "cloud", "typo"]) {
    process.env.RENDER_STORAGE = mode;
    assert.throws(() => storageMode(), /local/);
  }
  assert.throws(() => execFileSync(process.execPath, ["--import", "tsx", "-e", "import('./shared/storage.ts')"], {
    env: { ...process.env, RENDER_STORAGE: "s3" }, stdio: "pipe",
  }), /local/);
  const exports = await import("../shared/storage");
  assert.equal("uploadRenderDir" in exports, false);
  assert.equal("s3ConfigComplete" in exports, false);
  console.log("PASS local storage only; cloud settings fail at startup; no upload export");
} finally {
  if (original === undefined) delete process.env.RENDER_STORAGE; else process.env.RENDER_STORAGE = original;
}
