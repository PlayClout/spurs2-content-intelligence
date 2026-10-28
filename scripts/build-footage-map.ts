/**
 * Footage map: every ScorePlay video matched to its TwelveLabs copy (same platform content, "already indexed and
 * mapped to Twelve Labs"). Match key = normalized filename. Output: data/footage-map.json (ids + names only, no media).
 *   npx tsx --env-file=.env scripts/build-footage-map.ts
 */
import { writeFile } from "node:fs/promises";

const SP = "https://media.scoreplay.io/v1";
const TL = "https://api.twelvelabs.io/v1.3";
const TL_INDEX = process.env.TWELVELABS_INDEX_ID ?? "6ad90f31960d8ea7bdd040ab"; // official hackathon index "premiere-league"
const spGet = async (p: string, body?: unknown) =>
  (await fetch(SP + p, { method: body ? "POST" : "GET", headers: { "X-ScorePlay-Api-Key": process.env.SCOREPLAY_API_KEY!, "Content-Type": "application/json" }, body: body && JSON.stringify(body) })).json();
const tlGet = async (p: string) => (await fetch(TL + p, { headers: { "x-api-key": process.env.TWELVELABS_API_KEY! } })).json();
const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "");

const events: any[] = await spGet("/event/search", { sub_and_master: true });
const evName = new Map(events.map((e) => [e.ID, e.name]));
const sp: any[] = [];
for (let page = 1; ; page++) {
  const r = await spGet(`/media/search?page=${page}&per_page=50`, { media_type: "video" });
  sp.push(...(r.media ?? []));
  if ((r.media ?? []).length < 50) break;
}
const tl: any[] = [];
for (let page = 1; ; page++) {
  const r = await tlGet(`/indexes/${TL_INDEX}/videos?page_limit=50&page=${page}`);
  tl.push(...r.data);
  if (page >= r.page_info.total_page) break;
}
const tlByName = new Map<string, any>();
for (const v of tl) tlByName.set(norm(v.system_metadata.filename), v);

const media = [];
for (const m of sp) {
  const v = tlByName.get(norm(m.name));
  const assetId = v ? (await tlGet(`/indexes/${TL_INDEX}/videos/${v._id}`)).asset_id : undefined;
  media.push({
    scorePlayMediaId: m.ID, name: m.name, durationSec: m.duration, collection: evName.get(m.event_id) ?? m.event_id,
    ...(v ? { twelvelabsVideoId: v._id, twelvelabsAssetId: assetId } : {}),
  });
}
const matched = media.filter((m) => m.twelvelabsVideoId).length;
await writeFile("data/footage-map.json", JSON.stringify({ generatedAt: new Date().toISOString(), twelvelabsIndexId: TL_INDEX, scorePlayVideos: sp.length, twelvelabsVideos: tl.length, matched, media }, null, 2) + "\n");
console.log(`ScorePlay videos ${sp.length} · TwelveLabs videos ${tl.length} · matched ${matched}`);
const unmatchedTl = tl.filter((v) => !sp.some((m) => norm(m.name) === norm(v.system_metadata.filename)));
console.log(`TwelveLabs videos with no ScorePlay match: ${unmatchedTl.length}`, unmatchedTl.map((v) => v.system_metadata.filename).join(" | "));
console.log(`ScorePlay videos with no TwelveLabs copy, by collection:`, Object.entries(media.filter((m) => !m.twelvelabsVideoId).reduce((a: any, m) => ((a[m.collection] = (a[m.collection] ?? 0) + 1), a), {})));
