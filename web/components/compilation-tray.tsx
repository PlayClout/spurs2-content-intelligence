"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { approveAndRenderCompilation } from "@/lib/compilation";

type Candidate = { opportunityId: string; headline: string; durationSec: number; score: number; eligible: boolean; complianceStatus: string; requiresReview: boolean };
type Recent = { id: string; status: string; error: string | null; queuedAt: string; result: { outPath: string; posterPath: string; durationSec: number; entries: { headline: string; role: string }[] } | null };

const ROLES3 = ["Hook", "Build-up", "Payoff"];
const ROLES2 = ["Hook", "Payoff"];

export function CompilationTray({ orgId, candidates, suggested, limits, recent }: {
  orgId: string; candidates: Candidate[]; suggested: string[]; recent: Recent[];
  limits: { minEntries: number; maxEntries: number; minSec: number; maxSec: number };
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [order, setOrder] = useState<string[]>(suggested);
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const byId = new Map(candidates.map((c) => [c.opportunityId, c]));
  const total = order.reduce((n, id) => n + (byId.get(id)?.durationSec ?? 0), 0);
  const within = total >= limits.minSec && total <= limits.maxSec;
  const roles = order.length === 2 ? ROLES2 : ROLES3;

  const move = (i: number, d: -1 | 1) => setOrder((o) => { const n = [...o]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const toggle = (id: string) => setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : o.length < limits.maxEntries ? [...o, id] : o));

  return (
    <section className="panel max-w-4xl p-4" aria-label="Compilation tray">
      <h2 className="mb-3 text-[15px] font-semibold">Order</h2>

      <ol className="space-y-1.5">
        {order.map((id, i) => {
          const c = byId.get(id);
          if (!c) return null;
          return (
            <li key={id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-[13px]">
              <span className="pill tone-blue w-20 justify-center">{roles[i]}</span>
              <span className="min-w-0 flex-1 truncate">{titleCase(c.headline)}</span>
              <span className="tabular-nums text-muted-foreground">{c.durationSec}s</span>
              <button type="button" aria-label={`Move ${titleCase(c.headline)} up`} disabled={i === 0} onClick={() => move(i, -1)} className="h-7 w-7 rounded-md border border-border hover:bg-secondary disabled:opacity-30">&uarr;</button>
              <button type="button" aria-label={`Move ${titleCase(c.headline)} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)} className="h-7 w-7 rounded-md border border-border hover:bg-secondary disabled:opacity-30">&darr;</button>
              <button type="button" aria-label={`Remove ${titleCase(c.headline)}`} onClick={() => toggle(id)} className="h-7 w-7 rounded-md border border-border hover:bg-secondary">&times;</button>
            </li>
          );
        })}
        {order.length === 0 && <li className="rounded-lg border border-dashed border-input bg-subtle px-3 py-4 text-center text-[13px] text-muted-foreground">{candidates.length < limits.minEntries ? `Approve at least ${limits.minEntries} clips in the inbox, then pick them here.` : "Pick clips from the list below to build the order."}</li>}
      </ol>

      {order.length > 0 && <div className="mt-2 flex items-center gap-3 text-xs">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className={cn("h-full rounded-full", within ? "bg-success" : "bg-warning")} style={{ width: `${Math.min(100, (total / limits.maxSec) * 100)}%` }} />
        </div>
        <span className={cn("tabular-nums", within ? "text-success-fg" : "text-warning-fg")}>
          {total.toFixed(1)}s {total < limits.minSec ? `(under ${limits.minSec}s)` : total > limits.maxSec ? `(over ${limits.maxSec}s)` : "fits"}
        </span>
      </div>}

      <h2 className="mb-2 mt-5 text-[15px] font-semibold">Approved clips</h2>
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((c) => (
          <button key={c.opportunityId} type="button" disabled={!c.eligible || (!order.includes(c.opportunityId) && order.length >= limits.maxEntries)}
            aria-pressed={order.includes(c.opportunityId)} onClick={() => toggle(c.opportunityId)}
            title={!c.eligible ? (c.complianceStatus === "blocked" ? "Blocked by rights" : c.requiresReview ? "Needs review" : "No source window") : undefined}
            className={cn("rounded-full border px-2.5 py-1 text-[12.5px] font-medium disabled:opacity-40", order.includes(c.opportunityId) ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card hover:bg-secondary")}>
            {titleCase(c.headline)} · {c.durationSec}s
          </button>
        ))}
      </div>

      {errors.length > 0 && <ul role="alert" className="callout callout-red mt-3 block list-disc space-y-0.5 pl-6 text-xs">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <div className="mt-3 flex items-center gap-2">
        <Button
          disabled={busy || !within || order.length < limits.minEntries}
          onClick={() => start(async () => {
            const r = await approveAndRenderCompilation(orgId, order);
            if (r.ok) { setErrors([]); setMsg(r.message); } else { setErrors(r.errors); setMsg(null); }
            router.refresh();
          })}>
          Approve and render montage
        </Button>
        {suggested.length > 0 && <Button variant="ghost" onClick={() => setOrder(suggested)}>Reset to suggestion</Button>}
        {msg && <span className="text-xs text-accent-foreground" role="status">{msg}</span>}
      </div>
      <p className="mt-2 text-xs text-ink-4">Straight cuts, audio muted. Changing the order after approval requires approving again.</p>

      {recent.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-[15px] font-semibold">Recent montages</h2>
          <div className="space-y-1.5">
            {recent.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3 text-[13px]">
                <span className={cn("mr-2 pill dot", r.status === "done" ? "tone-green" : r.status === "failed" ? "tone-red" : "tone-blue")}>{r.status === "done" ? "Ready" : r.status === "failed" ? "Failed" : "Rendering"}</span>
                {r.result ? (
                  <>
                    <span>{r.result.entries.map((e) => `${e.role}: ${titleCase(e.headline)}`).join(" → ")} · {r.result.durationSec.toFixed(1)}s</span>
                    <video src={r.result.outPath} poster={r.result.posterPath} controls playsInline className="mt-1.5 aspect-video w-full max-w-md rounded border border-border bg-black" />
                  </>
                ) : (
                  <span className="text-muted-foreground">{r.error ?? "rendering…"}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
