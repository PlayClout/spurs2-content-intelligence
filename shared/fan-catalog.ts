/**
 * Fan catalog publication rules (B2.3, B4.2, B8.7). Pure: no DB, no network.
 * The fan app only ever sees editor-published versions of approved derivatives.
 */
import { createHash } from "node:crypto";
import type { RightsStatus } from "./rights/types";

/** Interest vocabulary shared by the editor metadata review and fan preferences. */
export const FAN_INTERESTS = ["goal", "chance", "defense", "skill", "celebration", "crowd", "comeback", "behind the scenes"] as const;
export type FanInterest = (typeof FAN_INTERESTS)[number];

export const FAN_POLICY_VERSION = "illustrative policy v0";

/**
 * Map the opportunity's compliance stamp to a fan-web rights status.
 * - blocked -> blocked; requiresReview or missing evidence -> needs_review (unknown never clears).
 * - "restricted" means owned channels stay allowed with advisories (see rules-test), and the fan app is an
 *   owned channel, so it maps to cleared while the advisory reasons travel with the decision as findings.
 */
export function fanRightsStatus(compliance: { status?: string | null } | null | undefined, requiresReview = false): RightsStatus {
  if (!compliance?.status || compliance.status === "unknown") return "needs_review";
  if (compliance.status === "blocked") return "blocked";
  if (requiresReview) return "needs_review";
  if (compliance.status === "cleared" || compliance.status === "restricted") return "cleared";
  return "needs_review";
}

/** Exact approved revision: trim, copy and the artifact path. Any change yields a new hash (B2.5/B4.2). */
export function revisionHash(input: { opportunityId: string; trim: { startSec: number; endSec: number } | null; copy: string; renderPath: string; featuredPlayerIds: string[]; interestTags: string[] }) {
  const stable = JSON.stringify([input.opportunityId, input.trim ? [input.trim.startSec, input.trim.endSec] : null, input.copy, input.renderPath,
    [...input.featuredPlayerIds].sort(), [...input.interestTags].sort()]);
  return createHash("sha256").update(stable).digest("hex");
}

export function artifactHash(renderPath: string, bytesFingerprint: string) {
  return createHash("sha256").update(`${renderPath}:${bytesFingerprint}`).digest("hex");
}

/** Suggest interest tags from moment text. The editor confirms; suggestions are never published unreviewed. */
export function suggestInterestTags(text: string): FanInterest[] {
  const t = text.toLowerCase();
  const out = new Set<FanInterest>();
  if (/\bgoal|scores?\b|finish|net\b/.test(t)) out.add("goal");
  if (/chance|shot|effort|attempt|saved|near miss/.test(t)) out.add("chance");
  if (/tackle|block|clearance|defen|intercept|save\b/.test(t)) out.add("defense");
  if (/dribble|skill|turn|nutmeg|dunk/.test(t)) out.add("skill");
  if (/celebrat|cheer|embrace/.test(t)) out.add("celebration");
  if (/crowd|fans|supporters|stands|atmosphere/.test(t)) out.add("crowd");
  if (/comeback|equali[sz]|late winner/.test(t)) out.add("comeback");
  return [...out];
}

/** Pick the fan-app artifact: a rendered final video first, then a final photo card. Drafts never publish. */
export function pickFanArtifact(finalPaths: Record<string, string>): { channel: string; renderPath: string; kind: "video" | "photo" } | null {
  const entries = Object.entries(finalPaths ?? {});
  const video = entries.find(([, p]) => /\.mp4$/i.test(p));
  if (video) return { channel: video[0], renderPath: video[1], kind: "video" };
  const photo = entries.find(([, p]) => /\.(jpe?g|png|webp)$/i.test(p));
  if (photo) return { channel: photo[0], renderPath: photo[1], kind: "photo" };
  return null;
}
