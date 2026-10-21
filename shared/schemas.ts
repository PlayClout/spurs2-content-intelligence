/**
 * Single source of truth for all data shapes.
 * Used by: Drizzle rows, TwelveLabs Pegasus json_schema calls, mock fixtures, React props.
 */
import { z } from "zod";

/** Multi-tenant from day one: every row is org-scoped. Spurs = org 1, Tottenham = org 2. */
export const OrgSchema = z.object({
  id: z.string().uuid(),
  name: z.string(), // "San Antonio Spurs", "Tottenham Hotspur"
  sport: z.enum(["basketball", "soccer"]),
  league: z.string(), // "NBA", "Premier League"
  brandTokens: z.record(z.string(), z.string()).optional(), // per-org theming
});

export const Sport = z.enum(["basketball", "soccer"]);
export const Audience = z.enum(["casual", "superfan", "regional", "international", "player_community", "sponsor"]);
export const ContentType = z.enum(["highlight_clip", "reel", "story", "x_post", "youtube_short", "youtube_highlight", "score_graphic", "milestone_graphic"]);
export const Channel = z.enum(["instagram_reel", "instagram_story", "tiktok", "x_post", "youtube_short", "youtube_highlight", "instagram_feed", "x_photo"]);

export const AssetSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  source: z.enum(["scoreplay", "upload", "fixture"]),
  sourceRef: z.string().nullable(), // ScorePlay asset id when real
  sport: Sport,
  title: z.string(),
  filePath: z.string(),
  durationSec: z.number().nullable(),
  twelvelabsVideoId: z.string().nullable(),
  indexStatus: z.enum(["pending", "indexing", "ready", "failed"]).default("pending"),
  createdAt: z.coerce.date(),
});

/** Shape ALSO used as the Pegasus /analyze json_schema response format. */
export const MomentSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  label: z.string(), // "dunk", "goal", "celebration", "crowd_eruption"
  description: z.string(),
  startSec: z.number(),
  endSec: z.number(),
  confidence: z.number().min(0).max(1),
  detector: z.enum(["marengo_search", "pegasus_analyze"]),
  raw: z.unknown().optional(),
});

export const SignalSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  kind: z.enum(["game_event", "social_reaction", "context"]),
  simulated: z.boolean(), // HONESTY FLAG — surfaced in UI
  sport: Sport,
  payload: z.record(z.string(), z.unknown()),
  eventText: z.string(), // used as Marengo correlation query
  weight: z.number().min(0).max(1),
  occurredAt: z.coerce.date(),
  momentId: z.string().uuid().nullable(), // set by fusion
});

export const ComplianceSchema = z.object({
  rightsSource: z.string(), // "scoreplay_metadata" | "mock"
  territories: z.array(z.string()),
  platformsAllowed: z.array(Channel),
  sponsorRestrictions: z.array(z.string()),
  expiresAt: z.coerce.date().nullable(),
  status: z.enum(["cleared", "restricted", "blocked", "unknown"]),
  reasons: z.array(z.string()), // explainability
});

export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  dedupeKey: z.string(), // hash(videoId, window±5s, contentType)
  momentId: z.string().uuid(),
  signalIds: z.array(z.string().uuid()),
  sport: Sport,
  audience: Audience,
  contentType: ContentType,
  channels: z.array(Channel),
  score: z.number(),
  scoreBreakdown: z.object({
    momentConfidence: z.number(),
    eventWeight: z.number(),
    socialVelocity: z.number(),
    recencyDecay: z.number(),
    audienceFit: z.number(),
  }),
  headline: z.string(),
  generatedCopy: z.record(z.string(), z.string()), // per-channel
  compliance: ComplianceSchema,
  status: z.enum(["draft_pending", "draft_ready", "approved", "rejected", "rendering", "rendered", "exported", "expired"]),
  rejectReason: z.string().nullable(),
  draftPaths: z.record(z.string(), z.string()), // channel -> rough-cut file
  finalPaths: z.record(z.string(), z.string()), // channel -> final variant
  trimOverride: z.object({ startSec: z.number(), endSec: z.number() }).nullable(),
  delivery: z.record(z.string(), z.unknown()).nullable().optional(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const JobSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["index_asset", "sweep_moments", "fuse_signals", "score_opportunities", "process_moment", "render_draft", "render_final", "export_bundle"]),
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(["queued", "running", "done", "failed"]),
  error: z.string().nullable(),
  attempts: z.number().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Measurement: schema'd now, populated post-event (learning loop storage is real from day one). */
export const PublishedAssetSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  opportunityId: z.string().uuid(),
  channel: Channel,
  publishedAt: z.coerce.date().nullable(),
  externalRef: z.string().nullable(),
});

export const PerformanceSnapshotSchema = z.object({
  id: z.string().uuid(),
  publishedAssetId: z.string().uuid(),
  capturedAt: z.coerce.date(),
  metrics: z.record(z.string(), z.number()), // views, likes, shares, watch_pct
});

export type Channel = z.infer<typeof Channel>;
export type Audience = z.infer<typeof Audience>;
export type ContentType = z.infer<typeof ContentType>;
export type Org = z.infer<typeof OrgSchema>;
export type PublishedAsset = z.infer<typeof PublishedAssetSchema>;
export type PerformanceSnapshot = z.infer<typeof PerformanceSnapshotSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Moment = z.infer<typeof MomentSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type Compliance = z.infer<typeof ComplianceSchema>;
export type Opportunity = z.infer<typeof OpportunitySchema>;
export type Job = z.infer<typeof JobSchema>;
