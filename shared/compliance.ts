/**
 * Compliance module — real evaluation semantics, mock-populated for the demo.
 * This is deliberately the Challenge B engine living inside the Challenge A product.
 * evaluate() returns an explainable decision; the approve endpoint hard-gates on it.
 */
import { type Compliance, type Channel } from "./schemas";

export interface Restriction {
  kind: "territory" | "platform" | "league" | "competition" | "sponsor" | "expiration" | "usage";
  rule: string; // human-readable, e.g. "No distribution in UK territory before 22:00 local"
  blockedChannels?: Channel[];
  blockedTerritories?: string[];
  expiresAt?: Date;
  /** embargo: blocked until this instant (e.g. ScorePlay accessible_from in the future) */
  notBefore?: Date;
  /** advisory: never blocks; always surfaces its rule and makes the verdict at least "restricted" */
  advisory?: boolean;
}

export interface ComplianceDecision {
  status: "cleared" | "restricted" | "blocked";
  allowedChannels: Channel[];
  reasons: string[]; // every restriction that fired, in plain language — explainability is the product
}

export function evaluate(requested: Channel[], restrictions: Restriction[], now = new Date()): ComplianceDecision {
  const reasons: string[] = [];
  let allowed = [...requested];

  for (const r of restrictions) {
    if (r.kind === "expiration" && r.expiresAt && now > r.expiresAt) {
      return { status: "blocked", allowedChannels: [], reasons: [`Rights expired ${r.expiresAt.toISOString().slice(0, 10)}: ${r.rule}`] };
    }
    if (r.notBefore && now < r.notBefore) {
      return { status: "blocked", allowedChannels: [], reasons: [`Embargoed until ${r.notBefore.toISOString().slice(0, 16).replace("T", " ")} UTC: ${r.rule}`] };
    }
    if (r.advisory) {
      reasons.push(r.rule);
      continue;
    }
    if (r.blockedChannels?.length) {
      const before = allowed.length;
      allowed = allowed.filter((c) => !r.blockedChannels!.includes(c));
      if (allowed.length < before) reasons.push(r.rule);
    }
    if (r.blockedTerritories?.length) reasons.push(`Territory restriction: ${r.rule}`);
  }

  const status = allowed.length === 0 ? "blocked" : reasons.length > 0 ? "restricted" : "cleared";
  if (status === "cleared") reasons.push("No restrictions apply to the requested channels");
  return { status, allowedChannels: allowed, reasons };
}

export function toComplianceStamp(decision: ComplianceDecision, source: string): Pick<Compliance, "status" | "reasons" | "rightsSource"> {
  return { status: decision.status === "cleared" ? "cleared" : decision.status, reasons: decision.reasons, rightsSource: source };
}
