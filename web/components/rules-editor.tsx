"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveRuleDraft, toggleRuleDraft, previewDraft, activateDraft } from "@/lib/rules";
import type { RuleDef } from "@shared/rights/rule-schema";

const SEV: Record<string, string> = {
  block: "tone-red",
  warning: "tone-amber",
  info: "tone-gray",
};

const NEW_RULE_TEMPLATE = JSON.stringify({
  id: "R7-NEW-RULE", name: "Describe the rule", enabled: true, status: "blocked", severity: "block",
  scope: { territories: ["GB"], use: ["owned_fan_web"] },
  condition: { fact: "content.brand.category", op: "eq", value: "gambling" },
  rationale: "Why this rule exists, in plain language.", citation: "Source of the rule (required for cleared rules)",
}, null, 2);

type Errors = string[] | Record<string, string[]>;
const flat = (e: Errors) => (Array.isArray(e) ? e : Object.entries(e).flatMap(([k, v]) => v.map((x) => `${k}: ${x}`)));

export function RulesEditor({ draft, pending, facts }: { draft: RuleDef[]; pending: string[]; facts: string[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ key: string; label: string; before: string; after: string; changed: boolean; firedAfter: string[] }[] | null>(null);

  const open = (id: string | "new") => {
    setErrors([]); setMsg(null);
    setEditing(id);
    setText(id === "new" ? NEW_RULE_TEMPLATE : JSON.stringify(draft.find((r) => r.id === id), null, 2));
  };
  const act = (fn: () => Promise<{ ok: boolean; message?: string; errors?: Errors }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) { setErrors([]); setMsg(r.message ?? "Done"); after?.(); } else { setErrors(flat(r.errors ?? ["Failed"])); setMsg(null); }
      setPreview(null);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => open("new")}>New rule</Button>
        <Button size="sm" variant="outline" disabled={busy}
          onClick={() => start(async () => { const r = await previewDraft(); if (r.ok) { setPreview(r.rows); setErrors([]); } else setErrors(flat(r.errors)); })}>
          Validate + preview draft
        </Button>
        <Button size="sm" disabled={busy || pending.length === 0}
          title={pending.length === 0 ? "Draft matches the active version" : undefined}
          onClick={() => act(() => activateDraft())}>
          Activate draft {pending.length ? `(${pending.length} change${pending.length === 1 ? "" : "s"})` : ""}
        </Button>
        {msg && <span className="text-xs text-accent-foreground">{msg}</span>}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="callout callout-red block list-disc space-y-0.5 py-2 pl-6 text-xs">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      {preview && (
        <section className="panel p-3.5">
          <p className="kicker mb-2">Preview on SIMULATED sample media · {preview.filter((r) => r.changed).length} verdict{preview.filter((r) => r.changed).length === 1 ? "" : "s"} would change · 0 TwelveLabs calls</p>
          <div className="space-y-1 text-xs">
            {preview.map((r) => (
              <div key={r.key} className={cn("flex items-center gap-3 rounded-md border px-2.5 py-1.5", r.changed ? "border-primary bg-accent" : "border-border")}>
                <span className="flex-1">{r.label}</span>
                <span className="w-32 text-muted-foreground">{r.before.replace(/_/g, " ")}</span>
                <span aria-hidden>&rarr;</span>
                <span className={cn("w-32 font-semibold", r.changed && "text-accent-foreground")}>{r.after.replace(/_/g, " ")}</span>
                <span className="w-44 truncate text-muted-foreground">{r.firedAfter.join(", ") || "no rule fired"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {editing && (
        <section className="panel border-primary p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="kicker">{editing === "new" ? "New rule (JSON)" : `Edit ${editing} (JSON)`}</p>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setEditing(null)}>Close</button>
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={16} spellCheck={false} className="font-mono text-[11px]" aria-label="Rule JSON" />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Operators: eq, neq, in, includes, exists, gt, gte, lt, lte; combine with all / any / not. Known facts: {facts.join(", ")}. Saving changes the draft only.
          </p>
          <Button size="sm" className="mt-2 h-8 text-xs" disabled={busy} onClick={() => act(() => saveRuleDraft(text), () => setEditing(null))}>Save to draft</Button>
        </section>
      )}

      <div className="space-y-2">
        {draft.map((r) => (
          <div key={r.id} className={cn("rounded-[10px] border bg-card p-3.5 shadow-xs", pending.includes(r.id) ? "border-warning" : "border-border", !r.enabled && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-[11px] text-ink-4">{r.id}</code>
              <span className="font-semibold">{r.name}</span>
              <span className={cn("pill dot", SEV[r.severity])}>{r.severity}</span>
              <span className="pill tone-gray">&rarr; {r.status.replace(/_/g, " ")}</span>
              <span className="pill tone-gray">{r.citation ? "Cited" : "Illustrative"}</span>
              {pending.includes(r.id) && <span className="pill tone-amber">Changed in draft</span>}
              <span className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => open(r.id)}>Edit</Button>
                <Button size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => act(() => toggleRuleDraft(r.id, !r.enabled))}>
                  {r.enabled ? "Disable" : "Enable"}
                </Button>
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{r.rationale}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Scope: {Object.entries(r.scope).map(([k, v]) => `${k} ${(v as string[]).join("/")}`).join(" · ") || "none"}
              {r.citation ? ` · Citation: ${r.citation}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
