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

export const performanceSnapshots = pgTable("performance_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  publishedAssetId: uuid("published_asset_id").notNull().references(() => publishedAssets.id),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  metrics: jsonb("metrics").notNull().default({}),
});
