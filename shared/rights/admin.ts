/**
 * Rights rule administration (B2.13-B2.16, A4.7-A4.10). Pure: no DB, no network, no eval.
 * Draft edits are validated against the schema + fact registry before they can be saved; activation produces an
 * immutable versioned rule set; preview re-evaluates cached facts so a change is seen BEFORE it goes live.
 */
import { RuleDefSchema, RuleSetSchema, type RuleDef, type RuleSet } from "./rule-schema";
import { evaluateRights, FACTS, lintRuleSet, type RightsFacts } from "./engine";
import type { DestinationContext, RightsStatus } from "./types";

export const FACT_REGISTRY = [...FACTS].sort();

export type LintResult = { ok: true; rule: RuleDef } | { ok: false; errors: string[] };

/** Parse + schema-check + fact-registry lint one rule from untrusted JSON (the admin's editor). */
export function validateRuleJson(raw: string): LintResult {
  let data: unknown;
  try { data = JSON.parse(raw); } catch (e) { return { ok: false, errors: [`Invalid JSON: ${(e as Error).message}`] }; }
  const parsed = RuleDefSchema.safeParse(data);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "rule"}: ${i.message}`) };
  const errors = lintRuleSet({ version: "lint", label: "lint", illustrative: true, rules: [parsed.data] })[parsed.data.id] ?? [];
  const r = parsed.data;
  if (!/^[A-Z0-9][A-Z0-9-]{1,60}$/.test(r.id)) errors.push("id must be UPPERCASE letters, digits and dashes");
  if (r.citation !== undefined && r.citation.trim().length < 3) errors.push("citation is too short to be checkable");
  return errors.length ? { ok: false, errors } : { ok: true, rule: r };
}

/** Field-level JSON diff (audit trail). */
export function diffRules(before: RuleDef | null, after: RuleDef | null): Record<string, { from: unknown; to: unknown }> {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of keys) {
    const a = (before as Record<string, unknown> | null)?.[k];
    const b = (after as Record<string, unknown> | null)?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = { from: a ?? null, to: b ?? null };
  }
  return out;
}

export function nextVersionLabel(existing: string[]): string {
  const nums = existing.map((v) => Number(/^v(\d+)$/.exec(v)?.[1] ?? 0));
  return `v${Math.max(0, ...nums) + 1}`;
}

/** Build the immutable rule set to activate. Refuses to activate a set containing any lint error. */
export function buildRuleSet(version: string, rules: RuleDef[], label = "Illustrative demo rights rules - not club policy"): { ok: true; ruleSet: RuleSet } | { ok: false; errors: Record<string, string[]> } {
  const ruleSet = RuleSetSchema.parse({ version, label, illustrative: true, rules });
  const lint = lintRuleSet(ruleSet);
  const bad = Object.fromEntries(Object.entries(lint).filter(([, e]) => e.length));
  const ids = rules.map((r) => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) bad["(set)"] = [`duplicate rule ids: ${[...new Set(dupes)].join(", ")}`];
  return Object.keys(bad).length ? { ok: false, errors: bad } : { ok: true, ruleSet };
}

export interface PreviewSubject { key: string; label: string; context: DestinationContext; facts: RightsFacts }
export interface PreviewRow { key: string; label: string; before: RightsStatus; after: RightsStatus; changed: boolean; firedAfter: string[] }

/** Re-evaluate cached facts under the current and the candidate rule sets. Zero provider calls. */
export function previewRuleChange(current: RuleSet, candidate: RuleSet, subjects: PreviewSubject[]): PreviewRow[] {
  return subjects.map((s) => {
    const base = { orgId: s.context.orgId, subjectType: "asset" as const, subjectId: s.key, context: s.context, facts: s.facts };
    const a = evaluateRights({ ...base, ruleSet: current });
    const b = evaluateRights({ ...base, ruleSet: candidate });
    return { key: s.key, label: s.label, before: a.status, after: b.status, changed: a.status !== b.status, firedAfter: b.findings.map((f) => f.ruleId) };
  });
}

/** Illustrative sample media for preview: labelled SIMULATED, never written to ScorePlay (B2.12). */
export function samplePreviewSubjects(orgId: string, now = new Date()): PreviewSubject[] {
  const ctx = (territories: string[], use: DestinationContext["use"] = "owned_fan_web"): DestinationContext => ({
    orgId, platform: "fan_app", territories, use, language: "en", releaseAt: now.toISOString(), policyVersion: "preview",
  });
  return [
    { key: "sim-cleared", label: "SIMULATED: confirmed rights, clean audio", context: ctx(["GB"]), facts: { rights: { policy: { unknown: false }, window: { active: true, expired: false } }, content: { audio: { music: false }, analysis: { truncated: false } } } },
    { key: "sim-expired", label: "SIMULATED: rights window ended", context: ctx(["GB"]), facts: { rights: { policy: { unknown: false }, window: { active: false, expired: true } } } },
    { key: "sim-music", label: "SIMULATED: stadium music audible", context: ctx(["GB"]), facts: { rights: { policy: { unknown: false } }, content: { audio: { music: true } } } },
    { key: "sim-alcohol-fr", label: "SIMULATED: alcohol board, France release", context: ctx(["FR"]), facts: { rights: { policy: { unknown: false } }, content: { brand: { category: "alcohol" } } } },
    { key: "sim-alcohol-gb", label: "SIMULATED: alcohol board, UK release", context: ctx(["GB"]), facts: { rights: { policy: { unknown: false } }, content: { brand: { category: "alcohol" } } } },
    { key: "sim-gambling-gb", label: "SIMULATED: betting sponsor, UK release", context: ctx(["GB"]), facts: { rights: { policy: { unknown: false } }, content: { brand: { category: "gambling" } } } },
    { key: "sim-unknown", label: "SIMULATED: no rights metadata", context: ctx(["GB"]), facts: { rights: { policy: { unknown: true } } } },
    { key: "sim-truncated", label: "SIMULATED: AI analysis truncated", context: ctx(["GB"]), facts: { rights: { policy: { unknown: false } }, content: { analysis: { truncated: true } } } },
  ];
}
