/**
 * Smart trim. Pure: no DB, no network, no media I/O.
 *
 * Picks a cut from what we already store: the beats TwelveLabs found inside the analysed window (moment.raw.moments,
 * absolute source seconds) and each channel's target length. The story is setup -> key beat -> reaction: start up to
 * LEAD seconds before the key beat, end after the beat that follows it, then fit the channel's [min, max] without ever
 * leaving the analysed window. The reason string describes the FINAL cut, so its numbers always match what renders.
 */
export interface Win { start: number; end: number }
export interface Beat extends Win { label: string; description?: string }
export interface TrimTarget { label: string; minSec: number; maxSec: number }
export interface SmartTrim extends Win { lengthSec: number; key: Beat | null; reason: string; note: string | null }

const LEAD = 3;
const ACTION = /\b(goals?|scores?|scoring|shot|shoots?|strike|finish(es)?|header|saves?|saved|cutback|chance|penalty|dunk|three|block|steal|assist|winner|equali[sz]er)\b/i;
const r1 = (x: number) => Math.round(x * 10) / 10;
const lc = (s: string) => s.toLowerCase();

/** Beats from a stored manifest, clipped to the analysed window, sorted, empties dropped. */
export function beatsFrom(raw: unknown, analysed: Win | null): Beat[] {
  const ms = (raw as { moments?: unknown } | null)?.moments;
  if (!Array.isArray(ms)) return [];
  return ms
    .map((m) => m as Partial<Beat>)
    .filter((m): m is Beat => typeof m.label === "string" && Number.isFinite(m.start) && Number.isFinite(m.end))
    .map((m) => ({ label: m.label, description: m.description, start: analysed ? Math.max(m.start, analysed.start) : m.start, end: analysed ? Math.min(m.end, analysed.end) : m.end }))
    .filter((m) => m.end > m.start)
    .sort((a, b) => a.start - b.start);
}

const overlap = (a: Win, b: Win) => Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));

/** The beat the clip is about: an action word in the label beats one in the description; ties go to the trigger window. */
export function keyBeat(beats: Beat[], focus: Win | null): Beat | null {
  if (!beats.length) return null;
  const score = (b: Beat) => (ACTION.test(b.label) ? 2 : 0) + (b.description && ACTION.test(b.description) ? 1 : 0);
  return beats.reduce((best, b) => {
    const d = score(b) - score(best);
    return d > 0 || (d === 0 && focus && overlap(b, focus) > overlap(best, focus)) ? b : best;
  });
}

export function smartTrim({ beats, analysed, focus, target }: { beats: Beat[]; analysed: Win; focus: Win | null; target: TrimTarget }): SmartTrim {
  const key = keyBeat(beats, focus);
  const i = key ? beats.indexOf(key) : -1;
  const after = i >= 0 ? beats[i + 1] : undefined;
  const base = focus ?? analysed;
  let start = key ? Math.max(analysed.start, i > 0 ? Math.max(beats[i - 1].start, key.start - LEAD) : key.start) : base.start;
  let end = key ? (after ?? key).end : base.end;
  let note: string | null = null;

  const { minSec, maxSec, label } = target;
  if (minSec && end - start < minSec) {
    start = Math.max(analysed.start, end - minSec);
    if (end - start < minSec) end = Math.min(analysed.end, start + minSec);
    note = end - start < minSec - 0.05
      ? `${label} works best at ${minSec}s or longer, but only ${r1(analysed.end - analysed.start)}s of this play was analysed, so it uses all of it.`
      : `Lengthened to reach ${label}'s ${minSec}s minimum.`;
  }
  if (maxSec && end - start > maxSec) {
    end = start + maxSec;
    if (key && end < key.end) { end = key.end; start = Math.max(analysed.start, end - maxSec); }
    note = `Shortened to fit ${label}'s ${maxSec}s limit.`;
  }
  // round to 0.1s for display, but never across the analysed window's edge (20.999 must not round up to 21.0:
  // the final render rightly refuses any cut that leaves the footage the AI actually analysed)
  start = Math.max(r1(start), analysed.start); end = Math.min(r1(end), analysed.end);

  let reason: string;
  if (!key) reason = "No beat breakdown for this clip, so it uses the detected moment.";
  else {
    const lead = r1(key.start - start);
    const head = lead > 0 ? `Starts ${lead.toFixed(1)}s before the ${lc(key.label)} so the build-up lands` : `Starts on the ${lc(key.label)}`;
    const tail = end >= r1((after ?? key).end) ? (after ? `ends after the ${lc(after.label)}` : `ends on the ${lc(key.label)}`) : `ends at ${end.toFixed(1)}s`;
    reason = `${head}, ${tail}.`;
  }
  return { start, end, lengthSec: r1(end - start), key, reason, note };
}

/** Target for a channel profile (photo channels have no length). */
export const targetFor = (p: { label: string; targetDurationSec: number[]; maxDurationSec: number }): TrimTarget =>
  ({ label: p.label, minSec: p.targetDurationSec[0] ?? 0, maxSec: Math.min(p.targetDurationSec[1] || Infinity, p.maxDurationSec || Infinity) });

const REPLAY = /\b(replay|slow[- ]motion|reaction|reacts|celebrat\w*|manager|bench|crowd|fans?)\b/i;
/** Where the photo card's still comes from: late in the live action beat, where the keeper dives or the ball goes in
 * (measured on the real match: the middle of a beat is still the build-up). Replays, reactions and celebrations are
 * passed over so the card shows the play itself. Falls back to the trigger window's middle when there are no beats. */
export function stillAt(beats: Beat[], focus: Win | null, fallback: Win): number {
  const live = beats.filter((b) => !REPLAY.test(b.label));
  const action = live.filter((b) => ACTION.test(b.label) || (b.description ? ACTION.test(b.description) : false));
  const pick = keyBeat(action.length ? action : live, focus);
  if (!pick) return r1((fallback.start + fallback.end) / 2);
  return r1(pick.start + (pick.end - pick.start) * 0.85);
}

/**
 * One rule for "is this clip's cut smart or manual?" (used by approval, packaging and the editor).
 * An explicit delivery.trimMode wins. Rows from before trimMode existed: a stored trimOverride means the editor set it.
 */
export function trimModeOf(delivery: unknown, trimOverride: unknown): "smart" | "manual" {
  const m = (delivery as { trimMode?: unknown } | null)?.trimMode;
  if (m === "smart" || m === "manual") return m;
  return trimOverride ? "manual" : "smart";
}

/** Smart trim straight from what an opportunity stores (moment.raw manifest + delivery windows). Null = nothing to trim. */
export function smartTrimFor(raw: unknown, delivery: unknown, profile: { label: string; targetDurationSec: number[]; maxDurationSec: number } | undefined): (SmartTrim & { beats: Beat[]; analysed: Win }) | null {
  const d = (delivery ?? {}) as { window?: Win; tightWindow?: Win };
  if (!profile || !profile.targetDurationSec[1] || !d.window) return null;
  const beats = beatsFrom(raw, d.window);
  return { ...smartTrim({ beats, analysed: d.window, focus: d.tightWindow ?? null, target: targetFor(profile) }), beats, analysed: d.window };
}
