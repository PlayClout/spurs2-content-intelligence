"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgRow } from "@/lib/actions";
import { LatencyDrawer } from "@/components/latency-drawer";
import type { JobRow } from "@/lib/actions";

export function TopChrome({
  orgs,
  orgId,
  engineOk,
  engineLatencyMs,
  jobs,
}: {
  orgs: OrgRow[];
  orgId: string;
  engineOk: boolean;
  engineLatencyMs: number | null;
  jobs: JobRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setOrg = (id: string) => {
    const p = new URLSearchParams(params.toString());
    p.set("org", id);
    p.delete("opp"); // selection is org-scoped
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-carbon/80 px-4 backdrop-blur">
      <Link href={`/?org=${orgId}`} className="flex items-center gap-2">
        <span className="display text-lg text-foreground">
          Clout <span className="text-[var(--clout-electric-blue)]">Content Intelligence</span>
        </span>
      </Link>

      <Select value={orgId} onValueChange={setOrg}>
        <SelectTrigger className="h-8 w-56 bg-secondary text-sm">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name} · {o.league}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title={engineOk ? `DB reachable · ${engineLatencyMs}ms` : "Engine unreachable"}>
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              engineOk ? "bg-[var(--success)] shadow-[0_0_8px_rgba(0,217,130,0.8)]" : "bg-[var(--danger)]"
            )}
          />
          {engineOk ? "engine live" : "engine offline"}
          {engineOk && engineLatencyMs !== null && <span className="tabular-nums">{engineLatencyMs}ms</span>}
        </span>

        <LatencyDrawer jobs={jobs}>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
            <Activity size={14} /> latency
          </Button>
        </LatencyDrawer>

        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Link href={`/published?org=${orgId}`}>
            <Send size={13} /> Published
          </Link>
        </Button>
      </div>
    </header>
  );
}
