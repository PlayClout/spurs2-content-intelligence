import { connection } from "next/server";
import { fanSearch, resolveFanOrg } from "@/lib/fan";
import { FanClipCard } from "@/components/fan/fan-clip-card";

const MODE_LABEL: Record<string, string> = {
  ai: "Video search by TwelveLabs, across published clips only",
  metadata_fallback: "Video search unavailable: showing a keyword match on clip titles and tags (not AI search)",
  no_catalog: "Keyword match on published clips (none are indexed for video search yet)",
};

export default async function FanSearch({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 200);
  const { org } = await resolveFanOrg(sp.org);
  const res = org && q ? await fanSearch(org.id, q) : null;

  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">Search clips</h1>
      <form role="search" className="flex gap-2">
        {sp.org && <input type="hidden" name="org" value={sp.org} />}
        <label htmlFor="q" className="sr-only">Describe the moment</label>
        <input
          id="q" name="q" defaultValue={q} placeholder="e.g. Solanke goal, crowd celebrating"
          className="min-h-12 flex-1 rounded-full border border-input bg-secondary px-5 text-base outline-none focus:border-[var(--clout-blue-tint)]"
        />
        <button type="submit" className="min-h-12 rounded-full bg-[var(--clout-electric-blue)] px-6 font-semibold text-white">Search</button>
      </form>
      <p className="text-xs text-muted-foreground">Searches only clips the club has published. Raw match footage is never searchable here.</p>

      {res && res.mode !== "empty" && (
        <>
          <p className="text-xs font-semibold text-[var(--clout-blue-tint)]">{MODE_LABEL[res.mode]}</p>
          {res.results.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-12 text-center">
              <p className="display text-xl">No matching clips</p>
              <p className="mt-2 text-sm text-muted-foreground">Try a player name or a moment like &ldquo;goal&rdquo; or &ldquo;crowd&rdquo;.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {res.results.map((c) => (
                <FanClipCard key={c.versionId} clip={c} orgId={sp.org} offsetStartSec={"offsetStartSec" in c ? c.offsetStartSec : undefined} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
