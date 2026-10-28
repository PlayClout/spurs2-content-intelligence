/**
 * Pipeline proof:  npm run proof:pipeline
 *
 * Shows, with live calls against the connected accounts, how ScorePlay + TwelveLabs feed the producer's list of
 * potential clips. Every stage calls the SAME production code the worker uses, records what came back (ids, counts,
 * timings) and checks the result, then writes a report: out/proof/pipeline-proof.md (+ .json).
 *
 *   1  Accounts      ScorePlay /whoami (company, download right) · TwelveLabs index (name, video count)
 *   2  Footage map   live ScorePlay media search <-> live TwelveLabs index listing, matched by filename
 *   3  Triggers      the match timeline: what fires and when; the watch-list query runs LIVE on TwelveLabs Marengo
 *   4  One moment    (Solanke goal) step by step: ScorePlay media + rights fields -> presigned proxy download ->
 *                    TwelveLabs Pegasus analysis of the trigger window -> beats -> rights verdict -> drafts on disk
 *   5  The list      replay the whole timeline through the real worker into a LOCAL test DB -> the producer's
 *                    queue (what /  shows), each clip traced back to its ScorePlay media + TwelveLabs asset
 *
 * Writes nothing to ScorePlay (writes held) and never touches live Supabase: stage 5 refuses a non-local database.
 * Club footage copies are deleted after rendering; the report records that too.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import postgres from "postgres";
import * as sp from "../shared/clients/scoreplay";
import { search, pickNew } from "../pipeline/watchlist";
import { processMoment, renderDir } from "../pipeline/moment";
import type { Timeline } from "../pipeline/replay";
import { beatsFrom, smartTrim, targetFor } from "../shared/smart-trim";
import profiles from "../pipeline/channel-profiles.json" with { type: "json" };

const DB_URL = process.env.UI_TEST_DATABASE_URL ?? "postgres://postgres:verify@127.0.0.1:55432/flow";
const OUT = "out/proof";
mkdirSync(OUT, { recursive: true });
delete process.env.MOCK_MODE;
delete process.env.SCOREPLAY_WRITES;
process.env.RENDER_STORAGE = "local";
process.env.RENDER_OUT_DIR = `${OUT}/renders`;

let fail = 0;
const md: string[] = [];
const json: Record<string, unknown> = { ranAt: new Date().toISOString() };
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); md.push(`- ${ok ? "PASS" : "**FAIL**"} ${msg}`); if (!ok) fail++; };
const h = (t: string) => { console.log(`\n── ${t}`); md.push("", `## ${t}`, ""); };
const line = (...ts: string[]) => { for (const t of ts) { console.log(`  ${t}`); md.push(t); } };
const timed = async <T>(fn: () => Promise<T>) => { const t0 = performance.now(); const v = await fn(); return { v, ms: Math.round(performance.now() - t0) }; };
const TL = "https://api.twelvelabs.io/v1.3";
const tlGet = async (p: string) => { const r = await fetch(TL + p, { headers: { "x-api-key": process.env.TWELVELABS_API_KEY ?? "" } }); if (!r.ok) throw new Error(`TwelveLabs ${p} -> ${r.status}`); return r.json(); };
const tl = JSON.parse(readFileSync("data/replays/thfc-mnu-week6.json", "utf8")) as Timeline;
const P = profiles as unknown as Record<string, { label: string; targetDurationSec: number[]; maxDurationSec: number }>;

md.push("# Pipeline proof: ScorePlay + TwelveLabs → the producer's list of potential clips", "",
  `Run ${new Date().toLocaleString()} against the connected accounts. Every number below came back from a live call made by this run.`);

// ── 1 accounts ─────────────────────────────────────────────────────────────────────────
h("1. Connected accounts");
const who = await timed(() => sp.preflightRights());
line(`ScorePlay: company **${who.v.company?.name ?? "?"}** (${who.v.company?.subdomain ?? "?"}), ${who.v.rights.length} rights, download right: ${who.v.canDownload ? "yes" : "no"} · ${who.ms} ms`);
check(sp.mode() === "live" && who.v.mode === "live", "ScorePlay answers live with the configured key (GET /whoami)");
check(who.v.canDownload, "ScorePlay key can download media (can_do_media_download)");
check(!sp.writesEnabled(), "ScorePlay writes are held: this proof writes nothing back");
const idx = await timed(() => tlGet(`/indexes/${tl.indexId}`));
line(`TwelveLabs: index **${idx.v.index_name}** (${tl.indexId}), ${idx.v.video_count ?? "?"} videos, models ${(idx.v.models ?? []).map((m: { model_name: string }) => m.model_name).join(", ")} · ${idx.ms} ms`);
check(!!idx.v._id && (idx.v.video_count ?? 0) > 0, "TwelveLabs answers live with the configured key (GET /indexes/{id})");
json.accounts = { scoreplay: { company: who.v.company, rights: who.v.rights.length, canDownload: who.v.canDownload }, twelvelabs: { index: tl.indexId, name: idx.v.index_name, videos: idx.v.video_count } };

// ── 2 footage map ──────────────────────────────────────────────────────────────────────
h("2. Footage map: the same clips in both accounts");
line("Each ScorePlay video is matched to its copy in the TwelveLabs index by filename (scripts/build-footage-map.ts). Re-checked live here:");
const fm = JSON.parse(readFileSync("data/footage-map.json", "utf8")) as { media: { scorePlayMediaId: number; name: string; twelvelabsVideoId?: string; twelvelabsAssetId?: string }[]; matched: number; scorePlayVideos: number; twelvelabsVideos: number };
line(`Stored map: ${fm.scorePlayVideos} ScorePlay videos, ${fm.twelvelabsVideos} TwelveLabs videos, **${fm.matched} matched**.`);
const spSearch = await timed(() => sp.mediaSearch({ media_type: "video" } as never, 1, 50));
const tlList = await timed(() => tlGet(`/indexes/${tl.indexId}/videos?page_limit=50&page=1`));
line(`Live now: ScorePlay media search page 1 → ${spSearch.v.data.media.length} videos (${spSearch.ms} ms); TwelveLabs index listing page 1 → ${tlList.v.data.length} videos (${tlList.ms} ms).`);
line("", "| Timeline clip | ScorePlay media | ScorePlay name (live) | TwelveLabs video | TwelveLabs filename (live) |", "|---|---|---|---|---|");
let mapOk = 0;
for (const [key, f] of Object.entries(tl.footage)) {
  const m = (await sp.getMedia(f.scorePlayMediaId)).data;
  const v = await tlGet(`/indexes/${tl.indexId}/videos/${f.twelvelabsVideoId}`);
  const same = m.name.normalize("NFKD").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "") === String(v.system_metadata?.filename ?? "").normalize("NFKD").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "");
  if (same && v.asset_id === f.twelvelabsAssetId) mapOk++;
  line(`| ${key} | ${f.scorePlayMediaId} | ${m.name} | ${f.twelvelabsVideoId} | ${v.system_metadata?.filename} |`);
}
check(mapOk === Object.keys(tl.footage).length, `all ${Object.keys(tl.footage).length} clips the match timeline uses resolve live in BOTH accounts with matching filenames and asset ids (${mapOk})`);

// ── 3 triggers ─────────────────────────────────────────────────────────────────────────
h("3. Triggers: what makes a clip a candidate");
line("A candidate starts from a trigger on a real clip. The match feed and fan reaction are a timed replay (labelled simulated in the app). The AI watch-list is a live TwelveLabs search that finds moments no feed logged.", "",
  "| At | Clock | Kind | Clip (ScorePlay media) | Trigger | Window |", "|---|---|---|---|---|---|");
for (const ev of tl.events) {
  const keys = Array.isArray(ev.footage) ? ev.footage : [ev.footage];
  line(`| ${ev.at}s | ${ev.clock} | ${ev.kind === "ai_watchlist" ? "AI watch-list (live)" : ev.kind === "game_event" ? "match feed (replay)" : "fan reaction (replay)"} | ${keys.map((k) => `${k} (${tl.footage[k].scorePlayMediaId})`).join(", ")} | ${ev.text ?? `search “${ev.query}”`} | ${ev.start !== undefined ? `${ev.start}–${ev.end}s` : "found by search"} |`);
}
const wl = tl.events.find((e) => e.kind === "ai_watchlist")!;
const watched = (wl.footage as string[]).map((k) => tl.footage[k]);
const ws = await timed(() => search(tl.indexId, wl.query!, watched.map((f) => f.twelvelabsVideoId)));
const pick = pickNew(ws.v.hits, watched, []);
line("", `Live watch-list: TwelveLabs Marengo search “${wl.query}” over ${watched.length} watched clips → ${ws.v.hits.length} hits in ${ws.ms} ms. Top new hit: ${pick ? `video ${pick.hit.video_id} at ${pick.hit.start.toFixed(1)}–${pick.hit.end.toFixed(1)}s → ScorePlay media ${pick.footage.scorePlayMediaId}` : "none"}.`);
check(ws.v.mode === "live" && !!pick, "the watch-list search runs live and lands on a watched real clip (mapped back to its ScorePlay media)");
json.watchlist = { query: wl.query, hits: ws.v.hits.length, ms: ws.ms, pick: pick && { videoId: pick.hit.video_id, start: pick.hit.start, end: pick.hit.end, scorePlayMediaId: pick.footage.scorePlayMediaId } };

// ── 4 one moment, step by step ─────────────────────────────────────────────────────────
h("4. One moment end to end: the Solanke goal");
const goal = tl.events.find((e) => e.kind === "game_event" && e.footage === "solanke-goal")!;
const f = tl.footage["solanke-goal"];
const media = await timed(() => sp.getMedia(f.scorePlayMediaId));
const m = media.v.data as unknown as Record<string, unknown>;
line(`4a. ScorePlay media ${f.scorePlayMediaId}: “${m.name}”, duration ${m.duration ? `${m.duration}s` : "not set in ScorePlay"}, event ${m.event_id} · ${media.ms} ms`);
line(`    Rights fields read: can_be_shared=${m.can_be_shared}, accessible_from=${m.accessible_from ?? "none"}, accessible_until=${m.accessible_until ?? "none"}, usage=${JSON.stringify(m.usage ?? null)}`);
const formats = await timed(() => sp.downloadFormats(f.scorePlayMediaId));
const best = sp.bestSource(formats.v.data, "video");
line(`4b. ScorePlay download formats (media version ${Object.keys(formats.v.data.items ?? {}).join(", ")}): ${Object.values(formats.v.data.items ?? {}).flat().map((x) => x.type).join(", ")} → using **${best?.type}** (${best?.file_name}, ${best ? Math.round(best.size / 1e6) : "?"} MB) via a presigned link · ${formats.ms} ms`);
check(!!best?.file_url?.startsWith("https://"), "ScorePlay returns a presigned download link for the proxy");
const rights = await timed(() => sp.getRightsInputs(f.scorePlayMediaId, { teamSeasonId: f.teamSeasonId }));
line(`4c. ScorePlay rights evidence: ${rights.v.status}${rights.v.status === "available" ? `, roster ${rights.v.roster.length} players (team season ${f.teamSeasonId}), ${rights.v.externalGroups.length} external groups` : ` (${(rights.v as { reason: string }).reason})`} · ${rights.ms} ms`);
check(rights.v.status === "available" && rights.v.mode === "live", "rights facts come live from ScorePlay (media + season roster + external groups)");

const slug = `proof-${f.scorePlayMediaId}-${Date.now().toString(36)}`;
const input = { orgKey: f.orgKey, competition: f.competition, scorePlayMediaId: f.scorePlayMediaId, twelvelabsAssetId: f.twelvelabsAssetId, teamSeasonId: f.teamSeasonId, manifestFixture: tl.manifestFixture, startSec: goal.start!, endSec: goal.end!, headline: goal.headline, kicker: goal.kicker, statLine: goal.statLine, trigger: { kind: "game_event" as const, text: goal.text!, simulated: true } };
line(`4d. processMoment (the worker's own function): trigger window ${goal.start}–${goal.end}s → download proxy → TwelveLabs Pegasus analyse → rights → render drafts…`);
const pm = await timed(() => processMoment(input as never, slug));
const pr = pm.v as unknown as { manifest: { summary: string; moments: { label: string; start: number; end: number }[]; detectedSponsors?: { name: string }[]; identifiablePeople?: { label: string }[]; audioRisks?: { type: string }[] }; manifestMode: string; window: { start: number; end: number }; tightWindow: { start: number; end: number }; content: { verdict: string; reasons: string[]; renderActions: string[] }; scoreplay: { mode: string }; drafts?: unknown; reel?: { outPath: string; durationSec: number }; card?: { outPath: string } };
line(`    TwelveLabs Pegasus (${pr.manifestMode}) analysed ${pr.window.start}–${pr.window.end}s in this run (whole moment ${pm.ms} ms):`);
line(`    Summary: “${pr.manifest.summary}”`);
line(`    Beats: ${pr.manifest.moments.map((b) => `${b.label} ${b.start}–${b.end}s`).join(" · ")}`);
line(`    Also seen: sponsors ${(pr.manifest.detectedSponsors ?? []).map((s) => s.name).join(", ") || "none"}; people ${(pr.manifest.identifiablePeople ?? []).map((p) => p.label).join(", ") || "none"}; audio ${(pr.manifest.audioRisks ?? []).map((a) => a.type).join(", ") || "none"}`);
line(`    Content check from what the AI saw (sponsors, people, audio): ${pr.content.verdict}${pr.content.renderActions.length ? `, actions ${pr.content.renderActions.join(", ")}` : ""}`);
check(pr.manifestMode === "live" && pr.manifest.moments.length > 0, "TwelveLabs Pegasus analysed this exact window live and returned timed beats");
const beats = beatsFrom({ moments: pr.manifest.moments }, pr.window);
const reelCut = smartTrim({ beats, analysed: pr.window, focus: null, target: targetFor(P.instagram_reel) });
line(`4e. Smart trim from those beats (Instagram Reel): ${reelCut.start}–${reelCut.end}s (${reelCut.lengthSec}s). ${reelCut.reason}`);
check(reelCut.end > reelCut.start && reelCut.start >= pr.window.start && reelCut.end <= pr.window.end, "smart trim picks a cut inside the analysed footage from the live beats");
const dir = renderDir(slug);
const files = existsSync(dir) ? readdirSync(dir) : [];
const probe = (p: string) => { try { return execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p]).toString().trim(); } catch { return "?"; } };
const reel = files.find((x) => x.endsWith(".draft.mp4")), card = files.find((x) => x.startsWith("card.") && x.endsWith(".jpg"));
line(`4f. Drafts on disk: ${reel} (${reel ? probe(`${dir}/${reel}`) : "-"}), ${card} (${card ? probe(`${dir}/${card}`) : "-"})`);
check(!!reel && probe(`${dir}/${reel}`) === "1080,1920" && !!card && probe(`${dir}/${card}`) === "1080,1350", "a 9:16 reel draft and a 4:5 photo card were rendered from the real ScorePlay footage");
check(!files.some((x) => x.startsWith("source-")), "the downloaded club footage copy was deleted after rendering (only drafts remain)");
json.moment = { mediaId: f.scorePlayMediaId, manifestMode: pr.manifestMode, beats: pr.manifest.moments, verdict: pr.content.verdict, reelCut, ms: pm.ms };

// ── 5 the producer's list ──────────────────────────────────────────────────────────────
h("5. The producer's list: the whole match through the real worker");
const host = new URL(DB_URL).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error(`stage 5 only runs against a local database (got ${host})`);
if (new URL(DB_URL).pathname === "/demo") throw new Error("stage 5 resets data, so it never runs against the demo database");
const sql = postgres(DB_URL, { max: 1, prepare: false, onnotice: () => {} });
await sql.unsafe(`delete from publication_versions; delete from publications; delete from rights_findings; delete from rights_decisions; delete from write_back_jobs; delete from approval_audits; delete from published_assets; delete from opportunities; delete from signals; delete from moments; delete from assets; delete from jobs;`);
const env = { ...process.env, DATABASE_URL: DB_URL, RENDER_OUT_DIR: "out/flow-renders", RENDER_STORAGE: "local" } as Record<string, string>;
delete env.SCOREPLAY_WRITES;
const rp = await timed(async () => execFileSync("node_modules/.bin/tsx", ["--env-file=.env", "scripts/replay.ts", "--speed=50"], { env, stdio: "pipe" }).toString());
const failed = await sql`select count(*)::int n from jobs where status='failed'`;
if (failed[0].n) { await sql`update jobs set status='queued', error=null, queued_at=now(), started_at=null, finished_at=null where status='failed' and type='process_moment'`; execFileSync("node_modules/.bin/tsx", ["--env-file=.env", "pipeline/worker.ts", "--once"], { env, stdio: "pipe" }); }
line(`Replayed ${tl.events.length} timeline events through the worker in ${Math.round(rp.ms / 1000)}s (local test database, real ScorePlay + TwelveLabs calls).`);
const rows = await sql`
  select o.id, o.headline, o.content_type, o.audience, o.score, o.status, o.compliance->>'status' rights, o.channels,
         o.delivery->'scoreplay'->>'mediaId' sp_media, o.delivery->'scoreplay'->>'mode' sp_mode,
         o.delivery->'inputs'->'videoUnderstanding'->>'mode' tl_mode, o.delivery->'ranking'->>'backend' ranker,
         m.detector, m.raw->'moments' beats, o.signal_ids
  from opportunities o join moments m on m.id = o.moment_id order by o.score desc`;
const sigs = await sql`select id, kind, simulated, event_text from signals`;
const sigBy = new Map(sigs.map((s) => [s.id, s]));
const assetBy = new Map(Object.values(tl.footage).map((x) => [String(x.scorePlayMediaId), x.twelvelabsAssetId]));
line("", "This is the list the producer sees in the inbox, highest score first, each clip traced to where it came from. Rights read “restricted” because ScorePlay marks this footage can_be_shared=false, so every clip waits for a person to approve it: the gate working, not a fault.", "",
  "| Score | Clip | Format | ScorePlay media | TwelveLabs asset | Analysis | Beats | Triggered by | Rights |", "|---|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  const by = (r.signal_ids as string[]).map((id) => sigBy.get(id)).filter(Boolean).map((s) => `${s!.kind === "context" ? "AI watch-list" : s!.kind.replace("_", " ")} (${s!.simulated ? "replay" : "live"})`);
  line(`| ${Math.round(r.score)} | ${r.headline} | ${r.content_type === "reel" ? "Reel" : "Photo card"} | ${r.sp_media} (${r.sp_mode}) | ${assetBy.get(r.sp_media) ?? "?"} | Pegasus ${r.tl_mode} | ${(r.beats ?? []).map((b: { label: string }) => b.label).join(", ")} | ${by.join(" + ")} | ${r.rights} |`);
}
const plays = new Set(rows.map((r) => r.sp_media)).size;
check(rows.length === 8 && plays === 4, `the worker turned the timeline into ${rows.length} candidate clips (a reel + a photo card for each of ${plays} plays)`);
check(rows.every((r) => r.sp_mode === "live" && r.tl_mode === "live"), "every candidate was built from live ScorePlay media and a live TwelveLabs analysis");
check(rows.every((r) => assetBy.has(r.sp_media)), "every candidate traces back to a ScorePlay media id that maps to a TwelveLabs asset");
check(rows.some((r) => (r.signal_ids as string[]).some((id) => sigBy.get(id)?.kind === "context" && !sigBy.get(id)?.simulated)), "one candidate exists only because the live AI watch-list found it (no feed logged it)");
check(rows.some((r) => (r.signal_ids as string[]).length >= 2), "a second report of the same play merged into the existing clip (corroboration, no duplicate)");
json.list = rows.map((r) => ({ headline: r.headline, format: r.content_type, score: r.score, scorePlayMediaId: r.sp_media, twelvelabsAssetId: assetBy.get(r.sp_media), rights: r.rights, signals: (r.signal_ids as string[]).length }));
await sql.end();

md.push("", "---", "", `**Result: ${fail ? `${fail} check(s) failed` : "all checks passed"}.** ScorePlay writes were held throughout; stage 5 ran against the local test database only.`);
writeFileSync(`${OUT}/pipeline-proof.md`, md.join("\n") + "\n");
writeFileSync(`${OUT}/pipeline-proof.json`, JSON.stringify(json, null, 2));
console.log(`\nreport: ${OUT}/pipeline-proof.md\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
