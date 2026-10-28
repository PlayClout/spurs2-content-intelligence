/**
 * Index a club's ScorePlay videos into that club's OWN TwelveLabs index (one club per index: footage never mixes).
 * Uploads by URL (TwelveLabs fetches from ScorePlay's presigned link; nothing is copied to this machine), then writes
 * data/footage-map-<club>.json (ids + names only). Idempotent: videos already in the map are skipped.
 *   npx tsx --env-file=.env scripts/index-club-footage.ts san-antonio-spurs 1536844 1536708
 *   (club key, then the ScorePlay collection/event ids to index)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as sp from "../shared/clients/scoreplay";

const [club, ...collections] = process.argv.slice(2);
if (!club || !collections.length) throw new Error("usage: index-club-footage.ts <club-key> <scoreplay-collection-id>...");
const TL = "https://api.twelvelabs.io/v1.3";
const tl = async (p: string, init: RequestInit = {}) => {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(TL + p, { ...init, headers: { "x-api-key": process.env.TWELVELABS_API_KEY!, ...init.headers } });
    if (r.status === 429 && attempt < 5) { await new Promise((ok) => setTimeout(ok, Number(r.headers.get("Retry-After") ?? 5) * 1000)); continue; }
    const t = await r.text();
    if (!r.ok) throw new Error(`TwelveLabs ${p} -> ${r.status}: ${t.slice(0, 200)}`);
    return JSON.parse(t);
  }
};
const wait = async <T>(fn: () => Promise<T & { status: string }>, everyMs: number, what: string) => {
  for (let i = 0; i < 120; i++) {
    const s = await fn();
    if (s.status === "ready") return s;
    if (s.status === "failed") throw new Error(`${what} failed`);
    await new Promise((ok) => setTimeout(ok, everyMs));
  }
  throw new Error(`${what} timed out`);
};

const indexName = `club-${club}`;
const existing = (await tl("/indexes?page_limit=50")).data?.find((x: { index_name: string }) => x.index_name === indexName);
const indexId: string = existing?._id ?? (await tl("/indexes", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ index_name: indexName, models: [{ model_name: "marengo3.0", model_options: ["visual", "audio"] }] }) }))._id;

const out = `data/footage-map-${club}.json`;
type Entry = { scorePlayMediaId: number; name: string; durationSec: number; collection: string; twelvelabsVideoId: string; twelvelabsAssetId: string };
const prev: { media: Entry[] } = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : { media: [] };
const done = new Set(prev.media.map((m) => m.scorePlayMediaId));
const media = [...prev.media];
const save = () => writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), club, twelvelabsIndexId: indexId, collections: collections.map(Number), media }, null, 2) + "\n");

const todo: sp.SPMedia[] = [];
// collection names come from the event list: a media record's embedded event name is empty on ScorePlay
const events: { ID: number; name: string }[] = await (await fetch("https://media.scoreplay.io/v1/event/search", { method: "POST",
  headers: { "X-ScorePlay-Api-Key": process.env.SCOREPLAY_API_KEY!, "Content-Type": "application/json" }, body: JSON.stringify({ sub_and_master: true }) })).json();
const collectionName = new Map(events.map((e) => [e.ID, e.name]));
for (const ev of collections.map(Number)) {
  for (let page = 1; page < 20; page++) {
    const r = await sp.mediaSearch({ media_type: "video", event_id: ev }, page, 50);
    todo.push(...r.data.media.filter((m) => !done.has(m.ID)));
    if (page >= (r.data.total_pages ?? 1)) break;
  }
}
console.log(`index ${indexName} (${indexId}): ${done.size} already indexed, ${todo.length} to go`);

const one = async (m: sp.SPMedia) => {
  const fm = await sp.downloadFormats(m.ID);
  const files = Object.values(fm.data.items).flat().filter((f) => f.file_url && f.size !== -1);
  const f = files.find((x) => x.type === "original") ?? files[0];
  if (!f?.file_url) throw new Error(`no downloadable file for ${m.ID}`);
  const form = new FormData();
  form.append("method", "url");
  form.append("url", f.file_url);
  const asset = await tl("/assets", { method: "POST", body: form });
  await wait(() => tl(`/assets/${asset._id}`), 3000, `asset ${m.ID}`);
  const ia = await tl(`/indexes/${indexId}/indexed-assets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asset_id: asset._id }) });
  await wait(() => tl(`/indexes/${indexId}/indexed-assets/${ia._id}`), 5000, `index ${m.ID}`);
  const ev = collectionName.get(m.event_id ?? -1) ?? String(m.event_id);
  media.push({ scorePlayMediaId: m.ID, name: m.name, durationSec: Number((m as { video?: { duration?: number } }).video?.duration ?? m.duration ?? 0), collection: ev, twelvelabsVideoId: ia._id, twelvelabsAssetId: asset._id });
  save();
  console.log(`  ok ${m.ID} ${m.name}`);
};
const queue = [...todo];
const failures: string[] = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let m = queue.shift(); m; m = queue.shift()) await one(m).catch((e) => failures.push(`${m!.ID}: ${(e as Error).message}`));
}));
save();
console.log(`done: ${media.length} indexed in ${indexName}${failures.length ? `, ${failures.length} failed:\n  ${failures.join("\n  ")}` : ""}`);
