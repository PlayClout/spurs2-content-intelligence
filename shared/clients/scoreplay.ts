/**
 * ScorePlay client — honors MOCK_MODE=1. Key is CSM-issued (get at Thursday briefing — Nate).
 * Verified public surface: GET /tag/search (labels->IDs), POST /media/search (AND/OR/exclude),
 * 3 asset tiers + face-aware dynamic crop CDN URLs, timecoded video actions (write schema TBD),
 * S3/GCS delivery, webhooks. Auth: X-ScorePlay-Api-Key. Docs: developer.scoreplay.io
 * TODO(Thu): download OpenAPI spec + Postman collection the moment we have a key; fill real base URL.
 */
const BASE = process.env.SCOREPLAY_API_BASE ?? ""; // confirm with issued key Thursday
const MOCK = process.env.MOCK_MODE === "1" || !process.env.SCOREPLAY_API_KEY;

async function fixture(name: string) {
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(`data/fallback-assets/fixtures/scoreplay-${name}.json`, "utf8"));
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "X-ScorePlay-Api-Key": process.env.SCOREPLAY_API_KEY ?? "", "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`ScorePlay ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function tagSearch(label: string) {
  if (MOCK) return fixture("tag-search");
  return api(`/tag/search?query=${encodeURIComponent(label)}`);
}

export async function mediaSearch(body: object) {
  if (MOCK) return fixture("media-search");
  return api("/media/search", { method: "POST", body: JSON.stringify(body) });
}

/** Write a TwelveLabs-detected moment back as a timecoded video action (headline integration if schema permits). */
export async function writeTimecodedAction(_assetId: string, _action: { label: string; startSec: number; endSec: number }) {
  if (MOCK) return { ok: true, mocked: true };
  throw new Error("Schema unknown until key issued — fill from OpenAPI spec Thursday");
}
