import { Suspense } from "react";
import { connection } from "next/server";
import { Inbox } from "lucide-react";
import {
  listOrgs,
  listOpportunities,
  getOpportunityDetail,
  getQueueStats,
  engineStatus,
  listJobs,
} from "@/lib/actions";
import { TopChrome } from "@/components/top-chrome";
import { OpportunityCard } from "@/components/opportunity-card";
import { QueueFilters } from "@/components/queue-filters";
import { ReviewPane } from "@/components/review-pane";
import { AutoRefresh } from "@/components/auto-refresh";


export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection(); // always render at request time — live queue, no prerender
  const sp = await searchParams;
  const [orgs, engine, jobs] = await Promise.all([listOrgs(), engineStatus(), listJobs()]);
  const orgId = sp.org && orgs.some((o) => o.id === sp.org) ? sp.org : orgs[0]?.id;

  if (!orgId) {
    return (
      <main className="flex h-screen items-center justify-center text-muted-foreground">
        No organizations found — run <code className="mx-1 rounded bg-secondary px-1">npm run seed</code> in the repo root.
      </main>
    );
  }

  const status = sp.status ?? "all";
  const audience = sp.audience ?? "all";
  const sport = sp.sport ?? "all";

  const [opps, stats] = await Promise.all([
    listOpportunities(orgId, { status, audience, sport }),
    getQueueStats(orgId),
  ]);

  const selectedId = sp.opp && opps.some((o) => o.id === sp.opp) ? sp.opp : opps[0]?.id;
  const detail = selectedId ? await getOpportunityDetail(selectedId) : null;

  const hrefFor = (oppId: string) => {
    const p = new URLSearchParams();
    p.set("org", orgId);
    if (sp.status) p.set("status", sp.status);
    if (sp.audience) p.set("audience", sp.audience);
    if (sp.sport) p.set("sport", sp.sport);
    p.set("opp", oppId);
    return `/?${p.toString()}`;
  };

  return (
    <div className="flex h-screen flex-col">
      <AutoRefresh />
      <Suspense>
        <TopChrome orgs={orgs} orgId={orgId} engineOk={engine.ok} engineLatencyMs={engine.latencyMs} jobs={jobs} />
      </Suspense>

      <div className="flex min-h-0 flex-1">
        {/* QUEUE */}
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-border">
          <div className="border-b border-border px-3 py-2.5">
            <div className="mb-2 flex items-baseline justify-between">
              <h1 className="kicker">Opportunity queue</h1>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {stats.active} active · {stats.approved} approved · avg {stats.avgScore}
              </span>
            </div>
            <Suspense>
              <QueueFilters status={status} audience={audience} sport={sport} />
            </Suspense>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {opps.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                <Inbox size={28} className="opacity-50" />
                <p className="text-sm font-medium">Queue is clear</p>
                <p className="max-w-[240px] text-xs">
                  No opportunities match these filters. New moments surface here automatically as the engine scores them.
                </p>
              </div>
            )}
            {opps.map((o) => (
              <OpportunityCard
                key={o.id}
                opp={o}
                selected={o.id === selectedId}
                hasSimulatedSignals={
                  detail && o.id === selectedId
                    ? detail.signals.some((x) => x.simulated)
                    : true /* all seed signals are simulated; per-card detail fetch is post-event */
                }
                href={hrefFor(o.id)}
              />
            ))}
          </div>
        </aside>

        {/* REVIEW + DECISION BAR */}
        <main className="min-w-0 flex-1">
          {detail ? (
            <ReviewPane key={detail.opp.id} opp={detail.opp} moment={detail.moment} signals={detail.signals} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select an opportunity to review
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
