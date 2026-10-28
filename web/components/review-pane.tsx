"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, TriangleAlert, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { channelProfiles } from "@/lib/channels";
import { cn } from "@/lib/utils";
import { FanAppPanel } from "@/components/fan-app-panel";
import { PackagingPanel } from "@/components/packaging-panel";
import { SmartTrimField } from "@/components/producer/smart-trim";
import { StatusPill } from "@/components/producer/queue-row";
import { formatLabel, titleCase } from "@/lib/format";
import type { TrimWorkspace } from "@/lib/trim";
import type { Compliance } from "@shared/schemas";
import type { OpportunityRow, SignalRow } from "@/lib/actions";
import type { moments } from "@shared/db-schema";
import { approveOpportunity, rejectOpportunity, saveCopy, publishOpportunity } from "@/lib/actions";

type MomentRow = typeof moments.$inferSelect;
export type FanAppProps = Omit<React.ComponentProps<typeof FanAppPanel>, "opportunityId" | "status">;
export type PackagingProps = Omit<React.ComponentProps<typeof PackagingPanel>, "opportunityId">;
type Tab = "edit" | "channels" | "fan" | "why";
const AUD: Record<string, string> = { casual: "casual fans", superfan: "superfans" };
const APPROVED = ["approved", "rendering", "rendered", "exported"];

function SafeZoneOverlay({ channel }: { channel: string }) {
  const p = channelProfiles[channel];
  if (!p || p.aspect !== "9:16") return null;
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(1)}%`;
  return (
    <div className="pointer-events-none absolute border border-dashed border-white/50"
      style={{ top: pct(p.safeZone.top, p.height), bottom: pct(p.safeZone.bottom, p.height), left: pct(p.safeZone.left, p.width), right: pct(p.safeZone.right, p.width) }}>
      <span className="absolute left-1 top-1 rounded bg-black/50 px-1 text-[9px] font-semibold uppercase tracking-wider text-white">safe zone</span>
    </div>
  );
}

export function ReviewPane({ opp, moment, signals, fanApp, packaging, trim, initialTab }: {
  opp: OpportunityRow; moment: MomentRow | null; signals: SignalRow[]; fanApp?: FanAppProps; packaging?: PackagingProps; trim?: TrimWorkspace; initialTab?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const compliance = opp.compliance as Compliance;
  const channels = opp.channels as string[];
  const copyMap = opp.generatedCopy as Record<string, string>;
  const [tab, setTab] = useState<Tab>((["edit", "channels", "fan", "why"] as const).find((t) => t === initialTab) ?? (APPROVED.includes(opp.status) ? "channels" : "edit"));
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [copyDrafts, setCopyDrafts] = useState<Record<string, string>>({ ...copyMap });
  const [rejecting, setRejecting] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [optimistic, setOptimistic] = useState<string | null>(null);

  const status = optimistic ?? opp.status;
  const delivery = (opp.delivery ?? null) as {
    draftVideo?: string | null; variant?: { why: string };
    inputs?: Record<string, { source: string; real: boolean; note?: string }>;
    ranking?: { score: number; eventWeight: number; audienceFit: number; corroboration: number; triggers: number; backend: string; confidence?: number; lowConfidence?: boolean };
  } | null;
  const drafts = opp.draftPaths as Record<string, string>;
  const poster = drafts[activeChannel] ?? Object.values(drafts)[0];
  const finals = (opp.finalPaths ?? {}) as Record<string, string>;
  const videoSrc = (finals[activeChannel]?.endsWith(".mp4") ? finals[activeChannel] : null) ?? delivery?.draftVideo ?? undefined;
  const isStill = !!poster && /\.(jpe?g|png|webp)$/i.test(poster) && !videoSrc;
  const profile = channelProfiles[activeChannel];
  const maxChars = profile?.copy.maxChars ?? 0;
  const currentCopy = copyDrafts[activeChannel] ?? "";
  const overLimit = maxChars > 0 && currentCopy.length > maxChars;
  const isBlocked = compliance?.status === "blocked";
  const needsReview = opp.status === "needs_review" && !APPROVED.includes(status);
  const decided = APPROVED.includes(status) || status === "rejected";
  const is916 = profile?.aspect === "9:16";
  const mode = signals.some((x) => x.simulated) ? "Replay" : delivery?.inputs?.footage?.real ? "Live" : "Fixture";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      setFlash({ ok: res.ok, text: res.ok ? okMsg : res.error ?? "Failed" });
      if (res.ok) { after?.(); setTimeout(() => setFlash((f) => (f?.ok ? null : f)), 3500); } else setOptimistic(null);
      router.refresh();
    });
  const unsaved = channels.filter((c) => (copyDrafts[c] ?? "") !== (copyMap[c] ?? ""));
  const overLimitAny = unsaved.find((c) => { const m = channelProfiles[c]?.copy.maxChars ?? 0; return m > 0 && (copyDrafts[c] ?? "").length > m; });
  const approveBlocker = isBlocked ? "Blocked by rights. Approval is hard-gated."
    : needsReview && overrideReason.trim().length < 5 ? "Enter why it's OK to approve (at least 5 characters)."
    : overLimitAny ? `The ${channelProfiles[overLimitAny]?.label} caption is over its limit.` : null;
  // Approving moves the clip out of the queue; pin it in the URL so the editor lands on its Channels tab, not the next clip.
  // Unsaved caption edits are saved first (approving must never drop them), then the clip is approved in the same step.
  const approve = () => {
    setOptimistic("approved");
    run(async () => {
      for (const c of unsaved) { const r = await saveCopy(opp.id, c, copyDrafts[c] ?? ""); if (!r.ok) return r; }
      return approveOpportunity(opp.id, overrideReason);
    }, unsaved.length ? "Captions saved and approved. Final render queued, ScorePlay log held." : "Approved. Final render queued, ScorePlay log held.", () => {
      setTab("channels");
      const u = new URL(window.location.href); u.searchParams.set("opp", opp.id); u.searchParams.set("tab", "channels");
      router.replace(`${u.pathname}${u.search}`, { scroll: false });
    });
  };
  const reject = () => {
    setOptimistic("rejected"); setRejecting(false);
    run(() => rejectOpportunity(opp.id, rejectReason), "Rejected", () => {
      const u = new URL(window.location.href); u.searchParams.delete("opp"); u.searchParams.delete("tab");
      router.replace(`${u.pathname}${u.search}`, { scroll: false });
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header: status, title, primary actions (always visible) */}
      <div className="flex items-start gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <StatusPill status={status} compliance={compliance?.status} />
            {compliance?.status === "restricted" && <span className="pill tone-gray">Owned channels only</span>}
            <span className={cn("pill", mode === "Live" ? "tone-green" : "tone-blue")} title={mode === "Replay" ? "Signals are a timed replay of the match, not a live feed" : undefined}>{mode}</span>
          </div>
          <h2 className="display text-xl">{titleCase(opp.headline)}</h2>
          <p className="mt-0.5 text-[13px] text-ink-2">
            {formatLabel(opp.contentType)} for {AUD[opp.audience] ?? opp.audience}
            {moment ? ` · ${(moment.endSec - moment.startSec).toFixed(0)}s detected` : ""}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {pending && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
          {rejecting ? (
            <>
              <Input autoFocus value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason (optional)" aria-label="Reject reason" className="h-9 w-52"
                onKeyDown={(e) => { if (e.key === "Enter") reject(); if (e.key === "Escape") setRejecting(false); }} />
              <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
              <Button variant="outline" className="text-danger-fg" disabled={pending} onClick={reject}>Reject</Button>
            </>
          ) : decided ? (
            (status === "approved" || status === "rendered") && (
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="outline" disabled={pending || isBlocked} onClick={() => run(() => publishOpportunity(opp.id, activeChannel), "Recorded as a simulated export")}>
                  <Upload /> Mark exported
                </Button>
              </TooltipTrigger><TooltipContent>No social post is created. This records an event-internal simulated export only.</TooltipContent></Tooltip></TooltipProvider>
            )
          ) : (
            <>
              <Button variant="outline" disabled={pending} onClick={() => setRejecting(true)}>Reject</Button>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <span>
                  <Button size="lg" disabled={!!approveBlocker || pending} onClick={approve}>
                    <Check strokeWidth={2.5} /> {unsaved.length ? "Save & approve" : "Approve"}
                  </Button>
                </span>
              </TooltipTrigger>{approveBlocker && <TooltipContent>{approveBlocker}</TooltipContent>}</Tooltip></TooltipProvider>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {flash && (
          <div role={flash.ok ? "status" : "alert"} className={cn("callout mx-5 mt-4 items-start", flash.ok ? "callout-green" : "callout-red")}>
            <span className="flex-1">{flash.text}</span>
            {!flash.ok && <button type="button" onClick={() => setFlash(null)} className="font-semibold opacity-70 hover:opacity-100" aria-label="Dismiss">×</button>}
          </div>
        )}
        {/* rights callout: one sentence, the decision it implies */}
        {isBlocked ? (
          <Callout tone="red" icon={<TriangleAlert size={18} />} title="Blocked by rights.">{compliance.reasons?.[0]}</Callout>
        ) : needsReview ? (
          <Callout tone="amber" icon={<TriangleAlert size={18} />} title="Rights need a decision.">
            {compliance?.reasons?.[0]}
            <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Why it's OK to approve (required)" aria-label="Override reason" className="mt-2 h-8 max-w-sm bg-card" />
          </Callout>
        ) : (
          <Callout tone="blue" icon={<Info size={18} />} title={compliance?.status === "cleared" ? "Cleared." : "Cleared for owned channels."}>
            {compliance?.reasons?.[0]} Rights are checked again at publish.
          </Callout>
        )}
        {compliance?.expiresAt && <p className="mx-5 mt-2 text-xs text-warning-fg">Rights expire {new Date(compliance.expiresAt).toLocaleString()}</p>}

        <div className="mt-3.5 flex gap-5 border-b border-border px-5" role="tablist" aria-label="Clip sections">
          {([["edit", "Edit"], ["channels", "Channels", packaging?.destinations.length], ["fan", "Fan app"], ["why", "Why this clip"]] as [Tab, string, number?][]).map(([k, l, n]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("-mb-px border-b-2 py-2.5 text-[13px] font-semibold", tab === k ? "border-primary text-accent-foreground" : "border-transparent text-ink-2 hover:text-foreground")}>
              {l}{n ? <span className="ml-1 rounded-full bg-secondary px-1.5 text-[11px] text-ink-2">{n}</span> : null}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "edit" && (
            <div className="grid grid-cols-[auto_1fr] gap-6">
              <div className={cn("relative overflow-hidden rounded-[14px] bg-black shadow-sm", is916 ? "aspect-[9/16] w-[230px]" : profile?.aspect === "4:5" ? "aspect-[4/5] w-[260px]" : "aspect-video w-[380px]")}>
                {isStill
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={poster} alt={`${opp.headline} photo card`} className="absolute inset-0 h-full w-full object-cover" />
                  : <video key={`${activeChannel}-${videoSrc ?? "poster"}`} poster={poster} src={videoSrc} controls playsInline className="absolute inset-0 h-full w-full object-cover" />}
                {is916 && <SafeZoneOverlay channel={activeChannel} />}
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {channels.map((c) => (
                    <button key={c} type="button" onClick={() => setActiveChannel(c)} aria-pressed={c === activeChannel}
                      className={cn("rounded-full border px-2.5 py-1 text-[12.5px] font-semibold", c === activeChannel ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-ink-2 hover:bg-secondary")}>
                      {channelProfiles[c]?.label ?? c}
                    </button>
                  ))}
                </div>
                <label className="mb-1.5 flex justify-between text-[12.5px] font-semibold" htmlFor="copy">
                  Caption for {profile?.label}
                  <span className={cn("font-medium tabular-nums", overLimit ? "text-danger-fg" : "text-ink-4")}>{currentCopy.length}{maxChars > 0 ? ` / ${maxChars}` : " · no caption on this format"}</span>
                </label>
                <Textarea id="copy" value={currentCopy} rows={4} className="text-[13.5px]" placeholder={maxChars === 0 ? "This format publishes without a caption" : "Caption"}
                  onChange={(e) => setCopyDrafts((d) => ({ ...d, [activeChannel]: e.target.value }))} />
                <div className="mt-2 flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={pending || overLimit || currentCopy === (copyMap[activeChannel] ?? "")}
                    onClick={() => run(() => saveCopy(opp.id, activeChannel, currentCopy), APPROVED.includes(status) ? "Caption saved. The clip needs approving again." : "Caption saved")}>Save caption</Button>
                  {unsaved.length > 0 && <span className="text-xs font-medium text-warning-fg">Unsaved changes on {unsaved.map((c) => channelProfiles[c]?.label ?? c).join(", ")}</span>}
                  {APPROVED.includes(status) && <span className="text-xs text-ink-4">Changing an approved clip sends it back for re-approval.</span>}
                </div>
                {trim && <SmartTrimField opportunityId={opp.id} trim={trim} activeChannel={activeChannel} onChannel={setActiveChannel} approved={APPROVED.includes(status)} />}
              </div>
            </div>
          )}

          {tab === "channels" && (packaging
            ? <PackagingPanel key={`${opp.id}-${packaging.destinations.map((d) => d.revision).join("")}`} opportunityId={opp.id} destinations={packaging.destinations} rendering={packaging.rendering} />
            : <p className="text-sm text-muted-foreground">Channel packaging is not available for this clip.</p>)}

          {tab === "fan" && (fanApp
            ? <FanAppPanel opportunityId={opp.id} status={status} {...fanApp} />
            : <p className="text-sm text-muted-foreground">Fan app publishing is not available for this clip.</p>)}

          {tab === "why" && (
            <div className="grid grid-cols-2 gap-6 text-[13px]">
              <div>
                <h3 className="mb-2 font-semibold">Why the engine picked it</h3>
                {delivery?.variant?.why && <p className="mb-3">{delivery.variant.why}</p>}
                {delivery?.ranking && (
                  <>
                    <Meter label="Significance" v={delivery.ranking.eventWeight} />
                    <Meter label="Audience fit" v={delivery.ranking.audienceFit} />
                    <Meter label="Corroboration" v={delivery.ranking.corroboration} />
                    <p className="mt-2 text-xs text-ink-3">
                      Score {delivery.ranking.score} from {delivery.ranking.triggers} trigger{delivery.ranking.triggers === 1 ? "" : "s"}, scored by {delivery.ranking.backend === "jev" ? "the Jev decision engine" : delivery.ranking.backend === "haiku" ? "Claude Haiku" : "the fallback formula"}.
                      {delivery.ranking.lowConfidence && <span className="pill tone-amber ml-1.5">Low confidence {Math.round((delivery.ranking.confidence ?? 0) * 100)}%</span>}
                    </p>
                  </>
                )}
                {moment?.description && <><h3 className="mb-1.5 mt-5 font-semibold">What TwelveLabs saw</h3><p className="text-ink-2">{moment.description}</p></>}
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Signals</h3>
                {signals.length === 0 && <p className="text-ink-3">No linked signals.</p>}
                {signals.map((sig) => (
                  <div key={sig.id} className="mb-1.5 flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                    <span className="w-28 shrink-0 text-[11.5px] font-semibold capitalize text-ink-2">{sig.kind === "context" ? "AI watch-list" : sig.kind.replace(/_/g, " ")}</span>
                    <span className="min-w-0 flex-1 truncate">{sig.eventText.replace(/\s*\((simulated feed|live search)\)/, "")}</span>
                    <span className={cn("pill", sig.simulated ? "tone-blue" : "tone-green")}>{sig.simulated ? "Replay" : "Live"}</span>
                  </div>
                ))}
                {delivery?.inputs && (
                  <>
                    <h3 className="mb-2 mt-5 font-semibold">Sources</h3>
                    <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5">
                      {Object.entries(delivery.inputs).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="capitalize text-ink-3">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
                          <dd>{v.source}{v.note ? ` · ${v.note}` : ""} <span className={cn("pill ml-1", v.real ? "tone-green" : "tone-blue")}>{v.real ? "Real" : "Simulated"}</span></dd>
                        </div>
                      ))}
                    </dl>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Callout({ tone, icon, title, children }: { tone: "blue" | "amber" | "red"; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className={cn("callout mx-5 mt-4", `callout-${tone}`)}>
      <span className="mt-px shrink-0">{icon}</span>
      <div><b className="font-semibold">{title}</b> {children}</div>
    </div>
  );
}

function Meter({ label, v }: { label: string; v: number }) {
  const n = Math.round((v ?? 0) * 100);
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span className="w-28 text-ink-2">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><i className="block h-full rounded-full bg-primary" style={{ width: `${n}%` }} /></span>
      <span className="w-7 text-right tabular-nums text-ink-2">{n}</span>
    </div>
  );
}

