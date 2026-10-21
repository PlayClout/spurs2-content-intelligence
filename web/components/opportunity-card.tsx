"use client";

import Link from "next/link";
import Image from "next/image";
import { Timer } from "lucide-react";
import { ScoreRing } from "@/components/score-ring";
import { ChannelIcons } from "@/components/channel-icons";
import { ComplianceBadge } from "@/components/compliance-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OpportunityRow } from "@/lib/actions";
import type { Compliance } from "@shared/schemas";

const statusTint: Record<string, string> = {
  approved: "border-l-[var(--success)]",
  rejected: "border-l-[var(--danger)] opacity-60",
  exported: "border-l-[var(--clout-violet)]",
  draft_ready: "border-l-[var(--clout-electric-blue)]",
  draft_pending: "border-l-[var(--clout-slate-dim)]",
};

export function OpportunityCard({
  opp,
  selected,
  hasSimulatedSignals,
  href,
}: {
  opp: OpportunityRow & { surfacedAfterSec: number | null };
  selected: boolean;
  hasSimulatedSignals: boolean;
  href: string;
}) {
  const compliance = opp.compliance as Compliance;
  const poster = Object.values(opp.draftPaths as Record<string, string>)[0];

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "block rounded-lg border border-border border-l-2 bg-card p-3 transition-colors hover:bg-carbon-2",
        statusTint[opp.status] ?? "border-l-border",
        selected && "ring-2 ring-[var(--clout-electric-blue)] bg-carbon-2"
      )}
    >
      <div className="flex gap-3">
        {poster ? (
          <Image
            src={poster}
            alt=""
            width={96}
            height={54}
            unoptimized
            className="h-[54px] w-24 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="h-[54px] w-24 shrink-0 rounded-md border border-border bg-secondary" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="display truncate text-[15px] leading-tight">{opp.headline}</p>
            {opp.score > 0 && <ScoreRing score={opp.score} size={40} />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] capitalize">{opp.audience}</Badge>
            <Badge variant="outline" className="text-[10px]">{opp.contentType.replace(/_/g, " ")}</Badge>
            <ComplianceBadge status={compliance?.status ?? "unknown"} compact />
            {hasSimulatedSignals && (
              <span className="rounded-full border border-[rgba(0,163,255,0.45)] bg-[rgba(0,163,255,0.14)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--clout-hyper-blue)]">
                SIMULATED
              </span>
            )}
            <ChannelIcons channels={opp.channels as string[]} size={12} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="capitalize">{opp.status.replace(/_/g, " ")}{opp.rejectReason ? ` · ${opp.rejectReason}` : ""}</span>
        {opp.surfacedAfterSec !== null && (
          <span className="flex items-center gap-1 text-[var(--clout-blue-tint)]">
            <Timer size={11} />
            surfaced {opp.surfacedAfterSec}s after the play
          </span>
        )}
      </div>
    </Link>
  );
}
