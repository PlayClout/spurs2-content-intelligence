/**
 * PublishBackend — pluggable publish seam (same philosophy as RenderBackend).
 * 'simulated' is the demo default: writes published_assets rows with externalRef=null.
 * 'x-clout' is a stub for posting to the real @playclout X account — NOT wired to creds.
 */
import type { Channel } from "../schemas";

export interface PublishRequest {
  orgId: string;
  opportunityId: string;
  channel: Channel;
  copy: string;
  /** final rendered variant path for this channel (may be a draft path pre-render) */
  assetPath: string | null;
}

export interface PublishResult {
  ok: boolean;
  mode: "simulated" | "live";
  /** platform permalink when live; null when simulated */
  externalRef: string | null;
  error?: string;
}

export interface PublishBackend {
  readonly id: "simulated" | "x-clout";
  publish(req: PublishRequest): Promise<PublishResult>;
}

export class SimulatedPublishBackend implements PublishBackend {
  readonly id = "simulated" as const;
  async publish(_req: PublishRequest): Promise<PublishResult> {
    // No external call. The caller records the published_assets row; this backend
    // just confirms the simulated send so the UI flow is identical to live.
    return { ok: true, mode: "simulated", externalRef: null };
  }
}

/**
 * X (Twitter) publish stub for the @playclout account.
 *
 * TODO (post-demo, deliberate — do NOT wire real creds during the hackathon):
 *  1. Chunked media upload via v1.1: POST media/upload (INIT -> APPEND -> FINALIZE),
 *     polling STATUS until processing_info.state === "succeeded". Video requires
 *     media_category="tweet_video".
 *  2. Create post via v2: POST /2/tweets with { text, media: { media_ids: [...] } }.
 *  3. Auth: OAuth 1.0a user context (media upload requires it) with keys held in
 *     protected secret store — never in repo env files.
 *  4. Return the permalink as externalRef: https://x.com/playclout/status/<id>.
 */
export class XCloutPublishBackend implements PublishBackend {
  readonly id = "x-clout" as const;
  async publish(_req: PublishRequest): Promise<PublishResult> {
    return {
      ok: false,
      mode: "live",
      externalRef: null,
      error: "x-clout backend is a stub — real X publishing is intentionally not armed",
    };
  }
}

export function getPublishBackend(mode: "simulated" | "live"): PublishBackend {
  return mode === "live" ? new XCloutPublishBackend() : new SimulatedPublishBackend();
}
