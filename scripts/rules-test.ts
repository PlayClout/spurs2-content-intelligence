/**
 * Content rules tests.
 *   npx tsx scripts/rules-test.ts
 * A: golden file — rights-desk expected-decisions.json (verdict, triggered rules, allowed/blocked uses, reasons).
 * B: integration with the compliance hard gate (evaluate()) on real Channel ids.
 * C: manifest schema — parse a Pegasus-shaped response; reject a malformed one.
 */
import { readFileSync } from "node:fs";
import { evaluateContent } from "../shared/content-rules";
import { evaluate } from "../shared/compliance";
import { parseManifest, PEGASUS_MANIFEST_SCHEMA } from "../shared/moment-manifest";
import { evaluateRights, lintRuleSet, reevaluateRightsDecisions } from "../shared/rights/engine";
import rightsRuleSet from "../pipeline/rules/rights-rules.json" with { type: "json" };
import { assessCompleteness, buildRightsRecord, buildRightsWritePayload, mergeRightsFields } from "../shared/rights/metadata";
import { RuleSetSchema } from "../shared/rights/rule-schema";
import { validateRuleJson, buildRuleSet, previewRuleChange, samplePreviewSubjects, diffRules, nextVersionLabel } from "../shared/rights/admin";

let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const assets = read("data/rights-fixtures/sample-assets.json") as { id: string; club: string; competition: string; eventDate: string; platformsRequested: string[] }[];
const manifests = read("data/rights-fixtures/sample-video-manifests.json");
const expected = read("data/rights-fixtures/expected-decisions.json");
const orgKey = (club: string) => (club === "Tottenham Hotspur" ? "tottenham-hotspur" : "san-antonio-spurs");
const same = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// ── A: golden decisions ────────────────────────────────────────────────────────────────
for (const a of assets) {
  const v = evaluateContent(manifests[a.id], { orgKey: orgKey(a.club), competition: a.competition, eventDate: a.eventDate }, a.platformsRequested);
  const e = expected[a.id];
  check(v.verdict === e.verdict, `${a.id}: verdict ${v.verdict} (want ${e.verdict})`);
  check(same(v.triggeredRules, e.triggeredRules), `${a.id}: triggered [${v.triggeredRules}] (want [${e.triggeredRules}])`);
  check(same(v.allowedUses, e.allowedUses), `${a.id}: allowed [${v.allowedUses}] (want [${e.allowedUses}])`);
  check(same(v.blockedUses, e.blockedUses), `${a.id}: blocked [${v.blockedUses}] (want [${e.blockedUses}])`);
  const text = v.reasons.join(" ").toLowerCase();
  const missing = (e.reasoningIncludes as string[]).filter((s) => !text.includes(s.toLowerCase()));
  check(!missing.length, `${a.id}: reasons mention ${JSON.stringify(e.reasoningIncludes)}${missing.length ? ` MISSING ${JSON.stringify(missing)}` : ""}`);
}

// sponsor policy is per-org, not a name string: same telecom signage is NOT a conflict for Tottenham's policy
const fancam = manifests["asset_saspurs_partner_003"];
const asThfc = evaluateContent(fancam, { orgKey: "tottenham-hotspur", competition: "Premier League" }, ["instagram", "partner_site"]);
check(!asThfc.triggeredRules.includes("SPONSOR-COMPETITOR-CATEGORY-REVIEW"), "sponsor conflict is org-policy driven (telecom fine under THFC demo policy)");

// music rule carries a render action
const goal = evaluateContent(manifests["asset_spurs_goal_001"], { orgKey: "tottenham-hotspur", competition: "Premier League", eventDate: "2026-10-18" }, ["instagram"]);
check(goal.renderActions.includes("mute_audio"), "MUSIC-SYNC-VERIFY -> render action mute_audio");
check(goal.reasons.some((r) => r.includes("Cooldown ends 2026-10-20 00:00 UTC")), "PL cooldown reason carries computed expiry");

// ── B: compliance gate on Channel ids ──────────────────────────────────────────────────
const g = evaluate(["instagram_reel", "x_photo"], goal.restrictions, new Date());
check(g.status === "restricted" && g.allowedChannels.length === 2, "AMBER goal -> gate 'restricted', owned channels still allowed");
const blockIg = evaluate(["instagram_reel", "instagram_feed", "x_photo"], [{ kind: "platform", rule: "test: no instagram", blockedPlatforms: ["instagram"] }], new Date());
check(blockIg.allowedChannels.length === 1 && blockIg.allowedChannels[0] === "x_photo" && blockIg.status === "restricted", "blockedPlatforms removes every channel in the family");
const all = evaluate(["instagram_reel"], [{ kind: "platform", rule: "test", blockedPlatforms: ["instagram"] }], new Date());
check(all.status === "blocked", "all requested channels blocked -> gate 'blocked' (approve hard-gate fires)");
const green = evaluateContent(manifests["asset_spurs_training_002"], { orgKey: "tottenham-hotspur", competition: "Training" }, ["instagram_reel"]);
check(green.verdict === "GREEN" && evaluate(["instagram_reel"], green.restrictions, new Date()).status === "restricted", "GREEN training still surfaces its clearance note (advisory), never a silent pass");

// ── C: manifest schema ─────────────────────────────────────────────────────────────────
const sample = {
  summary: "Castle rises for a dunk at the buzzer; bench erupts.",
  moments: [{ label: "dunk", description: "Game-winning dunk", start: 6.0, end: 9.5 }],
  subjectX: 0.62,
  detectedSponsors: [{ name: "Arena signage", category: "beverage" }],
  identifiablePeople: [{ type: "player", label: "home player" }],
  competitionMarkings: ["NBA scorebug"],
  crowdPrivacy: { facesVisible: true, closeUps: false },
  audioRisks: [{ type: "crowd_chant" }],
  suggestedUse: "Vertical reel for casual fans.",
};
const parsed = parseManifest({ data: JSON.stringify(sample) });
check(parsed.subjectX === 0.62 && parsed.moments[0].end === 9.5, "parseManifest accepts a Pegasus-shaped response");
const shifted = parseManifest({ data: JSON.stringify(sample) }, 40);
check(shifted.moments[0].start === 46 && shifted.moments[0].end === 49.5, "parseManifest shifts window-relative times by window start (verified live behavior)");
const rec = read("data/fallback-assets/fixtures/twelvelabs-manifest.json");
const recM = parseManifest(rec.response, rec.request.start_time);
check(recM.moments.every((x) => x.start >= rec.request.start_time - 0.01 && x.end <= rec.request.end_time + 0.5), "RECORDED live manifest validates + lands inside its window after shift");
let threw = ""; try { parseManifest({ data: JSON.stringify({ ...sample, crowdPrivacy: { facesVisible: "yes" } }) }); } catch (e) { threw = (e as Error).message; }
check(threw.includes("crowdPrivacy"), "parseManifest rejects malformed fields with a path");
check(PEGASUS_MANIFEST_SCHEMA.required[0] === Object.keys(PEGASUS_MANIFEST_SCHEMA.properties)[0], "json_schema: first declared property is required (TwelveLabs constraint)");
const ts = PEGASUS_MANIFEST_SCHEMA.properties.moments.items.properties.start;
check(ts.type === "timestamp" && ts.format === "seconds", "json_schema: timestamps declare format (else 400, per the empirical test)");

// ── D: A2 rights rule engine (illustrative policy v0, pure/no DB) ───────────────────────
const baseCtx = { orgId: "00000000-0000-4000-8000-000000000001", platform: "fan_web", territories: ["US"], use: "owned_fan_web" as const, language: "en", releaseAt: "2026-10-22T12:00:00.000Z", policyVersion: "illustrative-v0" };
check(Object.values(lintRuleSet(rightsRuleSet as never)).every((errs) => (errs as string[]).length === 0), "rights rules v0 lint clean (known facts, scoped rules, cleared rule cited)");
check(evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m1", context: baseCtx, facts: { rights: { window: { expired: true } } } }).status === "expired", "rights engine: expired window -> expired");
check(evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m2", context: baseCtx, facts: { rights: { policy: { unknown: true } } } }).status === "needs_review", "rights engine: unknown policy -> needs_review");
check(evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m3", context: baseCtx, facts: { content: { audio: { music: true } } } }).status === "needs_remediation", "rights engine: music -> needs_remediation");
check(evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m4", context: { ...baseCtx, territories: ["FR"] }, facts: { content: { brand: { category: "alcohol" } } } }).status === "blocked", "rights engine: alcohol brand blocked in FR only");
check(evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m5", context: baseCtx, facts: { content: { analysis: { truncated: true } } } }).status === "needs_review", "rights engine: truncated analysis -> needs_review");
const clearedDecision = evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m6", context: { ...baseCtx, use: "internal_preview" }, facts: { rights: { window: { active: true } } } });
check(clearedDecision.status === "cleared", "rights engine: active window clears internal preview only");
const reviewDecision = evaluateRights({ orgId: baseCtx.orgId, subjectType: "asset", subjectId: "m7", context: baseCtx, facts: { rights: { policy: { unknown: true } } } });
check(reevaluateRightsDecisions({ decisions: [reviewDecision], factsBySubject: { "asset:m7": { rights: { window: { expired: true } } } }, ruleSet: rightsRuleSet as never })[0].status === "expired", "rights engine: re-evaluation supersedes from cached facts");

// ── E: rights metadata merge/write contract (pure/no live write) ─────────────────────────
const existing = { usage: { value: "owned", provenance: "existing_scoreplay" as const }, valid_until: { value: "2026-10-24", provenance: "existing_scoreplay" as const } };
const inferred = { usage: { value: "paid", provenance: "inferred" as const }, allowed_territories: { value: ["US"], provenance: "inferred" as const } };
const merged = mergeRightsFields(existing, inferred);
check(merged.usage.provenance === "conflict" && merged.allowed_territories.provenance === "inferred", "rights metadata: existing conflict flagged; inferred fills gaps");
check(assessCompleteness({}) === "absent" && assessCompleteness(merged) === "conflict", "rights metadata: absent/conflict completeness states");
const record = buildRightsRecord(130849867, { usage: { value: "owned", provenance: "human_confirmed" }, allowed_territories: { value: ["US"], provenance: "human_confirmed" }, allowed_uses: { value: ["owned_fan_web"], provenance: "human_confirmed" }, valid_from: { value: "2026-10-22", provenance: "human_confirmed" }, valid_until: { value: "2026-10-24", provenance: "human_confirmed" }, policy_version: { value: "v0", provenance: "human_confirmed" } }, { by: "editor", at: "2026-10-22T12:00:00.000Z" });
const payload = buildRightsWritePayload(record);
check(record.completeness === "complete" && record.state === "cleared", "rights metadata: complete confirmed record becomes cleared");
check(payload.rawTags.includes("rights:cleared") && payload.comment.includes("[clout:rights:130849867:"), "rights metadata: write payload uses allow-listed rights tags and marker");

// rights rules admin: add a territory rule with no code change, preview before activation, immutable versions
{
  const base = RuleSetSchema.parse(rightsRuleSet);
  const gamblingJson = JSON.stringify({ id: "R7-GAMBLING-GB", name: "Betting sponsor in UK fan app", enabled: true, status: "blocked", severity: "block",
    scope: { territories: ["GB"], use: ["owned_fan_web"] }, condition: { fact: "content.brand.category", op: "eq", value: "gambling" },
    rationale: "Illustrative: betting sponsorship is blocked on the UK fan app.", citation: "Illustrative gambling-ad rule (demo)" });
  const v = validateRuleJson(gamblingJson);
  check(v.ok, "rules admin: new territory rule validates from JSON (no code change)");
  check(!validateRuleJson("{not json").ok, "rules admin: malformed JSON rejected");
  const bad = validateRuleJson(JSON.stringify({ ...JSON.parse(gamblingJson), condition: { fact: "content.brand.colour", op: "eq", value: "red" } }));
  check(!bad.ok && bad.errors.some((e) => e.includes("unknown fact")), "rules admin: unknown fact path fails lint");
  const noScope = validateRuleJson(JSON.stringify({ ...JSON.parse(gamblingJson), scope: {} }));
  check(!noScope.ok && noScope.errors.some((e) => e.includes("scope")), "rules admin: empty scope fails lint");
  const clearedNoCite = validateRuleJson(JSON.stringify({ ...JSON.parse(gamblingJson), status: "cleared", citation: undefined }));
  check(!clearedNoCite.ok && clearedNoCite.errors.some((e) => e.includes("citation")), "rules admin: cleared rule without citation fails lint");
  if (v.ok) {
    const built = buildRuleSet("v2", [...base.rules, v.rule]);
    check(built.ok, "rules admin: candidate set with the new rule builds");
    if (built.ok) {
      const rows = previewRuleChange(base, built.ruleSet, samplePreviewSubjects("3f1d2c4b-8a7e-4b6f-9c2d-1e5a7b9c0d11", new Date("2026-10-22T12:00:00Z")));
      const changed = rows.filter((r) => r.changed);
      check(changed.length === 1 && changed[0].key === "sim-gambling-gb" && changed[0].after === "blocked", "rules admin: preview shows exactly the one verdict that would change");
      check(rows.find((r) => r.key === "sim-alcohol-fr")?.after === "blocked" && rows.find((r) => r.key === "sim-alcohol-gb")?.after === "cleared", "rules admin: territory scoping holds in preview (alcohol FR blocked, GB cleared)");
    }
    check(!buildRuleSet("v3", [...base.rules, v.rule, v.rule]).ok, "rules admin: duplicate rule ids refused at activation");
  }
  const disabled = base.rules.map((r) => (r.id === "R3-MUSIC-REMEDIATION" ? { ...r, enabled: false } : r));
  const d = buildRuleSet("v2", disabled);
  check(d.ok && previewRuleChange(base, d.ruleSet, samplePreviewSubjects("3f1d2c4b-8a7e-4b6f-9c2d-1e5a7b9c0d11")).find((r) => r.key === "sim-music")?.after === "cleared", "rules admin: disabling a rule is previewable (music clip clears)");
  check(JSON.stringify(diffRules(base.rules[2], { ...base.rules[2], enabled: false })) === JSON.stringify({ enabled: { from: true, to: false } }), "rules admin: audit diff records only the changed field");
  check(nextVersionLabel(["illustrative-v0", "v1", "v4"]) === "v5" && nextVersionLabel([]) === "v1", "rules admin: version labels are monotonic");
}

console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
