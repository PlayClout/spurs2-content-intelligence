/**
 * Engine unit tests (no DB, no network): copy, ranking, watch-list selection, replay timing.
 *   npx tsx scripts/engine-test.ts
 */
import { readFileSync } from "node:fs";
import { templateCopy, generateCopy, __setCopyFetch } from "../shared/copy";
import { overlapRatio, pickNew, SAME_PLAY, type Footage } from "../pipeline/watchlist";
import { runTimeline, type Timeline } from "../pipeline/replay";
import { canViewPublication, publicationStateAt, rightsStatusAllowsFanDistribution, type PublicationVersion } from "../shared/publication";
import { DEMO_FAN_PERSONAS, rankForFan } from "../shared/fan-ranking";
import { allowedIndexedAssetIds, buildFanSearchRequest, postValidateSearchHits, mapHitsToPublishedDerivatives, metadataSearch } from "../shared/fan-search";
import { DEMO_PLAYERS, PLAYERS, resolveDemoPlayer, matchSquadName, suggestPlayers } from "../shared/player-identity";
import { fanRightsStatus, revisionHash, pickFanArtifact, suggestInterestTags } from "../shared/fan-catalog";
import { planCompilation, suggestCompilation, compilationStillValid, type CompilationCandidate } from "../shared/compilation";
import { planPackaging, variantRevision, DESTINATIONS, type PackagingSource } from "../shared/packaging";
import { scoreUrgency, matchConfidence, weightFromText, alertVisible, providerStatuses } from "../shared/signals";
import { smartTrim, beatsFrom, keyBeat, targetFor, smartTrimFor } from "../shared/smart-trim";
import { packagingSourceFromRow } from "../shared/packaging";

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
check(rank(1, 1, [game], "jev", 0.62).lowConfidence && !rank(1, 1, [game], "jev", 0.7).lowConfidence && !rank(1, 1, [game], "formula", 0.4).lowConfidence, "Jev below the 0.7 floor is flagged low-confidence (formula never is)");

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

// ── real-footage timeline: every id resolves against the ScorePlay<->TwelveLabs map; windows inside the clip ─────
const real = JSON.parse(readFileSync("data/replays/thfc-mnu-week6.json", "utf8")) as Timeline;
const fmap = JSON.parse(readFileSync("data/footage-map.json", "utf8")) as { twelvelabsIndexId: string; media: { scorePlayMediaId: number; durationSec: number; twelvelabsAssetId?: string; twelvelabsVideoId?: string }[] };
check(real.indexId === fmap.twelvelabsIndexId, "real timeline uses the official TwelveLabs index");
const bad = Object.entries(real.footage).filter(([, f]) => { const m = fmap.media.find((x) => x.scorePlayMediaId === f.scorePlayMediaId); return !m || m.twelvelabsAssetId !== f.twelvelabsAssetId || m.twelvelabsVideoId !== f.twelvelabsVideoId; });
check(bad.length === 0, `every footage entry matches data/footage-map.json (ScorePlay id <-> TwelveLabs asset + video)${bad.length ? `: bad ${bad.map(([k]) => k)}` : ""}`);
const outOfClip = real.events.filter((e) => e.kind !== "ai_watchlist").filter((e) => { const m = fmap.media.find((x) => x.scorePlayMediaId === real.footage[e.footage as string]?.scorePlayMediaId); return !m || e.start! < 0 || e.end! > m.durationSec + 1 || e.end! <= e.start!; });
check(outOfClip.length === 0, `every trigger window lies inside its clip${outOfClip.length ? `: ${outOfClip.map((e) => e.headline)}` : ""}`);
check(real.events.some((e) => e.kind === "ai_watchlist") && real.events.filter((e) => e.kind !== "ai_watchlist").every((e) => (e.text ?? "").length > 0), "real timeline has a watch-list event and every feed trigger has text");

// ── publication lifecycle helpers (no DB) ───────────────────────────────────────────────
const pubBase: PublicationVersion = {
  version: 1,
  orgId: "00000000-0000-4000-8000-000000000001",
  state: "published",
  approvedRevisionHash: "rev-1",
  artifactId: "artifact-1",
  artifactHash: "hash-1",
  renderPath: "/renders/a.mp4",
  durationSec: 12,
  featuredPlayerIds: [],
  interestTags: ["goal"],
  claimIds: [],
  rightsDecisionId: "00000000-0000-4000-8000-000000000002",
  validFrom: "2026-10-22T12:00:00.000Z",
  validUntil: "2026-10-23T12:00:00.000Z",
  destination: { orgId: "00000000-0000-4000-8000-000000000001", platform: "fan_web", territories: ["US"], use: "owned_fan_web", language: "en", releaseAt: "2026-10-22T12:00:00.000Z", policyVersion: "demo-v1" },
};
const now = new Date("2026-10-22T13:00:00.000Z");
check(publicationStateAt(pubBase, now) === "published", "publicationStateAt: currently published version is published");
check(publicationStateAt({ ...pubBase, validFrom: "2026-10-24T00:00:00.000Z" }, now) === "scheduled", "publicationStateAt: future validFrom -> scheduled");
check(publicationStateAt({ ...pubBase, validUntil: "2026-10-22T12:59:00.000Z" }, now) === "expired", "publicationStateAt: past validUntil -> expired");
check(!canViewPublication({ ...pubBase, state: "withdrawn" }, { orgId: pubBase.orgId, territory: "US", use: "owned_fan_web" }, now).ok, "canViewPublication: withdrawn denied");
check(!canViewPublication(pubBase, { orgId: pubBase.orgId, territory: "GB", use: "owned_fan_web" }, now).ok, "canViewPublication: wrong territory denied");
check(canViewPublication(pubBase, { orgId: pubBase.orgId, territory: "US", use: "owned_fan_web" }, now).ok, "canViewPublication: matching viewer allowed");
check(rightsStatusAllowsFanDistribution("cleared") && !rightsStatusAllowsFanDistribution("needs_review") && !rightsStatusAllowsFanDistribution("unknown"), "fan distribution: only cleared rights status can publish to fan catalog");

// ── fan ranking and fan search guards (no DB / no provider calls) ───────────────────────
const fanItems = [
  { id: "solanke-goal", featuredPlayerIds: ["solanke"], interestTags: ["goal"], editorScore: 90, publishedAt: now, sourcePlayKey: "p1" },
  { id: "crowd", featuredPlayerIds: [], interestTags: ["crowd"], editorScore: 75, publishedAt: now, sourcePlayKey: "p2" },
];
check(DEMO_FAN_PERSONAS.length === 2 && DEMO_FAN_PERSONAS[0].favoritePlayerIds.includes("solanke"), "demo personas: two seed-friendly fan preference profiles defined");
check(rankForFan(fanItems, DEMO_FAN_PERSONAS[0], now)[0].item.id === "solanke-goal", "fan ranking: favorite/player interest leads for Fan A");
check(rankForFan(fanItems, DEMO_FAN_PERSONAS[1], now)[0].item.id === "crowd", "fan ranking: interest match leads for Fan B");
const searchItems = [
  { publicationVersionId: "pv1", orgId: pubBase.orgId, indexedAssetId: "idx-1", state: "published" as const, canView: true },
  { publicationVersionId: "pv2", orgId: pubBase.orgId, indexedAssetId: "idx-2", state: "withdrawn" as const, canView: true },
  { publicationVersionId: "pv3", orgId: pubBase.orgId, indexedAssetId: "idx-3", state: "published" as const, canView: false },
];
const allowedIds = allowedIndexedAssetIds(searchItems);
check(allowedIds.length === 1 && allowedIds[0] === "idx-1", "fan search: allowed ID set includes only viewable published derivatives");
check(buildFanSearchRequest("index", "goal", []).ok === false, "fan search: empty allowed set refuses provider search");
check(postValidateSearchHits([{ video_id: "idx-1", start: 0, end: 5, rank: 1 }, { video_id: "idx-2", start: 0, end: 5, rank: 2 }], searchItems).length === 1, "fan search: post-validation drops withdrawn/unviewable hits");
check(PLAYERS.filter((p) => p.orgKey === "tottenham-hotspur").length >= 30 && PLAYERS.filter((p) => p.orgKey === "san-antonio-spurs").length >= 20 && PLAYERS.every((p) => p.scoreplayPlayerId),
  `player identity: the whole ScorePlay squad of each club, with ScorePlay player IDs (Tottenham ${PLAYERS.filter((p) => p.orgKey === "tottenham-hotspur").length}, San Antonio ${PLAYERS.filter((p) => p.orgKey === "san-antonio-spurs").length})`);
check(["solanke", "savio", "kudus", "wembanyama", "harper", "fox"].every((id) => PLAYERS.some((p) => p.id === id)) && new Set(PLAYERS.map((p) => p.id)).size === PLAYERS.length,
  "player identity: the original six ids are kept (saved fan preferences and published clips still resolve); every id is unique");
{
  const thfc = PLAYERS.filter((p) => p.orgKey === "tottenham-hotspur"), sas = PLAYERS.filter((p) => p.orgKey === "san-antonio-spurs");
  const m = (n: string, sq = thfc) => matchSquadName(n, sq)?.id ?? null;
  check(m("Andy Robertson") === "andy-robertson" && m("Tosin Adarabioyo") === "tosin-adarabioyo" && m("Micky van de Ven") === "micky-van-de-ven" && m("Sávio") === "savio" && m("Savio") === "savio" && m("Dominic Solanke") === "solanke",
    "player identity: caption names match ScorePlay's legal-name records (Andy -> Andrew Henry Robertson, Tosin -> ...Oluwatosin... Adarabioyo, Sávio, van de Ven)");
  check(m("Tarris Reed Jr.", sas) === "tarris-reed-jr" && m("Johnson", sas) === null && m("Brown", sas) === null && m("Erling Haaland") === null,
    "player identity: never fuzzy: two Johnsons or two Browns do not resolve on a surname; a player not in the squad is no match");
  const sug = (t: string, sq = thfc) => suggestPlayers(t, sq).map((id) => PLAYERS.find((p) => p.id === id)!.displayName).sort().join(",");
  check(sug("Micky van de Ven of Tottenham Hotspur (R) battles with Carlos Baleba of Manchester United (L)") === "Micky van de Ven"
    && sug("San Antonio Spurs guard De'Aaron Fox drives against the Sacramento Kings", sas) === "De'Aaron Fox"
    && sug("a fox ran on the pitch; the kings of the north", sas) === ""
    && sug("Spurs fans participate in on-court in-game activation Beach Ball Mania. (Photo by Tony Garcia/San Antonio Spurs)", sas) === "",
    "player identity: suggestions are whole-word, capitalised names from the club's text (\"the kings\" is not Scott King, \"a fox\" is not De'Aaron Fox, the photographer Tony Garcia is not David Garcia)");
}
check(DEMO_PLAYERS.some((p) => p.id === "solanke") && DEMO_PLAYERS.some((p) => p.id === "wembanyama"), "player identity: soccer and basketball demo players defined");
check(resolveDemoPlayer("Sávio").status === "resolved" && resolveDemoPlayer("wemby").status === "resolved", "player identity: aliases resolve deterministically");
check(resolveDemoPlayer("unknown player").status === "not_found", "player identity: unknown player does not guess silently");
check(rankForFan([{ id: "x", featuredPlayerIds: ["solanke"], interestTags: [] }], { favoritePlayerIds: ["solanke"], interestTags: [] }, new Date(), (id) => DEMO_PLAYERS.find((p) => p.id === id)!.displayName)[0].reasons[0] === "Because you follow Dominic Solanke", "fan ranking: why-chip names the player, not the internal id");

// fan catalog publication rules
check(fanRightsStatus({ status: "blocked" }) === "blocked", "fan catalog: blocked compliance cannot publish");
check(fanRightsStatus(null) === "needs_review" && fanRightsStatus({ status: "unknown" }) === "needs_review", "fan catalog: unknown rights never clear");
check(fanRightsStatus({ status: "cleared" }, true) === "needs_review", "fan catalog: requiresReview blocks even a cleared stamp");
check(fanRightsStatus({ status: "restricted" }) === "cleared", "fan catalog: restricted (owned channels allowed) clears owned fan web");
const revBase = { opportunityId: "o1", trim: { startSec: 2, endSec: 11 }, copy: "Solanke!", renderPath: "/renders/a/reel.final.mp4", featuredPlayerIds: ["solanke"], interestTags: ["goal"] };
check(revisionHash(revBase) === revisionHash({ ...revBase, interestTags: ["goal"] }), "fan catalog: revision hash is stable");
check(revisionHash(revBase) !== revisionHash({ ...revBase, trim: { startSec: 2, endSec: 12 } }), "fan catalog: trim change invalidates revision");
check(revisionHash(revBase) !== revisionHash({ ...revBase, featuredPlayerIds: ["kudus"] }), "fan catalog: player metadata change invalidates revision");
check(pickFanArtifact({ instagram_reel: "/renders/a/reel.final.mp4" })?.kind === "video", "fan catalog: final video picked for fan app");
check(pickFanArtifact({}) === null, "fan catalog: nothing final -> nothing to publish (drafts never publish)");
check(suggestInterestTags("Solanke scores a goal and celebrates with the crowd").join(",") === "goal,celebration,crowd", "fan catalog: interest suggestions from moment text");

// fan search derivative mapping
const rangeItems = [
  { publicationVersionId: "pv-goal", orgId: "o", indexedAssetId: "vid-1", state: "published" as const, canView: true, sourceRanges: [{ start: 2, end: 11 }], durationSec: 9 },
  { publicationVersionId: "pv-gone", orgId: "o", indexedAssetId: "vid-1", state: "withdrawn" as const, canView: false, sourceRanges: [{ start: 30, end: 40 }], durationSec: 10 },
];
const mapped = mapHitsToPublishedDerivatives([{ video_id: "vid-1", start: 5, end: 8, rank: 1 }], rangeItems);
check(mapped.length === 1 && mapped[0].publicationVersionId === "pv-goal" && mapped[0].offsetStartSec === 3 && mapped[0].offsetEndSec === 6, "fan search: hit maps to offset inside the published derivative");
check(mapHitsToPublishedDerivatives([{ video_id: "vid-1", start: 60, end: 70, rank: 1 }], rangeItems).length === 0, "fan search: raw full-match hit outside published ranges is dropped");
check(mapHitsToPublishedDerivatives([{ video_id: "vid-1", start: 31, end: 35, rank: 1 }], rangeItems).length === 0, "fan search: hit inside a withdrawn version's range is dropped");
check(metadataSearch("solanke goal", [{ publicationVersionId: "a", text: "Solanke scores", playerNames: ["Dominic Solanke"], interestTags: ["goal"] }, { publicationVersionId: "b", text: "Crowd sings", playerNames: [], interestTags: ["crowd"] }]).map((x) => x.publicationVersionId).join() === "a", "fan search: metadata fallback matches only relevant published items");

// compilation planning
{
  const mk = (id: string, start: number, end: number, score: number, over: Partial<CompilationCandidate> = {}): CompilationCandidate =>
    ({ opportunityId: id, headline: id, status: "rendered", complianceStatus: "cleared", requiresReview: false, mediaId: 100, window: { start, end }, score, ...over });
  const a = mk("goal", 0, 12, 95), b = mk("chance", 0, 9, 70), c = mk("tackle", 0, 8, 60);
  const p = planCompilation([c, b, a]);
  check(p.ok && p.entries.map((e) => e.role).join() === "hook,build-up,payoff" && Math.abs(p.totalSec - 29) < 1e-9, "compilation: 3 approved clips plan to hook/build-up/payoff in 20-45s");
  check(p.ok && planCompilation([a, b, c]).ok && (planCompilation([a, b, c]) as { revision: string }).revision !== p.revision, "compilation: reordering creates a new exact revision");
  const unapproved = planCompilation([a, b, mk("draft", 0, 8, 50, { status: "draft_ready" })]);
  check(!unapproved.ok && unapproved.errors.some((e) => e.includes("not approved")), "compilation: unapproved clip refused");
  const blocked = planCompilation([a, b, mk("blk", 0, 8, 50, { complianceStatus: "blocked" })]);
  check(!blocked.ok && blocked.errors.some((e) => e.includes("blocked")), "compilation: rights-blocked clip refused");
  const short = planCompilation([mk("x", 0, 5, 50), mk("y", 0, 5, 40)]);
  check(!short.ok && short.errors.some((e) => e.includes("budget")), "compilation: under 20s refused (budget)");
  check(!planCompilation([a, a]).ok, "compilation: duplicate clip refused");
  const sug = suggestCompilation([a, b, c, mk("long", 0, 40, 99), mk("draft", 0, 8, 98, { status: "draft_ready" })]);
  check(sug.length >= 2 && sug.every((x) => x.status === "rendered") && sug[sug.length - 1].score === Math.max(...sug.map((x) => x.score)) && planCompilation(sug).ok, "compilation: suggestion fits budget, skips drafts, saves best moment for the payoff");
  const live = new Map([["goal", { status: "rendered", complianceStatus: "cleared" }], ["chance", { status: "rendered", complianceStatus: "blocked" }]]);
  const v = compilationStillValid(["goal", "chance", "gone"], live);
  check(!v.ok && v.broken.join() === "chance,gone", "compilation: becomes invalid when a source clip is blocked or removed");
}

// destination packaging
{
  const base: PackagingSource = { opportunityId: "o1", headline: "SOLANKE RESCUES A POINT", status: "rendered", complianceStatus: "cleared", requiresReview: false,
    restrictions: [], renderActions: [], window: { start: 2, end: 16 }, analysedWindow: { start: 0, end: 17.5 }, subjectX: 0.62,
    generatedCopy: { x_post: "x".repeat(400), instagram_reel: "Late drama #COYS" } };
  const plan = planPackaging(base);
  const by = (c: string) => plan.find((p) => p.channel === c)!;
  check(plan.length === DESTINATIONS.length && DESTINATIONS.includes("fan_app") && DESTINATIONS.includes("tiktok"), `packaging: one plan per destination incl. fan app (${plan.length})`);
  check(plan.every((p) => p.eligible), "packaging: approved clean clip is eligible everywhere");
  check(by("instagram_story").recipe!.endSec - by("instagram_story").recipe!.startSec === 14 && by("instagram_story").notes.length === 0 && by("instagram_story").recipe!.copy === "", "packaging: Story keeps 14s (fits 15s) and publishes without copy");
  check(by("instagram_reel").recipe!.width === 1080 && by("instagram_reel").recipe!.height === 1920 && by("youtube_highlight").recipe!.width === 1920, "packaging: aspect and size follow each channel profile");
  check(by("x_post").recipe!.copy.length === 280 && by("x_post").notes.some((n) => n.includes("280")), "packaging: X copy trimmed to its 280-char limit, with a note");
  check(by("youtube_short").recipe!.endSec - by("youtube_short").recipe!.startSec >= 15 && by("youtube_short").recipe!.startSec >= 0 && by("youtube_short").recipe!.endSec <= 17.5, "packaging: Short extended toward its 15s target inside the analysed window");
  check(by("youtube_highlight").notes.some((n) => /only 17\.5s was analysed/.test(n)), "packaging: honest note when the target needs more footage than was analysed");
  check(by("instagram_feed").recipe!.kind === "photo" && by("instagram_reel").recipe!.cropXOffset === 0.62, "packaging: photo channels marked photo; crop follows the subject position");
  // edit only one destination: only that revision changes
  const edited = planPackaging({ ...base, overrides: { tiktok: { startSec: 3, endSec: 12 } } });
  check(edited.find((p) => p.channel === "tiktok")!.revision !== by("tiktok").revision && edited.filter((p) => p.channel !== "tiktok").every((p) => p.revision === by(p.channel).revision), "packaging: editing one destination changes only its revision");
  check(variantRevision("o1", by("tiktok").recipe!) === by("tiktok").revision, "packaging: revision is reproducible from the recipe");
  const outside = planPackaging({ ...base, overrides: { tiktok: { startSec: 10, endSec: 30 } } }).find((p) => p.channel === "tiktok")!;
  check(!outside.eligible && outside.reasons.some((r) => r.includes("analysed window")), "packaging: a cut outside the analysed footage is refused");
  const blockedX = planPackaging({ ...base, restrictions: [{ kind: "platform", rule: "No X distribution for this match", blockedPlatforms: ["x"] }] });
  check(!blockedX.find((p) => p.channel === "x_post")!.eligible && !blockedX.find((p) => p.channel === "x_photo")!.eligible && blockedX.find((p) => p.channel === "tiktok")!.eligible, "packaging: a platform rule blocks only that platform's destinations, with its reason");
  check(planPackaging({ ...base, status: "draft_ready" }).every((p) => !p.eligible && p.reasons.includes("Approve the clip first")), "packaging: nothing packages before approval");
  check(planPackaging({ ...base, complianceStatus: "blocked" }).every((p) => !p.eligible), "packaging: rights-blocked clip packages nowhere");
  check(planPackaging({ ...base, renderActions: ["mute_audio"] }).every((p) => !p.recipe || p.recipe.muteAudio), "packaging: music-remediation mute carries into every variant");
}

// outside signals + hot-clip urgency
{
  const now = new Date("2026-10-22T20:00:00Z");
  const ago = (s: number) => new Date(now.getTime() - s * 1000);
  const sig = (kind: "game_event" | "social_reaction" | "ai_watchlist", secAgo: number, weight = 0.8, mode: "live" | "replay" = "replay") => ({ kind, observedAt: ago(secAgo), weight, mode });
  const hot = scoreUrgency({ signals: [sig("game_event", 60), sig("social_reaction", 30, 0.86), sig("social_reaction", 20, 0.86)], now, matchConfidence: 1, draftReady: true });
  check(hot.lane === "act_now" && hot.coverage === 2 && hot.why.some((w) => w.includes("independent sources")), `signals: goal + reaction spike -> Act now (${hot.score})`);
  check(hot.why.some((w) => w.includes("not a live feed")), "signals: replay signals are labelled not-live in the why");
  const lone = scoreUrgency({ signals: [sig("ai_watchlist", 90, 0.5)], now, matchConfidence: 1, draftReady: true });
  check(lone.lane !== "act_now", `signals: a single watch-list hit is not Act now (${lone.lane}, ${lone.score})`);
  const stale = scoreUrgency({ signals: [sig("game_event", 25 * 60), sig("social_reaction", 22 * 60)], now, matchConfidence: 1, draftReady: true });
  check(stale.expired && stale.lane === "watch", "signals: stale signals expire to Watch");
  const unsure = scoreUrgency({ signals: [sig("game_event", 60), sig("social_reaction", 30, 0.86), sig("social_reaction", 20, 0.86)], now, matchConfidence: 0.3, draftReady: true });
  check(unsure.score < hot.score && unsure.why.some((w) => w.includes("uncertain")), "signals: uncertain footage match lowers urgency and says so");
  const accel = scoreUrgency({ signals: [sig("social_reaction", 700, 0.3), sig("social_reaction", 30, 0.3), sig("social_reaction", 20, 0.3), sig("social_reaction", 10, 0.3), sig("social_reaction", 5, 0.3)], now, matchConfidence: 1, draftReady: true });
  check(accel.momentum.ratio >= 2 && accel.why.some((w) => /x the usual rate/.test(w)), `signals: acceleration over baseline is measured (${accel.momentum.ratio}x)`);
  // hysteresis: a score just under the Act-now line (65) stays Act now if it was Act now, else enters Rising
  const edge = { signals: [sig("game_event", 30), sig("social_reaction", 30)], now, matchConfidence: 0.75, draftReady: true };
  const fresh = scoreUrgency(edge), held = scoreUrgency({ ...edge, previousLane: "act_now" });
  check(fresh.score >= 62 && fresh.score < 70 && fresh.lane === "rising" && held.lane === "act_now", `signals: hysteresis at the boundary (score ${fresh.score}: new -> rising, was act_now -> stays act_now)`);
  check(matchConfidence({ mediaId: 1, window: { start: 2, end: 11 } }, { mediaId: 1, window: { start: 2, end: 11 } }) === 1 && matchConfidence({ mediaId: 2, window: null }, { mediaId: 1, window: null }) === 0, "signals: same media + overlapping window = confident; different media = no match");
  check(Math.abs(weightFromText("Mentions of Solanke up 11x in 2 minutes", "social_reaction") - Math.log2(11) / 4) < 1e-9, "signals: social strength parsed from the provider's own text");
  check(!alertVisible({ snoozedUntil: new Date(now.getTime() + 60_000).toISOString() }, hot, now).visible && alertVisible({ snoozedUntil: ago(1).toISOString() }, hot, now).visible, "alerts: snooze hides until it expires");
  check(!alertVisible({ dismissedAt: ago(10).toISOString(), dismissedScore: hot.score }, hot, now).visible && alertVisible({ dismissedAt: ago(10).toISOString(), dismissedScore: hot.score - 20 }, hot, now).visible, "alerts: a dismissed alert re-opens only on a meaningful escalation");
  check(providerStatuses({}).find((p) => p.provider === "x")?.state === "unavailable", "signals: X search shows unavailable without access (never silently simulated)");
}

// smart trim (real TwelveLabs beats stored for the Man Utd v Tottenham replay)
{
  const P = profiles as unknown as Record<string, { label: string; targetDurationSec: number[]; maxDurationSec: number }>;
  const solanke = { analysed: { start: 0, end: 14 }, raw: { moments: [
    { label: "Pass and Dribble", description: "A player receives a pass and begins dribbling towards the goal.", start: 0, end: 4.5 },
    { label: "Goal Scoring", description: "The player shoots the ball past the goalkeeper into the net.", start: 4.5, end: 8 },
    { label: "Celebration", description: "The goalscorer and teammates celebrate.", start: 8, end: 14 }] } };
  const beats = beatsFrom(solanke.raw, solanke.analysed);
  check(keyBeat(beats, null)?.label === "Goal Scoring", "smart trim: the goal is the key beat (action word in the label)");
  const reel = smartTrim({ beats, analysed: solanke.analysed, focus: null, target: targetFor(P.instagram_reel) });
  check(reel.start === 1.5 && reel.end === 14 && reel.lengthSec === 12.5, `smart trim: Reel = 3s setup -> goal -> celebration (${reel.start}-${reel.end})`);
  check(reel.reason === "Starts 3.0s before the goal scoring so the build-up lands, ends after the celebration." && reel.note === null, `smart trim: reason describes the final cut (${reel.reason})`);
  const yt = smartTrim({ beats, analysed: solanke.analysed, focus: null, target: targetFor(P.youtube_short) });
  check(yt.start === 0 && yt.end === 14 && /only 14s of this play was analysed/.test(yt.note ?? ""), `smart trim: Short wants 15s, uses all 14s analysed and says so (${yt.note})`);
  check(yt.reason.startsWith("Starts 4.5s before"), "smart trim: reason is recomputed after lengthening (4.5s, not 3s)");
  const story = smartTrim({ beats, analysed: solanke.analysed, focus: null, target: targetFor(P.instagram_story) });
  check(story.lengthSec <= 15 && story.start <= 4.5 && story.end >= 8, `smart trim: Story fits 15s and keeps the whole goal (${story.start}-${story.end})`);
  const tight = smartTrim({ beats, analysed: solanke.analysed, focus: null, target: { label: "Tight", minSec: 0, maxSec: 6 } });
  check(tight.lengthSec === 6 && tight.start <= 4.5 && tight.end >= 8, `smart trim: shortening never cuts the key beat (${tight.start}-${tight.end})`);
  // Sávio: key beat is the LAST beat -> ends on it
  const savio = beatsFrom({ moments: [{ label: "Initial pass and tackle", start: 1, end: 4.5 }, { label: "Dribble into the box", start: 4.5, end: 11.5 }, { label: "Cutback and save", start: 11.5, end: 16.5 }] }, { start: 1, end: 16.5 });
  const sv = smartTrim({ beats: savio, analysed: { start: 1, end: 16.5 }, focus: null, target: targetFor(P.instagram_reel) });
  check(sv.key?.label === "Cutback and save" && sv.start === 8.5 && sv.end === 16.5 && /ends on the cutback and save/.test(sv.reason), `smart trim: last-beat key ends on it (${sv.start}-${sv.end})`);
  // Away end: no action word -> trigger window decides
  const away = beatsFrom({ moments: [{ label: "Player clapping", start: 19.8, end: 21.8 }, { label: "Player walking and clapping", start: 21.8, end: 26.8 }, { label: "Fans cheering", start: 26.8, end: 30.4 }] }, { start: 19.8, end: 30.392 });
  check(keyBeat(away, { start: 22, end: 26 })?.label === "Player walking and clapping", "smart trim: with no action beat, the beat overlapping the trigger window is key");
  // beats are clipped to the analysed window; garbage dropped
  const clipped = beatsFrom({ moments: [{ label: "a", start: -2, end: 3 }, { label: "b", start: 3, end: 40 }, { label: "bad", start: "x", end: 2 }, { label: "zero", start: 5, end: 5 }] }, { start: 0, end: 14 });
  check(clipped.length === 2 && clipped[0].start === 0 && clipped[1].end === 14, "smart trim: beats clipped to the analysed window, malformed beats dropped");
  const none = smartTrim({ beats: [], analysed: { start: 0, end: 14 }, focus: { start: 2, end: 11 }, target: targetFor(P.instagram_reel) });
  check(none.start === 2 && none.end === 11 && /No beat breakdown/.test(none.reason), "smart trim: no beats -> uses the detected moment and says so");
  check(smartTrimFor(solanke.raw, { window: solanke.analysed }, P.instagram_feed) === null, "smart trim: photo channels have nothing to trim");
  // every cut stays inside the analysed window, for every video channel
  const inside = Object.entries(P).filter(([k, p]) => !k.startsWith("$") && p.targetDurationSec[1]).every(([, p]) => { const t = smartTrim({ beats, analysed: solanke.analysed, focus: null, target: targetFor(p) }); return t.start >= 0 && t.end <= 14 && t.end > t.start; });
  check(inside, "smart trim: every channel's cut stays inside the analysed footage");
  // packaging: smart mode gives each channel its own cut; manual mode keeps the editor's window
  const row = { id: "o1", headline: "SOLANKE", status: "approved", compliance: { status: "cleared" }, trimOverride: null, generatedCopy: {}, delivery: { window: solanke.analysed, tightWindow: { start: 2, end: 11 } } };
  const smartPlan = planPackaging(packagingSourceFromRow(row, solanke.raw));
  const cut = (ch: string, plan = smartPlan) => plan.find((d) => d.channel === ch)?.recipe;
  check(cut("instagram_reel")?.startSec === 1.5 && cut("instagram_reel")?.endSec === 14 && cut("youtube_short")?.startSec === 0, "packaging: smart trim gives each channel its own cut");
  const manualPlan = planPackaging(packagingSourceFromRow({ ...row, trimOverride: { startSec: 3, endSec: 11 }, delivery: { ...row.delivery, trimMode: "manual" } }, solanke.raw));
  check(cut("instagram_reel", manualPlan)?.startSec === 3 && cut("instagram_reel", manualPlan)?.endSec === 11, "packaging: a manual cut is respected (not re-trimmed)");
}

// ── live match mode (pure; the real match file, no network) ──────────────────────────────
{
  const L = await import("../shared/live-match");
  const m = JSON.parse(readFileSync("data/live/mnu-tot-full-match.json", "utf8")) as import("../shared/live-match").LiveMatch;
  // clock read off the broadcast scorebug on ScorePlay proxy frames (see the match file's "verified" note)
  check(L.clockAt(m, 600).label === "5:59" && L.clockAt(m, 2900).label === "44:19" && L.clockAt(m, 3600).label === "54:13" && L.clockAt(m, 5822).label === "91:15",
    `live: match clock matches the broadcast scorebug (5:59, 44:19, 54:13, 91:15 -> ${[600, 2900, 3600, 5822].map((v) => L.clockAt(m, v).label).join(", ")})`);
  check(L.clockAt(m, 3020).label === "HT" && L.clockAt(m, 100).label === "Pre-match" && L.clockAt(m, 6300).label === "FT" && L.clockAt(m, 5829).minute === "90+2'", "live: half-time, pre-match, full time and stoppage minutes read correctly");
  check(JSON.stringify(L.scoreAt(m.feed, 4677)) === '{"home":0,"away":0}' && JSON.stringify(L.scoreAt(m.feed, 4680)) === '{"home":1,"away":0}' && JSON.stringify(L.scoreAt(m.feed, 5830)) === '{"home":1,"away":1}',
    "live: score follows the goals as they air (0-0, 1-0 at 72', 1-1 at 90+2')");
  check(L.airedFeed(m.feed, 4600).every((e) => e.at <= 4600) && !L.airedFeed(m.feed, 4600).some((e) => e.type === "goal"), "live: the desk never sees a goal before it airs (no spoilers)");
  const ses = { status: "live" as const, anchorVideoSec: 1000, anchorAt: new Date(0).toISOString(), speed: 1 };
  check(L.liveEdge(ses, 30_000, m.durationSec) === 1030 && L.liveEdge({ ...ses, status: "paused" }, 30_000, m.durationSec) === 1000 && L.liveEdge(ses, 1e12, m.durationSec) === m.durationSec,
    "live: live edge advances in real time, freezes when paused, stops at the end");

  // feed: only the club's own goal becomes a clip, and only once its whole passage has aired
  let st = L.emptyState("t");
  let f = L.stepFeed(m, st, 4680, 236); st = f.state;
  const mbeumo = f.aired.find((a) => a.event.id === "g1");
  check(mbeumo?.action === "score_only" && f.clipNow.length === 0 && st.pending.length === 0, "live: opponent goal updates the score and is never clipped");
  check(st.quietUntil === 4690 + 90 && st.fired.some((x) => x.start === 4664), "live: an opponent goal still blocks its passage and the replays after it from the watch-list");
  f = L.stepFeed(m, st, 5830, 236); st = f.state;
  check(f.aired.some((a) => a.event.id === "g2" && a.action === "clip_when_aired") && f.clipNow.length === 0 && st.pending.length === 1, "live: club goal is held until the celebration has aired");
  f = L.stepFeed(m, st, 5842, 236); st = f.state;
  check(f.clipNow.length === 1 && f.clipNow[0].window.start === 5814 && f.clipNow[0].window.end === 5840 && st.pending.length === 0, "live: club goal is cut once its whole window has aired (5814-5840)");
  check(L.stepFeed(m, st, 5900, 236).clipNow.length === 0 && L.stepFeed(m, st, 5900, 236).aired.length === 0, "live: a goal is never cut twice");
  const late = L.stepFeed(m, L.emptyState("t2"), 4440, 4440);
  check(late.aired.filter((a) => a.event.at < 4400).every((a) => a.action === "before_join") && late.clipNow.length === 0, "live: joining late summarises what already happened, clips nothing from before");

  // watch-list: live ranking among aired footage, confidence floors, play only, no repeats
  const hits = [{ rank: 3, start: 300, end: 308 }, { rank: 1, start: 900, end: 910 }, { rank: 7, start: 3010, end: 3020 }, { rank: 60, start: 1000, end: 1008 }, { rank: 2, start: 1010, end: 1018 }];
  const lr = L.liveRanked(hits, 1030);
  check(lr.every((h) => h.end <= 1030 - L.AIR_LAG_SEC && h.start >= 1030 - L.LOOKBACK_SEC) && lr[0].rank === 1 && lr[0].liveRank === 1 && !lr.some((h) => h.start === 3010),
    "live: watch-list only sees footage that has aired in the last 3 minutes, ranked among itself (never the future)");
  const wh = (h: { rank: number; start: number; end: number }, liveRank: number) => ({ ...h, liveRank, query: "q", label: "Save", headline: "WHAT A STOP" });
  const base = L.emptyState("w");
  check(L.pickWatchHit(m, base, [wh({ rank: 60, start: 1000, end: 1008 }, 1)], 1030, 236) === null, "live: a weak hit is ignored even when it is the best of a quiet spell");
  check(L.pickWatchHit(m, base, [wh({ rank: 5, start: 2990, end: 3005 }, 1)], 3040, 236) === null, "live: nothing is clipped across half-time or from the studio");
  check(L.pickWatchHit(m, { ...base, quietUntil: 1020 }, [wh({ rank: 2, start: 1010, end: 1018 }, 1)], 1030, 236) === null, "live: broadcast replays after a goal are not re-clipped");
  check(L.pickWatchHit(m, { ...base, fired: [{ start: 1005, end: 1012, source: "watchlist", label: "Save" }] }, [wh({ rank: 2, start: 1010, end: 1018 }, 1)], 1030, 236) === null, "live: the same passage is never clipped twice");
  const pick = L.pickWatchHit(m, base, [wh({ rank: 9, start: 990, end: 998 }, 2), wh({ rank: 2, start: 1010, end: 1018 }, 1)], 1030, 236);
  check(pick?.start === 1010, "live: the best live-ranked hit wins");
  check(L.pickWatchHit(m, base, [wh({ rank: 2, start: 1010, end: 1018 }, 1)], 1030, 1029 + L.JOIN_BACKFILL_SEC) === null, "live: nothing from before the producer joined (beyond a short backfill)");
  check(L.scanDue(L.emptyState("s"), 300) && !L.scanDue({ ...L.emptyState("s"), lastScanAt: 300 }, 340) && L.scanDue({ ...L.emptyState("s"), lastScanAt: 300 }, 360), "live: the watch-list looks again every match minute");
  {
    const st = { ...L.emptyState("s"), lastScanAt: 360 };
    check(!L.earlyScanAllowed(st, 365) && L.earlyScanAllowed(st, 370) && !L.earlyScanAllowed(L.emptyState("s"), 370),
      "live: between minute scans the engine may look again, at most every 10s (never before its first scan)");
    check(L.airedSinceLastScan({ start: 365.8, end: 375.8 }, st) && !L.airedSinceLastScan({ start: 340, end: 350 }, st),
      "live: an early look only acts on a moment that finished airing after the last scan (never re-picks what a scan passed over)");
    const first = m.joinPresets[0];
    check(first.label === "First chance" && first.videoSec === 356 && L.inPlay(m, first.videoSec),
      "live: the first join point starts ~10s before the engine's first find (measured on this match: a save at 2'-3')");
  }

  // Pegasus verdict -> whether the club posts it (team = the attacking side)
  const v = (type: import("../shared/live-match").VerifyType, team: "home" | "away" | "unclear", confidence = 0.9, isHighlight = true) => ({ isHighlight, type, team, description: "", confidence });
  const h = (x: ReturnType<typeof L.liveHeadline>) => (x.post ? x.headline : `skip:${x.reason}`);
  check(h(L.liveHeadline(m, v("shot_saved", "away"), false)) === "SO CLOSE" && h(L.liveHeadline(m, v("shot_saved", "home"), false)) === "WHAT A STOP", "live: our shot saved = SO CLOSE; their shot saved by our keeper = WHAT A STOP");
  check(h(L.liveHeadline(m, v("goal", "home"), true)).startsWith("skip") && h(L.liveHeadline(m, v("big_chance", "home"), false)).startsWith("skip") && h(L.liveHeadline(m, v("woodwork", "home"), false)).startsWith("skip"),
    "live: the opponent's goals, chances and woodwork are never posted");
  check(h(L.liveHeadline(m, v("goal", "away"), false)) === "SO CLOSE", "live: a 'goal' the match data never recorded (disallowed / offside) is posted as a chance, not a goal");
  check(h(L.liveHeadline(m, v("card", "home"), false)).startsWith("skip") && h(L.liveHeadline(m, v("none", "away"), false)).startsWith("skip") && h(L.liveHeadline(m, v("woodwork", "away", 0.4), false)).startsWith("skip") && h(L.liveHeadline(m, v("shot_saved", "unclear"), false)).startsWith("skip"),
    "live: bookings, ordinary play, low confidence and unclear teams are not posted");
  check(L.laneFor({ live: { sessionId: "x" } }) === "live" && L.laneFor({}) === undefined, "live: jobs for a live clip stay in the live lane (the cloud worker never cuts the full match)");
  // DVR: the viewer rewinds anywhere that has aired, never past the live edge; the engine stays on the edge
  check(L.dvrSeek(9999, 5700) === 5700 && L.dvrSeek(-5, 5700) === 0 && L.dvrSeek(600, 5700) === 600, "live DVR: seeking lands inside what has aired (never ahead of live, never before the start)");
  check(L.isAtLive(5699, 5700) && !L.isAtLive(5690, 5700) && L.behindLabel(5537, 5700) === "-2:43", "live DVR: within 2s of the edge counts as live; otherwise the badge says how far behind (-2:43)");
  const rewoundScore = L.scoreAt(m.feed, 600), liveScore = L.scoreAt(m.feed, 5900);
  check(rewoundScore.home === 0 && rewoundScore.away === 0 && liveScore.home + liveScore.away === 2, "live DVR: the scorebug follows the moment on screen (0-0 when rewound to the first half, 1-1 at the end)");
  check(L.clearableOnRestart({ status: "draft_ready", fromLiveMatch: true, referenced: false })
    && !L.clearableOnRestart({ status: "approved", fromLiveMatch: true, referenced: false })
    && !L.clearableOnRestart({ status: "rejected", fromLiveMatch: true, referenced: false })
    && !L.clearableOnRestart({ status: "draft_ready", fromLiveMatch: true, referenced: true })
    && !L.clearableOnRestart({ status: "draft_ready", fromLiveMatch: false, referenced: false }),
    "live restart: clears only untouched live drafts (approved, rejected, published, library and replay clips stay)");
  // photo card still: late in the live action beat (measured on this match), never a replay / reaction / celebration
  const ST = await import("../shared/smart-trim");
  const goalBeats = [{ label: "Build-up play", start: 5814, end: 5823 }, { label: "Goal scored", start: 5823, end: 5827.5 }, { label: "Celebration", start: 5827.5, end: 5840 }];
  check(ST.stillAt(goalBeats, { start: 5814, end: 5840 }, { start: 5814, end: 5840 }) === 5826.8, `live: goal card still sits as the ball goes in (5826.8s, got ${ST.stillAt(goalBeats, { start: 5814, end: 5840 }, { start: 5814, end: 5840 })})`);
  const saveBeats = [{ label: "through ball and shot", start: 3385, end: 3391 }, { label: "goalkeeper save replay", start: 3391, end: 3396.5 }, { label: "manager reaction", start: 3396.5, end: 3402 }];
  const s51 = ST.stillAt(saveBeats, { start: 3391, end: 3396 }, { start: 3385, end: 3402 });
  check(s51 >= 3385 && s51 <= 3391, `live: the still is taken from the live play, never the replay or the manager's reaction (${s51}s)`);
  check(ST.stillAt([], null, { start: 10, end: 20 }) === 15, "live: no beats -> the still falls back to the middle of the clip");
  const prompt = (await import("../pipeline/moment")).livePrompt(m);
  check(/shirts of the player who shoots/.test(prompt) && /goalkeeper always belongs to the DEFENDING side/.test(prompt) && prompt.includes(m.away.kit),
    "live: Pegasus decides the attacking team from the shooter's kit, with this match's real kits in the prompt");
  check(/ONLY when the name is shown in an on-screen graphic/.test(prompt), "live: Pegasus may only name a player when an on-screen graphic shows the name");
}

// ── library mode: a club whose ScorePlay library is not a full match (raw clips, edits, interviews, photos) ─────
{
  const L = await import("../shared/library");
  const plan = JSON.parse(readFileSync("data/library/san-antonio-spurs.json", "utf8")) as import("../shared/library").LibraryPlan;
  const map = JSON.parse(readFileSync("data/footage-map-san-antonio-spurs.json", "utf8")) as { twelvelabsIndexId: string; media: import("../shared/library").IndexedClip[] };
  const tot = JSON.parse(readFileSync("data/footage-map.json", "utf8")) as { twelvelabsIndexId: string };
  check(map.twelvelabsIndexId !== tot.twelvelabsIndexId && map.media.length >= 60 && map.media.every((m) => m.twelvelabsVideoId && m.twelvelabsAssetId),
    `library: San Antonio has its OWN TwelveLabs index (${map.media.length} videos), never Tottenham's`);
  check(new Set(plan.formats.map((f) => f.id)).size === 4 && plan.formats.some((f) => f.photo) && plan.formats.some((f) => f.queries) && plan.teamSeasonId === 72210,
    "library: the plan covers four kinds of club footage (game action, player voice, partner activation, player photo) on the club's own season roster");
  check(plan.formats.filter((f) => f.queries).every((f) => map.media.some((m) => m.collection === f.collection)), "library: every video format points at a collection that is actually indexed");

  check(L.playKey("X S1 JAM-423A-.mov") === L.playKey("X S1 JAM-423B-.mov") && L.playKey("Vic_Dunk_#3_4x5.mp4") === L.playKey("Vic_Dunk_#3_16x9.mp4") && L.playKey("S5 3PT-322A-.mov") !== L.playKey("S5 3PT-329B-.mov"),
    "library: two camera angles or crops of one play are the same play; different plays stay different");
  const clip = (id: number, name: string, collection = "Raw Footage") => ({ scorePlayMediaId: id, name, collection, twelvelabsVideoId: `v${id}`, twelvelabsAssetId: `a${id}` });
  const clips = [clip(1, "X S1 JAM-423A-.mov"), clip(2, "X S1 JAM-423B-.mov"), clip(3, "S7 BLK-251A-.mov"), clip(4, "S5 3PT-322A-.mov"), clip(5, "Interview.mp4", "Social Edits")];
  const fmt = { id: "game_action", label: "Game action", collection: "Raw Footage", max: 3, queries: [] };
  const q = (label: string) => ({ query: label, label, headline: label.toUpperCase() });
  const hits = (...ids: number[]) => ids.map((id, i) => ({ rank: i + 1, start: 1, end: 9, video_id: `v${id}` }));
  const taken = new Set<string>();
  const picks = L.pickVideos(fmt, [{ q: q("Dunk"), hits: hits(1, 2, 5) }, { q: q("Block"), hits: hits(3, 1) }, { q: q("Three"), hits: hits(4) }], clips, taken);
  check(picks.map((x) => x.label).join(",") === "Dunk,Block,Three" && picks.map((x) => x.clip.scorePlayMediaId).join(",") === "1,3,4",
    `library: one pick per query in turn, never the same play twice, never outside the format's collection (${picks.map((x) => `${x.label}:${x.clip.scorePlayMediaId}`).join(" ")})`);
  check(L.pickVideos(fmt, [{ q: q("Dunk"), hits: hits(2) }], clips, taken).length === 0, "library: a play already picked for one format is not picked again for another");

  const gill = "October 16, 2026, San Antonio, TX:\nSan Antonio Spurs guard Ja’Kobi Gillespie shoots a three pointer during the fourth quarter of the preseason game against the Sacramento Kings at the Frost Bank Center. (Photo by Reginald Thomas II/San Antonio Spurs)";
  const group = "October 16, 2026, San Antonio, TX: San Antonio Spurs guard Dylan Harper and San Antonio Spurs guard De'Aaron Fox wait for play to resume during the first quarter.";
  const pose = "Sacramento Kings guard Tristen Newton, San Antonio Spurs guard Stephon Castle pose for a photo after the preseason game.";
  check(JSON.stringify(L.captionPlayer(gill)) === JSON.stringify({ name: "Ja'Kobi Gillespie", action: "shoots a three pointer", period: "fourth quarter" }),
    `library: the player, action and quarter come from the photographer's caption (${JSON.stringify(L.captionPlayer(gill))})`);
  check(L.captionPlayer(group) === null && L.captionPlayer(pose) === null, "library: group shots and posed photos are not credited to one player");
  check(L.captionActivation("Spurs fan participates in on-court in-game activation Whataburger Drop in the Bucket during the San Antonio Spurs vs. Sacramento Kings game") === "Whataburger Drop in the Bucket",
    "library: the partner activation is named exactly as the club captioned it");
  const photos = [
    { ID: 10, description: "San Antonio Spurs guard Dylan Harper adjusts his arm band during the first quarter" },
    { ID: 11, description: "San Antonio Spurs forward Victor Wembanyama dunks during the first quarter of the preseason game" },
    { ID: 12, description: "San Antonio Spurs forward Victor Wembanyama blocks a shot during the second quarter" },
    { ID: 13, description: "Spurs fans participate in on-court in-game activation Beach Ball Mania during the game" },
    { ID: 14, description: "Spurs fans participate in on-court in-game activation Beach Ball Mania during the game" },
  ];
  const tp = new Set<number>();
  const players = L.pickPhotos({ id: "p", label: "Player photo", collection: "Photos", max: 2, photo: "player" }, photos, tp, "Spurs vs Kings");
  check(players[0]?.headline === "WEMBANYAMA" && players[0].statLine === "Victor Wembanyama dunks, first quarter" && players.length === 2 && players[1].headline === "HARPER",
    `library: a captioned dunk beats a routine photo, one card per player (${players.map((x) => x.headline).join(", ")})`);
  const acts = L.pickPhotos({ id: "a", label: "Partner activation", collection: "Photos", max: 2, photo: "activation" }, photos, tp, "Spurs vs Kings");
  check(acts.length === 1 && acts[0].headline === "BEACH BALL MANIA", "library: one card per activation, even when the photographer shot it several times");
  check(L.interleave([[1, 2, 3], ["a"], ["x", "y"]]).join("") === "1ax2y3", "library: formats are interleaved so the inbox fills with a mix, not one block per type");

  // Tottenham: Premier League caption style ("<Name> of Tottenham Hotspur <action>"), real captions from ScorePlay
  const T = "Tottenham Hotspur";
  const thfc = JSON.parse(readFileSync("data/library/tottenham-hotspur.json", "utf8")) as import("../shared/library").LibraryPlan;
  const thfcMap = JSON.parse(readFileSync("data/footage-map.json", "utf8")) as { media: Partial<import("../shared/library").IndexedClip>[] };
  check(thfc.teamSeasonId === 72209 && thfc.team === T && thfc.formats.filter((f) => f.queries).every((f) => thfcMap.media.some((m) => m.collection === f.collection && m.twelvelabsVideoId)),
    "library: Tottenham's plan searches only collections that are in its TwelveLabs index, on its own season roster");
  check(!thfc.formats.some((f) => f.collection === "Full Match"), "library: Tottenham's library run never touches the full match (the live desk owns it)");
  const sol = L.captionPlayer("Dominic Solanke of Tottenham Hotspur scores a goal for their side to make it 1-1", T);
  check(sol?.name === "Dominic Solanke" && sol.action === "scores a goal for their side to make it 1-1", `library: Premier League caption names the player and the action (${JSON.stringify(sol)})`);
  check(L.captionPlayer("Micky van de Ven of Tottenham Hotspur (R) battles with Carlos Baleba of Manchester United (L)", T)?.name === "Micky van de Ven" && L.surnameOf("Micky van de Ven") === "VAN DE VEN",
    "library: (L)/(R) markers dropped; a Dutch surname keeps its particles (VAN DE VEN)");
  check(L.captionPlayer("The match shirt of Micky van de Ven of Tottenham Hotspur in the away dressing room", T) === null
    && L.captionPlayer("James Maddison of Tottenham Hotspur (L) and Archie Gray of Tottenham Hotspur (R) arrive", T) === null
    && L.captionPlayer("Tottenham Hotspur fans celebrate the full-time result", T) === null,
    "library: a shirt on a peg, a two-player arrival and a crowd shot are not credited to one player");
  const tp2 = new Set<number>();
  const thPhotos = [
    { ID: 1, description: "Dominic Solanke of Tottenham Hotspur arrives" },
    { ID: 2, description: "Sávio of Tottenham Hotspur shoots at goal but fails to score" },
    { ID: 3, description: "Dominic Solanke of Tottenham Hotspur scores a goal for their side to make it 1-1" },
    { ID: 4, description: "Tottenham Hotspur fans celebrate the full-time result" },
    { ID: 5, description: "Tottenham Hotspur fans celebrate the full-time result" },
    { ID: 6, description: "The match shirt of Marcos Senesi of Tottenham Hotspur in the away dressing room" },
  ];
  const thPlayers = L.pickPhotos({ id: "p", label: "Player photo", collection: "Match photos", max: 2, photo: "player" }, thPhotos, tp2, "Man Utd v Spurs", T);
  check(thPlayers.map((x) => `${x.headline}:${x.photo.ID}`).join(",") === "SOLANKE:3,SÁVIO:2",
    `library: the goal beats the arrival, a missed shot is not a 'strong' moment, one card per player (${thPlayers.map((x) => `${x.headline}:${x.photo.ID}`).join(",")})`);
  const fans = L.pickPhotos({ id: "f", label: "Fans photo", collection: "Match photos", max: 3, photo: "scene", captionMatch: "fans celebrate", headline: "THE AWAY END" }, thPhotos, tp2, "Man Utd v Spurs", T);
  const shirt = L.pickPhotos({ id: "d", label: "Dressing room", collection: "Dressing Room photos", max: 1, photo: "scene", captionMatch: "match shirt of", headline: "READY" }, thPhotos, tp2, "Man Utd v Spurs", T);
  check(fans.length === 1 && fans[0].headline === "THE AWAY END" && shirt[0]?.photo.ID === 6 && shirt[0].statLine.includes("Marcos Senesi"),
    "library: a scene card uses the photographer's caption as written; the same scene shot twice is one card");
  const ST = await import("../shared/smart-trim");
  const edge = ST.smartTrim({ beats: [{ label: "Player walking", start: 6, end: 15 }, { label: "Fast break and dunk", start: 15, end: 19 }, { label: "Walk back", start: 19, end: 27 }],
    analysed: { start: 6, end: 20.999 }, focus: { start: 9, end: 18 }, target: { label: "Instagram Reel", minSec: 6, maxSec: 15 } });
  check(edge.end <= 20.999 && edge.start >= 6, `smart trim: rounding never pushes a cut past the analysed footage (20.999 stays ${edge.end}, not 21.0) (found on a real San Antonio dunk)`);

  const { sourceLogRequest } = await import("../shared/approval");
  const photoOpp = { id: "o", orgId: "g", headline: "WEMBANYAMA", audience: "superfan", status: "approved", trimOverride: null, generatedCopy: {}, channels: ["instagram_feed"],
    delivery: { photo: true, tightWindow: { start: 0, end: 0 }, scoreplay: { mediaId: 130913016, companyId: 5366, mode: "live" } } };
  const r = sourceLogRequest(photoOpp as never, "rev", "editor");
  check(!r.ok && /photo card/.test(r.reason), "library: approving a photo card never writes a video log to ScorePlay");
}

console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
