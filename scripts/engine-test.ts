/**
 * Engine unit tests (no DB, no network): copy, ranking, watch-list selection, replay timing.
 *   npx tsx scripts/engine-test.ts
 */
import { readFileSync } from "node:fs";
import { templateCopy, generateCopy, __setCopyFetch } from "../shared/copy";
import { overlapRatio, pickNew, SAME_PLAY, type Footage } from "../pipeline/watchlist";
import { runTimeline, type Timeline } from "../pipeline/replay";

process.env.DATABASE_URL ??= "postgres://unused@127.0.0.1:1/none"; // worker module builds a lazy client at import; never queried here
const { rank } = await import("../pipeline/worker");

let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
const profiles = JSON.parse(readFileSync("pipeline/channel-profiles.json", "utf8")) as Record<string, { copy?: { maxChars: number } }>;
const base = { orgKey: "san-antonio-spurs", audience: "casual", headline: "Castle at the buzzer", kicker: "Spurs 112 · Thunder 110 · Q4 0:00.3", statLine: "Game-winning dunk with 0.3 left · SIMULATED game data" };

// ── copy ───────────────────────────────────────────────────────────────────────────────
const chans = ["instagram_reel", "tiktok", "youtube_short", "x_photo", "instagram_story"];
const t = templateCopy({ ...base, channels: chans });
check(chans.every((c) => typeof t[c] === "string"), "template: one post per channel");
check(chans.every((c) => !profiles[c].copy?.maxChars || t[c].length <= profiles[c].copy!.maxChars), "template: every post within its channel char limit");
check(t.instagram_story === "", "template: story (maxChars 0) publishes without copy");
check(!Object.values(t).some((x) => /simulated/i.test(x)), "template: UI honesty labels ('SIMULATED game data') never leak into post copy");
check(!Object.values(t).some((x) => /[\u2014\u2013]/.test(x)) && t.x_photo.includes("#GoSpursGo"), "template: no em/en dashes; club hashtag present");
check(templateCopy({ ...base, orgKey: "tottenham-hotspur", channels: ["x_photo"] }).x_photo.includes("#COYS"), "template: per-club hashtag (#COYS)");

const saved = { key: process.env.ANTHROPIC_API_KEY, mock: process.env.MOCK_MODE };
process.env.ANTHROPIC_API_KEY = "test-not-real"; delete process.env.MOCK_MODE;
let body: { model?: string; system?: string } = {};
__setCopyFetch((async (_u: unknown, init?: RequestInit) => {
  body = JSON.parse(String(init?.body));
  const long = "A".repeat(400);
  return new Response(JSON.stringify({ content: [{ type: "text", text: "```json\n" + JSON.stringify({ x_photo: `Castle \u2014 at the buzzer ${long}`, instagram_reel: "Castle at the buzzer #GoSpursGo", instagram_story: "ignored" }) + "\n```" }] }), { status: 200 });
}) as typeof fetch);
const h = await generateCopy({ ...base, channels: ["x_photo", "instagram_reel", "instagram_story"] });
check(h.backend === "haiku" && body.model === h.model && /ONLY the facts/.test(body.system ?? ""), "haiku: request carries model + facts-only system prompt");
check(h.copy.x_photo.length <= 280 && !/[\u2014]/.test(h.copy.x_photo), "haiku: output clamped to limit and de-dashed");
check(h.copy.instagram_story === "", "haiku: maxChars-0 channel forced empty");
__setCopyFetch((async () => new Response("overloaded", { status: 529 })) as typeof fetch);
const fb = await generateCopy({ ...base, channels: ["x_photo"] });
check(fb.backend === "template" && /529/.test(fb.error ?? "") && fb.copy.x_photo.length > 0, "haiku failure -> template fallback with recorded reason");
__setCopyFetch((async () => new Response(JSON.stringify({ content: [{ type: "text", text: '{"x_photo": "ok"}' }] }))) as typeof fetch);
check((await generateCopy({ ...base, channels: ["x_photo", "tiktok"] })).backend === "template", "haiku missing a channel -> template fallback (never a half-filled card)");
process.env.ANTHROPIC_API_KEY = saved.key ?? ""; if (!saved.key) delete process.env.ANTHROPIC_API_KEY; if (saved.mock) process.env.MOCK_MODE = saved.mock;

// ── ranking ────────────────────────────────────────────────────────────────────────────
const game = { kind: "game_event" as const, text: "x", simulated: true };
const social = { kind: "social_reaction" as const, text: "y", simulated: true };
const r1 = rank(1, 0.8, [game], "jev", 0.9);
const r2 = rank(1, 0.8, [game, social], "jev", 0.9);
const r3 = rank(1, 0.8, [game, social, social], "jev", 0.9);
check(r1.score === 78 && r1.corroboration === 0, `single trigger: score from significance + fit only (${r1.score})`);
check(r2.score > r1.score && r3.score > r2.score, `corroboration raises rank: ${r1.score} -> ${r2.score} -> ${r3.score}`);
check(rank(1, 1, [game, social, { ...game, kind: "ai_watchlist" as never }, social], "jev", 1).score <= 100, "rank capped at 100");
check(rank(0.2, 0.3, [game], "formula", 0.4).score < r1.score, "routine play ranks below a game-winner");
check(rank(1, 1, [game], "jev", 0.62).lowConfidence && !rank(1, 1, [game], "jev", 0.7).lowConfidence && !rank(1, 1, [game], "formula", 0.4).lowConfidence, "Jev below Nova's 0.7 floor is flagged low-confidence (formula never is)");

// ── watch-list selection ───────────────────────────────────────────────────────────────
const fp: Footage[] = [
  { orgKey: "tottenham-hotspur", competition: "PL", scorePlayMediaId: 2, twelvelabsAssetId: "a2", twelvelabsVideoId: "v2" },
  { orgKey: "san-antonio-spurs", competition: "NBA", scorePlayMediaId: 1, twelvelabsAssetId: "a1", twelvelabsVideoId: "v1" },
];
const hits = [
  { rank: 1, start: 0, end: 14, video_id: "v1" },
  { rank: 2, start: 0, end: 8.8, video_id: "v2" },
  { rank: 3, start: 8.8, end: 17.5, video_id: "v2" },
  { rank: 4, start: 0, end: 5, video_id: "unwatched" },
];
check(overlapRatio({ start: 4, end: 12 }, { start: 0, end: 8.8 }) >= SAME_PLAY && overlapRatio({ start: 4, end: 12 }, { start: 8.8, end: 17.5 }) < SAME_PLAY, "overlapRatio: same-play threshold separates the two soccer segments");
const { paddedWindow } = await import("../pipeline/render-local");
check(paddedWindow(8.8, 17.53, 17.519987, 3).end <= 17.519987, "paddedWindow end never exceeds true duration (17.519987 must not round up to 17.520)");
// cross-platform: Debian ffmpeg 5.1 reports the SAME file as 17.520000 / 13.973000 (rounded up). The window must
// still land inside the true duration TwelveLabs holds (17.519987 / 13.972331).
check(paddedWindow(8.8, 17.53, 17.52, 3).end < 17.519987 && paddedWindow(6, 12, 13.973, 3).end < 13.972331, "paddedWindow stays inside true duration even when Linux ffprobe rounds the duration up");
const pick = pickNew(hits, fp, [{ mediaId: 1, window: { start: 6, end: 12 } }, { mediaId: 2, window: { start: 4, end: 12 } }]);
check(pick?.hit.rank === 3 && pick.footage.scorePlayMediaId === 2, "pickNew: skips hits overlapping fired plays, takes best remaining (soccer 8.8-17.5s)");
check(pickNew(hits, fp, [{ mediaId: 1, window: { start: 0, end: 14 } }, { mediaId: 2, window: { start: 0, end: 17.5 } }]) === null, "pickNew: nothing new -> null (no duplicate card)");

// ── replay timeline (recorded watch-list search, fake enqueue, 50x speed) ─────────────────
process.env.MOCK_MODE = "1";
const tl = JSON.parse(readFileSync("data/replays/demo-broll.json", "utf8")) as Timeline;
const enq: { orgKey: string; kind: string; start: number; simulated: boolean; at: number }[] = [];
const t0 = Date.now();
const fired = await runTimeline(tl, { speed: 50, log: () => {}, enqueue: async (orgKey, i) => { enq.push({ orgKey, kind: i.trigger.kind, start: i.startSec, simulated: i.trigger.simulated, at: Date.now() - t0 }); } });
check(fired.length === tl.events.length && enq.length === 4, `replay fired all ${tl.events.length} events (${enq.length} enqueued)`);
check(enq.map((e) => e.kind).join() === "game_event,social_reaction,social_reaction,ai_watchlist", "replay order follows the clock");
const wl = enq[3];
check(wl.orgKey === "tottenham-hotspur" && Math.abs(wl.start - 8.8) < 0.01 && wl.simulated === false, "watch-list surfaced the UNLOGGED soccer segment (8.8s), labeled real");
check(enq.slice(0, 3).every((e) => e.simulated), "game/social triggers labeled simulated");
const span = enq[3].at - enq[0].at;
check(span >= ((45 - 5) / 50) * 1000 * 0.8, `replay honors timing at 50x (${span}ms between first and last, ~800ms expected)`);

console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
