"use server";

/**
 * Library page (server): everything a club holds in ScorePlay, by collection, with live TwelveLabs search over the
 * club's own index and "Make clip" on any asset. Make clip queues the same process_moment job a library run or the
 * live engine uses, so the clip is analysed (Pegasus), rights-screened and lands in the Inbox as a draft. Nothing
 * publishes. Thumbnails are ScorePlay's own CDN thumbnails; nothing is downloaded to show the page.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import * as sp from "@shared/clients/scoreplay";
import { searchMoments } from "@shared/clients/twelvelabs";
import type { IndexedClip, SearchHit } from "@shared/library";
import type { MomentInput } from "@pipeline/moment";
import saMap from "../../data/footage-map-san-antonio-spurs.json" with { type: "json" };
import thfcMap from "../../data/footage-map.json" with { type: "json" };
import saPlan from "../../data/library/san-antonio-spurs.json" with { type: "json" };
import thfcPlan from "../../data/library/tottenham-hotspur.json" with { type: "json" };
import themes from "../../pipeline/club-themes.json" with { type: "json" };

type Group = "Match" | "Around the match" | "Creative" | "Game footage" | "Club posts" | "Photos";
interface CollectionDef { id: number; name: string; kind: "video" | "photo"; group: Group }
interface ClubLib { indexId: string; competition: string; teamSeasonId: number; eventLabel: string; collections: CollectionDef[]; indexed: IndexedClip[]; suggestions: string[] }

const indexed = (media: Partial<IndexedClip>[]) => media.filter((m): m is IndexedClip => !!m.twelvelabsVideoId && !!m.twelvelabsAssetId);
// the club's ScorePlay collections (probed 2026-10-23). Full Match is listed (it is the club's footage) but clips from
// it are made on the Live match desk; the library cuts the shorter assets.
const CLUBS: Record<string, ClubLib> = {
  "tottenham-hotspur": {
    indexId: thfcMap.twelvelabsIndexId, competition: thfcPlan.competition, teamSeasonId: thfcPlan.teamSeasonId, eventLabel: thfcPlan.eventLabel,
    indexed: indexed(thfcMap.media as Partial<IndexedClip>[]),
    suggestions: ["Solanke goal", "De Zerbi press conference", "away fans singing", "sliding tackle", "goalkeeper save"],
    collections: [
      { id: 1536086, name: "Full Match", kind: "video", group: "Match" },
      { id: 1536082, name: "Moments", kind: "video", group: "Match" },
      { id: 1536079, name: "Highlights", kind: "video", group: "Match" },
      { id: 1536076, name: "Pre-Match", kind: "video", group: "Around the match" },
      { id: 1536078, name: "Post-Match", kind: "video", group: "Around the match" },
      { id: 1536080, name: "Press Conference", kind: "video", group: "Around the match" },
      { id: 1536081, name: "Creative Video", kind: "video", group: "Creative" },
      { id: 1536077, name: "Match photos", kind: "photo", group: "Photos" },
      { id: 1536083, name: "Dressing room photos", kind: "photo", group: "Photos" },
      { id: 1536080, name: "Press Conference photos", kind: "photo", group: "Photos" },
    ],
  },
  "san-antonio-spurs": {
    indexId: saMap.twelvelabsIndexId, competition: saPlan.competition, teamSeasonId: saPlan.teamSeasonId, eventLabel: saPlan.eventLabel,
    indexed: indexed(saMap.media as Partial<IndexedClip>[]),
    suggestions: ["Wembanyama dunk", "blocked shot", "postgame interview", "three pointer", "alley-oop"],
    collections: [
      { id: 1536844, name: "Raw Footage", kind: "video", group: "Game footage" },
      { id: 1536708, name: "Social Edits", kind: "video", group: "Club posts" },
      { id: 1536706, name: "Photos", kind: "photo", group: "Photos" },
    ],
  },
};
const keyOf = async (orgId: string) => {
  const [org] = await db.select().from(s.orgs).where(eq(s.orgs.id, orgId));
  const key = org && Object.entries(themes as Record<string, { displayName?: string }>).find(([, t]) => t.displayName === org.name)?.[0];
  return { org, key: key && CLUBS[key] ? key : null };
};
const collKey = (c: CollectionDef) => `${c.id}:${c.kind}`;

export interface LibraryAsset {
  id: number; kind: "video" | "photo"; name: string; caption: string | null; durationSec: number; thumb: string | null;
  collection: string; searchable: boolean; clipped: boolean;
}

/** The club's collections with their real ScorePlay counts. */
export async function libraryCollections(orgId: string) {
  const { key } = await keyOf(orgId);
  if (!key) return null;
  const lib = CLUBS[key];
  const counts = await Promise.all(lib.collections.map(async (c) => {
    const r = await sp.mediaSearch({ media_type: c.kind, event_id: c.id }, 1, 1);
    return r.data.count ?? r.data.media.length;
  }));
  const idx = new Set(lib.indexed.map((m) => m.scorePlayMediaId));
  return {
    indexLabel: `${lib.indexed.length} videos searchable in TwelveLabs`,
    suggestions: lib.suggestions,
    collections: lib.collections.map((c, i) => ({ key: collKey(c), name: c.name, kind: c.kind, group: c.group, count: counts[i],
      searchable: c.kind === "photo" ? counts[i] : lib.indexed.filter((m) => m.collection === c.name && idx.has(m.scorePlayMediaId)).length })),
  };
}

/** One page of a collection (or of everything), straight from ScorePlay. */
export async function libraryAssets(orgId: string, collection: string | null, page = 1, perPage = 24) {
  const { key } = await keyOf(orgId);
  if (!key) return { assets: [] as LibraryAsset[], hasMore: false };
  const lib = CLUBS[key];
  const idx = new Set(lib.indexed.map((m) => m.scorePlayMediaId));
  const clipped = await clippedMediaIds(orgId);
  const cols = collection ? lib.collections.filter((c) => collKey(c) === collection) : lib.collections.filter((c) => c.kind === "video");
  const assets: LibraryAsset[] = [];
  let hasMore = false;
  for (const c of cols) {
    const r = await sp.mediaSearch({ media_type: c.kind, event_id: c.id }, page, perPage);
    assets.push(...r.data.media.map((m) => toAsset(m, c, idx, clipped)));
    hasMore ||= page < (r.data.total_pages ?? 1);
  }
  // what can be clipped now first (searchable video, any photo); clips uploaded after indexing follow, marked Not indexed
  assets.sort((a, b) => Number(b.kind === "photo" || b.searchable) - Number(a.kind === "photo" || a.searchable));
  return { assets, hasMore };
}

function toAsset(m: sp.SPMedia, c: CollectionDef, idx: Set<number>, clipped: Set<number>): LibraryAsset {
  const caption = (m.description ?? "").replace(/\s+/g, " ").replace(/\(Photo by [^)]*\)/gi, "").replace(/^[A-Z][a-z]+ \d{1,2}, \d{4}, [^:]{1,40}:\s*/, "").trim() || null;
  return {
    id: m.ID, kind: c.kind, name: m.name, caption, durationSec: Math.round(m.duration ?? 0), thumb: m.thumbnail_url ?? null,
    collection: c.name, searchable: c.kind === "video" && idx.has(m.ID), clipped: clipped.has(m.ID),
  };
}

async function clippedMediaIds(orgId: string) {
  const rows = await db.select({ d: s.opportunities.delivery }).from(s.opportunities).where(eq(s.opportunities.orgId, orgId));
  return new Set(rows.map((r) => (r.d as { scoreplay?: { mediaId?: number } } | null)?.scoreplay?.mediaId).filter((x): x is number => !!x));
}

export interface LibraryHit { asset: LibraryAsset; start: number; end: number; rank: number }

/** Live TwelveLabs search over the club's whole index: each hit opens AT the moment, not the start of the file. */
export async function librarySearch(orgId: string, query: string) {
  const q = query.trim().slice(0, 200);
  if (!q) return { ok: true as const, hits: [] as LibraryHit[] };
  const { key } = await keyOf(orgId);
  if (!key) return { ok: false as const, error: "This club has no library" };
  const lib = CLUBS[key];
  try {
    const r = (await searchMoments(lib.indexId, q)) as { data?: SearchHit[] };
    const byVideo = new Map(lib.indexed.map((m) => [m.twelvelabsVideoId, m]));
    const top = (r.data ?? []).filter((h) => byVideo.has(h.video_id) && h.end > h.start).slice(0, 12);
    const clipped = await clippedMediaIds(orgId);
    const idx = new Set(lib.indexed.map((m) => m.scorePlayMediaId));
    const hits = await Promise.all(top.map(async (h) => {
      const clip = byVideo.get(h.video_id)!;
      const c = lib.collections.find((x) => x.name === clip.collection && x.kind === "video") ?? { id: 0, name: clip.collection, kind: "video" as const, group: "Match" as Group };
      let m: sp.SPMedia;
      try { m = (await sp.getMedia(clip.scorePlayMediaId)).data; } catch { m = { ID: clip.scorePlayMediaId, name: clip.name, type: "video", company_id: 0 } as sp.SPMedia; }
      return { asset: toAsset(m, c, idx, clipped), start: h.start, end: h.end, rank: h.rank };
    }));
    return { ok: true as const, hits };
  } catch (e) {
    return { ok: false as const, error: `TwelveLabs search failed: ${(e as Error).message}` };
  }
}

/**
 * Make clip: queue the normal pipeline for one asset. Video = the given window (a search hit) or the first 15s,
 * analysed by Pegasus; photo = a branded card named from the photographer's caption. Lands in the Inbox as a draft.
 */
export async function makeLibraryClip(orgId: string, asset: { id: number; kind: "video" | "photo"; name: string; caption?: string | null; collection: string; durationSec: number }, window?: { start: number; end: number }) {
  try {
    const { org, key } = await keyOf(orgId);
    if (!org || !key) return { ok: false as const, error: "This club has no library" };
    const lib = CLUBS[key];
    if (asset.collection === "Full Match") return { ok: false as const, error: "Clips from the full match are made on the Live match desk" };
    let input: MomentInput;
    const base = { orgKey: key, competition: lib.competition, teamSeasonId: lib.teamSeasonId, scorePlayMediaId: asset.id };
    if (asset.kind === "photo") {
      const caption = asset.caption ?? "";
      input = { ...base, startSec: 0, endSec: 1, headline: headlineFor(caption, org.name) ?? "FROM THE GALLERY", kicker: `${lib.eventLabel} · ${asset.collection}`,
        statLine: caption.length > 140 ? `${caption.slice(0, 137).trimEnd()}...` : caption,
        trigger: { kind: "ai_watchlist", text: `Library: producer picked a ScorePlay photo from ${asset.collection}`, simulated: false, mode: "live" },
        format: { id: "library_pick", label: "Library pick" }, photo: { caption } };
    } else {
      const clip = lib.indexed.find((m) => m.scorePlayMediaId === asset.id);
      if (!clip) return { ok: false as const, error: "This video is not in the club's TwelveLabs index yet, so it cannot be analysed" };
      const start = window ? Math.max(0, window.start) : 0;
      const end = window ? Math.max(start + 1, window.end) : Math.min(asset.durationSec || 15, 15);
      input = { ...base, twelvelabsAssetId: clip.twelvelabsAssetId, startSec: start, endSec: end, headline: "FROM THE LIBRARY", kicker: `${lib.eventLabel} · ${asset.collection}`,
        statLine: `${asset.collection} · ${window ? `search hit ${start.toFixed(1)}-${end.toFixed(1)}s` : "picked by the producer"}`,
        trigger: { kind: "ai_watchlist", text: window ? `Library search hit, ${start.toFixed(1)}-${end.toFixed(1)}s of ${asset.name}` : `Library: producer picked ${asset.name}`, simulated: false, mode: "live" },
        format: { id: "library_pick", label: "Library pick" } };
    }
    const slug = `pick-${key}-${asset.id}-${Math.round(input.startSec)}-${Date.now().toString(36)}`;
    await db.insert(s.jobs).values({ type: "process_moment", payload: { orgId, input, slug }, status: "queued" });
    revalidatePath("/"); revalidatePath("/library");
    return { ok: true as const, message: asset.kind === "photo" ? "Queued: the photo card lands in the Inbox in a few seconds" : "Queued: Pegasus is checking the moment; the draft lands in the Inbox in about 30 seconds" };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

/** "Dominic Solanke of Tottenham Hotspur scores..." -> "SOLANKE"; no single named player -> null */
function headlineFor(caption: string, team: string) {
  const m = caption.match(new RegExp(`^((?:[\\p{Lu}][\\p{L}'.-]*\\s?(?:van |de |der )?)+?)\\s(?:\\((?:L|R|C)\\)\\s)?of ${team}\\b`, "u"))
    ?? caption.match(new RegExp(`^${team} (?:guard|forward|center) ((?:[\\p{Lu}][\\p{L}'.-]*\\s?)+?)(?=\\s[\\p{Ll}])`, "u"));
  if (!m) return null;
  const words = m[1].trim().replace(/ Jr\.$/, "").split(/\s+/);
  return words[words.length - 1].toUpperCase();
}
