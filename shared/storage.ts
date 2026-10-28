/** Club media stays on the worker laptop. Reject legacy/cloud configuration rather than falling back. */
export type StorageMode = "local";

export function storageMode(): StorageMode {
  if (process.env.RENDER_STORAGE && process.env.RENDER_STORAGE !== "local") {
    throw new Error("Club media requires RENDER_STORAGE=local; cloud storage is disabled");
  }
  return "local";
}

storageMode(); // fail at process startup, before any media work
