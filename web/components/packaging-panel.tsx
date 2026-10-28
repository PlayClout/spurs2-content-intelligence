"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveVariantOverride, resetVariantOverride, approveAndRenderVariants } from "@/lib/packaging";

type Dest = {
  channel: string; label: string; eligible: boolean; reasons: string[]; notes: string[]; revision: string | null;
  recipe: { kind: "video" | "photo"; aspect: string; width: number; height: number; startSec: number; endSec: number; cropXOffset: number; muteAudio: boolean; copy: string } | null;
  approvedRevision: string | null; approvalCurrent: boolean;
  rendered: { path: string; durationSec: number | null } | null;
  lastStatus: { status: string; error: string | null; stale: boolean } | null;
};

const STATE_LABEL: Record<string, string> = {
  ready: "Ready", rendering: "Rendering", approved: "Queued", held: "Needs re-approval", failed: "Failed", draft: "Not rendered", unavailable: "Unavailable",
};
const aspectBox: Record<string, string> = { "9:16": "aspect-[9/16] w-28", "4:5": "aspect-[4/5] w-36", "16:9": "aspect-video w-56" };

/** One approved clip -> every relevant destination. Approval is per destination and exact; app publish stays separate. */
export function PackagingPanel({ opportunityId, destinations, rendering }: { opportunityId: string; destinations: Dest[]; rendering: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [selected, setSelected] = useState<string[]>(destinations.filter((d) => d.eligible && !d.approvalCurrent).map((d) => d.channel));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ startSec: string; endSec: string; crop: string; copy: string; mute: boolean }>({ startSec: "", endSec: "", crop: "", copy: "", mute: false });
  const [msg, setMsg] = useState<string | null>(null);

  const ready = destinations.filter((d) => d.rendered).length;
  const eligible = destinations.filter((d) => d.eligible).length;
  const act = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, ok: string, after?: () => void) =>
    start(async () => { const r = await fn(); setMsg(r.ok ? r.message ?? ok : `Couldn't save: ${r.error}`); if (r.ok) after?.(); router.refresh(); });

  const openEdit = (d: Dest) => {
    if (!d.recipe) return;
    setEditing(d.channel);
    setDraft({ startSec: String(d.recipe.startSec), endSec: String(d.recipe.endSec), crop: String(d.recipe.cropXOffset), copy: d.recipe.copy, mute: d.recipe.muteAudio });
  };

  return (
    <section aria-label="Channel packaging">
      <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-border bg-subtle px-3 py-2.5 text-[13px]">
        <span><b className="font-semibold">{ready} of {eligible} ready.</b> {eligible === 0 ? "Approve the clip first, then render every channel in one go." : `${selected.length} selected to render. Each channel gets its own cut, size and caption.`}</span>
        <Button size="sm" className="ml-auto" disabled={busy || selected.length === 0}
          onClick={() => act(() => approveAndRenderVariants(opportunityId, selected), "Rendering", () => setSelected([]))}>
          Render {selected.length} channel{selected.length === 1 ? "" : "s"}
        </Button>
      </div>

      <div className="space-y-2">
        {destinations.map((d) => {
          const on = selected.includes(d.channel);
          const state = d.rendered ? "ready" : d.lastStatus?.status === "failed" ? "failed" : d.lastStatus?.status === "held" ? "held" : d.approvalCurrent ? (rendering ? "rendering" : "approved") : d.eligible ? "draft" : "unavailable";
          const tint: Record<string, string> = {
            ready: "tone-green", rendering: "tone-blue",
            approved: "tone-blue", held: "tone-amber",
            failed: "tone-red", draft: "tone-gray", unavailable: "tone-gray",
          };
          return (
            <div key={d.channel} className={cn("rounded-lg border border-border bg-card p-2.5 text-[13px]", !d.eligible && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2">
                <input type="checkbox" aria-label={`Include ${d.label}`} disabled={!d.eligible} checked={on}
                  onChange={() => setSelected((s) => (on ? s.filter((x) => x !== d.channel) : [...s, d.channel]))} />
                <span className="font-semibold">{d.label}</span>
                {d.recipe && <span className="text-ink-3">{d.recipe.aspect} · {d.recipe.width}×{d.recipe.height}{d.recipe.kind === "video" ? ` · ${(d.recipe.endSec - d.recipe.startSec).toFixed(1)}s` : " · still"}{d.recipe.muteAudio ? " · muted" : ""}</span>}
                <span className={cn("pill dot", tint[state])}>{STATE_LABEL[state]}</span>
                {d.eligible && <button type="button" className="ml-auto rounded-md px-2 py-0.5 text-xs font-semibold text-ink-2 hover:bg-secondary" onClick={() => openEdit(d)}>Edit</button>}
              </div>
              {!d.eligible && <p className="mt-1 text-xs text-muted-foreground">Unavailable: {d.reasons.join("; ")}</p>}
              {d.notes.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{d.notes.join(" · ")}</p>}
              {d.lastStatus?.error && state !== "ready" && <p className="mt-1 text-xs text-warning-fg">{d.lastStatus.error}</p>}
              {d.approvedRevision && !d.approvalCurrent && <p className="mt-1 text-xs text-warning-fg">Edited since it was rendered. Select it and render again.</p>}
              {d.rendered && (
                <div className={cn("relative mt-2 overflow-hidden rounded border border-border bg-black", aspectBox[d.recipe?.aspect ?? "16:9"])}>
                  {d.recipe?.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.rendered.path} alt={`${d.label} rendition`} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <video src={d.rendered.path} controls playsInline preload="metadata" aria-label={`${d.label} rendition`} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </div>
              )}
              {editing === d.channel && d.recipe && (
                <div className="mt-2 space-y-2 rounded-lg border border-border bg-subtle p-2.5">
                  {d.recipe.kind === "video" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Cut</span>
                      <Input value={draft.startSec} onChange={(e) => setDraft({ ...draft, startSec: e.target.value })} inputMode="decimal" className="h-7 w-20 text-xs tabular-nums" aria-label={`${d.label} start (sec)`} />
                      <span className="text-muted-foreground">→</span>
                      <Input value={draft.endSec} onChange={(e) => setDraft({ ...draft, endSec: e.target.value })} inputMode="decimal" className="h-7 w-20 text-xs tabular-nums" aria-label={`${d.label} end (sec)`} />
                      <label className="ml-2 flex items-center gap-1 text-xs"><input type="checkbox" checked={draft.mute} onChange={(e) => setDraft({ ...draft, mute: e.target.checked })} /> Mute audio</label>
                    </div>
                  )}
                  {d.recipe.aspect !== "16:9" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground" htmlFor={`crop-${d.channel}`}>Framing (left ↔ right)</label>
                      <input id={`crop-${d.channel}`} type="range" min={0} max={1} step={0.01} value={draft.crop} onChange={(e) => setDraft({ ...draft, crop: e.target.value })} className="w-40" />
                      <span className="text-xs tabular-nums text-muted-foreground">{Number(draft.crop) < 0.4 ? "Left" : Number(draft.crop) > 0.6 ? "Right" : "Centre"}</span>
                    </div>
                  )}
                  {d.channel !== "instagram_story" ? (
                    <Textarea value={draft.copy} onChange={(e) => setDraft({ ...draft, copy: e.target.value })} rows={3} className="text-xs" aria-label={`${d.label} copy`} />
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" disabled={busy}
                      onClick={() => act(() => saveVariantOverride(opportunityId, d.channel, {
                        ...(d.recipe!.kind === "video" ? { startSec: Number(draft.startSec), endSec: Number(draft.endSec), muteAudio: draft.mute } : {}),
                        cropXOffset: Number(draft.crop), copy: draft.copy,
                      }), `${d.label} saved. Render it to update the file.`, () => { setEditing(null); setSelected((s) => (s.includes(d.channel) ? s : [...s, d.channel])); })}>
                      Save {d.label}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => act(() => resetVariantOverride(opportunityId, d.channel), "Reset to suggestion", () => setEditing(null))}>Reset to suggestion</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {rendering && <span className="text-[11px] text-accent-foreground">Rendering in the background…</span>}
        {msg && <span className="text-[11px] text-accent-foreground">{msg}</span>}
      </div>
      <p className="mt-2 text-xs text-ink-4">
        Each destination renders and is checked on its own; a failed channel retries alone. Social versions are for export only, nothing is posted. Publishing to the fan app is a separate step below.
      </p>
    </section>
  );
}
