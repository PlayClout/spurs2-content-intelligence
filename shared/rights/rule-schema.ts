import { z } from "zod";
import { RightsStatus } from "./types";

export const FactOperator = z.enum(["eq", "neq", "in", "includes", "exists", "gt", "gte", "lt", "lte"]);

export const FactConditionSchema = z.object({
  fact: z.string().min(1),
  op: FactOperator,
  value: z.unknown().optional(),
});

export type FactCondition = z.infer<typeof FactConditionSchema>;

export type Condition = FactCondition | { all: Condition[] } | { any: Condition[] } | { not: Condition };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() => z.union([
  FactConditionSchema,
  z.object({ all: z.array(ConditionSchema).min(1) }),
  z.object({ any: z.array(ConditionSchema).min(1) }),
  z.object({ not: ConditionSchema }),
]));

export const RuleDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  status: RightsStatus,
  severity: z.enum(["info", "warning", "block"]).default("warning"),
  scope: z.object({
    use: z.array(z.string()).optional(),
    platform: z.array(z.string()).optional(),
    territories: z.array(z.string()).optional(),
  }).default({}),
  condition: ConditionSchema,
  rationale: z.string().min(1),
  citation: z.string().optional(),
  remedies: z.array(z.string()).default([]),
});

export const RuleSetSchema = z.object({
  version: z.string().min(1),
  label: z.string().min(1),
  illustrative: z.boolean().default(true),
  rules: z.array(RuleDefSchema),
});

export type RuleDef = z.infer<typeof RuleDefSchema>;
export type RuleSet = z.infer<typeof RuleSetSchema>;

function collectFacts(c: Condition, out = new Set<string>()) {
  if ("fact" in c) out.add(c.fact);
  else if ("all" in c) c.all.forEach((x) => collectFacts(x, out));
  else if ("any" in c) c.any.forEach((x) => collectFacts(x, out));
  else collectFacts(c.not, out);
  return out;
}

export function lintRule(rule: RuleDef, allowedFacts: Set<string>) {
  const errors: string[] = [];
  for (const fact of collectFacts(rule.condition)) if (!allowedFacts.has(fact)) errors.push(`unknown fact '${fact}'`);
  if (rule.status === "cleared" && !rule.citation) errors.push("cleared rules require a citation");
  if (!rule.scope.use?.length && !rule.scope.platform?.length && !rule.scope.territories?.length) errors.push("rule must declare at least one scope field");
  return errors;
}
