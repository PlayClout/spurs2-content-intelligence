import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { and, eq, inArray, desc, ne } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { listPublished } from "@/lib/actions";
import { channelLabel } from "@/lib/channels";
import { Shell, shellContext, PageHead, NoOrg } from "@/components/producer/shell";
import { titleCase } from "@/lib/format";
import { WithdrawButton } from "@/components/producer/withdraw-button";

const still = (p?: string) => !!p && /\.(jpe?g|png|webp)$/i.test(p);
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : d.toLocaleDateString();
};

/** Everything that left the desk: live in the fan app (publications) + simulated social exports (published_assets). */
export default async function PublishedPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const ctx = await shellContext(await searchParams);
  if (!ctx.org) return <NoOrg />;
  const orgId = ctx.org.id;
  const [pubs, exportsRows] = await Promise.all([
    db.select().from(s.publications).where(and(eq(s.publications.orgId, orgId), ne(s.publications.state, "preparing"))).orderBy(desc(s.publications.updatedAt)),
    listPublished(orgId),
  ]);
  const oppIds = [...new Set([...pubs.map((p) => p.opportunityId), ...exportsRows.map((r) => r.opp.id)].filter(Boolean) as string[])];
  const opps = oppIds.length ? await db.select().from(s.opportunities).where(inArray(s.opportunities.id, oppIds)) : [];
  const oppBy = new Map(opps.map((o) => [o.id, o]));
  const exportsBy = new Map<string, string[]>();
  for (const r of exportsRows) exportsBy.set(r.opp.id, [...(exportsBy.get(r.opp.id) ?? []), channelLabel(r.pub.channel)]);

  // one card per clip: fan-app publication first, then clips that were only exported
  const cards = [
    ...pubs.map((p) => ({ oppId: p.opportunityId!, state: p.state, at: p.updatedAt })),
    ...[...exportsBy.keys()].filter((id) => !pubs.some((p) => p.opportunityId === id)).map((id) => ({ oppId: id, state: "exported", at: exportsRows.find((r) => r.opp.id === id)!.pub.publishedAt ?? new Date() })),
  ].filter((c) => oppBy.has(c.oppId));

  return (
    <Shell ctx={ctx} active="published">
      <PageHead title="Published" sub="Live in the fan app, or recorded as a simulated export. Nothing is posted to real social accounts." />
      {cards.length === 0 ? (
        <div className="panel px-8 py-16 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Nothing published yet.</p>
          <p className="mt-1">Approve a clip, then publish it from its Fan app tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {cards.map((c) => {
            const o = oppBy.get(c.oppId)!;
            const drafts = Object.values(o.draftPaths as Record<string, string>);
            const poster = [...Object.values((o.finalPaths ?? {}) as Record<string, string>), ...drafts].find(still);
            const ex = exportsBy.get(o.id) ?? [];
            const where = [c.state === "published" ? "Fan app" : null, ...ex.map((x) => `${x} (simulated)`)].filter(Boolean).join(" · ");
            return (
              <article key={o.id} className="panel overflow-hidden">
                {poster ? <Image src={poster} alt="" width={520} height={650} unoptimized className="block aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] bg-secondary" />}
                <div className="p-3">
                  <p className="font-semibold">{titleCase(o.headline)}</p>
                  <p className="mb-2 mt-0.5 text-xs text-ink-3">{where || "Fan app"} · {ago(c.at)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.state === "published" && <span className="pill dot tone-green">Live in fan app</span>}
                    {c.state === "withdrawn" && <span className="pill dot tone-red">Withdrawn</span>}
                    {ex.length > 0 && <span className="pill dot tone-violet">Simulated export</span>}
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Link href={`/?org=${orgId}&opp=${o.id}&tab=fan`} className="inline-flex h-7 items-center rounded-md border border-border bg-card px-2.5 text-xs font-semibold shadow-xs hover:bg-secondary">View</Link>
                    {c.state === "published" && <WithdrawButton opportunityId={o.id} />}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
