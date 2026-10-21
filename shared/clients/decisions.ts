/**
 * DecisionProvider — typed, probabilistic "smart if-statements" for the hot path.
 * Backend chain: Jev (TypeSafe AI System One) → Haiku structured output → deterministic formula.
 * The pipeline MUST work end-to-end on the deterministic fallback; Jev/Haiku are upgrades, never dependencies.
 * Jev: https://docs.typesafe.ai — early access pending (Stu requesting). ~70-500ms, typed outputs,
 * calibrated probabilities, no string generation. Use for: signal→event fusion matching,
 * audience_fit / event_weight scoring inputs, moment dedupe, caption guardrail checks.
 * NOT for captions/copy/why-text — that stays an LLM (Haiku) job in copy.ts.
 */
import { readFileSync } from "node:fs";
import type { Channel } from "../schemas";

export type Backend = "jev" | "haiku" | "formula";

export interface FusionDecision {
  /** probability per candidate event id that the social cluster refers to it */
  eventMatch: Record<string, number>;
  sentiment: "euphoric" | "hype" | "positive" | "neutral" | "negative";
  hypeLevel: number; // 0-1
  confidence: number; // calibrated when backend=jev
  backend: Backend;
}

export interface FitDecision {
  audienceFit: number; // 0-1
  eventWeight: number; // 0-1
  suggestedChannels: Channel[];
  confidence: number;
  backend: Backend;
}

export interface DedupeDecision {
  sameMoment: number; // probability 0-1
  confidence: number;
  backend: Backend;
}

const JEV_KEY_PATH =
  process.env.TYPESAFE_KEY_PATH ??
  "/Users/stu/.openclaw/workspace/memory/credentials/typesafe-jev.json";

let jevKeyCache: string | null | undefined;
function jevKey(): string | null {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  if (jevKeyCache !== undefined) return jevKeyCache;
  try {
    jevKeyCache = (JSON.parse(readFileSync(JEV_KEY_PATH, "utf8")).key as string | undefined) ?? null;
  } catch {
    jevKeyCache = null;
  }
  return jevKeyCache;
}
const jevAvailable = () => !!jevKey() && process.env.MOCK_MODE !== "1";
const haikuAvailable = () => !!process.env.ANTHROPIC_API_KEY && process.env.MOCK_MODE !== "1";

/**
 * Jev (TypeSafe System One) — wired via @typesafe-ai/sdk (docs.typesafe.ai).
 * One systemOne call per decision: state + typed questions (choice/score/noul),
 * parallel evaluation, calibrated probabilities + confidence. Dynamic import so
 * the formula fallback works in environments without the SDK installed.
 */
async function jevClient() {
  const key = jevKey();
  if (!key) throw new Error("jev_unavailable");
  const sdk = await import("@typesafe-ai/sdk");
  return { sdk, client: new sdk.TypeSafeClient({ apiKey: key, defaultModel: "jev-latest" }) };
}

/** Score answers are positions 0..(levels-1); normalize to 0-1. */
const norm = (score: number, levels: number) => Math.max(0, Math.min(1, score / (levels - 1)));

async function jevDecide<T>(state: object, questions: object): Promise<T> {
  const kind = (questions as { kind?: string }).kind ?? "";
  if (!jevAvailable()) throw new Error("jev_unavailable");
  const { sdk, client } = await jevClient();
  const { choice, score, noul } = sdk;

  if (kind === "fusion") {
    const { cluster, candidates } = state as {
      cluster: { text: string; platform: string; velocity: number };
      candidates: { id: string; eventText: string; occurredAt: string }[];
    };
    const criteria: Record<string, string> = { none: "The post does not refer to any of the listed game events" };
    for (const c of candidates) criteria[c.id] = c.eventText;
    const res = await client.systemOne({
      state: { socialPost: cluster.text, platform: cluster.platform, candidateGameEvents: candidates.map((c) => ({ id: c.id, event: c.eventText, occurredAt: c.occurredAt })) },
      questions: {
        event: choice("Which candidate game event does the social post refer to? Pick 'none' if it refers to a different play, a previous game, or is generic hype about no specific play.", criteria),
        sentiment: choice("Overall sentiment of the social post", {
          euphoric: "Ecstatic, peak celebration", hype: "Excited, energized", positive: "Pleased, approving", neutral: "Flat or informational", negative: "Critical, upset, or disappointed",
        }),
        hype: score("How hyped / high-energy is this post", ["Flat, no energy", "Mild interest", "Clearly excited", "Very hyped", "Peak euphoria, all-caps eruption"]),
      },
    });
    const ev = res.answers.event as { choice: string; probabilities: Record<string, number>; confidence: number };
    const eventMatch: Record<string, number> = {};
    for (const c of candidates) eventMatch[c.id] = ev.probabilities[c.id] ?? 0;
    const sent = (res.answers.sentiment as { choice: string }).choice as FusionDecision["sentiment"];
    const hype = res.answers.hype as { score: number };
    return { eventMatch, sentiment: sent, hypeLevel: norm(hype.score, 5), confidence: ev.confidence, backend: "jev" } as T;
  }

  if (kind === "fit") {
    const { moment, audience } = state as { moment: { label: string; description: string }; audience: string };
    const channels: Channel[] = ["instagram_reel", "instagram_story", "tiktok", "x_post", "youtube_short", "youtube_highlight"];
    const qs: Record<string, unknown> = {
      audienceFit: score(`How well does this moment fit the '${audience}' audience`, ["Poor fit", "Weak fit", "Decent fit", "Strong fit", "Perfect fit"]),
      eventWeight: score("How significant is this moment within a game", ["Routine play", "Nice play", "Notable highlight", "Major moment", "Game-defining moment"]),
    };
    for (const ch of channels) qs[`ch_${ch}`] = noul(`This moment would perform well published as ${ch.replace(/_/g, " ")}`);
    const res = await client.systemOne({ state: { moment, audience }, questions: qs as never });
    const answers = res.answers as Record<string, unknown>;
    const af = answers.audienceFit as { score: number; confidence: number };
    const ew = answers.eventWeight as { score: number; confidence: number };
    const suggested = channels.filter((ch) => (answers[`ch_${ch}`] as { noul: number }).noul >= 0.6);
    return {
      audienceFit: norm(af.score, 5), eventWeight: norm(ew.score, 5),
      suggestedChannels: suggested.length ? suggested : (["x_post"] as Channel[]),
      confidence: Math.min(af.confidence, ew.confidence), backend: "jev",
    } as T;
  }

  if (kind === "dedupe") {
    const { a, b } = state as { a: { startSec: number; endSec: number; description: string }; b: { startSec: number; endSec: number; description: string } };
    const res = await client.systemOne({
      state: { clipA: a, clipB: b },
      questions: {
        same: choice("Are clipA and clipB detections of the same play (overlapping time windows and matching descriptions)?", {
          same: "Same play captured twice", different: "Two distinct plays",
        }),
      },
    });
    const same = res.answers.same as { probabilities: Record<string, number>; confidence: number };
    return { sameMoment: same.probabilities.same ?? 0, confidence: same.confidence, backend: "jev" } as T;
  }

  throw new Error(`jev: unknown question kind ${kind}`);
}

/** Haiku with tool-use forced JSON — slower (~1s) but same typed shape. TODO(Wed): wire via @anthropic-ai/sdk. */
async function haikuDecide<T>(_state: object, _questions: object): Promise<T> {
  if (!haikuAvailable()) throw new Error("haiku_unavailable");
  throw new Error("haiku_not_wired");
}

async function chain<T>(state: object, questions: object, formula: () => T): Promise<T> {
  for (const fn of [jevDecide<T>, haikuDecide<T>]) {
    try { return await fn(state, questions); } catch { /* fall through */ }
  }
  return formula();
}

/** Does this social cluster refer to one of these candidate game events? */
export function fuseSignal(cluster: { text: string; platform: string; velocity: number }, candidates: { id: string; eventText: string; occurredAt: string }[]): Promise<FusionDecision> {
  return chain({ cluster, candidates }, { kind: "fusion" }, () => {
    // Deterministic fallback: token-overlap entity match + time proximity
    const tokens = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9']+/g) ?? []);
    const ct = tokens(cluster.text);
    const eventMatch: Record<string, number> = {};
    for (const c of candidates) {
      const et = tokens(c.eventText);
      const overlap = [...et].filter((t) => t.length > 3 && ct.has(t)).length;
      eventMatch[c.id] = Math.min(1, overlap / 3);
    }
    return { eventMatch, sentiment: cluster.velocity > 0.8 ? "euphoric" : "positive", hypeLevel: cluster.velocity, confidence: 0.4, backend: "formula" as const };
  });
}

/** How well does this moment fit this audience, and which channels? */
export function scoreFit(moment: { label: string; description: string }, audience: string): Promise<FitDecision> {
  return chain({ moment, audience }, { kind: "fit" }, () => {
    const table: Record<string, number> = { game_winner: 1.0, highlight_play: 0.85, milestone: 0.8, celebration: 0.7, crowd_eruption: 0.6 };
    return {
      audienceFit: audience === "casual" ? 0.8 : 0.7,
      eventWeight: table[moment.label] ?? 0.5,
      suggestedChannels: ["instagram_reel", "x_post"] as Channel[],
      confidence: 0.4,
      backend: "formula" as const,
    };
  });
}

/** Are these two detected moments the same play? */
export function dedupeMoments(a: { startSec: number; endSec: number; description: string }, b: { startSec: number; endSec: number; description: string }): Promise<DedupeDecision> {
  return chain({ a, b }, { kind: "dedupe" }, () => {
    const overlap = Math.max(0, Math.min(a.endSec, b.endSec) - Math.max(a.startSec, b.startSec));
    const span = Math.max(a.endSec, b.endSec) - Math.min(a.startSec, b.startSec);
    return { sameMoment: span > 0 ? overlap / span : 0, confidence: 0.6, backend: "formula" as const };
  });
}
