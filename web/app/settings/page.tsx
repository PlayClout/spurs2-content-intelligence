import { connection } from "next/server";
import Link from "next/link";
import { integrationStatus, listWriteBackJobs, jobSummary, recentJobs } from "@/lib/admin";
import { rulesScreenData } from "@/lib/rules";
import { providerStatuses } from "@shared/signals";
import { Shell, shellContext, PageHead, NoOrg } from "@/components/producer/shell";
import { KillSwitchToggle, DryRunPayload, RequeueButton } from "@/components/admin-controls";
import { RulesEditor } from "@/components/rules-editor";
import { heldReason, titleCase, windowLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [["integrations", "Integrations"], ["writeback", "Write-back history"], ["rules", "Rights rules"]] as const;
type Tab = (typeof TABS)[number][0];
const when = (iso: string) => {
  const d = new Date(iso), today = new Date();
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today ${t}`;
  if (d.toDateString() === new Date(today.getTime() - 864e5).toDateString()) return `Yesterday ${t}`;
  return `${d.toLocaleDateString()} ${t}`;
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const ctx = await shellContext(sp);
  if (!ctx.org) return <NoOrg />;
  const tab: Tab = TABS.find(([k]) => k === sp.tab)?.[0] ?? "integrations";
  const q = (t: Tab) => `/settings?org=${ctx.org!.id}&tab=${t}`;

  return (
    <Shell ctx={ctx} active="settings">
      <PageHead title="Settings" />
      <nav className="-mt-2 mb-5 flex gap-6 border-b border-border" aria-label="Settings sections">
        {TABS.map(([k, l]) => (
          <Link key={k} href={q(k)} aria-current={tab === k ? "page" : undefined}
            className={cn("-mb-px border-b-2 py-2.5 text-[13.5px] font-semibold", tab === k ? "border-primary text-accent-foreground" : "border-transparent text-ink-2 hover:text-foreground")}>{l}</Link>
        ))}
      </nav>
      {tab === "integrations" && <Integrations />}
      {tab === "writeback" && <WriteBackHistory orgId={ctx.org.id} />}
      {tab === "rules" && <Rules />}
    </Shell>
  );
}

async function Integrations() {
  const [st, summary, jobs] = await Promise.all([integrationStatus(), jobSummary(), recentJobs(12)]);
  const svc: [string, boolean, string, string][] = [
    ["ScorePlay", st.scoreplay.mode === "live", st.scoreplay.mode === "live" ? "Live" : "Fixture", st.scoreplay.note],
    ["TwelveLabs", st.twelvelabs.mode === "live", st.twelvelabs.mode === "live" ? "Live" : "Fixture", `${st.twelvelabs.note} · ${st.footage.matched}/${st.footage.twelvelabsVideos} videos mapped to ScorePlay`],
    ["Storage", st.storage.mode === "local", st.storage.mode === "local" ? "Local" : st.storage.mode, st.storage.note],
  ];
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {svc.map(([n, ok, label, note]) => (
          <div key={n} className="panel p-4">
            <div className="mb-1.5 flex items-center justify-between"><span className="font-semibold">{n}</span><span className={cn("pill dot", ok ? "tone-green" : "tone-amber")}>{label}</span></div>
            <p className="text-[12.5px] text-ink-2">{note}</p>
          </div>
        ))}
      </div>
      <section className="panel mb-4 overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-[15px] font-semibold">Signal sources</h2>
        <table className="ptable">
          <thead><tr><th>Source</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>
            {providerStatuses({ TWELVELABS_API_KEY: process.env.TWELVELABS_API_KEY, MOCK_MODE: process.env.MOCK_MODE, X_BEARER_TOKEN: process.env.X_BEARER_TOKEN }).map((p) => (
              <tr key={p.provider}>
                <td className="font-semibold">{p.label}</td>
                <td><span className={cn("pill dot", p.state === "live" ? "tone-green" : p.state === "replay" ? "tone-blue" : "tone-gray")}>{p.state === "unavailable" ? "Not connected" : p.state === "live" ? "Live" : "Replay"}</span></td>
                <td className="text-ink-3">{p.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="text-[15px] font-semibold">Worker jobs</h2>
          <div className="ml-auto flex gap-1.5">
            <span className="pill tone-gray">Queued {summary.queued ?? 0}</span><span className="pill tone-blue">Running {summary.running ?? 0}</span>
            <span className="pill tone-red">Failed {summary.failed ?? 0}</span><span className="pill tone-green">Done {summary.done ?? 0}</span>
          </div>
        </div>
        <table className="ptable">
          <thead><tr><th>Status</th><th>Job</th><th>Detail</th><th>Queued</th><th /></tr></thead>
          <tbody>
            {jobs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No jobs yet.</td></tr>}
            {jobs.map((j) => (
              <tr key={j.id}>
                <td><span className={cn("pill dot", j.status === "failed" ? "tone-red" : j.status === "done" ? "tone-green" : "tone-blue")}>{j.status[0].toUpperCase() + j.status.slice(1)}</span></td>
                <td className="font-medium">{j.type.replace(/_/g, " ")}</td>
                <td className="max-w-[420px] truncate text-ink-3" title={j.error ?? undefined}>{j.error ?? ""}</td>
                <td className="text-ink-3">{j.queuedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
                <td className="text-right">{j.status === "failed" && <RequeueButton jobId={j.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

/** Record of every source log the desk sent (or held) to ScorePlay, newest first. */
async function WriteBackHistory({ orgId }: { orgId: string }) {
  const [rows, st] = await Promise.all([listWriteBackJobs(100, orgId), integrationStatus()]);
  const n = (k: string) => rows.filter((r) => r.status === k).length;
  const paused = st.writes.reasons.includes("Admin kill switch on");
  return (
    <>
      <p className="mb-3.5 text-sm text-ink-3">Every time a clip is approved, its source moment is logged back to ScorePlay so the club&apos;s library knows what was used. This is the record of those writes.</p>
      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="text-[15px] font-semibold">History</h2>
          <div className="ml-auto flex gap-1.5">
            <span className="pill tone-green">Written {n("synced")}</span><span className="pill tone-amber">Held {n("held")}</span>
            <span className="pill tone-blue">Pending {n("pending")}</span><span className="pill tone-red">Failed {n("failed")}</span>
          </div>
        </div>
        <table className="ptable">
          <thead><tr><th>When</th><th>Clip</th><th>What was written</th><th>ScorePlay media</th><th>Result</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No write-backs yet. Approving a clip logs its source moment here automatically.</td></tr>}
            {rows.map((w) => (
              <tr key={w.id} className="align-top">
                <td className="whitespace-nowrap text-ink-3">{when(w.createdAt)}</td>
                <td className="font-semibold">{titleCase(w.label.replace(/\s*\((casual|superfan)\)$/, "")) || w.subjectId}</td>
                <td className="text-ink-3">
                  {w.kind === "source_log" ? "Moment log" : w.kind.replace(/_/g, " ")} {windowLabel(w.startSec, w.endSec)}{w.tags.length ? ` · tags: ${w.tags.join(", ")}` : ""}
                  {w.dryRun && <div className="mt-1"><DryRunPayload payload={{ method: w.dryRun.method, path: w.dryRun.path, body: w.dryRun.body }} /></div>}
                </td>
                <td className="text-ink-3">{w.mediaId ?? ""}</td>
                <td>
                  <span className={cn("pill dot", { synced: "tone-green", held: "tone-amber", pending: "tone-blue", failed: "tone-red" }[w.status] ?? "tone-gray")}>{w.status === "synced" ? "Written" : w.status[0].toUpperCase() + w.status.slice(1)}</span>
                  <div className="mt-1 text-xs text-ink-3">{w.externalRef ? `ScorePlay log ${w.externalRef}` : heldReason(w.error)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel mt-4 flex items-center gap-4 px-4 py-3.5">
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold">Pause write-back</p>
          <p className="text-[12.5px] text-ink-3">Keep new writes as drafts instead of sending them to ScorePlay. {st.writes.state === "held" ? `Writes are held: ${[...new Set(st.writes.reasons.map(heldReason))].join("; ")}.` : "Writes are enabled."}</p>
        </div>
        <KillSwitchToggle on={paused} />
      </section>
    </>
  );
}

async function Rules() {
  const data = await rulesScreenData();
  return (
    <>
      <div className="mb-3.5 flex items-center gap-3">
        <p className="text-sm text-ink-3">Active version <b className="text-foreground">{data.active.version}</b> · {data.active.label}. Edits change a draft; nothing affects decisions until you preview and activate.</p>
        <span className="pill tone-amber ml-auto">Illustrative demo policy, not club or league policy</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <RulesEditor draft={data.draft} pending={data.pendingChanges} facts={data.factRegistry} />
        <aside className="space-y-4">
          <section className="panel">
            <h2 className="border-b border-border px-4 py-3 text-[15px] font-semibold">History</h2>
            <div className="px-4 py-1.5 text-[13px]">
              {data.versions.map((v) => (
                <div key={v.version} className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
                  <b>{v.version}</b>{v.current && <span className="pill tone-green">Active</span>}
                  <span className="text-ink-3">{v.ruleCount} rules</span>
                  <span className="ml-auto text-ink-3">{v.activatedAt ? when(v.activatedAt) : "Draft"}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2 className="border-b border-border px-4 py-3 text-[15px] font-semibold">Audit trail</h2>
            <div className="max-h-[50vh] space-y-1.5 overflow-y-auto p-3 text-xs">
              {data.audits.length === 0 && <p className="text-ink-3">No rule changes yet.</p>}
              {data.audits.map((a) => (
                <details key={a.id} className="rounded-md border border-border px-2.5 py-1.5">
                  <summary className="cursor-pointer"><b className="capitalize">{a.action.replace(/_/g, " ")}</b> <code className="text-ink-3">{a.ruleId}</code>
                    <span className="block text-ink-3">{a.actor} · {when(a.at)}</span></summary>
                  <pre className="mt-1 overflow-x-auto text-[10.5px] leading-relaxed">{JSON.stringify(a.diff, null, 2)}</pre>
                </details>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
