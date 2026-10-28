/**
 * Moment processing: one ranked moment -> analyzed, rights-checked, drafted opportunities (2 audiences, 2 formats).
 *
 *   resolveSource   ScorePlay media (live|fixture) -> rights fields + a renderable source file
 *   analyzeWindow   TwelveLabs Pegasus 1.6, ONE windowed analyze -> MomentManifest (live, or recorded fixture)
 *   rights          content rules (what the AI saw) + ScorePlay rights fields -> compliance gate per opportunity
 *   drafts          9:16 reel (casual / global) + photo card (superfan / core) in club brand, via RenderBackend
 *
 * Honesty: every input records whether it was real or simulated in `opportunity.delivery.inputs`.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync, createWriteStream } from "node:fs";
import { pipeline as streamPipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { join, basename, dirname } from "node:path";
import * as sp from "../shared/clients/scoreplay";
import { restrictionsFromScorePlay } from "../shared/clients/scoreplay-rights";
import { evaluate } from "../shared/compliance";
import { evaluateContent, type ContentVerdict } from "../shared/content-rules";
import { MANIFEST_PROMPT, PEGASUS_MANIFEST_SCHEMA, parseManifest, type MomentManifest } from "../shared/moment-manifest";
import { getRenderBackend } from "./render-backend";
import { paddedWindow, probeDuration, END_MARGIN_SEC } from "./render-local";
import { storageMode } from "../shared/storage";
import type { Channel } from "../shared/schemas";
import type { CaptionText } from "./overlay";
import { cutLiveSource, analysisCopy, loadLiveMatch, sourceWindowOf } from "./live-source";
import { captionFacts, liveHeadline, VERIFY_TYPES, type LiveMatch, type Verification } from "../shared/live-match";
import { beatsFrom, stillAt } from "../shared/smart-trim";

/** Render output lives OUTSIDE web/public: Next production only serves public/ files present at startup, so
 * renders made during the demo would 404. web/app/renders/[...path]/route.ts serves this dir at request time. */
export const OUT_ROOT = process.env.RENDER_OUT_DIR ?? "out/renders";
const PUBLIC_PREFIX = "/renders"; // URL prefix served by the route handler
const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
/** absolute directory for a moment's renders: the ONE place drafts and finals for a slug live */
export const renderDir = (slug: string) => join(OUT_ROOT.startsWith("/") ? OUT_ROOT : join(REPO_ROOT, OUT_ROOT), slug);
export const publicPathFor = (slug: string, file: string) => `${PUBLIC_PREFIX}/${slug}/${file.split("/").pop()}`;

export interface MomentInput {
  teamSeasonId?: number; // explicit current roster, never infer season from a filename
  orgKey: string; // club-themes key
  competition: string; // "NBA Regular Season" | "Premier League" | ...
  scorePlayMediaId: number;
  startSec: number; // trigger-supplied rough window (absolute source seconds)
  endSec: number;
  headline: string;
  kicker?: string;
  statLine?: string;
  /** what triggered it, for the explainability panel */
  trigger: { kind: "game_event" | "social_reaction" | "ai_watchlist"; text: string; simulated: boolean;
    mode?: "live" | "replay" | "fixture";
    evidence?: { provider: string; observedAtReplaySec: number; currentCount: number; baselineCount: number; windowSec: number; synthetic: true };
  };
  twelvelabsAssetId?: string; // when the source is already uploaded to TwelveLabs
  /** recorded manifest fixture to use when TwelveLabs is not live (path relative to repo root) */
  manifestFixture?: string;
  /** set when the source is a LIVE full match: cut just this window off the stream, verify the moment with Pegasus,
   * and only keep it when it is a real highlight for the club (see shared/live-match.liveHeadline) */
  live?: { sessionId: string; matchId: string; cut: { start: number; end: number }; verify: boolean; scoreSec?: number };
  /** library mode: which kind of club footage this is (game action, player voice, partner activation, player photo) */
  format?: { id: string; label: string };
  /** set when the source is a ScorePlay PHOTO: one branded card from the photographer's own image and caption (no video) */
  photo?: { caption: string };
}

/** Thrown when a live moment turns out not to be worth a clip (not a highlight, opponent's moment, booking...). The
 * worker records it on the live log; it is a decision, not a failure. */
export class SkipMoment extends Error {
  constructor(readonly reason: string, readonly verification?: Verification) { super(`skipped: ${reason}`); }
}

export interface Variant {
  audience: "casual" | "superfan";
  contentType: "reel" | "milestone_graphic";
  channels: Channel[];
  previewChannel: Channel;
  publicPath: string;
  posterPublicPath: string;
  renderMs: number;
  durationSec: number;
  audioMuted?: boolean;
  why: string;
}

export interface ProcessedMoment {
  manifest: MomentManifest;
  requiresReview: boolean;
  rightsInputs: sp.RightsInputs;
  featuredPlayerIds: string[];
  manifestMode: "live" | "recorded-fixture";
  window: { start: number; end: number };
  tightWindow: { start: number; end: number };
  content: ContentVerdict;
  scoreplay: { mode: sp.Mode; mediaId: number; companyId: number; eventId?: number; rightsFieldsUsed: string[] };
  variants: Variant[];
  compliance: { channel: Channel; status: string; reasons: string[] }[];
  /** live moments only: what Pegasus confirmed, the club headline it earned, the cut it came from, timings */
  live?: { verification: Verification | null; headline: string; kicker: string; label: string; cut: { start: number; end: number }; cutMs: number; analyzeMs: number; proxy: string };
  /** true when the source was a ScorePlay photo (one card, no video analysis) */
  photo?: boolean;
}

const abs = (p: string) => (p.startsWith("/") ? p : join(REPO_ROOT, p));

/** Fetch a renderable source for a ScorePlay media (the brief: "fetch the proxy, keep work on your machine").
 * Downloads are TRANSIENT working copies named source-<id>.* : callers delete them with releaseSource() as soon as
 * their render is done, and storage.ts never uploads them. Club footage is not ours to keep (hackathon rule: content
 * stays on the platform). Exported so render_final can re-fetch on whichever worker picks the job up. */
export async function resolveSource(mediaId: number, outDir: string) {
  const media = (await sp.getMedia(mediaId)).data;
  const fm = await sp.downloadFormats(mediaId);
  const best = sp.bestSource(fm.data, "video");
  if (!best?.file_url) throw new Error(`ScorePlay media ${mediaId}: no downloadable video file (check can_do_media_download)`);
  let local: string;
  let downloaded = false;
  if (best.file_url.startsWith("file:")) local = fileURLToPath(best.file_url);
  else {
    await mkdir(outDir, { recursive: true });
    local = join(outDir, `source-${mediaId}${best.file_name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp4"}`);
    if (!existsSync(local)) {
      const res = await fetch(best.file_url);
      if (!res.ok || !res.body) throw new Error(`download ${mediaId} -> ${res.status}`);
      try {
        await streamPipeline(Readable.fromWeb(res.body as never), createWriteStream(local));
      } catch (error) {
        await rm(local, { force: true });
        throw error;
      }
    }
    downloaded = true;
  }
  return { media, mode: fm.mode, local, downloaded };
}

/** Delete a transient source copy (no-op for repo/local fixture files). Safe to call twice. */
export async function releaseSource(src: { local: string; downloaded: boolean }) {
  if (src.downloaded && basename(src.local).startsWith("source-")) await rm(src.local, { force: true });
}

/** Source for a later render of an existing clip (final, channel versions, montage). A live-match clip re-cuts just
 * its analysed window off the stream; anything else resolves the whole (short) ScorePlay clip. `offsetSec` maps the
 * clip's absolute times onto the working copy. */
export async function sourceForRender(mediaId: number, outDir: string, delivery: unknown) {
  const cut = sourceWindowOf(delivery);
  if (cut) return cutLiveSource(mediaId, cut, outDir);
  if ((delivery as { photo?: boolean } | null)?.photo) return { ...(await resolvePhoto(mediaId, outDir)), offsetSec: 0 };
  return { ...(await resolveSource(mediaId, outDir)), offsetSec: 0 };
}

/** Transient copy of a ScorePlay PHOTO original (deleted by releaseSource, exactly like a video source). */
export async function resolvePhoto(mediaId: number, outDir: string) {
  const media = (await sp.getMedia(mediaId)).data;
  const fm = await sp.downloadFormats(mediaId);
  const best = sp.bestSource(fm.data, "photo");
  if (!best?.file_url) throw new Error(`ScorePlay media ${mediaId}: no downloadable photo`);
  await mkdir(outDir, { recursive: true });
  const local = join(outDir, `source-${mediaId}${best.file_name?.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg"}`);
  if (best.file_url.startsWith("file:")) await writeFile(local, await readFile(fileURLToPath(best.file_url)));
  else {
    const res = await fetch(best.file_url);
    if (!res.ok) throw new Error(`photo download ${mediaId} -> ${res.status}`);
    await writeFile(local, Buffer.from(await res.arrayBuffer()));
  }
  return { media, mode: fm.mode, local, downloaded: true };
}

async function analyzeWindow(input: MomentInput, window: { start: number; end: number }): Promise<{ manifest: MomentManifest; mode: "live" | "recorded-fixture" }> {
  const live = !!process.env.TWELVELABS_API_KEY && process.env.MOCK_MODE !== "1" && !!input.twelvelabsAssetId;
  if (live) {
    const res = await fetch("https://api.twelvelabs.io/v1.3/analyze", {
      method: "POST",
      headers: { "x-api-key": process.env.TWELVELABS_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: "pegasus1.6",
        video: { type: "asset_id", asset_id: input.twelvelabsAssetId },
        prompt: MANIFEST_PROMPT,
        response_format: { type: "json_schema", json_schema: PEGASUS_MANIFEST_SCHEMA },
        start_time: window.start,
        end_time: window.end,
        temperature: 0.1,
        max_tokens: 2048,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`TwelveLabs analyze -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return { manifest: parseManifest(await res.json(), window.start), mode: "live" };
  }
  if (!input.manifestFixture) throw new Error("TwelveLabs not live and no manifestFixture given");
  const rec = JSON.parse(await readFile(abs(input.manifestFixture), "utf8"));
  return { manifest: parseManifest(rec.response, rec.request.start_time), mode: "recorded-fixture" };
}

/** Tight window = union of the manifest's moments, clamped to the analyzed window; padded for render. */
function tighten(m: MomentManifest, w: { start: number; end: number }) {
  if (!m.moments.length) return w;
  const s = Math.max(w.start, Math.min(...m.moments.map((x) => x.start)));
  const e = Math.min(w.end, Math.max(...m.moments.map((x) => x.end)));
  return e > s ? { start: s, end: e } : w;
}

// ── live analysis: Pegasus on just the cut window, plus a highlight verdict ─────────────
/** Pegasus can't analyse a source over 60 minutes (the full match is 105), so a live moment is analysed from its own
 * short cut (sent as a low-bitrate copy). Same manifest as every other clip, plus a verdict used to decide whether the
 * club should post it at all. */
export const liveVerdictSchema = () => ({
  ...PEGASUS_MANIFEST_SCHEMA,
  properties: {
    ...PEGASUS_MANIFEST_SCHEMA.properties,
    verdict: {
      type: "object",
      properties: {
        isHighlight: { type: "boolean" },
        type: { type: "string", enum: [...VERIFY_TYPES] },
        team: { type: "string", enum: ["home", "away", "unclear"] },
        description: { type: "string" },
        confidence: { type: "number" },
        actionX: { type: "number" },
      },
      required: ["isHighlight", "type", "team", "description", "confidence", "actionX"],
    },
  },
  required: [...PEGASUS_MANIFEST_SCHEMA.required, "verdict"],
});
export const livePrompt = (m: LiveMatch) => [
  MANIFEST_PROMPT,
  `verdict: is this clip a real highlight of ${m.home.name} v ${m.away.name}? home = ${m.home.name} (${m.home.kit}), away = ${m.away.name} (${m.away.kit}).`,
  "type: goal (the ball goes in), shot_saved (a goalkeeper saves a shot), woodwork (a shot hits the post or bar), big_chance (a clear shot or chance that misses), card (the referee shows a card), celebration (players celebrating), none (ordinary play, studio, crowd, replays of something not in this clip).",
  "team: the ATTACKING side, decided by the shirts of the player who shoots or scores (not by who is celebrating or who is in close-up); a goalkeeper always belongs to the DEFENDING side. For a card, the booked player's side; unclear if you cannot tell from the kits.",
  "isHighlight: true only if the action is clearly visible in this clip. description: one plain sentence that follows the naming rule above. confidence: 0 to 1.",
  "actionX: horizontal position of the BALL at the decisive instant (the save, the ball crossing the line, the shot hitting the woodwork), from 0 (far left of the frame) to 1 (far right); 0.5 if unclear.",
].join("\n");

function parseVerdict(raw: unknown): Verification | null {
  const v = (raw as { verdict?: Partial<Verification> } | null)?.verdict;
  if (!v || typeof v.isHighlight !== "boolean" || !VERIFY_TYPES.includes(v.type as never) || !["home", "away", "unclear"].includes(v.team as string)) return null;
  const ax = Number(v.actionX);
  return { isHighlight: v.isHighlight, type: v.type!, team: v.team!, description: String(v.description ?? ""), confidence: Math.max(0, Math.min(1, Number(v.confidence) || 0)),
    ...(Number.isFinite(ax) ? { actionX: Math.max(0, Math.min(1, ax)) } : {}) };
}

async function analyzeLive(local: string, window: { start: number; end: number }, offsetSec: number, m: LiveMatch) {
  if (!process.env.TWELVELABS_API_KEY || process.env.MOCK_MODE === "1") throw new Error("live match mode needs a live TwelveLabs key");
  const ana = join(dirname(local), `${basename(local, ".mp4")}-ana.mp4`);
  try {
    await analysisCopy(local, window.start - offsetSec, window.end - offsetSec, ana);
    const t0 = performance.now();
    const res = await fetch("https://api.twelvelabs.io/v1.3/analyze", {
      method: "POST",
      headers: { "x-api-key": process.env.TWELVELABS_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: "pegasus1.6",
        video: { type: "base64_string", base64_string: (await readFile(ana)).toString("base64") },
        prompt: livePrompt(m),
        response_format: { type: "json_schema", json_schema: liveVerdictSchema() },
        temperature: 0.1, max_tokens: 2048, stream: false,
      }),
    });
    if (!res.ok) throw new Error(`TwelveLabs analyze -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = await res.json() as { data?: string; finish_reason?: string };
    const analyzeMs = Math.round(performance.now() - t0);
    // timestamps come back relative to the clip sent; shift them to absolute full-match seconds
    const manifest = parseManifest(body, window.start);
    let verification: Verification | null = null;
    try { verification = parseVerdict(JSON.parse(body.data ?? "{}")); } catch { verification = null; }
    return { manifest, mode: "live" as const, verification, analyzeMs };
  } finally {
    await rm(ana, { force: true });
  }
}

const REEL_CHANNELS: Channel[] = ["instagram_reel", "tiktok", "youtube_short"];
const CARD_CHANNELS: Channel[] = ["instagram_feed", "x_photo"];

/** A ScorePlay PHOTO -> one branded card. The image is the club photographer's original; the facts (who, what,
 * which partner) come from the photographer's caption, never from faces or ScorePlay's player tags. Video
 * understanding does not apply to a still, so there is no Pegasus call and no reel; the rights gate is the same. */
async function processPhoto(input: MomentInput, slug: string, outDir: string): Promise<ProcessedMoment> {
  const src = await resolvePhoto(input.scorePlayMediaId, outDir);
  const { media, mode, local } = src;
  try {
    const caption = input.photo!.caption;
    // the caption is what the photographer saw: it is the manifest for a still (no detections are invented)
    const manifest: MomentManifest = {
      summary: caption, moments: [], subjectX: 0.5, detectedSponsors: [], identifiablePeople: [], competitionMarkings: [],
      crowdPrivacy: { facesVisible: /\bfans?\b/i.test(caption), closeUps: false }, audioRisks: [], onScreenText: [],
      analysisStatus: "checked", suggestedUse: input.format?.label ?? "Photo card",
    };
    const rightsInputs = await sp.getRightsInputs(input.scorePlayMediaId, { teamSeasonId: input.teamSeasonId });
    const requiresReview = rightsInputs.status === "needs_review";
    const content = evaluateContent(manifest, { orgKey: input.orgKey, competition: input.competition, eventDate: media.date ? new Date(media.date * 1000).toISOString() : undefined }, CARD_CHANNELS);
    const spRestrictions = restrictionsFromScorePlay(media);
    const gate = evaluate(CARD_CHANNELS, [...content.restrictions, ...spRestrictions]);
    const compliance = CARD_CHANNELS.map((c) => ({
      channel: c, status: !requiresReview && gate.allowedChannels.includes(c) ? gate.status : "blocked",
      reasons: requiresReview ? [...gate.reasons, "Needs review: incomplete ScorePlay rights evidence"] : gate.reasons,
    }));
    const backend = await getRenderBackend();
    const card = await backend.render({
      orgId: input.orgKey, sourcePath: local, startSec: 0, endSec: 1, channel: "instagram_feed", mode: "final", cropXOffset: 0.5,
      ...({ club: input.orgKey, captionText: { kicker: input.kicker, headline: input.headline }, outDir, slug: "card", statLine: input.statLine, stillPath: local } as object),
    } as never);
    const variant: Variant = {
      audience: "superfan", contentType: "milestone_graphic", channels: CARD_CHANNELS, previewChannel: "instagram_feed",
      publicPath: publicPathFor(slug, card.outPath), posterPublicPath: publicPathFor(slug, card.outPath), renderMs: card.renderMs, durationSec: 0,
      why: input.format?.id === "partner_activation"
        ? "Partner activations are sponsor inventory: a branded card proves the activation ran and gives the partner something to share."
        : "Core supporters share the still: the club photographer's best frame, named from the photographer's own caption.",
    };
    const win = { start: 0, end: 1 }; // a still has no time; a nominal 1s window keeps every window check meaningful
    await writeFile(join(outDir, "manifest.json"), JSON.stringify({ manifest, manifestMode: "photo", content, compliance }, null, 2));
    return {
      manifest, manifestMode: "live", window: win, tightWindow: win, content, requiresReview, rightsInputs, featuredPlayerIds: [],
      scoreplay: { mode, mediaId: media.ID, companyId: media.company_id, eventId: media.event_id,
        rightsFieldsUsed: spRestrictions.map((r) => r.rule.match(/\(ScorePlay media \d+: ([a-z_]+)/)?.[1] ?? r.kind) },
      variants: [variant], compliance, photo: true,
    };
  } finally {
    await releaseSource(src);
  }
}

export async function processMoment(input: MomentInput, slug: string): Promise<ProcessedMoment> {
  storageMode();
  const outDir = renderDir(slug);
  await mkdir(outDir, { recursive: true });
  if (input.photo) return processPhoto(input, slug, outDir);

  // 1) source + ScorePlay rights fields. A live full match is never downloaded whole: only this moment's window is
  //    cut off the stream. Times stay absolute; `off` maps them onto the working copy.
  const match = input.live ? await loadLiveMatch(input.live.matchId) : null;
  const tCut = performance.now();
  const src = input.live ? await cutLiveSource(input.scorePlayMediaId, input.live.cut, outDir) : { ...(await resolveSource(input.scorePlayMediaId, outDir)), offsetSec: 0, proxy: "" };
  const cutMs = Math.round(performance.now() - tCut);
  const off = src.offsetSec;
  try {
    const srcDur = await probeDuration(src.local);

    // 2) one windowed TwelveLabs analyze around the trigger (live: the whole cut, which IS the analysed window)
    const window = match ? { start: off, end: Math.floor((off + srcDur - END_MARGIN_SEC) * 1000) / 1000 } : paddedWindow(input.startSec, input.endSec, srcDur, 3);
    const analysed = match ? await analyzeLive(src.local, window, off, match) : { ...(await analyzeWindow(input, window)), verification: null, analyzeMs: 0 };
    const { manifest, mode: manifestMode } = analysed;

    // 2b) live: is it a real highlight for the club? Not -> stop here (a decision, logged; nothing is drafted)
    let headline = input.headline, kicker = input.kicker, label = input.trigger.kind === "game_event" ? "Goal" : "Moment";
    if (match && input.live) {
      const goalRecorded = match.feed.some((e) => e.type === "goal" && e.at >= window.start - 5 && e.at <= window.end + 5);
      if (input.live.verify) {
        const d = analysed.verification ? liveHeadline(match, analysed.verification, goalRecorded) : { post: false as const, reason: "the analysis gave no verdict" };
        if (!d.post) throw new SkipMoment(d.reason, analysed.verification ?? undefined);
        headline = d.headline; label = d.label;
      }
      kicker = captionFacts(match, Math.max(window.start, input.startSec), input.live.scoreSec ?? window.end).kicker;
    }

    const rightsInputs = await sp.getRightsInputs(input.scorePlayMediaId, { teamSeasonId: input.teamSeasonId });
    const requiresReview = manifest.analysisStatus !== "checked" || rightsInputs.status === "needs_review";
    // Populated by editor-confirmed clip metadata, never copied from a whole-match roster or guessed from names.
    const featuredPlayerIds: string[] = [];
    const tight = tighten(manifest, window);
    const renderWin = paddedWindow(tight.start - off, tight.end - off, srcDur); // relative to the working copy

    // 3) rights: what the AI saw (content rules) + ScorePlay fields -> per-channel gate
    const content = evaluateContent(manifest, { orgKey: input.orgKey, competition: input.competition, eventDate: src.media.date ? new Date(src.media.date * 1000).toISOString() : undefined }, [...REEL_CHANNELS, ...CARD_CHANNELS]);
    const spRestrictions = restrictionsFromScorePlay(src.media);
    const allChannels = [...REEL_CHANNELS, ...CARD_CHANNELS];
    const gate = evaluate(allChannels, [...content.restrictions, ...spRestrictions]);
    const compliance = allChannels.map((c) => ({
      channel: c,
      status: !requiresReview && gate.allowedChannels.includes(c) ? gate.status : "blocked",
      reasons: requiresReview ? [...gate.reasons, "Needs review: incomplete analysis or ScorePlay rights evidence"] : gate.reasons,
    }));

    // 4) drafts: two audiences, two formats, club brand
    const backend = await getRenderBackend();
    const caption: CaptionText = { kicker, headline };
    const reel = await backend.render({
      orgId: input.orgKey, sourcePath: src.local, startSec: renderWin.start, endSec: renderWin.end,
      channel: "instagram_reel", caption: headline, cropXOffset: manifest.subjectX, mode: "draft",
      ...({ club: input.orgKey, captionText: caption, outDir, slug: "reel", renderActions: content.renderActions } as object),
    } as never) as Awaited<ReturnType<typeof backend.render>> & { audioMuted?: boolean };
    // the still is late in the live action beat (keeper diving, ball going in), never a replay or reaction shot
    const peak = stillAt(beatsFrom(manifest, window), { start: input.startSec, end: input.endSec }, tight);
    const card = await backend.render({
      orgId: input.orgKey, sourcePath: src.local, startSec: tight.start - off, endSec: tight.end - off,
      channel: "instagram_feed", mode: "final", cropXOffset: analysed.verification?.actionX ?? manifest.subjectX,
      ...({ club: input.orgKey, captionText: caption, outDir, slug: "card", statLine: input.statLine, grabAtSec: peak - off } as object),
    } as never);

    const pub = (p: string) => publicPathFor(slug, p);
    const variants: Variant[] = [
      {
        audience: "casual", contentType: "reel", channels: REEL_CHANNELS, previewChannel: "instagram_reel",
        publicPath: pub(reel.outPath), posterPublicPath: pub(reel.posterPath), renderMs: reel.renderMs, durationSec: reel.durationSec, audioMuted: reel.audioMuted,
        why: "Casual and global fans discover moments in sound-off vertical feeds: short, captioned, action kept in frame.",
      },
      {
        audience: "superfan", contentType: "milestone_graphic", channels: CARD_CHANNELS, previewChannel: "instagram_feed",
        publicPath: pub(card.outPath), posterPublicPath: pub(card.outPath), renderMs: card.renderMs, durationSec: 0,
        why: "Core supporters share the still: a branded card with the stat line travels in feeds, group chats and X.",
      },
    ];
    await writeFile(join(outDir, "manifest.json"), JSON.stringify({ manifest, manifestMode, window, tight, content, compliance }, null, 2));

    return {
      manifest, manifestMode, window, tightWindow: tight, content, requiresReview, rightsInputs, featuredPlayerIds,
      scoreplay: {
        mode: src.mode, mediaId: src.media.ID, companyId: src.media.company_id, eventId: src.media.event_id,
        rightsFieldsUsed: spRestrictions.map((r) => r.rule.match(/\(ScorePlay media \d+: ([a-z_]+)/)?.[1] ?? r.kind),
      },
      variants, compliance,
      ...(input.live ? { live: { verification: analysed.verification, headline, kicker: kicker ?? "", label, cut: window, cutMs, analyzeMs: analysed.analyzeMs, proxy: src.proxy } } : {}),
    };
  } finally {
    await releaseSource(src);
  }
}
