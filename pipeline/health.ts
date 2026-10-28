import { storageMode } from "../shared/storage";
import { mode } from "../shared/clients/scoreplay";
import { canWrite } from "../shared/clients/writeback";

/** No secrets or media paths. Settings failures report writes held, never enabled. */
export async function workerHealth(worker: string, lane: string, lastLoopAt: number, now = Date.now()) {
  const gate = await canWrite();
  const lastLoopMsAgo = now - lastLoopAt;
  return { worker, lane, ok: lastLoopMsAgo <= 120_000, lastLoopMsAgo, storage: storageMode(),
    scoreplay: mode(), twelvelabs: process.env.TWELVELABS_API_KEY && process.env.MOCK_MODE !== "1" ? "live" : "fixture",
    writes: gate.allowed ? "enabled" : "held", ...(gate.reason ? { writeHoldReason: gate.reason } : {}),
  };
}
