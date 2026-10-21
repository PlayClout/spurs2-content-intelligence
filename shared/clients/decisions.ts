/**
 * DecisionProvider — typed, probabilistic "smart if-statements" for the hot path.
 * Backend chain: Jev (TypeSafe AI System One) → Haiku structured output → deterministic formula.
 * The pipeline MUST work end-to-end on the deterministic fallback; Jev/Haiku are upgrades, never dependencies.
 * Jev: https://docs.typesafe.ai — early access pending (Stu requesting). ~70-500ms, typed outputs,
 * calibrated probabilities, no string generation. Use for: signal→event fusion matching,
 * audience_fit / event_weight scoring inputs, moment dedupe, caption guardrail checks.
 * NOT for captions/copy/why-text — that stays an LLM (Haiku) job in copy.ts.
 */
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

const JEV_BASE = process.env.TYPESAFE_API_BASE ?? "https://api.typesafe.ai";
const jevAvailable = () => !!process.env.TYPESAFE_API_KEY && process.env.MOCK_MODE !== "1";
const haikuAvailable = () => !!process.env.ANTHROPIC_API_KEY && process.env.MOCK_MODE !== "1";

/** TODO(Wed): fill exact request shape from docs.typesafe.ai once early-access key lands.
 * Expected pattern: POST state + question schema -> parallel typed probabilities. */
async function jevDecide<T>(_state: object, _questions: object): Promise<T> {
  if (!jevAvailable()) throw new Error("jev_unavailable");
  throw new Error("jev_not_wired: fill from docs.typesafe.ai after early-access key (see TODO)");
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
