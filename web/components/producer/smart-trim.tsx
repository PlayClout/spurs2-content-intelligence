"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveTrim, resetToSmartTrim } from "@/lib/actions";
import type { TrimWorkspace } from "@/lib/trim";
import { cn } from "@/lib/utils";

const fmt = (x: number) => `${x.toFixed(1)}s`;

/**
 * Smart trim: the cut comes from the beats TwelveLabs found in this footage plus the channel's target length.
 * Smart = one cut per channel, recomputed from beats. Manual = the editor's one cut, used for every channel.
 */
export function SmartTrimField({ opportunityId, trim, activeChannel, onChannel, approved }: {
  opportunityId: string; trim: TrimWorkspace; activeChannel: string; onChannel: (c: string) => void; approved: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState(trim.mode);
  const smart = trim.perChannel.find((c) => c.channel === activeChannel) ?? trim.perChannel[0];
  const lead = trim.perChannel.find((c) => c.channel === trim.leadChannel) ?? trim.perChannel[0];
  // manual inputs start from the editor's saved cut, else the lead channel's smart cut (what the final render would use)
  const [from, setFrom] = useState(String(trim.manual?.startSec ?? lead?.start ?? trim.analysed.start));
  const [to, setTo] = useState(String(trim.manual?.endSec ?? lead?.end ?? trim.analysed.end));
  const [err, setErr] = useState<string | null>(null);
  if (!smart || !lead) return null;

  const a = trim.analysed, span = a.end - a.start;
  const pct = (x: number) => `${(((x - a.start) / span) * 100).toFixed(2)}%`;
  const typed = { start: Number(from), end: Number(to) };
  const typedValid = Number.isFinite(typed.start) && Number.isFinite(typed.end) && typed.end > typed.start && typed.start >= a.start - 1e-6 && typed.end <= a.end + 1e-6;
  const typedError = !Number.isFinite(typed.start) || !Number.isFinite(typed.end) ? "Enter both times in seconds."
    : typed.end <= typed.start ? "End must be after start."
    : typed.start < a.start - 1e-6 || typed.end > a.end + 1e-6 ? `Stay within the ${fmt(a.start)} to ${fmt(a.end)} that was analysed.` : null;
  const savedManual = trim.manual;
  const dirty = !savedManual || savedManual.startSec !== typed.start || savedManual.endSec !== typed.end;
  const cut = mode === "smart" ? smart : typedValid ? { start: typed.start, end: typed.end, lengthSec: typed.end - typed.start } : null;

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); setErr(r.ok ? null : r.error ?? "Failed"); router.refresh(); });
  const toSmart = () => {
    // only a SAVED manual cut needs the server; unsaved typing is just discarded
    if (trim.mode === "manual" && !confirm(approved ? "Go back to smart trim? Your manual cut is removed and the clip needs approving again." : "Go back to smart trim? Your manual cut is removed.")) return;
    setMode("smart");
    if (trim.mode === "manual") act(() => resetToSmartTrim(opportunityId));
  };

  return (
    <div className="mt-5">
      <p className="mb-1.5 flex justify-between text-[12.5px] font-semibold">
        Trim
        <span className="font-medium text-ink-4">{mode === "smart" ? `${smart.label}: ${smart.minSec} to ${smart.maxSec}s` : "One cut for every channel"}</span>
      </p>
      <div className="rounded-[10px] border border-border bg-card p-3">
        <div className="mb-2.5 flex items-center gap-2">
          {mode === "smart" && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-px text-[11px] font-semibold text-accent-foreground"><Sparkles size={11} aria-hidden />Smart trim</span>}
          <span className="text-[13px] font-semibold tabular-nums">{cut ? `${fmt(cut.start)} to ${fmt(cut.end)} · ${fmt(cut.lengthSec)}` : "Set a start and end"}</span>
          <div className="ml-auto flex gap-0.5 rounded-lg bg-secondary p-[3px]" role="radiogroup" aria-label="Trim mode">
            {(["smart", "manual"] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={pending} onClick={() => (m === "smart" ? mode !== "smart" && toSmart() : setMode("manual"))}
                className={cn("rounded-md px-2.5 py-1 text-[12.5px] font-semibold capitalize", mode === m ? "bg-card text-foreground shadow-sm" : "text-ink-2 hover:text-foreground")}>{m}</button>
            ))}
          </div>
        </div>

        <div className="relative h-[46px] rounded-md bg-secondary" role="img" aria-label={`Beats detected in the footage: ${trim.beats.map((b) => `${b.label} ${fmt(b.start)} to ${fmt(b.end)}`).join(", ")}`}>
          {trim.beats.map((b) => (
            <div key={`${b.label}-${b.start}`} title={`${b.label} · ${fmt(b.start)} to ${fmt(b.end)}`} aria-hidden
              className={cn("absolute inset-y-0 truncate border-r border-card px-1.5 py-1 text-[10.5px]", b.key ? "bg-beat-key font-semibold text-beat-key-fg" : "text-ink-2")}
              style={{ left: pct(b.start), width: `${(((b.end - b.start) / span) * 100).toFixed(2)}%` }}>{b.label}</div>
          ))}
          {cut && (
            <div aria-hidden className="pointer-events-none absolute inset-y-0 rounded-md border-2 border-primary bg-primary/10 transition-[left,width] duration-200
              before:absolute before:-left-[5px] before:top-1/2 before:-mt-[11px] before:h-[22px] before:w-1.5 before:rounded-[3px] before:border-2 before:border-primary before:bg-card
              after:absolute after:-right-[5px] after:top-1/2 after:-mt-[11px] after:h-[22px] after:w-1.5 after:rounded-[3px] after:border-2 after:border-primary after:bg-card"
              style={{ left: pct(cut.start), width: `${((cut.lengthSec / span) * 100).toFixed(2)}%` }} data-testid="trim-cut" />
          )}
        </div>
        <div className="mt-1 flex justify-between text-[10.5px] tabular-nums text-ink-4" aria-hidden>
          <span>{fmt(a.start)}</span><span>Beats detected by TwelveLabs in the footage</span><span>{fmt(a.end)}</span>
        </div>

        {mode === "smart" ? (
          <>
            <p className="mt-2.5 text-[12.5px] leading-snug text-ink-2" data-testid="trim-reason">
              {smart.reason}{smart.note && <span className="text-warning-fg"> {smart.note}</span>}
            </p>
            {trim.perChannel.length > 1 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-ink-3">Cut per channel:</span>
                {trim.perChannel.map((c) => (
                  <button key={c.channel} type="button" onClick={() => onChannel(c.channel)} aria-pressed={c.channel === activeChannel}
                    className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", c.channel === activeChannel ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-ink-2 hover:bg-secondary")}>
                    {c.label} {fmt(c.lengthSec)}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-ink-4">The approved final uses the {lead.label} cut ({fmt(lead.start)} to {fmt(lead.end)}). Each channel version uses its own cut.</p>
          </>
        ) : (
          <>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Input value={from} onChange={(e) => setFrom(e.target.value)} inputMode="decimal" aria-label="Trim start (sec)" aria-invalid={!!typedError} className="h-8 w-20 tabular-nums" />
              <span className="text-ink-3">to</span>
              <Input value={to} onChange={(e) => setTo(e.target.value)} inputMode="decimal" aria-label="Trim end (sec)" aria-invalid={!!typedError} className="h-8 w-20 tabular-nums" />
              <Button variant="outline" size="sm" disabled={pending || !typedValid || !dirty} onClick={() => act(() => saveTrim(opportunityId, typed.start, typed.end))}>
                {savedManual && !dirty ? "Saved" : "Save cut"}
              </Button>
            </div>
            <p className={cn("mt-1.5 text-xs", typedError ? "text-danger-fg" : "text-ink-4")} role={typedError ? "alert" : undefined}>
              {typedError ?? `Within the ${fmt(a.start)} to ${fmt(a.end)} that was analysed.`}
            </p>
          </>
        )}
        {err && <p className="mt-2 text-xs text-danger-fg" role="alert">{err}</p>}
        {approved && <p className="mt-2 text-xs text-ink-4">Changing the trim of an approved clip sends it back for re-approval.</p>}
      </div>
    </div>
  );
}
