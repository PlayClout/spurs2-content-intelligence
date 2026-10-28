import Link from "next/link";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Inbox, CheckCheck, Upload, Clapperboard, Settings, Smartphone, ArrowUpRight, Radio, LibraryBig } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { listOrgs, engineStatus } from "@/lib/actions";
import { liveStatus } from "@/lib/live";
import { libraryFor } from "@/lib/library";
import liveMatch from "../../../data/live/mnu-tot-full-match.json" with { type: "json" };
import themes from "../../../pipeline/club-themes.json" with { type: "json" };
import { OrgSwitcher } from "@/components/producer/org-switcher";
import { TopBar } from "@/components/producer/top-bar";
import { AutoRefresh } from "@/components/auto-refresh";
import { cn } from "@/lib/utils";

export type Section = "live" | "inbox" | "library" | "approved" | "published" | "montages" | "settings";
const OPEN = ["draft_pending", "draft_ready", "needs_review"];
const APPROVED = ["approved", "rendering", "rendered", "exported"];
/** The one club whose ScorePlay library holds a full match (the live match desk only exists for it). */
const LIVE_CLUB = (themes as Record<string, { displayName?: string }>)[liveMatch.orgKey]?.displayName;

/** Org + nav counts for every producer page. Org comes from ?org=, defaulting to the first club. */
export async function shellContext(sp: Record<string, string | undefined>) {
  const [orgs, engine] = await Promise.all([listOrgs(), engineStatus()]);
  const org = orgs.find((o) => o.id === sp.org) ?? orgs[0] ?? null;
  if (!org) return { orgs, org: null, engine, live: null, hasLive: false, library: null, counts: { inbox: 0, approved: 0, published: 0 } };
  const [[c], [p], live] = await Promise.all([
    db.select({
      inbox: sql<number>`count(*) filter (where ${inArray(s.opportunities.status, OPEN)} and coalesce(${s.opportunities.compliance}->>'status','unknown') <> 'blocked')::int`,
      approved: sql<number>`count(*) filter (where ${inArray(s.opportunities.status, APPROVED)})::int`,
    }).from(s.opportunities).where(eq(s.opportunities.orgId, org.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(s.publications).where(and(eq(s.publications.orgId, org.id), eq(s.publications.state, "published"))),
    liveStatus(org.id).catch(() => null),
  ]);
  // Hosted demo (Vercel): the live-match desk needs the time-boxed venue feed (ScorePlay), gone post-event — hide it.
  return { orgs, org, engine, live, hasLive: !process.env.VERCEL && org.name === LIVE_CLUB, library: await libraryFor(org.name), counts: { inbox: c?.inbox ?? 0, approved: c?.approved ?? 0, published: p?.n ?? 0 } };
}
export type ShellContext = Awaited<ReturnType<typeof shellContext>>;

const NAV: { key: Section; label: string; href: string; icon: typeof Inbox; count?: keyof ShellContext["counts"] }[] = [
  { key: "live", label: "Live match", href: "/live", icon: Radio },
  { key: "inbox", label: "Inbox", href: "/", icon: Inbox, count: "inbox" },
  { key: "library", label: "Library", href: "/library", icon: LibraryBig },
  { key: "approved", label: "Approved", href: "/approved", icon: CheckCheck, count: "approved" },
  { key: "published", label: "Published", href: "/published", icon: Upload, count: "published" },
  { key: "montages", label: "Montages", href: "/montages", icon: Clapperboard },
];

export function Shell({ ctx, active, children, refresh = false }: { ctx: ShellContext; active: Section; children: React.ReactNode; refresh?: boolean }) {
  const q = ctx.org ? `?org=${ctx.org.id}` : "";
  const item = (n: { key: Section; label: string; href: string; icon: typeof Inbox; count?: keyof ShellContext["counts"] }) => (
    <Link key={n.key} href={`${n.href}${q}`} aria-current={active === n.key ? "page" : undefined}
      className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] font-medium transition-colors",
        active === n.key ? "bg-accent text-accent-foreground" : "text-ink-2 hover:bg-secondary hover:text-foreground")}>
      <n.icon size={17} strokeWidth={2} aria-hidden />
      {n.label}
      {n.key === "live" && ctx.live && (
        <span className={cn("ml-auto rounded px-1.5 text-[10.5px] font-bold leading-[18px] text-white", ctx.live === "live" ? "live-badge bg-[var(--danger)]" : "bg-ink-3")}
          aria-label={ctx.live === "live" ? "a match is live" : "live match paused"}>{ctx.live === "live" ? "LIVE" : "PAUSED"}</span>
      )}
      {n.count && ctx.counts[n.count] > 0 && (
        <span className={cn("ml-auto rounded-full px-1.5 text-[11.5px] font-semibold leading-[19px]", active === n.key ? "bg-card text-accent-foreground" : "bg-secondary text-ink-2")}
          aria-label={`${ctx.counts[n.count]} ${n.key === "inbox" ? "to review" : n.key === "published" ? "live" : "items"}`}>{ctx.counts[n.count]}</span>
      )}
    </Link>
  );
  return (
    <div className="producer grid h-screen grid-cols-[240px_1fr] overflow-hidden">
      {refresh && <AutoRefresh />}
      <aside className="flex flex-col border-r border-border bg-card px-3 py-3.5">
        <OrgSwitcher orgs={ctx.orgs.map((o) => ({ id: o.id, name: o.name, league: o.league }))} orgId={ctx.org?.id ?? ""} />
        <nav className="mt-4 space-y-0.5" aria-label="Main">
          {NAV.filter((n) => n.key !== "live" || ctx.hasLive).map(item)}
          <p className="px-2 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">Workspace</p>
          {item({ key: "settings", label: "Settings", href: "/settings", icon: Settings })}
        </nav>
        <div className="mt-auto space-y-2 border-t border-border pt-3">
          <p className="flex items-center gap-2 px-2 text-xs text-ink-2" title={ctx.engine.ok ? "Database reachable" : "Database unreachable"}>
            <span className={cn("status-dot", ctx.engine.ok ? "ok" : "bad")} />
            {ctx.engine.ok ? `All systems live · ${ctx.engine.latencyMs} ms` : "Engine offline"}
          </p>
          <Link href={`/fan${q}`} target="_blank" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-secondary hover:text-foreground">
            <Smartphone size={16} aria-hidden /> Open fan app <span className="sr-only">(opens in a new tab)</span><ArrowUpRight size={14} className="ml-auto" aria-hidden />
          </Link>
          <p className="px-2 text-[11px] text-ink-4">Spursx2 AI</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col overflow-hidden">
        <TopBar orgId={ctx.org?.id ?? ""} match={ctx.hasLive} library={!!ctx.library} />
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

/** Standard page heading for non-inbox pages. */
export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="display text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function NoOrg() {
  return <p className="p-10 text-sm text-muted-foreground">No organizations found. Run <code className="rounded bg-secondary px-1">npm run seed</code> in the repo root.</p>;
}
