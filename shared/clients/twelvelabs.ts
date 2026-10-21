/**
 * TwelveLabs client — honors MOCK_MODE=1 (serves recorded fixtures from data/fallback-assets/).
 * Real API: v1.3, auth via x-api-key header. See docs/api-spike-report.md §1 for verified details.
 * Record real responses as fixtures during Wednesday testing — mocks are replayed truth.
 */
const BASE = "https://api.twelvelabs.io/v1.3";
const MOCK = process.env.MOCK_MODE === "1";

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": process.env.TWELVELABS_API_KEY ?? "",
      "Content-Type": "application/json",
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

async function fixture(name: string) {
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(`data/fallback-assets/fixtures/twelvelabs-${name}.json`, "utf8"));
}

/** Marengo semantic search: returns hits with start/end seconds. */
export async function searchMoments(indexId: string, query: string) {
  if (MOCK) return fixture("search");
  return api("/search", {
    method: "POST",
    body: JSON.stringify({ index_id: indexId, query_text: query, search_options: ["visual", "audio"] }),
  });
}

/** Pegasus analyze with json_schema -> structured events with ms timestamps. TODO(Wed): verify schema shape empirically. */
export async function analyzeStructured(videoId: string, prompt: string, jsonSchema: object) {
  if (MOCK) return fixture("analyze");
  return api("/analyze", {
    method: "POST",
    body: JSON.stringify({ video_id: videoId, prompt, response_format: { type: "json_schema", json_schema: jsonSchema } }),
  });
}

/** Create indexing task (legacy one-shot path — simplest for hackathon). */
export async function indexVideo(indexId: string, videoUrl: string) {
  if (MOCK) return fixture("index-task");
  return api("/tasks", { method: "POST", body: JSON.stringify({ index_id: indexId, video_url: videoUrl }) });
}

export async function taskStatus(taskId: string) {
  if (MOCK) return { status: "ready" };
  return api(`/tasks/${taskId}`);
}
