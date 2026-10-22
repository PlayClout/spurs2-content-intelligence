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
