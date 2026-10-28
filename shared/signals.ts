/**
 * Outside signals + hot-clip urgency (B13.1-B13.5, A0.2). Pure: no DB, no network.
 *
 * A signal is one observation from a provider (game feed, social reaction, AI watch-list, news). Signals are
 * normalized, matched to the exact play they are about (same media + overlapping window), and scored for urgency
 * from what we can actually measure: how many independent signals, how fast they are arriving versus the baseline,
 * how fresh they are, and how confident the match is. Urgency never touches rights: a blocked clip stays blocked.
 *
 * Every number shown to the editor comes from these inputs. Nothing is invented: a provider we do not have
 * (e.g. live X search) shows as unavailable instead of being simulated silently.
 */

export const SIGNAL_KINDS = ["game_event", "social_reaction", "ai_watchlist", "news"] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
export type SignalMode = "live" | "replay" | "fixture";

export interface NormalizedSignal {
  provider: string;            // e.g. "replay:thfc-mnu-week6", "twelvelabs:marengo"
  kind: SignalKind;
  mode: SignalMode;
  text: string;
  observedAt: Date;            // when WE saw it
  eventAt: Date;               // when the play happened (== observedAt if unknown)
  mediaId: number | null;      // ScorePlay media it is about, when known
  window: { start: number; end: number } | null;
  entities: string[];          // canonical player ids mentioned
  weight: number;              // provider-supplied strength, 0-1 (e.g. "mentions up 11x" -> high)
}

export interface ProviderStatus { provider: string; label: string; state: "live" | "replay" | "unavailable"; detail: string }

/** What we can and cannot read right now. Shown verbatim on the operator page. */
export function providerStatuses(env: Record<string, string | undefined>): ProviderStatus[] {
  const tl = !!env.TWELVELABS_API_KEY && env.MOCK_MODE !== "1";
  return [
    { provider: "replay", label: "Match feed (game events)", state: "replay", detail: "Timed replay of the real Man Utd v Tottenham timeline; labelled REPLAY, never shown as live." },
    { provider: "replay-social", label: "Fan reaction", state: "replay", detail: "Replayed reaction signals from the same timeline; labelled SIMULATED." },
    { provider: "twelvelabs", label: "AI watch-list (TwelveLabs search)", state: tl ? "live" : "unavailable", detail: tl ? "Live search over the indexed match footage." : "No TwelveLabs key: watch-list uses the recorded search." },
    { provider: "x", label: "X / social search", state: env.X_BEARER_TOKEN ? "live" : "unavailable", detail: env.X_BEARER_TOKEN ? "Authorized X read access." : "No authorized X read access configured; not simulated." },
  ];
}

export type Lane = "act_now" | "rising" | "watch";
export interface UrgencyInput {
  signals: Pick<NormalizedSignal, "kind" | "observedAt" | "weight" | "mode">[];
  now: Date;
  matchConfidence: number;     // 0-1: how sure we are these signals are about THIS clip
  draftReady: boolean;         // can the editor review it in one click?
  /** lane the alert was in last time; hysteresis keeps it from flapping */
  previousLane?: Lane | null;
}
export interface Urgency {
  lane: Lane; score: number; why: string[];
  momentum: { recent: number; baseline: number; ratio: number };
  ageSec: number; coverage: number; confidence: number; expired: boolean;
}

const RECENT_MS = 3 * 60_000;      // "now" window
const BASELINE_MS = 15 * 60_000;   // what normal looks like
const EXPIRE_MS = 20 * 60_000;     // an alert with no new signal for 20 min drops off
const ACT_NOW = 70, RISING = 45, HYSTERESIS = 8;

export function scoreUrgency(u: UrgencyInput): Urgency {
  const t = u.now.getTime();
  const recent = u.signals.filter((s) => t - s.observedAt.getTime() <= RECENT_MS);
  const older = u.signals.filter((s) => { const a = t - s.observedAt.getTime(); return a > RECENT_MS && a <= BASELINE_MS; });
  const baselinePerWindow = older.length / ((BASELINE_MS - RECENT_MS) / RECENT_MS); // signals per 3 min before now
  const ratio = (recent.length + 0.5) / (baselinePerWindow + 0.5);                 // smoothed acceleration
  const newest = u.signals.reduce((m, s) => Math.max(m, s.observedAt.getTime()), 0);
  const ageSec = newest ? Math.max(0, Math.round((t - newest) / 1000)) : Infinity;
  const coverage = new Set(u.signals.map((s) => s.kind)).size;                     // independent signal types
  const strength = Math.min(1, recent.reduce((n, s) => n + s.weight, 0) / 1.5);
  const freshness = ageSec === Infinity ? 0 : Math.max(0, 1 - ageSec / (EXPIRE_MS / 1000));
  const accel = Math.min(1, Math.log2(Math.max(1, ratio)) / 3);                     // 8x the baseline = full marks
  const corroboration = Math.min(1, (coverage - 1) / 2);
  const raw = 100 * (0.3 * strength + 0.25 * accel + 0.2 * freshness + 0.15 * corroboration + 0.1 * (u.draftReady ? 1 : 0));
  const score = Math.round(raw * Math.max(0.3, Math.min(1, u.matchConfidence)));
  const expired = ageSec * 1000 > EXPIRE_MS;

  // hysteresis: entering a hotter lane needs the full threshold; leaving it needs to drop clearly below
  const up = (th: number, lane: Lane) => (u.previousLane === lane ? score >= th - HYSTERESIS : score >= th);
  const lane: Lane = expired ? "watch" : up(ACT_NOW, "act_now") ? "act_now" : up(RISING, "rising") ? "rising" : "watch";

  const why: string[] = [];
  if (recent.length) why.push(`${recent.length} signal${recent.length === 1 ? "" : "s"} in the last 3 min`);
  if (ratio >= 2) why.push(`${ratio.toFixed(1)}x the usual rate`);
  if (coverage >= 2) why.push(`${coverage} independent sources agree`);
  if (u.matchConfidence < 0.6) why.push("match to footage is uncertain");
  if (!u.draftReady) why.push("draft still rendering");
  if (u.signals.every((s) => s.mode !== "live")) why.push("replay/simulated signals, not a live feed");
  if (expired) why.push("no new signals for 20 min");
  return { lane, score, why, momentum: { recent: recent.length, baseline: Math.round(baselinePerWindow * 10) / 10, ratio: Math.round(ratio * 10) / 10 }, ageSec: ageSec === Infinity ? -1 : ageSec, coverage, confidence: u.matchConfidence, expired };
}

/** Match confidence from the evidence we have: same media + overlapping window is strong; media only is weak. */
export function matchConfidence(sig: Pick<NormalizedSignal, "mediaId" | "window">, clip: { mediaId: number | null; window: { start: number; end: number } | null }) {
  if (!sig.mediaId || !clip.mediaId || sig.mediaId !== clip.mediaId) return 0;
  if (!sig.window || !clip.window) return 0.5;
  const o = Math.max(0, Math.min(sig.window.end, clip.window.end) - Math.max(sig.window.start, clip.window.start));
  const short = Math.min(sig.window.end - sig.window.start, clip.window.end - clip.window.start);
  return short > 0 ? Math.min(1, 0.5 + 0.5 * (o / short)) : 0.5;
}

/** Social text like "Mentions of Solanke up 11x in 2 minutes" carries its own strength; parse it, never guess. */
export function weightFromText(text: string, kind: SignalKind): number {
  const m = /up\s+(\d+(?:\.\d+)?)x/i.exec(text);
  if (m) return Math.min(1, Math.log2(Number(m[1])) / 4);
  return kind === "game_event" ? 0.8 : kind === "ai_watchlist" ? 0.5 : 0.4;
}

// ── alert lifecycle (B13.5, A0.6) ──────────────────────────────────────────────────────
export type AlertState = { claimedBy?: string | null; snoozedUntil?: string | null; dismissedAt?: string | null; dismissedScore?: number | null; lastLane?: Lane | null };

/** Should this alert show in the rail? Snooze expires; a dismissal re-opens only on a meaningful escalation. */
export function alertVisible(state: AlertState, urgency: Urgency, now: Date) {
  if (urgency.expired) return { visible: false, reason: "expired" };
  if (state.snoozedUntil && new Date(state.snoozedUntil) > now) return { visible: false, reason: "snoozed" };
  if (state.dismissedAt) {
    const escalated = urgency.lane === "act_now" && urgency.score >= (state.dismissedScore ?? 0) + 15;
    if (!escalated) return { visible: false, reason: "dismissed" };
    return { visible: true, reason: "re-opened: escalated after dismissal" };
  }
  return { visible: true, reason: "" };
}
