/**
 * Content rules engine: TwelveLabs moment manifest + asset context -> explainable GREEN/AMBER/RED verdict,
 * per-platform allowed/blocked uses, render actions (e.g. mute), and compliance Restrictions that feed the
 * existing evaluate() hard gate. Rules live in pipeline/rules/content-rules.json (representative, not club policy).
 *
 * Platforms are families ("instagram", "x", "youtube", "tiktok") plus distribution targets ("partner_site").
 * Our channels map onto families; a family block removes every channel in that family.
 */
import rulesFile from "../pipeline/rules/content-rules.json" with { type: "json" };
import { platformOf, type Restriction } from "./compliance";

export { platformOf };

export type Severity = "GREEN" | "AMBER" | "RED";
export interface ContentRule {
  id: string;
  name: string;
  appliesWhen: Partial<{
    competition: string;
    competitionMarkingIncludes: string;
    audioRiskType: string;
    facesVisible: boolean;
    closeUps: boolean;
    audioRiskCount: number;
    detectedSponsorCategoryInOrgConflicts: boolean;
  }>;
  severity: Severity;
  restriction: string;
  platformBlocks: string[];
  territoryBlocks: string[];
  expiryHoursAfterEvent?: number;
  renderActions?: string[];
}
/** The subset of a manifest the rules read (rights-desk fixtures and live Pegasus manifests both fit). */
export interface RulesManifest {
  detectedSponsors: { name: string; category: string }[];
  competitionMarkings: string[];
  crowdPrivacy: { facesVisible: boolean; closeUps: boolean };
  audioRisks: { type: string }[];
}
export interface AssetContext {
  orgKey: string; // club-themes / orgPolicies key
  competition: string; // "Premier League" | "NBA Regular Season" | "Training" | ...
  eventDate?: string; // ISO, for cooldown expiry text
}
export interface ContentVerdict {
  verdict: Severity;
  triggeredRules: string[];
  allowedUses: string[];
  blockedUses: string[];
  territoryBlocks: string[];
  reasons: string[]; // plain English, each prefixed with its rule id
  renderActions: string[];
  restrictions: Restriction[];
}

const RULES = rulesFile.rules as ContentRule[];
const POLICIES = rulesFile.orgPolicies as Record<string, { sponsorConflictCategories?: string[] } | string>;
const RANK: Record<Severity, number> = { GREEN: 0, AMBER: 1, RED: 2 };

function fires(rule: ContentRule, m: RulesManifest, a: AssetContext): boolean {
  const w = rule.appliesWhen;
  const conflicts = (() => {
    const p = POLICIES[a.orgKey];
    return typeof p === "object" ? (p.sponsorConflictCategories ?? []).map((c) => c.toLowerCase()) : [];
  })();
  const checks: boolean[] = [];
  if (w.competition !== undefined) checks.push(a.competition === w.competition);
  if (w.competitionMarkingIncludes !== undefined) checks.push(m.competitionMarkings.some((x) => x.toLowerCase().includes(w.competitionMarkingIncludes!.toLowerCase())));
  if (w.audioRiskType !== undefined) checks.push(m.audioRisks.some((x) => x.type === w.audioRiskType));
  if (w.facesVisible !== undefined) checks.push(m.crowdPrivacy.facesVisible === w.facesVisible);
  if (w.closeUps !== undefined) checks.push(m.crowdPrivacy.closeUps === w.closeUps);
  if (w.audioRiskCount !== undefined) checks.push(m.audioRisks.length === w.audioRiskCount);
  if (w.detectedSponsorCategoryInOrgConflicts) checks.push(m.detectedSponsors.some((s) => conflicts.includes(s.category.toLowerCase())));
  return checks.length > 0 && checks.every(Boolean);
}

/**
 * requested: platform families/targets the producer wants (e.g. ["instagram","x","partner_site"]),
 * or our Channel ids (mapped to families automatically).
 */
export function evaluateContent(m: RulesManifest, a: AssetContext, requested: string[]): ContentVerdict {
  const wanted = [...new Set(requested.map(platformOf))];
  const triggered = RULES.filter((r) => fires(r, m, a));
  const blocked = new Set(triggered.flatMap((r) => r.platformBlocks));
  const territory = [...new Set(triggered.flatMap((r) => r.territoryBlocks))];
  const verdict = triggered.reduce<Severity>((v, r) => (RANK[r.severity] > RANK[v] ? r.severity : v), "GREEN");

  const reasons = triggered.map((r) => {
    let txt = `${r.id}: ${r.name}. ${r.restriction}`;
    if (r.expiryHoursAfterEvent && a.eventDate) {
      const until = new Date(Date.parse(a.eventDate) + r.expiryHoursAfterEvent * 3600_000);
      txt += ` Cooldown ends ${until.toISOString().slice(0, 16).replace("T", " ")} UTC.`;
    }
    return txt;
  });
  if (!triggered.length) reasons.push("No content rules triggered by what TwelveLabs saw in this window.");

  // Restrictions for the compliance gate. Owned-platform blocks are hard (blockedPlatforms); partner-site
  // and territory blocks don't touch owned social channels, so they are advisory (surfaced, never silently cleared).
  const restrictions: Restriction[] = triggered.map((r) => {
    const ownedBlocks = r.platformBlocks.filter((p) => p !== "partner_site");
    return ownedBlocks.length
      ? { kind: "platform", rule: `${r.id}: ${r.restriction}`, blockedPlatforms: ownedBlocks }
      : { kind: r.territoryBlocks.length ? "territory" : "usage", rule: `${r.id} (${r.severity}): ${r.restriction}`, advisory: true };
  });

  return {
    verdict,
    triggeredRules: triggered.map((r) => r.id),
    allowedUses: wanted.filter((p) => !blocked.has(p)),
    blockedUses: wanted.filter((p) => blocked.has(p)),
    territoryBlocks: territory,
    reasons,
    renderActions: [...new Set(triggered.flatMap((r) => r.renderActions ?? []))],
    restrictions,
  };
}
