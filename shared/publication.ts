import { z } from "zod";
import { DestinationContextSchema, type DestinationContext } from "./rights/types";

export const PublicationState = z.enum(["preparing", "scheduled", "published", "withdrawn", "expired"]);

export const PublicationVersionSchema = z.object({
  id: z.string().uuid().optional(),
  publicationId: z.string().uuid().optional(),
  version: z.number().int().positive(),
  orgId: z.string().uuid(),
  state: PublicationState,
  approvedRevisionHash: z.string().min(1),
  artifactId: z.string().min(1),
  artifactHash: z.string().min(1),
  renderPath: z.string().min(1),
  twelveLabsAssetId: z.string().nullable().optional(),
  indexedAssetId: z.string().nullable().optional(),
  durationSec: z.number().nonnegative(),
  featuredPlayerIds: z.array(z.string()).default([]),
  interestTags: z.array(z.string()).default([]),
  claimIds: z.array(z.string()).default([]),
  rightsDecisionId: z.string().uuid(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().nullable().optional(),
  destination: DestinationContextSchema,
});

export type PublicationState = z.infer<typeof PublicationState>;
export type PublicationVersion = z.infer<typeof PublicationVersionSchema>;

export function publicationStateAt(version: Pick<PublicationVersion, "state" | "validFrom" | "validUntil">, now = new Date()): PublicationState {
  if (version.state === "withdrawn") return "withdrawn";
  if (version.state === "preparing") return "preparing";
  const from = new Date(version.validFrom);
  if (from.getTime() > now.getTime()) return "scheduled";
  if (version.validUntil && new Date(version.validUntil).getTime() <= now.getTime()) return "expired";
  return version.state === "published" ? "published" : version.state;
}

export function rightsStatusAllowsFanDistribution(status: "cleared" | "needs_remediation" | "needs_review" | "blocked" | "expired" | "unknown") {
  return status === "cleared";
}

export function canViewPublication(version: PublicationVersion, viewer: { orgId: string; territory?: string; use?: DestinationContext["use"] }, now = new Date()) {
  const state = publicationStateAt(version, now);
  if (state !== "published") return { ok: false as const, reason: state };
  if (viewer.orgId !== version.orgId) return { ok: false as const, reason: "wrong_org" };
  if (viewer.use && viewer.use !== version.destination.use) return { ok: false as const, reason: "wrong_use" };
  if (viewer.territory && version.destination.territories.length && !version.destination.territories.includes(viewer.territory)) {
    return { ok: false as const, reason: "territory_blocked" };
  }
  return { ok: true as const, reason: "ok" };
}
