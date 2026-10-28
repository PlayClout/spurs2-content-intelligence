"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setWriteKillSwitch, requeueFailedJob } from "@/lib/admin";

export function KillSwitchToggle({ on }: { on: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <span className={cn("pill dot", on ? "tone-amber" : "tone-green")}>{on ? "Paused" : "Sending"}</span>
      <button type="button" role="switch" aria-checked={on} aria-label="Pause write-back" disabled={pending}
        onClick={() => start(async () => { await setWriteKillSwitch(!on); router.refresh(); })}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50", on ? "bg-warning" : "bg-input")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  );
}

export function DryRunPayload({ payload }: { payload: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-accent-foreground hover:underline" aria-expanded={open}>
        {open ? "Hide" : "View"} payload
      </button>
      {open && <pre className="code-block mt-1.5 max-h-64">{JSON.stringify(payload, null, 2)}</pre>}
    </div>
  );
}

export function RequeueButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <Button size="sm" variant="outline" className="h-7" disabled={pending}
        onClick={() => start(async () => { const r = await requeueFailedJob(jobId); setErr(r.ok ? null : r.error); router.refresh(); })}>
        Retry
      </Button>
      {err && <span className="text-[10px] text-danger-fg">{err}</span>}
    </span>
  );
}
