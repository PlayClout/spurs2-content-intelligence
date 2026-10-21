#!/usr/bin/env node
/**
 * Empirical test: upload both clips as assets, index them into the default
 * Marengo index, and measure wall-clock asset-ready + indexing time per clip.
 */
import { TwelveLabs } from "twelvelabs-js";
import { readFileSync, writeFileSync, createReadStream } from "node:fs";

const key = JSON.parse(readFileSync("/Users/stu/.openclaw/workspace/memory/credentials/twelvelabs.json", "utf8")).key;
const client = new TwelveLabs({ apiKey: key });

const INDEX_ID = "6ad81a01030b76724d10dc67"; // "My Index (Default)" - marengo3.0 visual+audio

const clips = [
  { label: "basketball", path: "data/fallback-assets/basketball-broll.mp4" },
  { label: "soccer", path: "data/fallback-assets/soccer-broll.mp4" },
];

async function waitFor(fn, isDone, label) {
  const t0 = Date.now();
  let result = await fn();
  while (!isDone(result)) {
    await new Promise((r) => setTimeout(r, 4000));
    result = await fn();
    console.log(`  [${label}] status=${result.status} (+${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  return { result, elapsedMs: Date.now() - t0 };
}

const report = {};

for (const clip of clips) {
  console.log(`\n=== ${clip.label} (${clip.path}) ===`);
  const t0 = Date.now();

  // 1. Upload asset (local direct upload)
  const uploadStart = Date.now();
  const asset = await client.assets.create({
    method: "direct",
    file: createReadStream(clip.path),
    filename: `${clip.label}-broll.mp4`,
  });
  console.log(`Created asset: id=${asset.id} status=${asset.status}`);

  // 2. Wait for asset ready
  const assetWait = await waitFor(
    () => client.assets.retrieve(asset.id),
    (a) => a.status === "ready" || a.status === "failed",
    `${clip.label}:asset`
  );
  if (assetWait.result.status === "failed") {
    console.error(`Asset failed: ${JSON.stringify(assetWait.result)}`);
    report[clip.label] = { error: "asset_failed", detail: assetWait.result };
    continue;
  }
  const assetReadyMs = Date.now() - uploadStart;
  console.log(`Asset ready in ${(assetReadyMs / 1000).toFixed(1)}s`);

  // 3. Index the asset (Marengo)
  const indexStart = Date.now();
  const indexedAsset = await client.indexes.indexedAssets.create(INDEX_ID, {
    assetId: asset.id,
  });
  console.log(`Created indexed asset: id=${indexedAsset.id}`);

  const indexWait = await waitFor(
    () => client.indexes.indexedAssets.retrieve(INDEX_ID, indexedAsset.id),
    (ia) => ia.status === "ready" || ia.status === "failed",
    `${clip.label}:index`
  );
  const indexingMs = Date.now() - indexStart;
  const totalMs = Date.now() - t0;

  console.log(`Indexing ${indexWait.result.status} in ${(indexingMs / 1000).toFixed(1)}s (total incl. upload: ${(totalMs / 1000).toFixed(1)}s)`);

  report[clip.label] = {
    assetId: asset.id,
    indexedAssetId: indexedAsset.id,
    indexId: INDEX_ID,
    status: indexWait.result.status,
    videoId: indexWait.result.videoId ?? indexWait.result.video_id ?? null,
    timings: {
      assetReadyMs,
      indexingMs,
      totalMs,
    },
    rawIndexedAsset: indexWait.result,
  };
}

writeFileSync("data/fallback-assets/fixtures/_raw-index-task-report.json", JSON.stringify(report, null, 2));
console.log("\n\n=== SUMMARY ===");
console.log(JSON.stringify(report, (k, v) => (k === "rawIndexedAsset" ? undefined : v), 2));
