import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { listOrgs, listPublished } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { channelLabel } from "@/lib/channels";


export default async function PublishedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const orgs = await listOrgs();
  const orgId = sp.org && orgs.some((o) => o.id === sp.org) ? sp.org : orgs[0]?.id;
  const org = orgs.find((o) => o.id === orgId);
  const rows = orgId ? await listPublished(orgId) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
          <Link href={`/?org=${orgId ?? ""}`}>
            <ArrowLeft size={14} /> Queue
          </Link>
        </Button>
        <h1 className="display text-2xl">Published — {org?.name ?? "…"}</h1>
      </div>

      {rows.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nothing published yet. Approve an opportunity, then publish a channel from the decision bar.
        </p>
      )}

      <div className="space-y-3">
        {rows.map(({ pub, opp }) => {
          const poster =
            (opp.finalPaths as Record<string, string>)[pub.channel] ??
            (opp.draftPaths as Record<string, string>)[pub.channel] ??
            Object.values(opp.draftPaths as Record<string, string>)[0];
          const copy = (opp.generatedCopy as Record<string, string>)[pub.channel] ?? opp.headline;
          return (
            <div key={pub.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              {poster ? (
                <Image src={poster} alt="" width={160} height={90} unoptimized className="h-[90px] w-40 shrink-0 rounded-md border border-border object-cover" />
              ) : (
                <div className="h-[90px] w-40 shrink-0 rounded-md bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="display truncate text-base">{opp.headline}</p>
                  <Badge variant="secondary" className="text-[10px]">{channelLabel(pub.channel)}</Badge>
                  {pub.externalRef ? (
                    <a
                      href={pub.externalRef}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--clout-blue-tint)] hover:underline"
                    >
                      live <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="rounded-full border border-[rgba(0,163,255,0.45)] bg-[rgba(0,163,255,0.14)] px-2 py-0.5 text-[10px] font-semibold text-[var(--clout-hyper-blue)]">
                      SIMULATED
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{copy || "(no copy on this format)"}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {pub.publishedAt ? new Date(pub.publishedAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
