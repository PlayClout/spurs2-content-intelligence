/**
 * ScorePlay media rights fields -> compliance Restrictions.
 *
 * Field meanings below are INTERPRETATIONS of the public spec (it documents the fields, not their policy
 * semantics). Each restriction says which field it came from, so the producer sees the evidence and we can
 * correct a mapping the moment ScorePlay confirms semantics. Conservative by design: anything ambiguous is
 * advisory (surfaced, never silently cleared) rather than guessed into a block.
 */
import type { Restriction } from "../compliance";
import type { SPMedia } from "./scoreplay";

const ts = (s?: number) => (s && s > 0 ? new Date(s * 1000) : undefined);
const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ") + " UTC";

export function restrictionsFromScorePlay(m: SPMedia): Restriction[] {
  const r: Restriction[] = [];
  const src = `ScorePlay media ${m.ID}`;

  const until = ts(m.accessible_until);
  if (until) r.push({ kind: "expiration", expiresAt: until, rule: `Access window ends ${fmt(until)} (${src}: accessible_until)` });

  const from = ts(m.accessible_from);
  if (from) r.push({ kind: "expiration", notBefore: from, rule: `Access window opens ${fmt(from)} (${src}: accessible_from)` });

  if (m.validated === false) {
    r.push({ kind: "usage", advisory: true, rule: `Not yet validated in ScorePlay; confirm before publishing (${src}: validated=false)` });
  }
  if (m.is_private) {
    r.push({ kind: "usage", advisory: true, rule: `Marked private in ScorePlay (${src}: is_private=true)` });
  }
  if (m.can_be_shared === false) {
    r.push({ kind: "usage", advisory: true, rule: `Not marked shareable in ScorePlay (${src}: can_be_shared=false)` });
  }
  if (m.usage && m.usage.toLowerCase() !== "commercial") {
    r.push({ kind: "usage", advisory: true, rule: `Usage "${m.usage}": editorial use; no sponsor/commercial overlay (${src}: usage)` });
  }
  if (m.custom_terms?.trim()) {
    r.push({ kind: "usage", advisory: true, rule: `Custom terms: ${m.custom_terms.trim()} (${src}: custom_terms)` });
  }
  for (const d of m.external_accounts_drms ?? []) {
    const u = ts(d.accessible_until);
    if (u) r.push({ kind: "usage", advisory: true, rule: `Partner account ${d.external_account_id} window ends ${fmt(u)} (${src}: external_accounts_drms)` });
  }
  return r;
}
