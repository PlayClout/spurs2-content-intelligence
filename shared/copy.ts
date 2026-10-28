/**
 * Per-channel post copy. Claude Haiku when ANTHROPIC_API_KEY is set (and MOCK_MODE != 1), else a deterministic
 * template. Either way the output is validated: per-channel char limits (pipeline/channel-profiles.json), no em/en
 * dashes (house style), only facts we pass in. Any Haiku failure falls back to the template and records why.
 */
import profiles from "../pipeline/channel-profiles.json" with { type: "json" };

export interface CopyInput {
  orgKey: string;
  audience: string;
  channels: string[];
  headline: string;
  kicker?: string;
  statLine?: string;
  summary?: string; // what TwelveLabs saw
}
export interface CopyResult { copy: Record<string, string>; backend: "haiku" | "template"; model?: string; error?: string }

type Profile = { copy: { maxChars: number; hashtags: boolean; tone: string } };
const P = profiles as unknown as Record<string, Profile>;
const TAG: Record<string, string> = { "tottenham-hotspur": "#COYS", "san-antonio-spurs": "#GoSpursGo" };
export const MODEL = process.env.ANTHROPIC_COPY_MODEL ?? "claude-haiku-4-5";

let fetchImpl: typeof fetch = (...a) => fetch(...a);
export const __setCopyFetch = (f: typeof fetch) => { fetchImpl = f; };

/** annotations like "SIMULATED game data" are UI honesty labels, never post copy */
const facts = (s?: string) => s?.split("·").map((x) => x.trim()).filter((x) => x && !/simulated/i.test(x)).join(" · ") ?? "";
const dashless = (s: string) => s.replace(/\s*[\u2014\u2013]\s*/g, ", ");
function fit(s: string, max: number) {
  const t = dashless(s).replace(/\s+/g, " ").trim();
  if (!max || t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}
const limit = (ch: string) => P[ch]?.copy.maxChars ?? 280;

export function templateCopy(i: CopyInput): Record<string, string> {
  const tag = TAG[i.orgKey] ?? "";
  return Object.fromEntries(i.channels.map((ch) => {
    const max = limit(ch);
    if (max === 0) return [ch, ""]; // e.g. stories publish without copy
    const lead = ch.startsWith("x_") ? facts(i.statLine) || facts(i.kicker) : facts(i.kicker);
    return [ch, fit(`${i.headline}. ${lead} ${P[ch]?.copy.hashtags ? tag : ""}`.replace(/\.\s*\./g, "."), max)];
  }));
}

async function haikuCopy(i: CopyInput): Promise<Record<string, string>> {
  const spec = i.channels.map((ch) => ({ channel: ch, maxChars: limit(ch), tone: P[ch]?.copy.tone, hashtags: P[ch]?.copy.hashtags }));
  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.4,
      system:
        "You write social posts for a professional sports club's official accounts. Use ONLY the facts provided; never invent scores, names, stats or quotes. " +
        "No em dashes or en dashes. At most one emoji per post. Respect each channel's maxChars (0 means return an empty string). " +
        `Club hashtag when hashtags=true: ${TAG[i.orgKey] ?? "none"}. Return ONLY a JSON object mapping channel id to post text.`,
      messages: [{ role: "user", content: JSON.stringify({ audience: i.audience, headline: i.headline, scoreline: facts(i.kicker), detail: facts(i.statLine), whatTheFootageShows: i.summary ?? "", channels: spec }) }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = body.content?.find((c) => c.type === "text")?.text ?? "";
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("anthropic: no JSON object in response");
  const out = JSON.parse(json) as Record<string, unknown>;
  const missing = i.channels.filter((ch) => typeof out[ch] !== "string");
  if (missing.length) throw new Error(`anthropic: missing channels ${missing.join(",")}`);
  return Object.fromEntries(i.channels.map((ch) => [ch, limit(ch) === 0 ? "" : fit(out[ch] as string, limit(ch))]));
}

export async function generateCopy(i: CopyInput): Promise<CopyResult> {
  if (process.env.ANTHROPIC_API_KEY && process.env.MOCK_MODE !== "1") {
    try {
      return { copy: await haikuCopy(i), backend: "haiku", model: MODEL };
    } catch (e) {
      return { copy: templateCopy(i), backend: "template", error: (e as Error).message.slice(0, 300) };
    }
  }
  return { copy: templateCopy(i), backend: "template" };
}
