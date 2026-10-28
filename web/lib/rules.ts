"use server";

/**
 * Rights rules store (B2.13/B2.15/B2.16) behind the Rights Rules screen (A4.7-A4.10).
 *  - rights_rules: the editable DRAFT, one row per rule (definition = full rule JSON).
 *  - rights_rule_set_versions: IMMUTABLE activated snapshots. rule_ids holds the full rule objects, so a decision's
 *    pinned ruleSetVersion can always be re-read exactly as it was evaluated.
 *  - rights_rule_audits: who/when/JSON diff for every create, edit, toggle and activation.
 * Seeds v1 from pipeline/rules/rights-rules.json the first time the store is empty.
 */
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import rulesJson from "../../pipeline/rules/rights-rules.json" with { type: "json" };
import { RuleSetSchema, type RuleDef, type RuleSet } from "@shared/rights/rule-schema";
import { validateRuleJson, diffRules, buildRuleSet, nextVersionLabel, previewRuleChange, samplePreviewSubjects, FACT_REGISTRY } from "@shared/rights/admin";

const ACTOR = "operator"; // demo identity; real auth is post-hackathon

async function ensureSeeded() {
  const existing = await db.select({ id: s.rightsRules.id }).from(s.rightsRules).where(isNull(s.rightsRules.orgId)).limit(1);
  if (existing.length) return;
  const seed = RuleSetSchema.parse(rulesJson);
  for (const r of seed.rules) {
    await db.insert(s.rightsRules).values({ ruleId: r.id, orgId: null, enabled: r.enabled, definition: r }).onConflictDoNothing();
  }
  await db.insert(s.rightsRuleSetVersions).values({ orgId: null, version: "v1", label: seed.label, illustrative: true, ruleIds: seed.rules, activatedAt: new Date() }).onConflictDoNothing();
  await db.insert(s.rightsRuleAudits).values({ orgId: null, ruleId: "*", actor: "system", action: "seed_v1", diff: { from: rulesJson.version, rules: seed.rules.length } });
}

async function draftRules(): Promise<RuleDef[]> {
  const rows = await db.select().from(s.rightsRules).where(isNull(s.rightsRules.orgId)).orderBy(s.rightsRules.ruleId);
  return rows.map((r) => ({ ...(r.definition as RuleDef), enabled: r.enabled }));
}

export async function activeRuleSet(): Promise<RuleSet> {
  await ensureSeeded();
  const [v] = await db.select().from(s.rightsRuleSetVersions).where(and(isNull(s.rightsRuleSetVersions.orgId), isNotNull(s.rightsRuleSetVersions.activatedAt))).orderBy(desc(s.rightsRuleSetVersions.activatedAt)).limit(1);
  return RuleSetSchema.parse({ version: v.version, label: v.label, illustrative: v.illustrative, rules: v.ruleIds });
}

export async function rulesScreenData() {
  await ensureSeeded();
  const [draft, active, versions, audits] = await Promise.all([
    draftRules(),
    activeRuleSet(),
    db.select().from(s.rightsRuleSetVersions).where(isNull(s.rightsRuleSetVersions.orgId)).orderBy(desc(s.rightsRuleSetVersions.createdAt)),
    db.select().from(s.rightsRuleAudits).orderBy(desc(s.rightsRuleAudits.createdAt)).limit(40),
  ]);
  const activeById = new Map(active.rules.map((r) => [r.id, r]));
  const pending = draft.filter((r) => JSON.stringify(r) !== JSON.stringify(activeById.get(r.id))).map((r) => r.id);
  const removed = active.rules.filter((r) => !draft.some((d) => d.id === r.id)).map((r) => r.id);
  return {
    draft, active, factRegistry: FACT_REGISTRY, pendingChanges: [...pending, ...removed],
    versions: versions.map((v) => ({ version: v.version, label: v.label, ruleCount: (v.ruleIds as unknown[]).length, activatedAt: v.activatedAt?.toISOString() ?? null, current: v.version === active.version })),
    audits: audits.map((a) => ({ id: a.id, ruleId: a.ruleId, actor: a.actor, action: a.action, diff: a.diff, at: a.createdAt.toISOString() })),
  };
}

export async function saveRuleDraft(raw: string) {
  const v = validateRuleJson(raw);
  if (!v.ok) return { ok: false as const, errors: v.errors };
  const [prior] = await db.select().from(s.rightsRules).where(and(eq(s.rightsRules.ruleId, v.rule.id), isNull(s.rightsRules.orgId)));
  const before = prior ? ({ ...(prior.definition as RuleDef), enabled: prior.enabled }) : null;
  const diff = diffRules(before, v.rule);
  if (!Object.keys(diff).length) return { ok: true as const, message: "No changes" };
  if (prior) await db.update(s.rightsRules).set({ definition: v.rule, enabled: v.rule.enabled }).where(eq(s.rightsRules.id, prior.id));
  else await db.insert(s.rightsRules).values({ ruleId: v.rule.id, orgId: null, enabled: v.rule.enabled, definition: v.rule });
  await db.insert(s.rightsRuleAudits).values({ orgId: null, ruleId: v.rule.id, actor: ACTOR, action: prior ? "edit_draft" : "create_draft", diff });
  revalidatePath("/settings");
  return { ok: true as const, message: prior ? "Draft updated (not live until activated)" : "Rule added to draft (not live until activated)" };
}

export async function toggleRuleDraft(ruleId: string, enabled: boolean) {
  const [prior] = await db.select().from(s.rightsRules).where(and(eq(s.rightsRules.ruleId, ruleId), isNull(s.rightsRules.orgId)));
  if (!prior) return { ok: false as const, errors: ["Rule not found"] };
  if (prior.enabled === enabled) return { ok: true as const, message: "No change" };
  await db.update(s.rightsRules).set({ enabled, definition: { ...(prior.definition as RuleDef), enabled } }).where(eq(s.rightsRules.id, prior.id));
  await db.insert(s.rightsRuleAudits).values({ orgId: null, ruleId, actor: ACTOR, action: enabled ? "enable_draft" : "disable_draft", diff: { enabled: { from: prior.enabled, to: enabled } } });
  revalidatePath("/settings");
  return { ok: true as const, message: `${ruleId} ${enabled ? "enabled" : "disabled"} in draft` };
}

/** Preview the draft against the active set on SIMULATED sample media. Zero provider calls. */
export async function previewDraft() {
  const [active, draft] = await Promise.all([activeRuleSet(), draftRules()]);
  const candidate = buildRuleSet("draft", draft);
  if (!candidate.ok) return { ok: false as const, errors: candidate.errors };
  const [org] = await db.select({ id: s.orgs.id }).from(s.orgs).limit(1);
  const rows = previewRuleChange(active, candidate.ruleSet, samplePreviewSubjects(org?.id ?? "3f1d2c4b-8a7e-4b6f-9c2d-1e5a7b9c0d11"));
  return { ok: true as const, rows };
}

/**
 * Activate: immutable snapshot + audit. Decisions made after this pin the new version.
 * Re-evaluating EXISTING stored decisions (B2.16) is not wired here: current stored decisions (fan-catalog publish)
 * carry no cached fact snapshot to re-run. The pure re-evaluation function exists (reevaluateRightsDecisions) and is
 * tested; it needs a facts column on rights_decisions before this action can call it.
 */
export async function activateDraft() {
  const draft = await draftRules();
  const versions = await db.select({ version: s.rightsRuleSetVersions.version }).from(s.rightsRuleSetVersions).where(isNull(s.rightsRuleSetVersions.orgId));
  const version = nextVersionLabel(versions.map((v) => v.version));
  const built = buildRuleSet(version, draft);
  if (!built.ok) return { ok: false as const, errors: built.errors };
  const before = await activeRuleSet();
  await db.insert(s.rightsRuleSetVersions).values({ orgId: null, version, label: built.ruleSet.label, illustrative: true, ruleIds: built.ruleSet.rules, activatedAt: new Date() });
  const changed = Object.fromEntries(draft.flatMap((r) => {
    const d = diffRules(before.rules.find((x) => x.id === r.id) ?? null, r);
    return Object.keys(d).length ? [[r.id, d]] : [];
  }));
  await db.insert(s.rightsRuleAudits).values({ orgId: null, ruleId: "*", actor: ACTOR, action: `activate_${version}`, diff: { from: before.version, to: version, changed } });
  revalidatePath("/settings");
  return { ok: true as const, message: `Activated ${version} (${built.ruleSet.rules.length} rules). New decisions pin ${version}.` };
}
