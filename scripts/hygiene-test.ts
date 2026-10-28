import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, readdir, rm, mkdir, utimes, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { purgeLocalMedia } from "../pipeline/local-media";
import * as sp from "../shared/clients/scoreplay";
import { LocalFfmpegBackend, FFMPEG } from "../pipeline/render-local";

const root = await mkdtemp(join(tmpdir(), "spursx2-hygiene-"));
const saved = { ...process.env }, originalFetch = globalThis.fetch;
try {
  const source = join(root, "synthetic.mp4");
  execFileSync(FFMPEG, ["-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=320x180:d=2", "-c:v", "libx264", source]);
  const bytes = await readFile(source);
  const dir = join(root, "render"); await mkdir(dir);
  process.env.SCOREPLAY_API_KEY = "unit-test-key";
  delete process.env.MOCK_MODE; delete process.env.TWELVELABS_API_KEY;
  const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
  sp.__setFetch((async (url) => String(url).endsWith("formats/download")
    ? json({ items: { video: [{ type: "video_large", size: bytes.length, file_name: "proxy.mp4", file_url: "https://proxy.test/video" }] } })
    : json({ ID: 10, company_id: 20, type: "video", name: "synthetic" })) as typeof fetch);
  globalThis.fetch = (async () => new Response(bytes)) as typeof fetch;
  process.env.RENDER_OUT_DIR = dir;
  const { processMoment, resolveSource } = await import("../pipeline/moment");
  await assert.rejects(processMoment({ orgKey: "san-antonio-spurs", competition: "test", scorePlayMediaId: 10,
    startSec: 0, endSec: 1, headline: "synthetic", trigger: { kind: "game_event", text: "test", simulated: true } }, "failure"), /no manifestFixture/);
  assert.deepEqual(await readdir(join(dir, "failure")), []);
  globalThis.fetch = (async () => new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); c.error(new Error("broken transfer")); } }))) as typeof fetch;
  await assert.rejects(resolveSource(10, dir), /broken transfer/);
  assert(!(await readdir(dir)).some((n) => n.startsWith("source-")));
  const renderer = new LocalFfmpegBackend();
  const req = { orgId: "test", sourcePath: source, startSec: 0, endSec: 1, channel: "instagram_feed" as const,
    mode: "final" as const, outDir: dir, slug: "test", club: "not-a-club" };
  await assert.rejects(renderer.render(req));
  assert(!(await readdir(dir)).some((n) => n.endsWith(".grab.png")));
  await renderer.render({ ...req, club: "san-antonio-spurs" } as import("../pipeline/render-local").LocalRenderRequest);
  assert(!(await readdir(dir)).some((n) => n.endsWith(".grab.png")));
  const stale = join(dir, "source-old.mp4"); await writeFile(stale, "old"); await utimes(stale, 1, 1);
  const active = join(dir, "source-active.mp4"); await writeFile(active, "active");
  const outside = join(root, "outside"); await mkdir(outside); await writeFile(join(outside, "keep.mp4"), "unrelated");
  await symlink(outside, join(dir, "outside-link"));
  await purgeLocalMedia({ roots: [dir] });
  assert(!(await readdir(dir)).includes("source-old.mp4"));
  assert((await readdir(dir)).includes("source-active.mp4"));
  const result = await purgeLocalMedia({ all: true, roots: [dir] });
  assert.equal(result.files_left, 0);
  assert.equal(await readFile(join(outside, "keep.mp4"), "utf8"), "unrelated");
  console.log("PASS failures remove source copies and frame grabs; stale sweep preserves active work; explicit purge files_left=0; symlink targets untouched");
} finally {
  globalThis.fetch = originalFetch;
  sp.__setFetch((...args) => originalFetch(...args));
  for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
  Object.assign(process.env, saved);
  await rm(root, { recursive: true, force: true });
}
