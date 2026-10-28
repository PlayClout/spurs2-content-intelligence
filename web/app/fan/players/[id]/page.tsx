import Link from "next/link";
import { connection } from "next/server";
import { resolveFanOrg, fanPlayerClips } from "@/lib/fan";
import { playerById } from "@shared/player-identity";
import { FanClipCard } from "@/components/fan/fan-clip-card";

export default async function FanPlayer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const player = playerById(id);
  const q = sp.org ? `?org=${sp.org}` : "";
  if (!player) {
    return (
      <div className="py-16 text-center">
        <p className="display text-xl">Player not found</p>
        <p className="mt-2 text-sm text-muted-foreground">We don&apos;t guess: pick a player from the list.</p>
        <Link href={`/fan/players${q}`} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold">All players</Link>
      </div>
    );
  }
  const { org } = await resolveFanOrg(sp.org);
  const clips = org ? await fanPlayerClips(org.id, player.id) : [];
  return (
    <div className="space-y-4">
      <Link href={`/fan/players${q}`} className="text-xs text-muted-foreground hover:text-foreground">&larr; Players</Link>
      <h1 className="display text-3xl">{player.displayName}</h1>
      {clips.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No published clips feature {player.displayName} yet. Clips are tagged to a player only when the editor confirms they&apos;re in the cut.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clips.map((c) => <FanClipCard key={c.versionId} clip={c} orgId={sp.org} />)}
        </div>
      )}
    </div>
  );
}
