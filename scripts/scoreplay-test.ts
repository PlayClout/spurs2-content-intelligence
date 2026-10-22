/**
 * ScorePlay adapter tests (no key needed).
 *   npx tsx scripts/scoreplay-test.ts
 * Part A: fixture mode end-to-end (search -> formats -> rights -> write-back -> read-back -> idempotency).
 * Part B: LIVE request path against a fake transport: asserts exact method/path/headers/body we would send,
 *         error handling (401 hint, 500 never retried, 503 retried), and spec units (offsets s, read-back ms).
 * Part C: request bodies validated against the vendored OpenAPI schemas (property names + types).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };

// ── A: fixture mode ─────────────────────────────────────────────────────────────────────
delete process.env.SCOREPLAY_API_KEY;
const sp = await import("../shared/clients/scoreplay");
const { restrictionsFromScorePlay } = await import("../shared/clients/scoreplay-rights");
const { evaluate } = await import("../shared/compliance");

check(sp.mode() === "fixture", "no key -> fixture mode");
const who = await sp.preflightRights();
check(who.mode === "fixture" && who.canDownload === true, "preflightRights reads whoami (fixture) + can_do_media_download");

const castle = (await sp.tagSearch("Castle")).data.players[0];
check(castle?.ID === 189201, "tagSearch('Castle') resolves player id");

const vids = await sp.mediaSearch({ media_type: "video", players: [castle.ID] });
check(vids.mode === "fixture" && vids.data.media.length === 1 && vids.data.media[0].ID === 46000301, "mediaSearch video+player filters (AND)");
const photos = await sp.mediaSearch({ media_type: "photo", event_id: 321901 });
check(photos.data.media.length === 1 && photos.data.media[0].type === "photo", "mediaSearch photo+event filters");

const fm = await sp.downloadFormats(46000301);
const src = sp.bestSource(fm.data, "video");
const srcPath = src?.file_url ? fileURLToPath(src.file_url) : "";
check(!!src && src.type === "original" && srcPath.endsWith("data/fallback-assets/basketball-broll.mp4"), "bestSource -> original, resolved to repo file");
let readable = false; try { readFileSync(srcPath); readable = true; } catch { /* */ }
check(readable, "fixture source file exists on disk");

// rights
const thfc = (await sp.getMedia(46000302)).data;
const rs = restrictionsFromScorePlay(thfc);
const before = evaluate(["instagram_reel", "x_photo"], rs, new Date("2026-10-23T10:00:00Z"));
check(before.status === "restricted" && before.allowedChannels.length === 2, "THFC asset in window -> restricted (advisory), both channels allowed");
check(before.reasons.some((r) => r.includes("custom_terms")) && before.reasons.some((r) => r.includes('Usage "editorial"')), "reasons cite ScorePlay fields (custom_terms, usage)");
const after = evaluate(["instagram_reel"], rs, new Date("2026-10-25T10:00:00Z"));
check(after.status === "blocked" && after.reasons[0].includes("accessible_until"), "after accessible_until -> blocked, cites field (publish-time re-check)");
const embargo = evaluate(["instagram_reel"], restrictionsFromScorePlay({ ...thfc, accessible_from: 1893456000 }), new Date("2026-10-23T10:00:00Z"));
check(embargo.status === "blocked" && embargo.reasons[0].startsWith("Embargoed until"), "future accessible_from -> embargo block");
const clean = evaluate(["x_photo"], restrictionsFromScorePlay({ ...thfc, usage: "commercial", custom_terms: "", accessible_until: 0 }), new Date());
check(clean.status === "cleared", "no rights fields set -> cleared");

// write-back + read-back + idempotency
const m = { mediaId: 46000301, companyId: 789, startSec: 4.5, endSec: 13.972, ref: "opp-test-1", label: "Castle at the buzzer", tags: ["clout", "game-winner"], playerIds: [189201] };
const w1 = await sp.writeMomentAsVideoLog(m);
check(w1.mode === "fixture" && w1.data.created === true, "fixture write-back creates a log");
const ws = w1.wouldSend as { method: string; path: string; body: ReturnType<typeof sp.buildVideoLogPayload> };
check(ws?.method === "POST" && ws.path === "/video/logs" && ws.body.video_logs[0].log.start_offset === 4.5, "fixture write-back exposes exact wouldSend payload");
const rb = sp.findOurLog((await sp.listVideoLogs(46000301)).data.items, "opp-test-1");
check(rb?.start_timestamp === 4500 && rb?.end_timestamp === 13972, "read-back in ms (spec units)");
const w2 = await sp.writeMomentAsVideoLog(m);
check(w2.data.created === false && w2.data.entry?.id === w1.data.entry?.id, "second write is idempotent (no duplicate log)");
let threw = false; try { sp.buildVideoLogPayload({ ...m, endSec: 4 }); } catch { threw = true; }
check(threw, "end <= start rejected before any network call");

const up = await sp.uploadToEvent(321901, "data/fallback-assets/basketball-broll.mp4", { description: "Clout draft", tags: ["clout"] });
const ups = up.wouldSend as { path: string; body: { name: string } };
check(up.mode === "fixture" && ups.path === "/upload/event/321901?parts=1" && ups.body.name === "basketball-broll.mp4", "fixture upload exposes init call (parts computed from size)");

// ── B: live request path via fake transport ─────────────────────────────────────────────
process.env.SCOREPLAY_API_KEY = "test-key-not-real";
process.env.SCOREPLAY_API_BASE = "https://media.dev.scoreplay.io/v1";
check(sp.mode() === "live", "key set -> live mode");

type Call = { method: string; url: string; headers: Record<string, string>; body?: string };
const calls: Call[] = [];
let script: ((c: Call) => Response)[] = [];
sp.__setFetch((async (url: string | URL | Request, init?: RequestInit) => {
  const c: Call = { method: init?.method ?? "GET", url: String(url), headers: (init?.headers ?? {}) as Record<string, string>, body: init?.body ? String(init.body) : undefined };
  calls.push(c);
  const next = script.shift();
  if (!next) throw new Error(`unexpected call ${c.method} ${c.url}`);
  return next(c);
}) as typeof fetch);
const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

// writes HELD until taxonomy sign-off: live key but SCOREPLAY_WRITES unset -> read happens, NO POST, exact request returned
delete process.env.SCOREPLAY_WRITES;
script = [() => json(200, { items: [], page: 1, limit: 200 })]; // live logs carry no `total`
const held = await sp.writeMomentAsVideoLog({ ...m, ref: "opp-held-1" });
const hs = held.wouldSend as { path: string; held?: string; body: { video_logs: { log: { end_offset: number } }[] } } | undefined;
check(calls.length === 1 && calls[0].method === "GET" && !held.data.created && hs?.path === "/video/logs" && !!hs.held && hs.body.video_logs[0].log.end_offset === 13.972, "live write HELD without SCOREPLAY_WRITES=1: no POST, exact payload returned");
const upHeld = await sp.uploadToEvent(321901, "data/fallback-assets/basketball-broll.mp4", {});
check(calls.length === 1 && upHeld.data.mediaId === null && !!(upHeld.wouldSend as { held?: string }).held, "live upload HELD without SCOREPLAY_WRITES=1: no network call");
calls.length = 0;
script = [() => json(200, { items: [{ id: 5 }], page: 1, limit: 200 })];
const lv = await sp.listVideoLogs(46000301);
check(lv.data.total === 1 && lv.data.items.length === 1, "live logs list: `total` derived when ScorePlay omits it");
calls.length = 0;
process.env.SCOREPLAY_WRITES = "1";

// write-back: list (none) -> POST -> list (ours)
script = [
  () => json(200, { items: [], total: 0, page: 1, limit: 200 }),
  () => json(200, true),
  () => json(200, { items: [{ id: 777, media_id: 46000301, comment: "Castle at the buzzer [clout:opp-live-1]", start_timestamp: 4500, end_timestamp: 13972 }], total: 1, page: 1, limit: 200 }),
];
const live = await sp.writeMomentAsVideoLog({ ...m, ref: "opp-live-1" });
const post = calls[1];
check(calls[0].method === "GET" && calls[0].url === "https://media.dev.scoreplay.io/v1/media/46000301/logs?page=1&limit=200", "live: idempotency read hits GET /media/{id}/logs");
check(post.method === "POST" && post.url === "https://media.dev.scoreplay.io/v1/video/logs", "live: POST /video/logs on configured base");
check(post.headers["X-ScorePlay-Api-Key"] === "test-key-not-real" && post.headers["Content-Type"] === "application/json", "live: auth header + JSON content-type");
const pb = JSON.parse(post.body!);
check(pb.company_id === 789 && pb.video_logs[0].media_id === 46000301 && pb.video_logs[0].log.end_offset === 13.972 && !("external_id" in pb.video_logs[0]), "live: body shape (company_id, media_id, offsets in s, no external_id)");
check(live.data.created && live.data.entry?.id === 777, "live: created entry recovered by marker on read-back");

// 401 -> hint, 500 -> not retried, 503 -> retried once then ok
calls.length = 0;
script = [() => json(401, { message: "UNAUTHORIZED" })];
let e401 = ""; try { await sp.whoami(); } catch (e) { e401 = String((e as Error).message); }
check(e401.includes("401") && e401.includes("whoami"), "live: 401 surfaces with permission hint");
calls.length = 0;
script = [() => json(200, { items: [], total: 0, page: 1, limit: 200 }), () => json(500, { message: "INVALID_PAYLOAD" })];
let e500 = ""; try { await sp.writeMomentAsVideoLog({ ...m, ref: "opp-live-2" }); } catch (e) { e500 = String((e as Error).message); }
check(e500.includes("500") && calls.length === 2, "live: 500 on /video/logs NOT retried (ScorePlay uses 500 for bad payloads)");
calls.length = 0;
script = [() => json(503, { message: "BUSY" }, { "Retry-After": "0" }), () => json(200, { media: [], count: 0 })];
const r503 = await sp.mediaSearch({ media_type: "video" });
check(calls.length === 2 && r503.mode === "live", "live: 503 retried, then succeeds");
check(calls[1].url.endsWith("/media/search?page=1&per_page=50") && calls[1].method === "POST", "live: media search POST with paging query");

// ── C: bodies vs vendored OpenAPI schemas ───────────────────────────────────────────────
const spec = readFileSync("docs/vendor/scoreplay-openapi-2026-10-20.yaml", "utf8");
function schemaProps(name: string): Record<string, string> {
  const start = spec.indexOf(`\n    ${name}:\n`);
  if (start < 0) return {};
  const rest = spec.slice(start + name.length + 7);
  const end = rest.search(/\n    [A-Za-z][A-Za-z0-9]*:\n/);
  const block = end < 0 ? rest : rest.slice(0, end);
  const out: Record<string, string> = {};
  for (const mm of block.matchAll(/\n        ([a-z_]+):\n(?:          [^\n]*\n)*?          type: ([a-z]+)/g)) out[mm[1]] = mm[2];
  for (const mm of block.matchAll(/\n        ([a-z_]+):\n          \$ref:/g)) out[mm[1]] ??= "object";
  return out;
}
const typeOf = (v: unknown) => (Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer|number" : typeof v === "number" ? "number" : typeof v);
function conforms(obj: Record<string, unknown>, schema: string) {
  const props = schemaProps(schema);
  const bad = Object.entries(obj).filter(([k, v]) => !props[k] || !typeOf(v).split("|").includes(props[k]));
  return { ok: Object.keys(props).length > 0 && bad.length === 0, bad, known: Object.keys(props).length };
}
const vl = conforms(pb, "VideoLogPayload");
check(vl.ok, `VideoLogPayload keys/types match spec (${vl.known} props) ${vl.bad.length ? JSON.stringify(vl.bad) : ""}`);
const ve = conforms(pb.video_logs[0], "VideoLog");
check(ve.ok, `VideoLog keys/types match spec ${ve.bad.length ? JSON.stringify(ve.bad) : ""}`);
const ac = conforms(pb.video_logs[0].log, "ActionClip");
check(ac.ok, `ActionClip keys/types match spec ${ac.bad.length ? JSON.stringify(ac.bad) : ""}`);
const cm = conforms(ups.body as Record<string, unknown>, "CreateMediaPayload");
check(cm.ok, `CreateMediaPayload keys/types match spec ${cm.bad.length ? JSON.stringify(cm.bad) : ""}`);
const sm = conforms({ media_type: "video", players: [1], event_id: 1 }, "SearchMediaPayload");
check(sm.ok, `SearchMediaPayload keys/types match spec ${sm.bad.length ? JSON.stringify(sm.bad) : ""}`);

console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
