/**
 * AI watch-list: the "what the AI sees" trigger. A standing Marengo search over indexed footage that can surface a
 * moment no data feed logged. Live search when TWELVELABS_API_KEY is set (MOCK_MODE != 1), else the recorded live
 * search response (data/fallback-assets/fixtures/twelvelabs-search.json, query "ball in motion").
 * Hits overlapping a moment that already fired are skipped: the watch-list adds NEW moments, triggers merge elsewhere.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { searchMoments } from "../shared/clients/twelvelabs";

export interface Footage { orgKey: string; competition: string; scorePlayMediaId: number; twelvelabsAssetId: string; twelvelabsVideoId: string; teamSeasonId?: number }
export interface Hit { rank: number; start: number; end: number; video_id: string }
export interface Window { start: number; end: number }

/** overlap / shorter length: 1 = same play, 0 = disjoint. Shared with the worker's pre-analysis dedupe. */
export function overlapRatio(a: Window, b: Window) {
  const o = Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
  const short = Math.min(a.end - a.start, b.end - b.start);
  return short > 0 ? o / short : 0;
}
export const SAME_PLAY = 0.5;

const FIXTURE_REL = "data/fallback-assets/fixtures/twelvelabs-search.json";
/** Resolved lazily: Next's page-data collection evaluates this module, where import.meta.url is not a file URL. */
function fixturePath() {
  const candidates: string[] = [];
  try { candidates.push(fileURLToPath(new URL(`../${FIXTURE_REL}`, import.meta.url))); } catch { /* bundled context */ }
  candidates.push(join(process.cwd(), FIXTURE_REL), join(process.cwd(), "..", FIXTURE_REL));
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error(`recorded search fixture not found (${FIXTURE_REL})`);
  return hit;
}

export async function search(indexId: string, query: string, videoIds?: string[]): Promise<{ hits: Hit[]; mode: "live" | "recorded" }> {
  if (process.env.TWELVELABS_API_KEY && process.env.MOCK_MODE !== "1") {
    const r = (await searchMoments(indexId, query, videoIds)) as { data?: Hit[] };
    return { hits: r.data ?? [], mode: "live" };
  }
  return { hits: (JSON.parse(await readFile(fixturePath(), "utf8")) as { data: Hit[] }).data, mode: "recorded" };
}

/** Best-ranked hit on watched footage that is not the same play as anything already fired there. */
export function pickNew(hits: Hit[], footage: Footage[], fired: { mediaId: number; window: Window }[]) {
  for (const h of [...hits].sort((a, b) => a.rank - b.rank)) {
    const f = footage.find((x) => x.twelvelabsVideoId === h.video_id);
    if (!f) continue;
    const w = { start: h.start, end: h.end };
    if (fired.some((x) => x.mediaId === f.scorePlayMediaId && overlapRatio(x.window, w) >= SAME_PLAY)) continue;
    return { hit: h, footage: f };
  }
  return null;
}
