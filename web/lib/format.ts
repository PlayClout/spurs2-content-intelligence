/** Display helpers shared by server pages and client components (no "use client": callable everywhere). */
export const formatLabel = (t: string) => (t === "reel" ? "Reel" : t === "milestone_graphic" ? "Photo card" : t.replace(/_/g, " "));

export const AUDIENCE: Record<string, string> = { casual: "Casual fans", superfan: "Superfans" };

const PROPER = /(^|[^\p{L}])(solanke|sávio|savio|kudus|son|wembanyama|wemby|castle|fox|tottenham|spurs|man united|old trafford)(?![\p{L}])/giu;
const cap = (w: string) => w.split(" ").map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" ");
/** Headlines are stored in caps for burned-in captions; the desk reads them in sentence case. */
export function titleCase(h: string) {
  if (h !== h.toUpperCase()) return h;
  const s = h.toLowerCase();
  return (s.charAt(0).toUpperCase() + s.slice(1)).replace(PROPER, (_, pre: string, w: string) => pre + cap(w));
}

/** Write-back gate reasons are operator-facing codes; the desk reads them in plain language. */
export function heldReason(code: string | null) {
  if (!code) return "";
  if (/SCOREPLAY_WRITES/.test(code)) return "Awaiting ScorePlay taxonomy sign-off (kept as a dry run)";
  if (/admin kill switch/i.test(code)) return "Paused from this page";
  if (/kill switch/i.test(code)) return "Paused by the server setting SCOREPLAY_WRITE_KILL_SWITCH";
  if (/fixture/i.test(code)) return "Fixture mode: nothing sent to ScorePlay";
  return code;
}

/** "1.5s to 14.0s" from a stored window (empty when unknown). */
export const windowLabel = (start?: number | null, end?: number | null) =>
  Number.isFinite(start) && Number.isFinite(end) ? `${(start as number).toFixed(1)}s to ${(end as number).toFixed(1)}s` : "";

/** Status pill copy + tone. Blocked rights win over pipeline status (unless already rejected/exported). */
export function statusTone(status: string, compliance?: string): [string, string] {
  if (compliance === "blocked" && !["rejected", "exported"].includes(status)) return ["Blocked", "tone-red"];
  const m: Record<string, [string, string]> = {
    draft_pending: ["Rendering draft", "tone-gray"], draft_ready: ["Ready to review", "tone-blue"], needs_review: ["Needs review", "tone-amber"],
    approved: ["Approved", "tone-green"], rendering: ["Rendering final", "tone-blue"], rendered: ["Approved", "tone-green"],
    exported: ["Exported", "tone-violet"], rejected: ["Rejected", "tone-red"],
  };
  return m[status] ?? [status.replace(/_/g, " "), "tone-gray"];
}
