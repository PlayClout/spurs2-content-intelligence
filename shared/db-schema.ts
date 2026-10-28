/**
 * Drizzle schema — mirrors shared/schemas.ts (zod = source of truth for shapes).
 * Org-scoped from day one. Realtime is enabled on `opportunities`.
 */
import { pgTable, uuid, text, real, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";

export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sport: text("sport").notNull(), // basketball | soccer
  league: text("league").notNull(),
  brandTokens: jsonb("brand_tokens"),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  source: text("source").notNull(), // scoreplay | upload | fixture
  sourceRef: text("source_ref"),
  sport: text("sport").notNull(),
  title: text("title").notNull(),
  filePath: text("file_path").notNull(),
  durationSec: real("duration_sec"),
  twelvelabsVideoId: text("twelvelabs_video_id"),
  indexStatus: text("index_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("assets_org_idx").on(t.orgId)]);

export const moments = pgTable("moments", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  label: text("label").notNull(),
  description: text("description").notNull(),
  startSec: real("start_sec").notNull(),
  endSec: real("end_sec").notNull(),
  confidence: real("confidence").notNull(),
  detector: text("detector").notNull(), // marengo_search | pegasus_analyze
  raw: jsonb("raw"),
}, (t) => [index("moments_asset_idx").on(t.assetId)]);

export const signals = pgTable("signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  kind: text("kind").notNull(), // game_event | social_reaction | context
  simulated: boolean("simulated").notNull().default(false), // honesty flag, surfaced in UI
  sport: text("sport").notNull(),
  payload: jsonb("payload").notNull(),
  eventText: text("event_text").notNull(),
  weight: real("weight").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  momentId: uuid("moment_id").references(() => moments.id),
}, (t) => [index("signals_org_idx").on(t.orgId)]);

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  dedupeKey: text("dedupe_key").notNull(),
  momentId: uuid("moment_id").notNull().references(() => moments.id),
  signalIds: jsonb("signal_ids").notNull().default([]),
  sport: text("sport").notNull(),
  audience: text("audience").notNull(),
  contentType: text("content_type").notNull(),
  channels: jsonb("channels").notNull().default([]),
  score: real("score").notNull(),
  scoreBreakdown: jsonb("score_breakdown").notNull(),
  headline: text("headline").notNull(),
  generatedCopy: jsonb("generated_copy").notNull().default({}),
  compliance: jsonb("compliance").notNull(),
  status: text("status").notNull().default("draft_pending"),
  rejectReason: text("reject_reason"),
  draftPaths: jsonb("draft_paths").notNull().default({}),
  finalPaths: jsonb("final_paths").notNull().default({}),
  trimOverride: jsonb("trim_override"),
  /** delivery evidence: ScorePlay write-back (video log / upload) results or exact would-send payloads, render timings */
  delivery: jsonb("delivery"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("opportunities_dedupe_uq").on(t.dedupeKey), index("opportunities_org_status_idx").on(t.orgId, t.status)]);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status").notNull().default("queued"),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  // stage-transition latency telemetry from hour one (architecture.md latency budget)
  queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (t) => [index("jobs_status_idx").on(t.status)]);

// Measurement: schema'd now, populated post-event
export const publishedAssets = pgTable("published_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id),
  channel: text("channel").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  externalRef: text("external_ref"),
});

// A2 contracts: fan catalog + rights metadata. These are metadata-only tables; no media bytes.
export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  displayName: text("display_name").notNull(),
  sport: text("sport").notNull(),
  scoreplayPlayerId: integer("scoreplay_player_id"),
  aliases: jsonb("aliases").notNull().default([]),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("players_org_idx").on(t.orgId), uniqueIndex("players_scoreplay_uq").on(t.orgId, t.scoreplayPlayerId)]);

export const fanProfiles = pgTable("fan_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  label: text("label").notNull(),
  demo: boolean("demo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("fan_profiles_org_idx").on(t.orgId)]);

export const fanPreferences = pgTable("fan_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => fanProfiles.id),
  favoritePlayerIds: jsonb("favorite_player_ids").notNull().default([]),
  interestTags: jsonb("interest_tags").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("fan_preferences_profile_uq").on(t.profileId)]);

export const publications = pgTable("publications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  currentVersionId: uuid("current_version_id"),
  state: text("state").notNull().default("preparing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("publications_org_state_idx").on(t.orgId, t.state)]);

export const publicationVersions = pgTable("publication_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicationId: uuid("publication_id").notNull().references(() => publications.id),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  version: integer("version").notNull(),
  state: text("state").notNull().default("preparing"),
  approvedRevisionHash: text("approved_revision_hash").notNull(),
  artifactId: text("artifact_id").notNull(),
  artifactHash: text("artifact_hash").notNull(),
  renderPath: text("render_path").notNull(),
  twelvelabsAssetId: text("twelvelabs_asset_id"),
  indexedAssetId: text("indexed_asset_id"),
  durationSec: real("duration_sec").notNull(),
  sourceRanges: jsonb("source_ranges").notNull().default([]),
  featuredPlayerIds: jsonb("featured_player_ids").notNull().default([]),
  interestTags: jsonb("interest_tags").notNull().default([]),
  claimIds: jsonb("claim_ids").notNull().default([]),
  rightsDecisionId: uuid("rights_decision_id"),
  destination: jsonb("destination").notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("publication_versions_uq").on(t.publicationId, t.version), index("publication_versions_org_state_idx").on(t.orgId, t.state)]);

export const rightsRules = pgTable("rights_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: text("rule_id").notNull(),
  orgId: uuid("org_id").references(() => orgs.id),
  enabled: boolean("enabled").notNull().default(true),
  definition: jsonb("definition").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("rights_rules_rule_org_uq").on(t.ruleId, t.orgId)]);

export const rightsRuleSetVersions = pgTable("rights_rule_set_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => orgs.id),
  version: text("version").notNull(),
  label: text("label").notNull(),
  illustrative: boolean("illustrative").notNull().default(true),
  ruleIds: jsonb("rule_ids").notNull().default([]),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("rights_rule_set_version_uq").on(t.orgId, t.version)]);

export const rightsRuleAudits = pgTable("rights_rule_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => orgs.id),
  ruleId: text("rule_id").notNull(),
  actor: text("actor"),
  action: text("action").notNull(),
  diff: jsonb("diff").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("rights_rule_audits_rule_idx").on(t.ruleId)]);

export const rightsDecisions = pgTable("rights_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  context: jsonb("context").notNull(),
  status: text("status").notNull(),
  ruleSetVersion: text("rule_set_version").notNull(),
  artifactHash: text("artifact_hash"),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
}, (t) => [index("rights_decisions_subject_idx").on(t.orgId, t.subjectType, t.subjectId)]);

export const rightsFindings = pgTable("rights_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  decisionId: uuid("decision_id").notNull().references(() => rightsDecisions.id),
  ruleId: text("rule_id").notNull(),
  status: text("status").notNull(),
  rationale: text("rationale").notNull(),
  evidence: jsonb("evidence").notNull().default([]),
}, (t) => [index("rights_findings_decision_idx").on(t.decisionId)]);

export const rightsRecords = pgTable("rights_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  scoreplayMediaId: integer("scoreplay_media_id").notNull(),
  state: text("state").notNull(),
  completeness: text("completeness").notNull(),
  fields: jsonb("fields").notNull().default({}),
  provenance: jsonb("provenance").notNull().default({}),
  confirmedBy: text("confirmed_by"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("rights_records_media_uq").on(t.orgId, t.scoreplayMediaId)]);

export const approvalAudits = pgTable("approval_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  actor: text("actor"),
  action: text("action").notNull(),
  reasonCode: text("reason_code"),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("approval_audits_opp_idx").on(t.opportunityId)]);

export const writeBackJobs = pgTable("write_back_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => orgs.id),
  /** sha256 of (org, kind, media, revision, ref): retries and re-approvals can never create a second job */
  idempotencyKey: text("idempotency_key").notNull(),
  kind: text("kind").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status").notNull().default("held"),
  externalRef: text("external_ref"),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("write_back_jobs_status_idx").on(t.orgId, t.status), uniqueIndex("write_back_jobs_key_uq").on(t.idempotencyKey)]);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const performanceSnapshots = pgTable("performance_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  publishedAssetId: uuid("published_asset_id").notNull().references(() => publishedAssets.id),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  metrics: jsonb("metrics").notNull().default({}),
});
