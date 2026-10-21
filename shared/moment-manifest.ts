/**
 * Moment manifest: what TwelveLabs (Pegasus 1.6 analyze, json_schema, WINDOWED to the moment) is asked to
 * report for one ranked moment. One call gives the render inputs (tight in/out, subject position) AND the
 * rights-relevant content facts the content rules evaluate (sponsors, markings, crowd privacy, audio).
 *
 * Deliberately NO model "confidence" fields: Pegasus returns generated text, not calibrated scores, and a
 * made-up number in the explainability panel would be dishonest. Detections are present/absent + named.
 */
import { z } from "zod";

export const AudioRiskType = z.enum(["stadium_music", "recorded_music", "broadcast_commentary", "crowd_chant"]);

export const MomentManifestSchema = z.object({
  summary: z.string(),
  moments: z.array(z.object({ label: z.string(), description: z.string(), start: z.number(), end: z.number() })),
  /** 0 = far left, 1 = far right: where the main action sits horizontally (drives the vertical crop) */
  subjectX: z.number().min(0).max(1),
  detectedSponsors: z.array(z.object({ name: z.string(), category: z.string() })),
  identifiablePeople: z.array(z.object({ type: z.enum(["player", "coach", "official", "fan"]), label: z.string() })),
  competitionMarkings: z.array(z.string()),
  crowdPrivacy: z.object({ facesVisible: z.boolean(), closeUps: z.boolean() }),
  audioRisks: z.array(z.object({ type: AudioRiskType })),
  suggestedUse: z.string(),
});
export type MomentManifest = z.infer<typeof MomentManifestSchema>;

/** TwelveLabs json_schema (subset of JSON Schema; `timestamp` type for times). First property must be required. */
export const PEGASUS_MANIFEST_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    moments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
          start: { type: "timestamp", format: "seconds" },
          end: { type: "timestamp", format: "seconds" },
        },
        required: ["label", "description", "start", "end"],
      },
    },
    subjectX: { type: "number" },
    detectedSponsors: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, category: { type: "string" } }, required: ["name", "category"] },
    },
    identifiablePeople: {
      type: "array",
      items: {
        type: "object",
        properties: { type: { type: "string", enum: ["player", "coach", "official", "fan"] }, label: { type: "string" } },
        required: ["type", "label"],
      },
    },
    competitionMarkings: { type: "array", items: { type: "string" } },
    crowdPrivacy: {
      type: "object",
      properties: { facesVisible: { type: "boolean" }, closeUps: { type: "boolean" } },
      required: ["facesVisible", "closeUps"],
    },
    audioRisks: {
      type: "array",
      items: { type: "object", properties: { type: { type: "string", enum: AudioRiskType.options } }, required: ["type"] },
    },
    suggestedUse: { type: "string" },
  },
  required: ["summary", "moments", "subjectX", "detectedSponsors", "identifiablePeople", "competitionMarkings", "crowdPrivacy", "audioRisks", "suggestedUse"],
} as const;

export const MANIFEST_PROMPT = [
  "You are assisting a sports club content producer. Describe ONLY what is actually visible or audible in this window; do not guess.",
  "moments: the distinct actions in this window, each with a short label, one-sentence description, and start/end in seconds.",
  "subjectX: horizontal position of the main action across the window, from 0 (far left) to 1 (far right); 0.5 if centered or unclear.",
  "detectedSponsors: every brand logo or sponsor signage that is clearly visible, with its product category (e.g. apparel, beverage, telecom, airline, betting). Empty if none.",
  "identifiablePeople: people whose faces are clearly identifiable, typed player/coach/official/fan. Empty if none.",
  "competitionMarkings: visible league/competition branding or broadcast graphics (e.g. 'Premier League broadcast overlay', 'NBA scorebug'). Empty if none.",
  "crowdPrivacy: whether spectator faces are visible, and whether any spectator appears in close-up.",
  "audioRisks: only audio actually present among stadium_music, recorded_music, broadcast_commentary, crowd_chant. Empty if none.",
  "suggestedUse: one sentence on the best social use of this window.",
].join("\n");

/**
 * Parse + validate a TwelveLabs analyze response (data is a JSON string). Throws with the zod issue list.
 *
 * windowStartSec: the `start_time` sent with a WINDOWED analyze. VERIFIED LIVE 2026-10-20 (scripts/tl-manifest-probe.ts,
 * windows 5-13s and 8-12s): Pegasus returns moment timestamps RELATIVE TO THE WINDOW (8-12s window -> moment 0-4s).
 * Pass the window start so returned moments are shifted back to absolute source time (what ffmpeg and ScorePlay
 * video logs need). Omit (or 0) for whole-video analyze.
 */
export function parseManifest(analyzeResponse: { data?: string } | string, windowStartSec = 0): MomentManifest {
  const raw = typeof analyzeResponse === "string" ? analyzeResponse : analyzeResponse.data ?? "";
  const parsed = MomentManifestSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error(`manifest failed schema: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  const m = parsed.data;
  return {
    ...m,
    subjectX: Math.min(1, Math.max(0, m.subjectX)),
    moments: m.moments.map((x) => ({ ...x, start: x.start + windowStartSec, end: x.end + windowStartSec })),
  };
}
