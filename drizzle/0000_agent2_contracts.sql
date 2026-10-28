-- Agent #2 incremental contracts migration.
-- Apply after merging PR #7. This intentionally creates ONLY the new A2 tables, not a full baseline.
-- Human applies; agents do not run this against production/shared DB without approval.

CREATE TABLE IF NOT EXISTS "players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "display_name" text NOT NULL,
  "sport" text NOT NULL,
  "scoreplay_player_id" integer,
  "aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "players_org_idx" ON "players" ("org_id");
CREATE UNIQUE INDEX IF NOT EXISTS "players_scoreplay_uq" ON "players" ("org_id", "scoreplay_player_id");

CREATE TABLE IF NOT EXISTS "fan_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "label" text NOT NULL,
  "demo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "fan_profiles_org_idx" ON "fan_profiles" ("org_id");

CREATE TABLE IF NOT EXISTS "fan_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "fan_profiles"("id"),
  "favorite_player_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "interest_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "fan_preferences_profile_uq" ON "fan_preferences" ("profile_id");

CREATE TABLE IF NOT EXISTS "publications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "opportunity_id" uuid REFERENCES "opportunities"("id"),
  "current_version_id" uuid,
  "state" text DEFAULT 'preparing' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "publications_org_state_idx" ON "publications" ("org_id", "state");

CREATE TABLE IF NOT EXISTS "publication_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "publication_id" uuid NOT NULL REFERENCES "publications"("id"),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "version" integer NOT NULL,
  "state" text DEFAULT 'preparing' NOT NULL,
  "approved_revision_hash" text NOT NULL,
  "artifact_id" text NOT NULL,
  "artifact_hash" text NOT NULL,
  "render_path" text NOT NULL,
  "twelvelabs_asset_id" text,
  "indexed_asset_id" text,
  "duration_sec" real NOT NULL,
  "source_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "featured_player_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "interest_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "claim_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "rights_decision_id" uuid,
  "destination" jsonb NOT NULL,
  "valid_from" timestamp with time zone NOT NULL,
  "valid_until" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "publication_versions_uq" ON "publication_versions" ("publication_id", "version");
CREATE INDEX IF NOT EXISTS "publication_versions_org_state_idx" ON "publication_versions" ("org_id", "state");

CREATE TABLE IF NOT EXISTS "rights_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rule_id" text NOT NULL,
  "org_id" uuid REFERENCES "orgs"("id"),
  "enabled" boolean DEFAULT true NOT NULL,
  "definition" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "rights_rules_rule_org_uq" ON "rights_rules" ("rule_id", "org_id");

CREATE TABLE IF NOT EXISTS "rights_rule_set_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid REFERENCES "orgs"("id"),
  "version" text NOT NULL,
  "label" text NOT NULL,
  "illustrative" boolean DEFAULT true NOT NULL,
  "rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "activated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "rights_rule_set_version_uq" ON "rights_rule_set_versions" ("org_id", "version");

CREATE TABLE IF NOT EXISTS "rights_rule_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid REFERENCES "orgs"("id"),
  "rule_id" text NOT NULL,
  "actor" text,
  "action" text NOT NULL,
  "diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "rights_rule_audits_rule_idx" ON "rights_rule_audits" ("rule_id");

CREATE TABLE IF NOT EXISTS "rights_decisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "subject_type" text NOT NULL,
  "subject_id" text NOT NULL,
  "context" jsonb NOT NULL,
  "status" text NOT NULL,
  "rule_set_version" text NOT NULL,
  "artifact_hash" text,
  "evaluated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "valid_until" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "rights_decisions_subject_idx" ON "rights_decisions" ("org_id", "subject_type", "subject_id");

CREATE TABLE IF NOT EXISTS "rights_findings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "decision_id" uuid NOT NULL REFERENCES "rights_decisions"("id"),
  "rule_id" text NOT NULL,
  "status" text NOT NULL,
  "rationale" text NOT NULL,
  "evidence" jsonb DEFAULT '[]'::jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS "rights_findings_decision_idx" ON "rights_findings" ("decision_id");

CREATE TABLE IF NOT EXISTS "rights_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "scoreplay_media_id" integer NOT NULL,
  "state" text NOT NULL,
  "completeness" text NOT NULL,
  "fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "confirmed_by" text,
  "confirmed_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "rights_records_media_uq" ON "rights_records" ("org_id", "scoreplay_media_id");

CREATE TABLE IF NOT EXISTS "approval_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "opportunity_id" uuid REFERENCES "opportunities"("id"),
  "actor" text,
  "action" text NOT NULL,
  "reason_code" text,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "approval_audits_opp_idx" ON "approval_audits" ("opportunity_id");

CREATE TABLE IF NOT EXISTS "write_back_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id"),
  "idempotency_key" text NOT NULL,
  "kind" text NOT NULL,
  "subject_type" text NOT NULL,
  "subject_id" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'held' NOT NULL,
  "external_ref" text,
  "error" text,
  "attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "write_back_jobs_status_idx" ON "write_back_jobs" ("org_id", "status");
-- Added after the table's first draft: CREATE TABLE IF NOT EXISTS skips an existing table, so add the column explicitly.
ALTER TABLE "write_back_jobs" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
UPDATE "write_back_jobs" SET "idempotency_key" = "id"::text WHERE "idempotency_key" IS NULL;
ALTER TABLE "write_back_jobs" ALTER COLUMN "idempotency_key" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "write_back_jobs_key_uq" ON "write_back_jobs" ("idempotency_key");

CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
