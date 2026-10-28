import Link from "next/link";
import { connection } from "next/server";
import { resolveFanOrg, fanPlayersFor, fanClipCountsByPlayer } from "@/lib/fan";

export default async function FanPlayers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const { org, orgKey } = await resolveFanOrg(sp.org);
  const [all, counts] = await Promise.all([fanPlayersFor(orgKey), org ? fanClipCountsByPlayer(org.id) : Promise.resolve(new Map<string, number>())]);
  // the whole squad from ScorePlay; players with published clips first
  const players = all.filter((p) => p.role !== "staff").sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.displayName.localeCompare(b.displayName));
  const q = sp.org ? `?org=${sp.org}` : "";
  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">Players</h1>
      <p className="text-sm text-muted-foreground">The full squad. Follow anyone; clips appear once the club tags them.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {players.map((p) => {
          const n = counts.get(p.id) ?? 0;
          return (
            <Link key={p.id} href={`/fan/players/${p.id}${q}`} className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-4 font-semibold hover:border-[var(--clout-blue-tint)]">
              <span>{p.displayName}</span>
              <span className="text-xs font-medium text-muted-foreground">{n ? `${n} clip${n === 1 ? "" : "s"}` : ""}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
