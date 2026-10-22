/**
 * ScorePlay key preflight — run the minute a key is issued (Thursday briefing).
 *   SCOREPLAY_API_KEY=... npx tsx scripts/scoreplay-preflight.ts            # read-only probes
 *   SCOREPLAY_API_KEY=... npx tsx scripts/scoreplay-preflight.ts --record   # + save responses as fixtures
 *   ... --write-test <mediaId>                                              # + ONE video log write, read back, then DELETE it
 * Env: SCOREPLAY_API_BASE (default prod; dev = https://media.dev.scoreplay.io/v1).
 * Never prints the key. Recorded fixtures go to data/fallback-assets/fixtures/scoreplay-recorded/ (review before commit:
 * they may contain the org's real media names/urls; presigned urls expire in 24h).
 */
import { mkdir, writeFile } from "node:fs/promises";

if (!process.env.SCOREPLAY_API_KEY) { console.error("SCOREPLAY_API_KEY not set (this preflight is live-only)."); process.exit(2); }
delete process.env.MOCK_MODE;
const sp = await import("../shared/clients/scoreplay");
const args = process.argv.slice(2);
const record = args.includes("--record");
const wIdx = args.indexOf("--write-test");
const writeMedia = wIdx >= 0 ? Number(args[wIdx + 1]) : 0;
const OUT = "data/fallback-assets/fixtures/scoreplay-recorded";
const rec = async (name: string, data: unknown) => { if (record) { await mkdir(OUT, { recursive: true }); await writeFile(`${OUT}/${name}.json`, JSON.stringify(data, null, 2)); } };

const step = async <T>(name: string, fn: () => Promise<T>): Promise<T | null> => {
  const t0 = performance.now();
  try { const r = await fn(); console.log(`PASS  ${name} (${Math.round(performance.now() - t0)}ms)`); return r; }
  catch (e) { console.log(`FAIL  ${name}: ${(e as Error).message}`); return null; }
};

console.log(`base: ${process.env.SCOREPLAY_API_BASE || sp.DEFAULT_BASE}`);
const pre = await step("GET /whoami", () => sp.preflightRights());
if (pre) {
  console.log(`      company=${pre.company?.name ?? "none"} rights=[${pre.rights.join(", ")}]`);
  console.log(`      scope teams=${JSON.stringify(pre.scope.team_ids)} sponsor=${pre.scope.sponsor_id} onlyShared=${pre.scope.only_shared_content} requireValidation=${pre.scope.require_validation}`);
  console.log(`      canDownload=${pre.canDownload}  (write permissions undocumented; use --write-test)`);
  await rec("whoami", { ...pre });
}
const vids = await step("POST /media/search {media_type: video}", () => sp.mediaSearch({ media_type: "video" }, 1, 10));
const phot = await step("POST /media/search {media_type: photo}", () => sp.mediaSearch({ media_type: "photo" }, 1, 10));
if (vids) { console.log(`      videos: count=${vids.data.count} first=${vids.data.media.slice(0, 3).map((m) => `${m.ID}:${m.name}`).join(" | ")}`); await rec("media-search-video", vids.data); }
if (phot) { console.log(`      photos: count=${phot.data.count}`); await rec("media-search-photo", phot.data); }

const first = vids?.data.media[0];
if (first) {
  const rights = { usage: first.usage, custom_terms: first.custom_terms, accessible_from: first.accessible_from, accessible_until: first.accessible_until, validated: first.validated, can_be_shared: first.can_be_shared, drms: first.external_accounts_drms?.length ?? 0 };
  console.log(`      rights fields on ${first.ID}: ${JSON.stringify(rights)}  <- are these populated for real?`);
  const fm = await step(`GET /media/${first.ID}/formats/download`, () => sp.downloadFormats(first.ID));
  if (fm) {
    const best = sp.bestSource(fm.data, "video");
    console.log(`      best source: ${best ? `${best.type} ${best.mime_type} ${(best.size / 1e6).toFixed(1)}MB presigned=${!!best.file_url}` : "NONE (no downloadable file)"}`);
    await rec(`formats-${first.ID}`, fm.data);
  }
  const logs = await step(`GET /media/${first.ID}/logs`, () => sp.listVideoLogs(first.ID));
  if (logs) { console.log(`      existing video logs: ${logs.data.total} (data-feed actions present? ${logs.data.total > 0})`); await rec(`logs-${first.ID}`, logs.data); }
}
await step("GET /tag/search?query=goal", async () => { const t = await sp.tagSearch("goal"); await rec("tag-search-goal", t.data); return t; });

if (writeMedia) {
  const companyId = (await sp.getMedia(writeMedia)).data.company_id;
  const ref = `preflight-${Date.now()}`;
  const w = await step(`WRITE TEST POST /video/logs on media ${writeMedia}`, () => sp.writeMomentAsVideoLog({ mediaId: writeMedia, companyId, startSec: 1, endSec: 3, ref, label: "Spursx2 AI preflight test (safe to delete)" }));
  if (w?.data.entry) {
    console.log(`      created log id=${w.data.entry.id}; read back ${w.data.entry.start_timestamp}-${w.data.entry.end_timestamp}ms`);
    const base = (process.env.SCOREPLAY_API_BASE || sp.DEFAULT_BASE).replace(/\/$/, "");
    const del = await fetch(`${base}/media/${writeMedia}/logs`, { method: "DELETE", headers: { "X-ScorePlay-Api-Key": process.env.SCOREPLAY_API_KEY!, "Content-Type": "application/json" }, body: JSON.stringify({ log_ids: [w.data.entry.id] }) });
    console.log(`${del.ok ? "PASS" : "FAIL"}  cleanup DELETE /media/${writeMedia}/logs -> ${del.status}`);
  } else if (w) console.log("      POST returned true but our log was not found on read-back: check marker/comment handling");
}
console.log(record ? `\nrecorded to ${OUT}/ (review before committing)` : "\n(read-only run; add --record to save fixtures)");
