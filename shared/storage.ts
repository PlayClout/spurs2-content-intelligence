/** Club media stays on the worker laptop. Reject legacy/cloud configuration rather than falling back. */
export type StorageMode = "local" | "s3"; // legacy caller compatibility; s3 is always rejected
export function storageMode(): StorageMode {
  if (process.env.RENDER_STORAGE && process.env.RENDER_STORAGE !== "local") {
    throw new Error("Club media requires RENDER_STORAGE=local; cloud storage is disabled");
  }
  return "local";
}

// Compatibility for A3's current renders route; remove the redirect branch there when it merges.
export async function signedRenderUrl(_slug: string, _file: string, _expiresInSec = 3600): Promise<null> {
  storageMode();
  return null;
}

storageMode(); // fail at process startup, before any media work
