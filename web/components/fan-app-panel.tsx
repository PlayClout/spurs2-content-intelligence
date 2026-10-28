"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveFanMetadata, publishToFanCatalog, withdrawFromFanCatalog } from "@/lib/fan";

/**
 * Editor-side fan app controls: metadata review (B8.7) then explicit publish/withdraw (B4.4/B4.5).
 * Approval never publishes. Publishing needs: approved + final render + cleared rights + reviewed metadata.
 */
export function FanAppPanel({
  opportunityId, status, players, interests, suggested, reviewed, publication, rightsLabel,
}: {
  opportunityId: string;
  status: string;
  players: { id: string; displayName: string; role?: string }[];
  interests: readonly string[];
  suggested: { featuredPlayerIds: string[]; interestTags: string[] };
  reviewed: { featuredPlayerIds: string[]; interestTags: string[]; reviewedAt?: string } | null;
  publication: { state: string; version: number | null };
  rightsLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fav, setFav] = useState<string[]>(reviewed?.featuredPlayerIds ?? suggested.featuredPlayerIds);
  const [tags, setTags] = useState<string[]>(reviewed?.interestTags ?? suggested.interestTags);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const act = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, ok: string) =>
    start(async () => { const r = await fn(); setMsg(r.ok ? r.message ?? ok : `Couldn't complete: ${r.error}`); router.refresh(); });

  const approved = ["approved", "rendering", "rendered", "exported"].includes(status);
  const dirty = !reviewed || JSON.stringify([...fav].sort()) !== JSON.stringify([...reviewed.featuredPlayerIds].sort()) || JSON.stringify([...tags].sort()) !== JSON.stringify([...reviewed.interestTags].sort());
  const live = publication.state === "published";

  return (
    <section className="max-w-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">Publish to the fan app</h3>
        <span className={cn("pill dot",
          live ? "tone-green" : publication.state === "withdrawn" ? "tone-red" : "tone-gray")}>
          {live ? `Live · version ${publication.version}` : publication.state === "withdrawn" ? "Withdrawn" : publication.state === "scheduled" ? "Scheduled" : publication.state === "expired" ? "Expired" : "Not published"}
        </span>
      </div>

      <p className="mt-1 text-[13px] text-ink-3">Fans see it in their feed, ranked by who they follow. Rights for owned fan web: <span className="text-foreground">{rightsLabel}</span></p>

      <h4 className="mb-1.5 mt-5 text-[13px] font-semibold">Who is in the clip</h4>
      <PlayerPicker players={players} selected={fav} suggested={reviewed ? [] : suggested.featuredPlayerIds} onToggle={(id) => toggle(fav, setFav, id)} />
      {fav.length === 0 && <p className="mt-1 text-xs text-ink-4">No featured player: the clip will never be promoted as a favorite-player match.</p>}

      <h4 className="mb-1.5 mt-4 text-[13px] font-semibold">Interests</h4>
      <div className="flex flex-wrap gap-1.5">
        {interests.map((t) => (
          <button key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => toggle(tags, setTags, t)}
            className={cn("rounded-full border px-2.5 py-1 text-[12.5px] font-medium capitalize", tags.includes(t) ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-ink-2 hover:bg-secondary")}>
            {t}{suggested.interestTags.includes(t) && !reviewed ? " · suggested" : ""}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={pending || !dirty} onClick={() => act(() => saveFanMetadata(opportunityId, fav, tags), "Metadata confirmed")}>
          {reviewed ? (dirty ? "1. Confirm changes" : "1. Players and interests confirmed") : "1. Confirm players and interests"}
        </Button>
        <Button size="sm" disabled={pending || !approved || dirty}
          title={!approved ? "Approve the clip first" : dirty ? "Confirm metadata first" : undefined}
          onClick={() => act(() => publishToFanCatalog(opportunityId), "Published to fan app")}>
          {live ? "2. Republish current version" : "2. Publish to fan app"}
        </Button>
      </div>
      {live && (
        <div className="mt-2 flex items-center gap-2">
          <Input value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} placeholder="Withdraw reason" className="h-8 max-w-xs flex-1" />
          <Button size="sm" variant="outline" className="text-danger-fg" disabled={pending} onClick={() => act(() => withdrawFromFanCatalog(opportunityId, withdrawReason), "Withdrawn from fan app")}>
            Withdraw
          </Button>
        </div>
      )}
      {msg && <p className="mt-2 text-[13px] text-accent-foreground" role="status">{msg}</p>}
      {!approved && <p className="mt-2 text-xs text-ink-4">Approval does not publish. After approval and the final render, publish here explicitly.</p>}
    </section>
  );
}

/** The club's whole ScorePlay squad, not a fixed few: tagged + suggested players up front, then type to find anyone. */
function PlayerPicker({ players, selected, suggested, onToggle }: {
  players: { id: string; displayName: string; role?: string }[]; selected: string[]; suggested: string[]; onToggle: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const byId = new Map(players.map((p) => [p.id, p]));
  const pinned = [...new Set([...selected, ...suggested])].map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const plain = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hits = q.trim() ? players.filter((p) => !pinned.includes(p) && plain(p.displayName).includes(plain(q.trim()))).slice(0, 8) : [];
  const chip = (p: { id: string; displayName: string; role?: string }) => (
    <button key={p.id} type="button" aria-pressed={selected.includes(p.id)} onClick={() => onToggle(p.id)}
      className={cn("rounded-full border px-2.5 py-1 text-[12.5px] font-medium", selected.includes(p.id) ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-ink-2 hover:bg-secondary")}>
      {p.displayName}{p.role === "staff" ? " · coach" : ""}{suggested.includes(p.id) && !selected.includes(p.id) ? " · suggested" : ""}
    </button>
  );
  return (
    <div>
      {pinned.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{pinned.map(chip)}</div>}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Add a player: type a name (${players.length} in the ScorePlay squad)`}
        aria-label="Find a player in the squad" className="h-8 max-w-sm" />
      {hits.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="Matching players">{hits.map(chip)}</div>}
      {q.trim() && hits.length === 0 && <p className="mt-1 text-xs text-ink-4">No one in the squad matches “{q.trim()}”.</p>}
    </div>
  );
}
