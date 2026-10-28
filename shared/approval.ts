/**
 * Approval contract (B2.5/B10.4). Pure: no DB, no network.
 * The approved revision is a hash of everything a reviewer signed off on. A trim or copy edit after approval
 * changes the hash, so `isCurrent` fails and the queued write holds instead of sending a stale approval.
 */
import { createHash } from "node:crypto";
import type { WriteRequest } from "./clients/writeback";

export interface ApprovableOpportunity {
  id: string;
  orgId: string;
  headline: string;
  audience: string;
  trimOverride: unknown;
  generatedCopy: unknown;
  channels: unknown;
  delivery: unknown;
}

interface DeliveryShape {
  tightWindow?: { start: number; end: number };
  scoreplay?: { mode?: string; mediaId?: number; companyId?: number };
}

export function approvalRevision(opp: ApprovableOpportunity): string {
  const d = (opp.delivery ?? {}) as DeliveryShape;
  const trim = (opp.trimOverride as { startSec: number; endSec: number } | null) ?? null;
  const copy = Object.entries((opp.generatedCopy ?? {}) as Record<string, string>).sort(([a], [b]) => a.localeCompare(b));
  const stable = JSON.stringify([opp.id, trim ? [trim.startSec, trim.endSec] : null, d.tightWindow ? [d.tightWindow.start, d.tightWindow.end] : null, copy, [...((opp.channels as string[]) ?? [])].sort()]);
  return createHash("sha256").update(stable).digest("hex");
}

/** Source-log write request for an approval. Returns null (with a reason) when there is no ScorePlay lineage. */
export function sourceLogRequest(opp: ApprovableOpportunity, revision: string, confirmedBy: string, now = new Date()): { ok: true; request: WriteRequest } | { ok: false; reason: string } {
  const d = (opp.delivery ?? {}) as DeliveryShape;
  const trim = (opp.trimOverride as { startSec: number; endSec: number } | null) ?? null;
  const win = trim ? { start: trim.startSec, end: trim.endSec } : d.tightWindow;
  if (!d.scoreplay?.mediaId || !d.scoreplay.companyId || !win) return { ok: false, reason: "no ScorePlay source lineage on this card (seed/demo fixture)" };
  if ((d as { photo?: boolean }).photo) return { ok: false, reason: "a photo card has no video segment to log in ScorePlay" };
  return {
    ok: true,
    request: {
      kind: "source_log",
      orgId: opp.orgId,
      revision,
      source: d.scoreplay.mode === "live" ? "live" : "fixture",
      confirmedBy,
      confirmedAt: now.toISOString(),
      log: {
        mediaId: d.scoreplay.mediaId, companyId: d.scoreplay.companyId, startSec: win.start, endSec: win.end,
        ref: opp.id, label: `${opp.headline} (${opp.audience})`, tags: ["producer approved", "ai recommended"],
      },
    },
  };
}
