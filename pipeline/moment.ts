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
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync, createWriteStream } from "node:fs";
import { pipeline as streamPipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import * as sp from "../shared/clients/scoreplay";
import { restrictionsFromScorePlay } from "../shared/clients/scoreplay-rights";
import { evaluate } from "../shared/compliance";
import { evaluateContent, type ContentVerdict } from "../shared/content-rules";
import { MANIFEST_PROMPT, PEGASUS_MANIFEST_SCHEMA, parseManifest, type MomentManifest } from "../shared/moment-manifest";
import { getRenderBackend } from "./render-backend";
import { paddedWindow, probeDuration } from "./render-local";
import { uploadRenderDir } from "../shared/storage";
import type { Channel } from "../shared/schemas";
import type { CaptionText } from "./overlay";

/** Render output lives OUTSIDE web/public: Next production only serves public/ files present at startup, so
 * renders made during the demo would 404. web/app/renders/[...path]/route.ts serves this dir at request time. */
export const OUT_ROOT = process.env.RENDER_OUT_DIR ?? "out/renders";
const PUBLIC_PREFIX = "/renders"; // URL prefix served by the route handler
const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
/** absolute directory for a moment's renders: the ONE place drafts and finals for a slug live */
export const renderDir = (slug: string) => join(OUT_ROOT.startsWith("/") ? OUT_ROOT : join(REPO_ROOT, OUT_ROOT), slug);
export const publicPathFor = (slug: string, file: string) => `${PUBLIC_PREFIX}/${slug}/${file.split("/").pop()}`;

export interface MomentInput {
  orgKey: string; // club-themes key
  competition: string; // "NBA Regular Season" | "Premier League" | ...
  scorePlayMediaId: number;
  startSec: number; // trigger-supplied rough window (absolute source seconds)
  endSec: number;
  headline: string;
  kicker?: string;
  statLine?: string;
  /** what triggered it, for the explainability panel */
  trigger: { kind: "game_event" | "social_reaction" | "ai_watchlist"; text: string; simulated: boolean };
  twelvelabsAssetId?: string; // when the source is already uploaded to TwelveLabs
  /** recorded manifest fixture to use when TwelveLabs is not live (path relative to repo root) */
  manifestFixture?: string;
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
  manifestMode: "live" | "recorded-fixture";
  window: { start: number; end: number };
  tightWindow: { start: number; end: number };
  content: ContentVerdict;
  scoreplay: { mode: sp.Mode; mediaId: number; companyId: number; eventId?: number; rightsFieldsUsed: string[] };
  variants: Variant[];
  compliance: { channel: Channel; status: string; reasons: string[] }[];
}

const abs = (p: string) => (p.startsWith("/") ? p : join(REPO_ROOT, p));

async function resolveSource(mediaId: number, outDir: string) {
  const media = (await sp.getMedia(mediaId)).data;
  const fm = await sp.downloadFormats(mediaId);
  const best = sp.bestSource(fm.data, "video");
  if (!best?.file_url) throw new Error(`ScorePlay media ${mediaId}: no downloadable video file (check can_do_media_download)`);
  let local: string;
  if (best.file_url.startsWith("file:")) local = fileURLToPath(best.file_url);
  else {
    local = join(outDir, `source-${mediaId}${best.file_name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".mp4"}`);
    if (!existsSync(local)) {
      const res = await fetch(best.file_url);
      if (!res.ok || !res.body) throw new Error(`download ${mediaId} -> ${res.status}`);
      await streamPipeline(Readable.fromWeb(res.body as never), createWriteStream(local));
    }
  }
  return { media, mode: fm.mode, local };
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

const REEL_CHANNELS: Channel[] = ["instagram_reel", "tiktok", "youtube_short"];
const CARD_CHANNELS: Channel[] = ["instagram_feed", "x_photo"];

export async function processMoment(input: MomentInput, slug: string): Promise<ProcessedMoment> {
  const outDir = renderDir(slug);
  await mkdir(outDir, { recursive: true });

  // 1) source + ScorePlay rights fields
  const src = await resolveSource(input.scorePlayMediaId, outDir);
  const srcDur = await probeDuration(src.local);

  // 2) one windowed TwelveLabs analyze around the trigger
  const window = paddedWindow(input.startSec, input.endSec, srcDur, 3);
  const { manifest, mode: manifestMode } = await analyzeWindow(input, window);
  const tight = tighten(manifest, window);
  const renderWin = paddedWindow(tight.start, tight.end, srcDur);

  // 3) rights: what the AI saw (content rules) + ScorePlay fields -> per-channel gate
  const content = evaluateContent(manifest, { orgKey: input.orgKey, competition: input.competition, eventDate: src.media.date ? new Date(src.media.date * 1000).toISOString() : undefined }, [...REEL_CHANNELS, ...CARD_CHANNELS]);
  const spRestrictions = restrictionsFromScorePlay(src.media);
  const allChannels = [...REEL_CHANNELS, ...CARD_CHANNELS];
  const gate = evaluate(allChannels, [...content.restrictions, ...spRestrictions]);
  const compliance = allChannels.map((c) => ({
    channel: c,
    status: gate.allowedChannels.includes(c) ? gate.status : "blocked",
    reasons: gate.reasons,
  }));

  // 4) drafts: two audiences, two formats, club brand
  const backend = await getRenderBackend();
  const caption: CaptionText = { kicker: input.kicker, headline: input.headline };
  const reel = await backend.render({
    orgId: input.orgKey, sourcePath: src.local, startSec: renderWin.start, endSec: renderWin.end,
    channel: "instagram_reel", caption: input.headline, cropXOffset: manifest.subjectX, mode: "draft",
    ...({ club: input.orgKey, captionText: caption, outDir, slug: "reel", renderActions: content.renderActions } as object),
  } as never) as Awaited<ReturnType<typeof backend.render>> & { audioMuted?: boolean };
  const peak = manifest.moments.length ? (manifest.moments[0].start + manifest.moments[0].end) / 2 : (renderWin.start + renderWin.end) / 2;
  const card = await backend.render({
    orgId: input.orgKey, sourcePath: src.local, startSec: tight.start, endSec: tight.end,
    channel: "instagram_feed", mode: "final", cropXOffset: manifest.subjectX,
    ...({ club: input.orgKey, captionText: caption, outDir, slug: "card", statLine: input.statLine, grabAtSec: peak } as object),
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
  await uploadRenderDir(slug, outDir); // s3 mode: push drafts to the bucket so any worker/UI serves them; no-op locally

  return {
    manifest, manifestMode, window, tightWindow: tight, content,
    scoreplay: {
      mode: src.mode, mediaId: src.media.ID, companyId: src.media.company_id, eventId: src.media.event_id,
      rightsFieldsUsed: spRestrictions.map((r) => r.rule.match(/\(ScorePlay media \d+: ([a-z_]+)/)?.[1] ?? r.kind),
    },
    variants, compliance,
  };
}
