"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { snoozeAlert, type HotClip } from "@/lib/signals";
import { AUDIENCE, formatLabel, statusTone, titleCase } from "@/lib/format";
import type { OpportunityRow } from "@/lib/actions";
import type { Compliance } from "@shared/schemas";
import { cn } from "@/lib/utils";

export function StatusPill({ status, compliance }: { status: string; compliance?: string }) {
  const [label, tone] = statusTone(status, compliance);
  return <span className={cn("pill dot", tone)}>{label}</span>;
}

export function QueueRow({ opp, selected, hot, href }: { opp: OpportunityRow; selected: boolean; hot: HotClip | null; href: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const poster = Object.values(opp.draftPaths as Record<string, string>)[0];
  const card = opp.contentType !== "reel";
  return (
    <Link href={href} scroll={false} aria-current={selected ? "true" : undefined}
      className={cn("relative flex gap-3 border-b border-border px-3.5 py-3 last:border-b-0",
        selected ? "bg-selected before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary" : hot ? "bg-hot hover:bg-hot-hover" : "hover:bg-subtle")}>
      {poster
        ? <Image src={poster} alt="" width={64} height={80} unoptimized className={cn("h-20 shrink-0 rounded-md bg-secondary object-cover", card ? "w-16" : "w-[60px]")} />
        : <div className="h-20 w-[60px] shrink-0 rounded-md bg-secondary" />}
      <div className="min-w-0 flex-1">
        <p className={cn("line-clamp-2 text-[13.5px] font-semibold leading-snug", selected && "text-accent-foreground")}>{titleCase(opp.headline)}</p>
        <p className="mt-0.5 text-xs text-ink-3">{formatLabel(opp.contentType)} · {AUDIENCE[opp.audience] ?? opp.audience}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {hot && <span className={cn("pill dot", hot.lane === "act_now" ? "tone-red" : "tone-amber")}>{hot.lane === "act_now" ? "Act now" : "Rising"}</span>}
          <StatusPill status={opp.status} compliance={(opp.compliance as Compliance)?.status} />
        </div>
        {hot && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger-fg">
            <span className="truncate">{hot.latestSignal.replace(/\s*\((simulated feed|live search)\)/, "")}</span>
            <button type="button" disabled={pending} className="ml-auto shrink-0 text-ink-4 hover:text-foreground"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); start(async () => { await snoozeAlert(opp.id, 10); router.refresh(); }); }}>Snooze</button>
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-semibold leading-none tabular-nums">{Math.round(opp.score)}</p>
        <p className="text-[10.5px] text-ink-4">score</p>
      </div>
    </Link>
  );
}
