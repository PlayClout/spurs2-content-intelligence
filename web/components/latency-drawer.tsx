"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { JobRow } from "@/lib/actions";

function fmt(ms: number | null) {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function LatencyDrawer({ jobs, children }: { jobs: JobRow[]; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-carbon">
        <DialogHeader>
          <DialogTitle className="display text-xl">Pipeline latency</DialogTitle>
        </DialogHeader>
        <p className="kicker">stage transitions · jobs table timestamps</p>
        <div className="max-h-[50vh] space-y-1 overflow-y-auto font-mono text-xs">
          {jobs.length === 0 && <p className="text-muted-foreground">No jobs yet.</p>}
          {jobs.map((j) => {
            const queueMs = j.startedAt ? j.startedAt.getTime() - j.queuedAt.getTime() : null;
            const runMs = j.startedAt && j.finishedAt ? j.finishedAt.getTime() - j.startedAt.getTime() : null;
            return (
              <div key={j.id} className="flex items-center gap-3 rounded-md border border-border bg-background/60 px-3 py-2">
                <Badge variant={j.status === "failed" ? "destructive" : j.status === "done" ? "secondary" : "outline"} className="w-16 justify-center text-[10px]">
                  {j.status}
                </Badge>
                <span className="w-44 truncate">{j.type}</span>
                <span className="text-muted-foreground">queue {fmt(queueMs)}</span>
                <span className="text-muted-foreground">run {fmt(runMs)}</span>
                <span className="ml-auto text-muted-foreground">{j.queuedAt.toLocaleTimeString()}</span>
                {j.error && <span className="text-danger-fg">{j.error}</span>}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
