"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Play, RotateCcw, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replayDemo, resetDemo } from "@/lib/actions";
import { runLibrary } from "@/lib/library";

/** Search (filters the inbox by headline/caption) and the runs this club supports: a match replay (full-match footage)
 * and/or a library run (raw clips, edits, interviews, photos). Tottenham has both; San Antonio has only its library. */
export function TopBar({ orgId, match, library }: { orgId: string; match: boolean; library: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => start(async () => {
    const r = await fn();
    setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Done" : r.error ?? "Failed" });
    router.refresh();
    if (r.ok) setTimeout(() => setMsg((m) => (m?.ok ? null : m)), 5000);
  });

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-5">
      {/* keyed on the active search: when it changes in the URL (e.g. "Clear search"), the box resets to match.
          The Library page has its own TwelveLabs search, so the inbox filter is not shown there (one search box). */}
      {pathname === "/library" ? <span className="text-[15px] font-semibold">Library</span> : <SearchBox key={params.get("q") ?? ""} orgId={orgId} />}
      <div className="ml-auto flex items-center gap-2">
        {msg && (
          <span className={msg.ok ? "max-w-[320px] truncate text-xs text-muted-foreground" : "max-w-[320px] truncate text-xs font-medium text-danger-fg"} role={msg.ok ? "status" : "alert"} title={msg.text}>
            {msg.text}
          </span>
        )}
        {pathname !== "/live" && match && (
          <span className="pill dot tone-blue" title="The match feed is a timed replay of the real Man Utd v Tottenham timeline, not a live feed">Replay mode</span>
        )}
        <Button variant="ghost" size="sm" disabled={pending}
          onClick={() => { if (confirm("Reset the demo? This clears every clip, job, live match and fan-app publication for all clubs. ScorePlay is not touched.")) run(resetDemo); }}
          title="Clear the queue, jobs, live match and published rows. Keeps the clubs. Does not touch ScorePlay.">
          <RotateCcw /> Reset
        </Button>
        {pathname !== "/live" && match && (
          <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => replayDemo(orgId))} title="Queue the real Tottenham timeline. The local worker processes each moment on schedule.">
            <Play className="fill-current" /> Replay match
          </Button>
        )}
        {library && (
          <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => runLibrary(orgId))} title="Find the best moments, interviews and photos in this club's ScorePlay library (a real TwelveLabs search over its indexed footage). The worker drafts each one.">
            <Library /> Run library
          </Button>
        )}
      </div>
    </header>
  );
}

function SearchBox({ orgId }: { orgId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(pathname === "/" ? params.toString() : "");
    if (orgId) p.set("org", orgId);
    if (q.trim()) p.set("q", q.trim()); else p.delete("q");
    p.delete("opp");
    router.push(`/?${p.toString()}`);
  };
  return (
    <form onSubmit={submit} role="search" className="flex w-80 items-center gap-2 rounded-md border border-border bg-subtle px-2.5 py-1.5 text-[13px] text-ink-4 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-accent">
      <Search size={15} aria-hidden />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clips, players, moments" aria-label="Search clips"
        className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-ink-4" />
    </form>
  );
}
