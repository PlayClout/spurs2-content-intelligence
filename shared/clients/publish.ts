/**
 * PublishBackend — pluggable publish seam (same philosophy as RenderBackend).
 * 'simulated' is the demo default: writes published_assets rows with externalRef=null.
 * 'x-clout' posts to the real @playclout X account. HARD-GATED on PUBLISH_LIVE=1.
 */
import { createHmac } from "node:crypto";
import { readFileSync, statSync, openSync, readSync, closeSync } from "node:fs";
import OAuth from "oauth-1.0a";
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

/* ------------------------------------------------------------------ */
/* X (Twitter) live backend — OAuth 1.0a user context, @playclout      */
/* ------------------------------------------------------------------ */

interface XCreds {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

const DEFAULT_CREDS_PATH =
  "/Users/stu/.openclaw/workspace/memory/credentials/x-api.json";

function loadCreds(): XCreds {
  const p = process.env.X_CREDENTIALS_PATH ?? DEFAULT_CREDS_PATH;
  const raw = JSON.parse(readFileSync(p, "utf8"));
  for (const k of ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"]) {
    if (!raw[k]) throw new Error(`x-clout: credentials file missing field '${k}' (${p})`);
  }
  return raw as XCreds;
}

function makeOAuth(creds: XCreds) {
  const oauth = new OAuth({
    consumer: { key: creds.apiKey, secret: creds.apiKeySecret },
    signature_method: "HMAC-SHA1",
    hash_function: (base, key) =>
      createHmac("sha1", key).update(base).digest("base64"),
  });
  const token = { key: creds.accessToken, secret: creds.accessTokenSecret };
  /** Authorization header for a request. `bodyParams` only for form-encoded bodies. */
  return (url: string, method: string, bodyParams?: Record<string, string>) =>
    oauth.toHeader(
      oauth.authorize({ url, method, data: bodyParams }, token)
    ).Authorization;
}

const UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB, under the 5 MB APPEND cap

async function uploadVideo(auth: ReturnType<typeof makeOAuth>, path: string): Promise<string> {
  const size = statSync(path).size;
  // INIT
  const initParams: Record<string, string> = {
    command: "INIT",
    total_bytes: String(size),
    media_type: "video/mp4",
    media_category: "tweet_video",
  };
  const initRes = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: auth(UPLOAD_URL, "POST", initParams),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(initParams),
  });
  if (!initRes.ok) throw new Error(`media INIT failed ${initRes.status}: ${await initRes.text()}`);
  const mediaId: string = (await initRes.json()).media_id_string;

  // APPEND chunks (multipart — OAuth signs URL only, no body params)
  const fd = openSync(path, "r");
  try {
    let seg = 0;
    for (let off = 0; off < size; off += CHUNK_SIZE, seg++) {
      const len = Math.min(CHUNK_SIZE, size - off);
      const buf = Buffer.alloc(len);
      readSync(fd, buf, 0, len, off);
      const form = new FormData();
      form.append("command", "APPEND");
      form.append("media_id", mediaId);
      form.append("segment_index", String(seg));
      form.append("media", new Blob([new Uint8Array(buf)]), "chunk.mp4");
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: auth(UPLOAD_URL, "POST") },
        body: form,
      });
      if (!res.ok && res.status !== 204)
        throw new Error(`media APPEND seg ${seg} failed ${res.status}: ${await res.text()}`);
    }
  } finally {
    closeSync(fd);
  }

  // FINALIZE
  const finParams = { command: "FINALIZE", media_id: mediaId };
  const finRes = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: auth(UPLOAD_URL, "POST", finParams),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(finParams),
  });
  if (!finRes.ok) throw new Error(`media FINALIZE failed ${finRes.status}: ${await finRes.text()}`);
  let info = (await finRes.json()).processing_info;

  // STATUS poll until processing succeeds
  while (info && info.state !== "succeeded") {
    if (info.state === "failed")
      throw new Error(`media processing failed: ${JSON.stringify(info)}`);
    await new Promise((r) => setTimeout(r, (info.check_after_secs ?? 2) * 1000));
    const q = new URLSearchParams({ command: "STATUS", media_id: mediaId });
    const url = `${UPLOAD_URL}?${q}`;
    const res = await fetch(url, {
      headers: {
        Authorization: auth(UPLOAD_URL, "GET", { command: "STATUS", media_id: mediaId }),
      },
    });
    if (!res.ok) throw new Error(`media STATUS failed ${res.status}: ${await res.text()}`);
    info = (await res.json()).processing_info;
  }
  return mediaId;
}

export async function createTweet(text: string, mediaId?: string): Promise<{ id: string; url: string }> {
  const auth = makeOAuth(loadCreds());
  const body: Record<string, unknown> = { text };
  if (mediaId) body.media = { media_ids: [mediaId] };
  const url = "https://api.twitter.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth(url, "POST"), // JSON body is NOT included in OAuth 1.0a signature
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status !== 201) throw new Error(`tweet create failed ${res.status}: ${await res.text()}`);
  const id: string = (await res.json()).data.id;
  return { id, url: `https://x.com/playclout/status/${id}` };
}

export async function deleteTweet(id: string): Promise<boolean> {
  const auth = makeOAuth(loadCreds());
  const url = `https://api.twitter.com/2/tweets/${id}`;
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: auth(url, "DELETE") } });
  if (!res.ok) throw new Error(`tweet delete failed ${res.status}: ${await res.text()}`);
  return (await res.json()).data?.deleted === true;
}

export async function uploadVideoForTweet(path: string): Promise<string> {
  return uploadVideo(makeOAuth(loadCreds()), path);
}

/**
 * X (Twitter) publish backend for the @playclout account.
 * OAuth 1.0a user context (media upload requires it). Credentials are read from
 * X_CREDENTIALS_PATH (default: workspace credential store) — never from the repo.
 * HARD GATE: throws unless PUBLISH_LIVE=1 (the UI's SIM/LIVE toggle maps to this).
 */
export class XCloutPublishBackend implements PublishBackend {
  readonly id = "x-clout" as const;
  async publish(req: PublishRequest): Promise<PublishResult> {
    if (process.env.PUBLISH_LIVE !== "1") {
      return {
        ok: false,
        mode: "live",
        externalRef: null,
        error: "x-clout backend is gated: set PUBLISH_LIVE=1 to arm real @playclout posting",
      };
    }
    try {
      let mediaId: string | undefined;
      if (req.assetPath) mediaId = await uploadVideoForTweet(req.assetPath);
      const { url } = await createTweet(req.copy, mediaId);
      return { ok: true, mode: "live", externalRef: url };
    } catch (e) {
      return { ok: false, mode: "live", externalRef: null, error: String(e) };
    }
  }
}

export function getPublishBackend(mode: "simulated" | "live"): PublishBackend {
  return mode === "live" ? new XCloutPublishBackend() : new SimulatedPublishBackend();
}
