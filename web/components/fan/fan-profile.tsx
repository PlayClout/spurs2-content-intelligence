"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectPersona, savePreferences, clearPreferences, type FanProfile } from "@/lib/fan-prefs";
import { cn } from "@/lib/utils";

export function PersonaSwitcher({ personas, current }: { personas: { id: string; label: string }[]; current: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Demo fan profile">
      <span className="kicker">Demo profile</span>
      {personas.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={pending}
          aria-pressed={current === p.id}
          onClick={() => start(async () => { await selectPersona(p.id); router.refresh(); })}
          className={cn(
            "min-h-11 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
            current === p.id ? "border-[var(--clout-electric-blue)] bg-[var(--accent)] text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function PreferencesPanel({ profile, players, interests }: { profile: FanProfile; players: { id: string; displayName: string }[]; interests: readonly string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fav, setFav] = useState<string[]>(profile.favoritePlayerIds);
  const [tags, setTags] = useState<string[]>(profile.interestTags);
  const [open, setOpen] = useState(false);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="kicker">Your preferences</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.favoritePlayerIds.length || profile.interestTags.length
              ? `Following ${[...profile.favoritePlayerIds.map((id) => players.find((p) => p.id === id)?.displayName ?? id), ...profile.interestTags].join(", ")}`
              : "No preferences yet: you get a balanced feed."}
          </p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-h-11 rounded-full border border-border px-4 text-xs font-semibold hover:bg-secondary">
          {open ? "Close" : "Edit"}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="kicker mb-2">Favorite players</legend>
            <FavoritePlayers players={players} selected={fav} onToggle={(id) => toggle(fav, setFav, id)} />
          </fieldset>
          <fieldset>
            <legend className="kicker mb-2">Interests</legend>
            <div className="flex flex-wrap gap-2">
              {interests.map((t) => (
                <label key={t} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm capitalize", tags.includes(t) ? "border-[var(--clout-electric-blue)] bg-[var(--accent)]" : "border-border")}>
                  <input type="checkbox" className="sr-only" checked={tags.includes(t)} onChange={() => toggle(tags, setTags, t)} />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => start(async () => { await savePreferences(fav, tags); setOpen(false); router.refresh(); })} className="min-h-11 rounded-full bg-[var(--clout-electric-blue)] px-5 text-sm font-semibold text-white disabled:opacity-60">
              Save
            </button>
            <button type="button" disabled={pending} onClick={() => start(async () => { await clearPreferences(); setFav([]); setTags([]); setOpen(false); router.refresh(); })} className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-muted-foreground disabled:opacity-60">
              Skip, show a balanced feed
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** The whole squad: followed players first, then a search to add anyone (a 30-name wall of chips is not usable). */
function FavoritePlayers({ players, selected, onToggle }: { players: { id: string; displayName: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  const [q, setQ] = useState("");
  const plain = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const chosen = players.filter((p) => selected.includes(p.id));
  const hits = q.trim() ? players.filter((p) => !selected.includes(p.id) && plain(p.displayName).includes(plain(q.trim()))).slice(0, 8) : [];
  const chip = (p: { id: string; displayName: string }) => (
    <label key={p.id} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm", selected.includes(p.id) ? "border-[var(--clout-electric-blue)] bg-[var(--accent)]" : "border-border")}>
      <input type="checkbox" className="sr-only" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} />
      {p.displayName}
    </label>
  );
  return (
    <div className="space-y-2">
      {chosen.length > 0 && <div className="flex flex-wrap gap-2">{chosen.map(chip)}</div>}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Find a player (${players.length} in the squad)`} aria-label="Find a player"
        className="min-h-11 w-full max-w-sm rounded-full border border-border bg-transparent px-4 text-sm placeholder:text-muted-foreground" />
      {hits.length > 0 && <div className="flex flex-wrap gap-2">{hits.map(chip)}</div>}
      {q.trim() && hits.length === 0 && <p className="text-xs text-muted-foreground">No one in the squad matches “{q.trim()}”.</p>}
    </div>
  );
}
