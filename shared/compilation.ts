/**
 * Compilation planning (A3.1/B5.1/B5.2/B5.5). Pure: no DB, no network, no media I/O.
 * A compilation is an ordered list of APPROVED clips. Each entry keeps its own source lineage, approved trim and
 * approval revision; the whole ordered list is approved as one exact revision (any reorder = new approval).
 */
import { createHash } from "node:crypto";

export const COMPILATION_LIMITS = { minEntries: 2, maxEntries: 3, minSec: 20, maxSec: 45, channel: "fan_app" as const };
export const COMPILATION_ROLES = ["hook", "build-up", "payoff"] as const;

export interface CompilationCandidate {
  opportunityId: string;
  headline: string;
  status: string;
  complianceStatus: string;
  requiresReview: boolean;
  mediaId: number | null;
  window: { start: number; end: number } | null; // approved trim, else the tight window
  score: number;
}

export interface PlannedEntry { opportunityId: string; headline: string; mediaId: number; startSec: number; endSec: number; role: string; why: string }
export type PlanResult = { ok: true; entries: PlannedEntry[]; totalSec: number; revision: string } | { ok: false; errors: string[] };

const APPROVED = ["approved", "rendering", "rendered", "exported"];

/** Validate an editor-chosen order. Every entry must be approved, non-blocked and reviewed; budget must fit. */
export function planCompilation(ordered: CompilationCandidate[]): PlanResult {
  const errors: string[] = [];
  const L = COMPILATION_LIMITS;
  if (ordered.length < L.minEntries || ordered.length > L.maxEntries) errors.push(`A compilation needs ${L.minEntries}-${L.maxEntries} clips (got ${ordered.length})`);
  const ids = ordered.map((c) => c.opportunityId);
  if (new Set(ids).size !== ids.length) errors.push("The same clip appears twice");
  for (const c of ordered) {
    if (!APPROVED.includes(c.status)) errors.push(`"${c.headline}" is not approved`);
    if (c.complianceStatus === "blocked") errors.push(`"${c.headline}" is blocked by rights`);
    if (c.requiresReview) errors.push(`"${c.headline}" still needs review`);
    if (!c.mediaId || !c.window || !(c.window.end > c.window.start)) errors.push(`"${c.headline}" has no source window`);
  }
  if (errors.length) return { ok: false, errors };
  const totalSec = ordered.reduce((n, c) => n + (c.window!.end - c.window!.start), 0);
  if (totalSec < L.minSec || totalSec > L.maxSec) {
    return { ok: false, errors: [`Total ${totalSec.toFixed(1)}s is outside the ${L.minSec}-${L.maxSec}s compilation budget`] };
  }
  const roles = ordered.length === 2 ? ["hook", "payoff"] : [...COMPILATION_ROLES];
  const entries = ordered.map((c, i) => ({
    opportunityId: c.opportunityId, headline: c.headline, mediaId: c.mediaId!, startSec: c.window!.start, endSec: c.window!.end,
    role: roles[i], why: `${roles[i]}: ${c.headline} (rank ${Math.round(c.score)})`,
  }));
  return { ok: true, entries, totalSec, revision: compilationRevision(entries) };
}

/** Exact ordered revision: the same clips in a different order is a different revision. */
export function compilationRevision(entries: Pick<PlannedEntry, "opportunityId" | "mediaId" | "startSec" | "endSec">[]) {
  return createHash("sha256").update(JSON.stringify(entries.map((e) => [e.opportunityId, e.mediaId, e.startSec, e.endSec]))).digest("hex");
}

/**
 * Suggestion (B5.2): the highest total-rank set of 2-3 eligible clips that fits the duration budget, ordered with the
 * strongest moment as the payoff. Exhaustive over combinations (max 3 entries => at most C(n,3), trivial at match
 * scale); a greedy pass can lock in one long clip and then fail the minimum even when a valid trio exists.
 */
export function suggestCompilation(candidates: CompilationCandidate[]): CompilationCandidate[] {
  const L = COMPILATION_LIMITS;
  const eligible = candidates
    .filter((c) => APPROVED.includes(c.status) && c.complianceStatus !== "blocked" && !c.requiresReview && c.mediaId && c.window && c.window.end > c.window.start)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40); // bound the search; lower-ranked clips never win a top-3 set
  const dur = (c: CompilationCandidate) => c.window!.end - c.window!.start;
  let best: CompilationCandidate[] = [];
  let bestScore = -1;
  const consider = (set: CompilationCandidate[]) => {
    const total = set.reduce((n, c) => n + dur(c), 0);
    if (total < L.minSec || total > L.maxSec) return;
    const score = set.reduce((n, c) => n + c.score, 0) + set.length * 1e-6; // prefer 3 clips on ties
    if (score > bestScore) { bestScore = score; best = set; }
  };
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      consider([eligible[i], eligible[j]]);
      if (L.maxEntries >= 3) for (let k = j + 1; k < eligible.length; k++) consider([eligible[i], eligible[j], eligible[k]]);
    }
  }
  if (!best.length) return [];
  const [top, ...rest] = [...best].sort((a, b) => b.score - a.score);
  return [...rest.sort((a, b) => a.score - b.score), top]; // hook/build-up ascending, best moment as payoff
}

/** B5.5: a compilation is invalid once any source clip is no longer approved or becomes blocked. */
export function compilationStillValid(entryIds: string[], current: Map<string, { status: string; complianceStatus: string }>) {
  const broken = entryIds.filter((id) => { const c = current.get(id); return !c || !APPROVED.includes(c.status) || c.complianceStatus === "blocked"; });
  return { ok: broken.length === 0, broken };
}
