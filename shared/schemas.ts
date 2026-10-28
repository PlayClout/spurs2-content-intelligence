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

export const DistributionUse = z.enum(["owned_social", "owned_fan_web", "paid", "partner", "internal_preview"]);
export const RightsStatus = z.enum(["cleared", "needs_remediation", "needs_review", "blocked", "expired"]);
export const PublicationState = z.enum(["preparing", "scheduled", "published", "withdrawn", "expired"]);

export const DestinationContextSchema = z.object({
  orgId: z.string().uuid(),
  platform: z.string(),
  channel: Channel.optional(),
  territories: z.array(z.string()).default([]),
  use: DistributionUse,
  language: z.string().default("en"),
  releaseAt: z.string().datetime(),
  policyVersion: z.string(),
});

export const PlayerSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  displayName: z.string(),
  sport: Sport,
  scoreplayPlayerId: z.number().int().nullable(),
  aliases: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const FanProfileSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  label: z.string(),
  demo: z.boolean().default(true),
});

export const FanPreferenceSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  favoritePlayerIds: z.array(z.string().uuid()).default([]),
  interestTags: z.array(z.string()).default([]),
});

export const PublicationSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  currentVersionId: z.string().uuid().nullable(),
  state: PublicationState,
});

export const PublicationVersionSchema = z.object({
  id: z.string().uuid(),
  publicationId: z.string().uuid(),
  orgId: z.string().uuid(),
  version: z.number().int().positive(),
  state: PublicationState,
  approvedRevisionHash: z.string(),
  artifactId: z.string(),
  artifactHash: z.string(),
  renderPath: z.string(),
  twelvelabsAssetId: z.string().nullable(),
  indexedAssetId: z.string().nullable(),
  durationSec: z.number().nonnegative(),
  sourceRanges: z.array(z.record(z.string(), z.unknown())).default([]),
  featuredPlayerIds: z.array(z.string().uuid()).default([]),
  interestTags: z.array(z.string()).default([]),
  claimIds: z.array(z.string()).default([]),
  rightsDecisionId: z.string().uuid().nullable(),
  destination: DestinationContextSchema,
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().nullable(),
});

export const RightsFindingSchema = z.object({
  id: z.string().uuid().optional(),
  ruleId: z.string(),
  status: RightsStatus,
  rationale: z.string(),
  evidence: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const RightsRuleSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string(),
  orgId: z.string().uuid().nullable(),
  enabled: z.boolean(),
  definition: z.record(z.string(), z.unknown()),
});

export const RightsRuleSetVersionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid().nullable(),
  version: z.string(),
  label: z.string(),
  illustrative: z.boolean(),
  ruleIds: z.array(z.string()),
  activatedAt: z.coerce.date().nullable(),
});

export const RightsRuleAuditSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid().nullable(),
  ruleId: z.string(),
  actor: z.string().nullable(),
  action: z.string(),
  diff: z.record(z.string(), z.unknown()),
});

export const RightsDecisionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  subjectType: z.enum(["asset", "moment", "opportunity", "publication", "variant"]),
  subjectId: z.string(),
  context: DestinationContextSchema,
  status: RightsStatus,
  ruleSetVersion: z.string(),
  artifactHash: z.string().nullable(),
  findings: z.array(RightsFindingSchema).default([]),
  evaluatedAt: z.coerce.date(),
  validUntil: z.coerce.date().nullable(),
});

export const RightsRecordTableSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  scoreplayMediaId: z.number().int(),
  state: RightsStatus,
  completeness: z.enum(["complete", "incomplete", "absent", "conflict"]),
  fields: z.record(z.string(), z.unknown()),
  provenance: z.record(z.string(), z.unknown()),
  confirmedBy: z.string().nullable(),
  confirmedAt: z.coerce.date().nullable(),
});

export const ApprovalAuditSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  actor: z.string().nullable(),
  action: z.string(),
  reasonCode: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export const WriteBackJobSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  kind: z.string(),
  subjectType: z.string(),
  subjectId: z.string(),
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(["held", "pending", "synced", "failed"]),
  externalRef: z.string().nullable(),
  error: z.string().nullable(),
  attempts: z.number().int(),
});

export const AppSettingSchema = z.object({
  key: z.string(),
  value: z.record(z.string(), z.unknown()),
});

export type Channel = z.infer<typeof Channel>;
export type Audience = z.infer<typeof Audience>;
export type ContentType = z.infer<typeof ContentType>;
export type Org = z.infer<typeof OrgSchema>;
export type PublishedAsset = z.infer<typeof PublishedAssetSchema>;
export type PerformanceSnapshot = z.infer<typeof PerformanceSnapshotSchema>;
export type DistributionUse = z.infer<typeof DistributionUse>;
export type RightsStatus = z.infer<typeof RightsStatus>;
export type DestinationContext = z.infer<typeof DestinationContextSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type FanProfile = z.infer<typeof FanProfileSchema>;
export type FanPreference = z.infer<typeof FanPreferenceSchema>;
export type Publication = z.infer<typeof PublicationSchema>;
export type PublicationVersion = z.infer<typeof PublicationVersionSchema>;
export type RightsFinding = z.infer<typeof RightsFindingSchema>;
export type RightsRule = z.infer<typeof RightsRuleSchema>;
export type RightsRuleSetVersion = z.infer<typeof RightsRuleSetVersionSchema>;
export type RightsRuleAudit = z.infer<typeof RightsRuleAuditSchema>;
export type RightsDecision = z.infer<typeof RightsDecisionSchema>;
export type RightsRecordTable = z.infer<typeof RightsRecordTableSchema>;
export type ApprovalAudit = z.infer<typeof ApprovalAuditSchema>;
export type WriteBackJob = z.infer<typeof WriteBackJobSchema>;
export type AppSetting = z.infer<typeof AppSettingSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Moment = z.infer<typeof MomentSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type Compliance = z.infer<typeof ComplianceSchema>;
export type Opportunity = z.infer<typeof OpportunitySchema>;
export type Job = z.infer<typeof JobSchema>;
