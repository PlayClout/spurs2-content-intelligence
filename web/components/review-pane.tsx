"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Save, Send, Loader2 } from "lucide-react";
import { ComplianceBadge } from "@/components/compliance-badge";
import { channelProfiles } from "@/lib/channels";
import { cn } from "@/lib/utils";
import type { Compliance } from "@shared/schemas";
import type { OpportunityRow, SignalRow } from "@/lib/actions";
import type { moments } from "@shared/db-schema";
import {
  approveOpportunity,
  rejectOpportunity,
  saveTrim,
  saveCopy,
  publishOpportunity,
} from "@/lib/actions";

type MomentRow = typeof moments.$inferSelect;

const BREAKDOWN_LABELS: Record<string, string> = {
  momentConfidence: "Moment confidence",
  eventWeight: "Event weight",
  socialVelocity: "Social velocity",
  recencyDecay: "Recency",
  audienceFit: "Audience fit",
};

function SafeZoneOverlay({ channel }: { channel: string }) {
  const p = channelProfiles[channel];
  if (!p || p.aspect !== "9:16") return null;
  // overlay rendered inside a 9:16 preview box; safe zone values are px on 1080x1920
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(1)}%`;
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 bg-[rgba(255,41,66,0.12)]" style={{ height: pct(p.safeZone.top, p.height) }} />
      <div className="absolute inset-x-0 bottom-0 bg-[rgba(255,41,66,0.12)]" style={{ height: pct(p.safeZone.bottom, p.height) }} />
      <div className="absolute inset-y-0 left-0 bg-[rgba(255,41,66,0.12)]" style={{ width: pct(p.safeZone.left, p.width) }} />
      <div className="absolute inset-y-0 right-0 bg-[rgba(255,41,66,0.12)]" style={{ width: pct(p.safeZone.right, p.width) }} />
      <div
        className="absolute border border-dashed border-[rgba(0,217,130,0.6)]"
        style={{
          top: pct(p.safeZone.top, p.height),
          bottom: pct(p.safeZone.bottom, p.height),
          left: pct(p.safeZone.left, p.width),
          right: pct(p.safeZone.right, p.width),
        }}
      >
        <span className="absolute left-1 top-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--success-fg)]">
          safe zone
        </span>
      </div>
    </div>
  );
}

export function ReviewPane({
  opp,
  moment,
  signals,
}: {
  opp: OpportunityRow;
  moment: MomentRow | null;
  signals: SignalRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const compliance = opp.compliance as Compliance;
  const channels = opp.channels as string[];
  const copyMap = opp.generatedCopy as Record<string, string>;
  const trim = (opp.trimOverride as { startSec: number; endSec: number } | null) ?? {
    startSec: moment?.startSec ?? 0,
    endSec: moment?.endSec ?? 0,
  };

  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [trimStart, setTrimStart] = useState(String(trim.startSec));
  const [trimEnd, setTrimEnd] = useState(String(trim.endSec));
  const [copyDrafts, setCopyDrafts] = useState<Record<string, string>>({ ...copyMap });
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [liveMode, setLiveMode] = useState(false); // LIVE publish deliberately disabled
  const [flash, setFlash] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  const status = optimisticStatus ?? opp.status;
  const poster = (opp.draftPaths as Record<string, string>)[activeChannel] ?? Object.values(opp.draftPaths as Record<string, string>)[0];
  const profile = channelProfiles[activeChannel];
  const maxChars = profile?.copy.maxChars ?? 0;
  const currentCopy = copyDrafts[activeChannel] ?? "";
  const overLimit = maxChars > 0 && currentCopy.length > maxChars;
  const isBlocked = compliance?.status === "blocked";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) =>
    startTransition(async () => {
      const res = await fn();
      setFlash(res.ok ? okMsg : `⚠ ${res.error}`);
      setTimeout(() => setFlash(null), 3000);
      router.refresh();
    });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="display text-2xl">{opp.headline}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {moment?.description} · {moment ? `${(moment.endSec - moment.startSec).toFixed(0)}s` : ""} ·
              confidence {moment ? Math.round(moment.confidence * 100) : "–"}%
            </p>
          </div>
          <Badge variant="outline" className="capitalize">{status.replace(/_/g, " ")}</Badge>
        </div>

        {/* Format tabs + preview */}
        <Tabs value={activeChannel} onValueChange={setActiveChannel}>
          <TabsList className="h-8 bg-secondary">
            {channels.map((c) => (
              <TabsTrigger key={c} value={c} className="text-[11px]">
                {channelProfiles[c]?.label ?? c}
              </TabsTrigger>
            ))}
          </TabsList>
          {channels.map((c) => {
            const p = channelProfiles[c];
            const is916 = p?.aspect === "9:16";
            return (
              <TabsContent key={c} value={c} className="mt-3">
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border border-border bg-black",
                      is916 ? "aspect-[9/16] w-56" : "aspect-video w-[420px]"
                    )}
                  >
                    <video
                      key={c}
                      poster={poster}
                      controls
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {is916 && <SafeZoneOverlay channel={c} />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    {/* Trim */}
                    <div>
                      <p className="kicker mb-1.5">Trim (feeds frame-accurate final render)</p>
                      <div className="flex items-center gap-2">
                        <Input value={trimStart} onChange={(e) => setTrimStart(e.target.value)} className="h-8 w-24 font-mono text-xs" aria-label="trim start (sec)" />
                        <span className="text-xs text-muted-foreground">→</span>
                        <Input value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} className="h-8 w-24 font-mono text-xs" aria-label="trim end (sec)" />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs"
                          disabled={pending}
                          onClick={() => run(() => saveTrim(opp.id, Number(trimStart), Number(trimEnd)), "Trim saved")}
                        >
                          <Save size={13} /> Save trim
                        </Button>
                        {p && (
                          <span className="text-[11px] text-muted-foreground">
                            target {p.targetDurationSec[0]}–{p.targetDurationSec[1]}s · max {p.maxDurationSec}s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Copy */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="kicker">Copy — {p?.label} ({p?.copy.tone})</p>
                        <span className={cn("text-[11px] tabular-nums", overLimit ? "font-semibold text-danger-fg" : "text-muted-foreground")}>
                          {currentCopy.length}{maxChars > 0 ? ` / ${maxChars}` : " chars (no copy on this format)"}
                        </span>
                      </div>
                      <Textarea
                        value={currentCopy}
                        onChange={(e) => setCopyDrafts((d) => ({ ...d, [c]: e.target.value }))}
                        rows={4}
                        className="bg-background/60 text-sm"
                        placeholder={maxChars === 0 ? "This format publishes without copy" : "Generated copy"}
                      />
                      <div className="mt-1.5 flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          disabled={pending || overLimit}
                          onClick={() => run(() => saveCopy(opp.id, c, copyDrafts[c] ?? ""), "Copy saved")}
                        >
                          <Save size={12} /> Save copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4">
          {/* Why this */}
          <section>
            <p className="kicker mb-2">Why this</p>
            <div className="space-y-1.5">
              {Object.entries(opp.scoreBreakdown as Record<string, number>).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-36 text-muted-foreground">{BREAKDOWN_LABELS[k] ?? k}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-[var(--clout-electric-blue)]" style={{ width: `${Math.round(v * 100)}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{Math.round(v * 100)}</span>
                </div>
              ))}
            </div>
            <p className="kicker mb-1.5 mt-4">Contributing signals</p>
            <div className="space-y-1">
              {signals.map((sig) => (
                <div key={sig.id} className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-2 py-1.5 text-[11px]">
                  <Badge variant="outline" className="text-[9px] uppercase">{sig.kind.replace(/_/g, " ")}</Badge>
                  <span className="truncate text-muted-foreground">{sig.eventText}</span>
                  <span className={cn(
                    "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                    sig.simulated
                      ? "bg-[rgba(0,163,255,0.14)] text-[var(--clout-hyper-blue)]"
                      : "bg-[rgba(0,217,130,0.14)] text-[var(--success-fg)]"
                  )}>
                    {sig.simulated ? "SIMULATED" : "REAL"}
                  </span>
                </div>
              ))}
              {signals.length === 0 && <p className="text-[11px] text-muted-foreground">No linked signals.</p>}
            </div>
          </section>

          {/* Compliance */}
          <section>
            <p className="kicker mb-2">Compliance</p>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2">
                <ComplianceBadge status={compliance?.status ?? "unknown"} />
                <span className="text-[11px] text-muted-foreground">source: {compliance?.rightsSource}</span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                {(compliance?.reasons ?? []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {compliance?.expiresAt && (
                <p className="mt-2 text-[11px] text-warning-fg">
                  Rights expire {new Date(compliance.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Decision bar */}
      <div className="flex items-center gap-2 border-t border-border bg-carbon px-4 py-3">
        {pending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        {flash && <span className="text-xs text-[var(--clout-blue-tint)]">{flash}</span>}

        <div className="ml-auto flex items-center gap-2">
          {/* LIVE/SIM publish toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center overflow-hidden rounded-md border border-border text-[10px] font-semibold">
                  <button
                    className={cn("px-2 py-1", !liveMode ? "bg-[rgba(0,163,255,0.2)] text-[var(--clout-hyper-blue)]" : "text-muted-foreground")}
                    onClick={() => setLiveMode(false)}
                  >
                    SIM
                  </button>
                  <button className="cursor-not-allowed px-2 py-1 text-muted-foreground opacity-50" aria-disabled>
                    LIVE
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent>arms real @playclout post — enable in demo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {(status === "approved" || status === "rendered") && (
            <Button
              size="sm"
              className="h-8 bg-[var(--clout-violet)] text-xs text-white hover:bg-[var(--clout-violet)]/90"
              disabled={pending || isBlocked}
              onClick={() => run(() => publishOpportunity(opp.id, activeChannel, liveMode ? "live" : "simulated"), "Published (simulated)")}
            >
              <Send size={13} /> Publish {channelProfiles[activeChannel]?.label}
            </Button>
          )}

          {rejectMode ? (
            <>
              <Input
                autoFocus
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reject reason…"
                className="h-8 w-64 text-xs"
              />
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs"
                disabled={pending}
                onClick={() => {
                  setOptimisticStatus("rejected");
                  setRejectMode(false);
                  run(() => rejectOpportunity(opp.id, rejectReason), "Rejected");
                }}
              >
                Confirm reject
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setRejectMode(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={pending || status === "rejected"} onClick={() => setRejectMode(true)}>
                <X size={13} /> Reject
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs font-semibold"
                        style={{ background: isBlocked ? undefined : "var(--gradient-action)", color: "white" }}
                        disabled={pending || isBlocked || status === "approved" || status === "rejected" || status === "exported"}
                        onClick={() => {
                          setOptimisticStatus("approved"); // optimistic flip
                          run(() => approveOpportunity(opp.id), "Approved — final render queued");
                        }}
                      >
                        <Check size={14} /> Approve
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isBlocked && <TooltipContent>Blocked by compliance — approval is hard-gated</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
