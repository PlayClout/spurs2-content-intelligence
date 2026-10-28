import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { listOpportunities, getOpportunityDetail, getQueueStats } from "@/lib/actions";
import { fanAppPanelProps } from "@/lib/fan";
import { packagingWorkspace } from "@/lib/packaging";
import { hotClips, rememberLanes } from "@/lib/signals";
import { trimWorkspace } from "@/lib/trim";
import { Shell, shellContext, NoOrg } from "@/components/producer/shell";
import { QueueRow } from "@/components/producer/queue-row";
import { ReviewPane } from "@/components/review-pane";
import { cn } from "@/lib/utils";

const OPEN = ["draft_pending", "draft_ready", "needs_review"];
const FORMATS = [["all", "All"], ["reel", "Reels"], ["milestone_graphic", "Photo cards"]] as const;

export default async function InboxPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection(); // live queue, never prerendered
  const sp = await searchParams;
  const ctx = await shellContext(sp);
  if (!ctx.org) return <NoOrg />;
  const orgId = ctx.org.id;
  const format = sp.format ?? "all";
  const q = (sp.q ?? "").trim().toLowerCase();

  const [all, stats, hot] = await Promise.all([listOpportunities(orgId), getQueueStats(orgId), hotClips(orgId).catch(() => null)]);
  if (hot?.clips.length) await rememberLanes(orgId, hot.clips.map((c) => ({ opportunityId: c.opportunityId, lane: c.lane }))).catch(() => undefined);
  // An alert is about a PLAY: the reel and photo card cut from the same moment share it.
  const hotByMoment = new Map((hot?.clips ?? []).filter((c) => c.lane !== "watch").flatMap((c) => { const m = all.find((o) => o.id === c.opportunityId)?.momentId; return m ? [[m, c] as const] : []; }));
  const hotById = new Map(all.flatMap((o) => (hotByMoment.has(o.momentId) ? [[o.id, hotByMoment.get(o.momentId)!] as const] : [])));

  // Inbox = everything still waiting on a decision. Blocked clips stay visible (marked) so nothing silently vanishes.
  // A clip opened by link (e.g. from Approved) stays reviewable here even though it has left the queue.
  const open = all
    .filter((o) => OPEN.includes(o.status))
    .filter((o) => format === "all" || o.contentType === format)
    .filter((o) => !q || `${o.headline} ${Object.values((o.generatedCopy ?? {}) as Record<string, string>).join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) => (hotById.has(b.id) ? 1 : 0) - (hotById.has(a.id) ? 1 : 0) || b.score - a.score);

  const selectedId = sp.opp && all.some((o) => o.id === sp.opp) ? sp.opp : open[0]?.id;
  const [detail, fanApp, packaging, trim] = selectedId
    ? await Promise.all([getOpportunityDetail(selectedId), fanAppPanelProps(selectedId).catch(() => null), packagingWorkspace(selectedId).catch(() => null), trimWorkspace(selectedId).catch(() => null)])
    : [null, null, null, null];

  const href = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams({ org: orgId, ...(format !== "all" ? { format } : {}), ...(sp.q ? { q: sp.q } : {}) });
    for (const [k, v] of Object.entries(p)) if (v) u.set(k, v); else u.delete(k);
    return `/?${u.toString()}`;
  };
  const surfaced = all.map((o) => o.surfacedAfterSec).filter((x): x is number => x !== null).sort((a, b) => a - b);
  const median = surfaced.length ? surfaced[Math.floor(surfaced.length / 2)] : null;
  const hotCount = new Set(open.filter((o) => hotById.get(o.id)?.lane === "act_now").map((o) => o.momentId)).size;
  // every summary number counts the SAME rows the queue shows (all formats, ignoring search) so they never disagree
  const waiting = all.filter((o) => OPEN.includes(o.status));
  const blocked = waiting.filter((o) => (o.compliance as { status?: string } | null)?.status === "blocked").length;

  return (
    <Shell ctx={ctx} active="inbox" refresh>
      <div className="flex h-full min-h-0 flex-col">
        <h1 className="sr-only">Inbox</h1>
        <div className="mb-3.5 flex items-center gap-5 text-[13px] text-ink-2" aria-label="Queue summary">
          <span><b className="mr-1 text-lg font-semibold text-foreground">{waiting.length - blocked}</b>to review</span>
          <span><b className="mr-1 text-lg font-semibold text-danger">{hotCount}</b>act now</span>
          <span><b className="mr-1 text-lg font-semibold text-foreground">{stats.approved}</b>approved</span>
          {blocked > 0 && <span><b className="mr-1 text-lg font-semibold text-danger">{blocked}</b>blocked</span>}
          {median !== null && <span><b className="mr-1 text-lg font-semibold text-foreground">{median}s</b>play to draft</span>}
          {sp.q && <span className="pill tone-gray">Search: “{sp.q}” <Link href={href({ q: undefined })} className="ml-1 font-bold" aria-label="Clear search">×</Link></span>}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,420px)_1fr] gap-4">
          <section className="panel flex min-h-0 flex-col" aria-label="Queue">
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
              <h2 className="text-[15px] font-semibold">Queue</h2>
              <nav className="ml-auto flex gap-0.5 rounded-lg bg-secondary p-[3px]" aria-label="Filter by format">
                {FORMATS.map(([k, l]) => (
                  <Link key={k} href={href({ format: k === "all" ? undefined : k, opp: undefined })} aria-current={format === k ? "true" : undefined}
                    className={cn("rounded-md px-2.5 py-1 text-[12.5px] font-semibold", format === k ? "bg-card text-foreground shadow-sm" : "text-ink-2 hover:text-foreground")}>{l}</Link>
                ))}
              </nav>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {open.length === 0 ? (
                <div className="px-8 py-16 text-center text-sm text-muted-foreground">
                  {q || format !== "all" ? (
                    <>
                      <p className="font-semibold text-foreground">No clips match.</p>
                      <p className="mt-1"><Link href={`/?org=${orgId}`} className="font-semibold text-accent-foreground hover:underline">Clear filters</Link> to see the whole queue.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-foreground">Inbox zero.</p>
                      <p className="mt-1">New clips appear here as the engine finds them. Use Replay match to see it work.</p>
                    </>
                  )}
                </div>
              ) : open.map((o) => <QueueRow key={o.id} opp={o} selected={o.id === selectedId} hot={hotById.get(o.id) ?? null} href={href({ opp: o.id })} />)}
            </div>
          </section>

          <section className="panel flex min-h-0 flex-col overflow-hidden" aria-label="Review">
            {detail ? (
              <Suspense>
                <ReviewPane key={detail.opp.id} opp={detail.opp} moment={detail.moment} signals={detail.signals} fanApp={fanApp ?? undefined}
                  packaging={packaging ? { destinations: packaging.destinations, rendering: packaging.rendering } : undefined} trim={trim ?? undefined} initialTab={sp.tab} />
              </Suspense>
            ) : (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Select a clip to review</div>
            )}
          </section>
        </div>
      </div>
    </Shell>
  );
}
