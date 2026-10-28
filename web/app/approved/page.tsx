import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { and, eq, inArray, desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { Shell, shellContext, PageHead, NoOrg } from "@/components/producer/shell";
import { formatLabel, titleCase } from "@/lib/format";
import type { Compliance } from "@shared/schemas";
import { DESTINATIONS } from "@shared/packaging";

const APPROVED = ["approved", "rendering", "rendered", "exported"];

export default async function ApprovedPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const ctx = await shellContext(await searchParams);
  if (!ctx.org) return <NoOrg />;
  const orgId = ctx.org.id;
  const rows = await db.select().from(s.opportunities).where(and(eq(s.opportunities.orgId, orgId), inArray(s.opportunities.status, APPROVED))).orderBy(desc(s.opportunities.createdAt));
  const pubs = rows.length ? await db.select().from(s.publications).where(inArray(s.publications.opportunityId, rows.map((r) => r.id))) : [];
  const pubBy = new Map(pubs.map((p) => [p.opportunityId, p.state]));

  return (
    <Shell ctx={ctx} active="approved" refresh>
      <PageHead title="Approved" sub="Final renders. Package for channels or publish to the fan app." />
      <div className="panel overflow-hidden">
        <table className="ptable">
          <thead><tr><th>Clip</th><th>Format</th><th>Rights</th><th>Channels</th><th>Fan app</th><th>Final render</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nothing approved yet. Approve a clip from the inbox.</td></tr>}
            {rows.map((o) => {
              const poster = Object.values(o.draftPaths as Record<string, string>)[0];
              const d = (o.delivery ?? {}) as { packaging?: { variants?: Record<string, { status: string }> }; final?: { blockedAt?: string; skipped?: string } };
              const done = Object.values(d.packaging?.variants ?? {}).filter((v) => v.status === "done").length;
              const hasFinal = Object.values((o.finalPaths ?? {}) as Record<string, string>).some(Boolean);
              const final = o.status === "rendering" || (!hasFinal && o.status === "approved") ? ["Rendering", "tone-blue"]
                : d.final?.blockedAt ? ["Blocked at publish check", "tone-red"]
                : o.status === "exported" ? ["Exported", "tone-violet"] : hasFinal ? ["Ready", "tone-green"] : ["Not rendered", "tone-gray"];
              const rights = (o.compliance as Compliance)?.status;
              const pub = pubBy.get(o.id);
              const open = (tab?: string) => `/?org=${orgId}&opp=${o.id}${tab ? `&tab=${tab}` : ""}`;
              return (
                <tr key={o.id}>
                  <td>
                    <Link href={open()} className="flex items-center gap-2.5 font-semibold hover:underline">
                      {poster ? <Image src={poster} alt="" width={36} height={46} unoptimized className="h-[46px] w-9 rounded object-cover" /> : <span className="h-[46px] w-9 rounded bg-secondary" />}
                      {titleCase(o.headline)}
                    </Link>
                  </td>
                  <td className="text-ink-3">{formatLabel(o.contentType)}</td>
                  <td>{rights === "cleared" ? <span className="pill dot tone-green">Cleared</span> : rights === "restricted" ? <span className="pill dot tone-gray">Owned channels only</span> : <span className="pill dot tone-red">{rights ?? "Unknown"}</span>}</td>
                  <td><span className={`pill ${done ? "tone-green" : "tone-gray"}`}>{done ? `${done} of ${DESTINATIONS.length} ready` : "None yet"}</span></td>
                  <td>{pub === "published" ? <span className="pill dot tone-green">Live</span> : pub === "withdrawn" ? <span className="pill dot tone-red">Withdrawn</span> : <span className="pill tone-gray">Not published</span>}</td>
                  <td><span className={`pill dot ${final[1]}`}>{final[0]}</span></td>
                  <td className="text-right">
                    <Link href={open("channels")} className="mr-1.5 inline-flex h-7 items-center rounded-md border border-border bg-card px-2.5 text-xs font-semibold shadow-xs hover:bg-secondary">Package</Link>
                    <Link href={open("fan")} className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">{pub === "published" ? "Manage" : "Publish"}</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
