import type { RightsRecord, RightsStatus } from "./types";

export type RightsFieldProvenance = "existing_scoreplay" | "inferred" | "human_confirmed" | "conflict";
export type Completeness = "complete" | "incomplete" | "absent" | "conflict";

export interface RightsFieldValue {
  value: unknown;
  provenance: RightsFieldProvenance;
  evidence?: { source: string; startSec?: number; endSec?: number; note?: string }[];
}

export type RightsFields = Record<string, RightsFieldValue>;

export const REQUIRED_RIGHTS_FIELDS = [
  "usage",
  "allowed_territories",
  "allowed_uses",
  "valid_from",
  "valid_until",
  "policy_version",
] as const;

export function assessCompleteness(fields: RightsFields, required = REQUIRED_RIGHTS_FIELDS): Completeness {
  if (!Object.keys(fields).length) return "absent";
  if (Object.values(fields).some((f) => f.provenance === "conflict")) return "conflict";
  return required.every((k) => fields[k]?.value !== undefined && fields[k]?.value !== null && fields[k]?.value !== "") ? "complete" : "incomplete";
}

/** Existing ScorePlay or human-confirmed values win. Inferred values only fill gaps; disagreements are conflicts. */
export function mergeRightsFields(existing: RightsFields, inferred: RightsFields): RightsFields {
  const out: RightsFields = { ...existing };
  for (const [k, v] of Object.entries(inferred)) {
    const prev = out[k];
    if (!prev || prev.value === undefined || prev.value === null || prev.value === "") { out[k] = v; continue; }
    if (JSON.stringify(prev.value) !== JSON.stringify(v.value) && prev.provenance !== "inferred") {
      out[k] = { value: { existing: prev.value, inferred: v.value }, provenance: "conflict", evidence: [...(prev.evidence ?? []), ...(v.evidence ?? [])] };
    }
  }
  return out;
}

export function stateFromCompleteness(completeness: Completeness): RightsStatus {
  if (completeness === "complete") return "cleared";
  if (completeness === "absent" || completeness === "conflict") return "needs_review";
  return "needs_review";
}

export function buildRightsRecord(mediaId: number, fields: RightsFields, confirmed?: { by: string; at: string }): RightsRecord {
  const completeness = assessCompleteness(fields);
  const flatFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));
  const provenance = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.provenance]));
  return {
    mediaId,
    state: stateFromCompleteness(completeness),
    completeness,
    fields: flatFields,
    provenance,
    confirmedBy: confirmed?.by ?? null,
    confirmedAt: confirmed?.at ?? null,
  };
}

export function buildRightsWritePayload(record: RightsRecord) {
  const hash = Buffer.from(JSON.stringify({ mediaId: record.mediaId, state: record.state, fields: record.fields })).toString("base64url").slice(0, 8);
  const marker = `[clout:rights:${record.mediaId}:${hash}]`;
  const tags = [`rights:${record.state}`, `rights:completeness:${record.completeness}`];
  return {
    marker,
    rawTags: tags,
    comment: `${record.state.toUpperCase()} rights record ${marker}; completeness=${record.completeness}; confirmed=${record.confirmedAt ? "yes" : "no"}`,
  };
}
