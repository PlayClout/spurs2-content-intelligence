import { RightsDecisionSchema, type DestinationContext, type RightsDecision, type RightsFinding, type RightsStatus } from "./types";
import { RuleSetSchema, type Condition, type RuleDef, type RuleSet, lintRule } from "./rule-schema";
import rulesJson from "../../pipeline/rules/rights-rules.json" with { type: "json" };

export type RightsFacts = Record<string, unknown>;

export const FACTS = new Set([
  "rights.window.active",
  "rights.window.expired",
  "rights.policy.unknown",
  "content.audio.music",
  "content.brand.category",
  "content.brand.territoryRestricted",
  "content.analysis.truncated",
]);

const rank: Record<RightsStatus, number> = { cleared: 0, needs_remediation: 1, needs_review: 2, blocked: 3, expired: 4 };

function getFact(facts: RightsFacts, path: string) {
  return path.split(".").reduce<unknown>((v, k) => (v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined), facts);
}

function cmp(actual: unknown, op: string, expected: unknown) {
  if (op === "exists") return actual !== undefined && actual !== null;
  if (op === "eq") return actual === expected;
  if (op === "neq") return actual !== expected;
  if (op === "in") return Array.isArray(expected) && expected.includes(actual);
  if (op === "includes") return Array.isArray(actual) && actual.includes(expected);
  if (typeof actual !== "number" || typeof expected !== "number") return false;
  if (op === "gt") return actual > expected;
  if (op === "gte") return actual >= expected;
  if (op === "lt") return actual < expected;
  if (op === "lte") return actual <= expected;
  return false;
}

export function conditionMatches(c: Condition, facts: RightsFacts): boolean {
  if ("fact" in c) return cmp(getFact(facts, c.fact), c.op, c.value);
  if ("all" in c) return c.all.every((x) => conditionMatches(x, facts));
  if ("any" in c) return c.any.some((x) => conditionMatches(x, facts));
  return !conditionMatches(c.not, facts);
}

function inScope(rule: RuleDef, ctx: DestinationContext) {
  const s = rule.scope;
  if (s.use?.length && !s.use.includes(ctx.use)) return false;
  if (s.platform?.length && !s.platform.includes(ctx.platform)) return false;
  if (s.territories?.length && ctx.territories.length && !ctx.territories.some((t) => s.territories!.includes(t))) return false;
  return true;
}

export function evaluateRights(input: { orgId: string; subjectType: RightsDecision["subjectType"]; subjectId: string; context: DestinationContext; facts: RightsFacts; ruleSet?: RuleSet; artifactHash?: string | null }): RightsDecision {
  const ruleSet = RuleSetSchema.parse(input.ruleSet ?? rulesJson);
  const findings: RightsFinding[] = [];
  for (const rule of ruleSet.rules) {
    if (!rule.enabled || !inScope(rule, input.context)) continue;
    if (!conditionMatches(rule.condition, input.facts)) continue;
    findings.push({ ruleId: rule.id, status: rule.status, rationale: rule.rationale, evidence: [{ source: "facts", value: rule.condition }] });
  }
  const status = findings.reduce<RightsStatus>((acc, f) => (rank[f.status] > rank[acc] ? f.status : acc), "cleared");
  return RightsDecisionSchema.parse({
    orgId: input.orgId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    context: input.context,
    status,
    findings,
    ruleSetVersion: ruleSet.version,
    artifactHash: input.artifactHash ?? null,
    evaluatedAt: new Date().toISOString(),
    validUntil: null,
  });
}

export function lintRuleSet(ruleSet: RuleSet) {
  return Object.fromEntries(ruleSet.rules.map((r) => [r.id, lintRule(r, FACTS)]));
}

export function reevaluateRightsDecisions(input: { decisions: RightsDecision[]; factsBySubject: Record<string, RightsFacts>; ruleSet: RuleSet }) {
  return input.decisions.map((d) => {
    const key = `${d.subjectType}:${d.subjectId}`;
    return evaluateRights({
      orgId: d.orgId,
      subjectType: d.subjectType,
      subjectId: d.subjectId,
      context: d.context,
      facts: input.factsBySubject[key] ?? {},
      ruleSet: input.ruleSet,
      artifactHash: d.artifactHash ?? null,
    });
  });
}
