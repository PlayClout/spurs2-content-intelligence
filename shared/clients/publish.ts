/**
 * PublishBackend - simulated/event-internal publishing only.
 *
 * Club footage is not Clout IP, the hackathon brief keeps content on-platform/event-only,
 * and @playclout is a separate B2C surface. Therefore this app has no live social-posting
 * implementation. Publishing records an event-internal export row only.
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
  mode: "simulated";
  /** Always null: no external platform post is created. */
  externalRef: null;
  error?: string;
}

export interface PublishBackend {
  readonly id: "simulated";
  publish(req: PublishRequest): Promise<PublishResult>;
}

export class SimulatedPublishBackend implements PublishBackend {
  readonly id = "simulated" as const;
  async publish(_req: PublishRequest): Promise<PublishResult> {
    // No external call. The caller records the published_assets row; this backend
    // confirms an event-internal simulated export so the approval flow is still demoable.
    return { ok: true, mode: "simulated", externalRef: null };
  }
}

export function getPublishBackend(): PublishBackend {
  return new SimulatedPublishBackend();
}
