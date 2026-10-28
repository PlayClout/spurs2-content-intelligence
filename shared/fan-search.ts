export interface PublishedSearchItem {
  publicationVersionId: string;
  orgId: string;
  indexedAssetId: string;
  state: "preparing" | "scheduled" | "published" | "withdrawn" | "expired";
  canView: boolean;
}

export interface SearchHit {
  video_id: string;
  start: number;
  end: number;
  rank: number;
}

export function allowedIndexedAssetIds(items: PublishedSearchItem[]) {
  return [...new Set(items.filter((x) => x.state === "published" && x.canView && x.indexedAssetId).map((x) => x.indexedAssetId))];
}

export function buildFanSearchRequest(indexId: string, query: string, allowedIds: string[]) {
  if (!allowedIds.length) return { ok: false as const, reason: "empty_allowed_set" };
  return { ok: true as const, indexId, query, filter: { id: allowedIds } };
}

export function postValidateSearchHits(hits: SearchHit[], items: PublishedSearchItem[]) {
  const byIndexedId = new Map(items.filter((x) => x.state === "published" && x.canView).map((x) => [x.indexedAssetId, x]));
  return hits.flatMap((hit) => {
    const item = byIndexedId.get(hit.video_id);
    if (!item) return [];
    return [{ ...hit, publicationVersionId: item.publicationVersionId }];
  });
}

/**
 * Derivative mapping (B9.2/U4.4): the published derivative is a cut of an indexed source video. A provider hit
 * counts only when it overlaps a published version's source range; the result plays at an offset INSIDE that
 * derivative. Hits outside every published range (raw full-match footage) are dropped, never returned.
 */
export interface PublishedRangeItem extends PublishedSearchItem {
  sourceRanges: { start: number; end: number }[];
  durationSec: number;
}

const MIN_OVERLAP_SEC = 0.5;

export function mapHitsToPublishedDerivatives(hits: SearchHit[], items: PublishedRangeItem[]) {
  const eligible = items.filter((x) => x.state === "published" && x.canView && x.indexedAssetId);
  const seen = new Set<string>();
  const out: { publicationVersionId: string; rank: number; offsetStartSec: number; offsetEndSec: number }[] = [];
  for (const hit of [...hits].sort((a, b) => a.rank - b.rank)) {
    for (const item of eligible) {
      if (item.indexedAssetId !== hit.video_id || seen.has(item.publicationVersionId)) continue;
      let cursor = 0; // derivative timeline position of this range (ranges are concatenated in order)
      for (const r of item.sourceRanges) {
        const overlapStart = Math.max(r.start, hit.start);
        const overlapEnd = Math.min(r.end, hit.end);
        if (overlapEnd - overlapStart >= MIN_OVERLAP_SEC) {
          const offsetStartSec = Math.max(0, Math.min(item.durationSec, cursor + overlapStart - r.start));
          const offsetEndSec = Math.max(offsetStartSec, Math.min(item.durationSec, cursor + overlapEnd - r.start));
          out.push({ publicationVersionId: item.publicationVersionId, rank: hit.rank, offsetStartSec, offsetEndSec });
          seen.add(item.publicationVersionId);
          break;
        }
        cursor += r.end - r.start;
      }
    }
  }
  return out;
}

/** Labelled fallback when the video search provider is unavailable (B9.5/U4.5). Never called AI search. */
export interface MetadataSearchItem { publicationVersionId: string; text: string; playerNames: string[]; interestTags: string[] }

export function metadataSearch(query: string, items: MetadataSearchItem[]) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return [];
  return items
    .map((item) => {
      const hay = [item.text, ...item.playerNames, ...item.interestTags].join(" ").toLowerCase();
      const score = terms.filter((t) => hay.includes(t)).length;
      return { publicationVersionId: item.publicationVersionId, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}
