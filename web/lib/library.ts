"use server";

/**
 * Library run (server): fill a club's inbox from its ScorePlay LIBRARY when there is no full match to watch. Every pick
 * is real: video formats run a live TwelveLabs search over the club's own index, scoped to one ScorePlay collection;
 * photo formats come from the club photographer's captions in ScorePlay. Picks are queued as process_moment jobs, a
 * few seconds apart, and the normal worker drafts, rights-checks and packages them like any other clip.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import * as sp from "@shared/clients/scoreplay";
import { searchMoments } from "@shared/clients/twelvelabs";
import { pickVideos, pickPhotos, interleave, type LibraryPlan, type IndexedClip, type SearchHit, type PhotoItem } from "@shared/library";
import type { MomentInput } from "@pipeline/moment";
import saPlan from "../../data/library/san-antonio-spurs.json" with { type: "json" };
import saMap from "../../data/footage-map-san-antonio-spurs.json" with { type: "json" };
import thfcPlan from "../../data/library/tottenham-hotspur.json" with { type: "json" };
import thfcMap from "../../data/footage-map.json" with { type: "json" };
import themes from "../../pipeline/club-themes.json" with { type: "json" };

// Tottenham's map lists every video on the shared ScorePlay account; only the ones in its own TwelveLabs index count
const indexed = (media: Partial<IndexedClip>[]) => media.filter((m): m is IndexedClip => !!m.twelvelabsVideoId && !!m.twelvelabsAssetId);
const LIBRARIES: Record<string, { plan: LibraryPlan; indexId: string; clips: IndexedClip[] }> = {
  "san-antonio-spurs": { plan: saPlan as unknown as LibraryPlan, indexId: saMap.twelvelabsIndexId, clips: indexed(saMap.media) },
  "tottenham-hotspur": { plan: thfcPlan as unknown as LibraryPlan, indexId: thfcMap.twelvelabsIndexId, clips: indexed(thfcMap.media) },
};
const STAGGER_SEC = 4; // picks land in the inbox one after another, not as one block

const orgKeyOf = (name: string) => Object.entries(themes as Record<string, { displayName?: string }>).find(([, t]) => t.displayName === name)?.[0];

/** Which kind of run this club supports: a live match (full-match footage) or its library. */
export async function libraryFor(orgName: string) {
  const key = orgKeyOf(orgName);
  return key && LIBRARIES[key] ? { formats: LIBRARIES[key].plan.formats.map((f) => f.label) } : null;
}

export async function runLibrary(orgId: string) {
  try {
    const [org] = await db.select().from(s.orgs).where(eq(s.orgs.id, orgId));
    const key = org && orgKeyOf(org.name);
    const lib = key ? LIBRARIES[key] : undefined;
    if (!org || !key || !lib) return { ok: false as const, error: "This club has no library plan" };
    const { plan } = lib;

    const takenPlays = new Set<string>();
    const takenPhotos = new Set<number>();
    const photoCache = new Map<number, PhotoItem[]>();
    const groups: MomentInput[][] = [];
    for (const f of plan.formats) {
      if (f.queries) {
        const pool = lib.clips.filter((c) => c.collection === f.collection).map((c) => c.twelvelabsVideoId);
        const results = await Promise.all(f.queries.map(async (q) => ({ q, hits: (((await searchMoments(lib.indexId, q.query, pool)) as { data?: SearchHit[] }).data ?? []) })));
        groups.push(pickVideos(f, results, lib.clips, takenPlays).map((p) => ({
          orgKey: key, competition: plan.competition, teamSeasonId: plan.teamSeasonId, scorePlayMediaId: p.clip.scorePlayMediaId, twelvelabsAssetId: p.clip.twelvelabsAssetId,
          startSec: p.start, endSec: p.end, headline: p.headline, kicker: `${plan.eventLabel} · ${f.label}`, statLine: `${p.label} · from ${f.collection}`,
          trigger: { kind: "ai_watchlist", text: `TwelveLabs search "${p.query}" over ${f.collection}: hit #${p.rank}, ${p.start.toFixed(1)}-${p.end.toFixed(1)}s of ${p.clip.name}`, simulated: false, mode: "live" },
          format: { id: f.id, label: f.label },
        })));
      } else if (f.photo) {
        const cid = f.photoCollectionId ?? plan.photoCollectionId;
        if (!photoCache.has(cid)) photoCache.set(cid, await allPhotos(cid));
        groups.push(pickPhotos(f, photoCache.get(cid)!, takenPhotos, plan.eventLabel, plan.team).map((p) => ({
          orgKey: key, competition: plan.competition, teamSeasonId: plan.teamSeasonId, scorePlayMediaId: p.photo.ID, startSec: 0, endSec: 1,
          headline: p.headline, kicker: `${plan.eventLabel} · ${f.label}`, statLine: p.statLine,
          trigger: { kind: "ai_watchlist", text: `ScorePlay ${f.collection}: picked from the club photographer's caption`, simulated: false, mode: "live" },
          format: { id: f.id, label: f.label }, photo: { caption: p.photo.description ?? "" },
        })));
      }
    }
    const inputs = interleave(groups);
    const now = Date.now();
    for (const [i, input] of inputs.entries()) {
      await db.insert(s.jobs).values({ type: "process_moment", payload: { orgId, input, slug: `lib-${key}-${input.scorePlayMediaId}-${Math.round(input.startSec)}` }, status: "queued", queuedAt: new Date(now + i * STAGGER_SEC * 1000) });
    }
    revalidatePath("/");
    const counts = plan.formats.map((f, i) => `${groups[i].length} ${f.label.toLowerCase()}`).join(", ");
    return { ok: true as const, message: `Queued ${inputs.length} from the ${org.name} library: ${counts}` };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

async function allPhotos(eventId: number): Promise<PhotoItem[]> {
  const out: PhotoItem[] = [];
  for (let page = 1; page < 20; page++) {
    const r = await sp.mediaSearch({ media_type: "photo", event_id: eventId }, page, 50);
    out.push(...r.data.media.map((m) => ({ ID: m.ID, description: (m as { description?: string }).description })));
    if (page >= (r.data.total_pages ?? 1)) break;
  }
  return out;
}
