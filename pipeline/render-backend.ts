/**
 * RenderBackend — pluggable render seam. Local ffmpeg is the demo profile of the
 * product answer; cloud-worker (containerized ffmpeg) is the scale path (post-event).
 * Profiles: demo-local -> LocalFfmpegBackend on the M5 (hardware encoders).
 */
import type { Channel } from "../shared/schemas";

export interface RenderRequest {
  orgId: string;
  sourcePath: string;
  startSec: number;
  endSec: number;
  channel: Channel; // resolves against pipeline/channel-profiles.json
  caption?: string;
  cropXOffset?: number; // from Pegasus subject position; default center
  mode: "draft" | "final"; // draft = stream-copy rough cut; final = frame-accurate + profile encode
}

export interface RenderResult {
  outPath: string;
  posterPath: string;
  durationSec: number;
  renderMs: number;
  backend: "local-ffmpeg" | "cloud-worker";
}

export interface RenderBackend {
  render(req: RenderRequest): Promise<RenderResult>;
}

/** demo-local profile -> LocalFfmpegBackend (render-local.ts). cloud-worker lands post-event
 * behind the same interface. Captions are PNG overlays (overlay.ts), not drawtext. */
export async function getRenderBackend(): Promise<RenderBackend> {
  const { LocalFfmpegBackend } = await import("./render-local");
  return new LocalFfmpegBackend();
}
