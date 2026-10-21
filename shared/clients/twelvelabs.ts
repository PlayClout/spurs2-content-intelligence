/**
 * TwelveLabs client — honors MOCK_MODE=1 (serves recorded fixtures from data/fallback-assets/).
 * Real API: v1.3, auth via x-api-key header. See docs/twelvelabs-empirical-test.md for the
 * full empirical verification (2026-10-20) this file is based on — fixtures are REAL recorded
 * API responses, not guesses.
 *
 * CORRECTED post-empirical-test (see docs/twelvelabs-empirical-test.md §"client corrections"):
 * - POST /search requires multipart/form-data, NOT application/json (JSON body -> 400
 *   content_type_invalid). search_options must be appended as repeated form fields.
 * - POST /analyze takes `video: {type: "asset_id", asset_id}` (or url/base64_string), NOT a
 *   bare `video_id` field. It operates directly on an uploaded asset — no indexing required.
 * - The current working index flow is POST /assets (upload, multipart) -> POST
 *   /indexes/{id}/indexed-assets (index, JSON ok) -> poll GET .../indexed-assets/{id}. The
 *   legacy one-shot POST /tasks endpoint still exists in v1.3 but ALSO requires multipart
 *   (same gotcha) and was not exercised end-to-end here; prefer the assets flow below.
 */
const BASE = "https://api.twelvelabs.io/v1.3";
const MOCK = process.env.MOCK_MODE === "1";

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": process.env.TWELVELABS_API_KEY ?? "",
      ...init.headers,
    },
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get("Retry-After") ?? "5");
    await new Promise((r) => setTimeout(r, wait * 1000));
    return api(path, init);
  }
  if (!res.ok) throw new Error(`TwelveLabs ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiJson(path: string, body: object, init: RequestInit = {}) {
  return api(path, {
    ...init,
    method: init.method ?? "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(body),
  });
}

async function fixture(name: string) {
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(`data/fallback-assets/fixtures/twelvelabs-${name}.json`, "utf8"));
}

/** Marengo semantic search: returns hits with start/end seconds. Verified: multipart/form-data required. */
export async function searchMoments(indexId: string, query: string) {
  if (MOCK) return fixture("search");
  const form = new FormData();
  form.append("index_id", indexId);
  form.append("query_text", query);
  form.append("search_options", "visual");
  form.append("search_options", "audio");
  return api("/search", { method: "POST", body: form });
}

/**
 * Pegasus analyze with json_schema -> structured events with timestamp fields.
 * Verified: `video` must be {type:"asset_id", asset_id} (or url/base64_string); there is no
 * bare `video_id` field, and analyze does not require the asset to be indexed.
 */
export async function analyzeStructured(assetId: string, prompt: string, jsonSchema: object) {
  if (MOCK) return fixture("analyze");
  return apiJson("/analyze", {
    model_name: "pegasus1.6",
    video: { type: "asset_id", asset_id: assetId },
    prompt,
    response_format: { type: "json_schema", json_schema: jsonSchema },
    stream: false,
  });
}

/** Upload a local video file as an asset (multipart). Returns {_id, status: "processing", ...}. */
export async function uploadAsset(filePath: string, filename?: string) {
  const { createReadStream } = await import("node:fs");
  const form = new FormData();
  form.append("method", "direct");
  form.append("file", createReadStream(filePath) as unknown as Blob, filename);
  return api("/assets", { method: "POST", body: form });
}

export async function assetStatus(assetId: string) {
  if (MOCK) return { status: "ready" };
  return api(`/assets/${assetId}`);
}

/** Index an already-uploaded, ready asset into a Marengo index. Returns {_id, asset_id} (202). */
export async function indexAsset(indexId: string, assetId: string) {
  if (MOCK) return fixture("index-task");
  return apiJson(`/indexes/${indexId}/indexed-assets`, { asset_id: assetId });
}

export async function indexedAssetStatus(indexId: string, indexedAssetId: string) {
  if (MOCK) return { status: "ready" };
  return api(`/indexes/${indexId}/indexed-assets/${indexedAssetId}`);
}
