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

/** Implemented in render-local.ts (Wed PoC): draft = `-ss .. -to .. -c copy` (sub-second);
 * final = fast-seek + frame-trim re-encode -> profile crop/scale/drawtext in one filter chain,
 * then poster frame-grab. Fan-out: Promise.all over channel variants from one master cut. */
export function getRenderBackend(): RenderBackend {
  // demo-local profile; cloud-worker lands post-event behind the same interface
  throw new Error("wire render-local.ts after Wednesday ffmpeg PoC (build list item 2)");
}
