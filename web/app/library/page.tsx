import { connection } from "next/server";
import { Shell, shellContext, NoOrg } from "@/components/producer/shell";
import { libraryCollections, libraryAssets } from "@/lib/library-page";
import { LibraryBrowser } from "@/components/producer/library-browser";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const ctx = await shellContext(sp);
  if (!ctx.org) return <NoOrg />;
  const cols = await libraryCollections(ctx.org.id);
  if (!cols) {
    return (
      <Shell ctx={ctx} active="library">
        <p className="py-16 text-center text-sm text-ink-3">This club has no ScorePlay library connected yet.</p>
      </Shell>
    );
  }
  const col = sp.col && cols.collections.some((c) => c.key === sp.col) ? sp.col : null;
  const first = await libraryAssets(ctx.org.id, col, 1);
  return (
    <Shell ctx={ctx} active="library">
      <LibraryBrowser key={`${ctx.org.id}-${col ?? "all"}`} orgId={ctx.org.id} clubName={ctx.org.name} collections={cols.collections} indexLabel={cols.indexLabel}
        suggestions={cols.suggestions} active={col} initial={first.assets} initialHasMore={first.hasMore} initialQuery={sp.q ?? ""} />
    </Shell>
  );
}
