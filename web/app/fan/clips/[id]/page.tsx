import Link from "next/link";
import { connection } from "next/server";
import { fanClip, resolveFanOrg } from "@/lib/fan";
import { getFanProfile } from "@/lib/fan-prefs";
import { rankForFan } from "@shared/fan-ranking";
import { playerById } from "@shared/player-identity";
import { FanPlayer } from "@/components/fan/fan-player";

export default async function FanClipPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const q = sp.org ? `?org=${sp.org}` : "";
  const { org } = await resolveFanOrg(sp.org);
  const clip = org && /^[0-9a-f-]{36}$/i.test(id) ? await fanClip(org.id, id) : null;

  if (!clip) {
    return (
      <div className="py-16 text-center">
        <p className="display text-xl">This clip isn&apos;t available</p>
        <p className="mt-2 text-sm text-muted-foreground">The club may have withdrawn it or its viewing window ended.</p>
        <Link href={`/fan${q}`} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold">Back to your feed</Link>
      </div>
    );
  }
  const profile = await getFanProfile();
  const why = rankForFan([{ ...clip, id: clip.versionId }], profile, new Date(), (id) => playerById(id)?.displayName ?? id)[0]?.reasons ?? [];
  const startAt = Number(sp.t);

  return (
    <article className="space-y-4">
      <Link href={`/fan${q}`} className="text-xs text-muted-foreground hover:text-foreground">&larr; For you</Link>
      <FanPlayer src={`/fan/media/${clip.versionId}`} poster={clip.posterPath} kind={clip.kind} startAt={Number.isFinite(startAt) ? startAt : 0} title={clip.headline} />
      <h1 className="display text-3xl" style={{ lineHeight: 1 }}>{clip.headline}</h1>
      {clip.caption && clip.caption !== clip.headline && <p className="whitespace-pre-line text-sm text-muted-foreground">{clip.caption}</p>}
      <div className="flex flex-wrap gap-1.5">
        {why.map((r) => <span key={r} className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[var(--clout-blue-tint)]">{r}</span>)}
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 text-sm">
        <div><dt className="kicker">Match</dt><dd className="mt-1">{clip.sourceLabel}</dd></div>
        <div><dt className="kicker">Players</dt><dd className="mt-1">{clip.playerNames.length ? clip.playerNames.join(", ") : "No featured player"}</dd></div>
        <div><dt className="kicker">Moment</dt><dd className="mt-1 capitalize">{clip.interestTags.join(", ") || "Highlight"}</dd></div>
        <div><dt className="kicker">Published</dt><dd className="mt-1">{new Date(clip.publishedAt).toLocaleString()}</dd></div>
      </dl>
    </article>
  );
}
