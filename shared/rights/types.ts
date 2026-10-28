import { z } from "zod";
import { Channel } from "../schemas";

export const DistributionUse = z.enum(["owned_social", "owned_fan_web", "paid", "partner", "internal_preview"]);
export const RightsStatus = z.enum(["cleared", "needs_remediation", "needs_review", "blocked", "expired"]);

export const DestinationContextSchema = z.object({
  orgId: z.string().uuid(),
  platform: z.string().min(1),
  channel: Channel.optional(),
  territories: z.array(z.string().min(1)).default([]),
  use: DistributionUse,
  language: z.string().min(1).default("en"),
  releaseAt: z.string().datetime(),
  policyVersion: z.string().min(1),
});

export const RightsFindingSchema = z.object({
  ruleId: z.string().min(1),
  status: RightsStatus,
  rationale: z.string().min(1),
  evidence: z.array(z.object({
    source: z.string().min(1),
    startSec: z.number().optional(),
    endSec: z.number().optional(),
    value: z.unknown().optional(),
  })).default([]),
});

export const RightsDecisionSchema = z.object({
  id: z.string().uuid().optional(),
  orgId: z.string().uuid(),
  subjectType: z.enum(["asset", "moment", "opportunity", "publication", "variant"]),
  subjectId: z.string().min(1),
  context: DestinationContextSchema,
  status: RightsStatus,
  findings: z.array(RightsFindingSchema).default([]),
  ruleSetVersion: z.string().min(1),
  evaluatedAt: z.string().datetime(),
  validUntil: z.string().datetime().nullable().optional(),
  artifactHash: z.string().nullable().optional(),
});

export const RightsRecordSchema = z.object({
  mediaId: z.number().int().positive(),
  state: RightsStatus,
  completeness: z.enum(["complete", "incomplete", "absent", "conflict"]),
  fields: z.record(z.string(), z.unknown()).default({}),
  provenance: z.record(z.string(), z.enum(["existing_scoreplay", "inferred", "human_confirmed", "conflict"])).default({}),
  confirmedBy: z.string().nullable().optional(),
  confirmedAt: z.string().datetime().nullable().optional(),
});

export type DistributionUse = z.infer<typeof DistributionUse>;
export type RightsStatus = z.infer<typeof RightsStatus>;
export type DestinationContext = z.infer<typeof DestinationContextSchema>;
export type RightsFinding = z.infer<typeof RightsFindingSchema>;
export type RightsDecision = z.infer<typeof RightsDecisionSchema>;
export type RightsRecord = z.infer<typeof RightsRecordSchema>;
