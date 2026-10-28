"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Play, Image as ImageIcon, X, Check, Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { libraryAssets, librarySearch, makeLibraryClip, type LibraryAsset, type LibraryHit } from "@/lib/library-page";

type Collection = { key: string; name: string; kind: "video" | "photo"; group: string; count: number; searchable: number };
const fmt = (s: number) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
const title = (a: LibraryAsset) => (a.kind === "photo" ? a.caption || "Untitled photo" : a.name.replace(/\.(mp4|mov)$/i, "").replace(/_/g, " "));

/**
 * The club's ScorePlay library: collections down the left (what the club holds, grouped), a big TwelveLabs search on
 * top ("describe the moment"), every asset in a grid with Make clip. Search hits open AT the moment.
 */
export function LibraryBrowser({ orgId, clubName, collections, indexLabel, suggestions, active, initial, initialHasMore, initialQuery }: {
  orgId: string; clubName: string; collections: Collection[]; indexLabel: string; suggestions: string[]; active: string | null;
  initial: LibraryAsset[]; initialHasMore: boolean; initialQuery: string;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<"all" | "video" | "photo">("all");
  const [q, setQ] = useState(initialQuery);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<LibraryHit[] | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [sel, setSel] = useState<{ asset: LibraryAsset; hit?: LibraryHit } | null>(null);
  const [made, setMade] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [searching, startSearch] = useTransition();
  const total = collections.reduce((n, c) => n + c.count, 0);
  const activeCol = collections.find((c) => c.key === active) ?? null;
  const qs = (col: string | null) => `/library?org=${orgId}${col ? `&col=${encodeURIComponent(col)}` : ""}`;

  const runSearch = (text: string) => {
    const t = text.trim();
    setQ(t); setQuery(t); setSel(null); setSearchErr(null);
    if (!t) { setHits(null); return; }
    startSearch(async () => {
      const r = await librarySearch(orgId, t);
      if (r.ok) setHits(r.hits); else { setHits([]); setSearchErr(r.error); }
    });
  };
  const loadMore = () => start(async () => {
    const r = await libraryAssets(orgId, active, page + 1);
    setAssets((a) => [...a, ...r.assets]); setHasMore(r.hasMore); setPage((p) => p + 1);
  });
  const keyOf = (a: LibraryAsset, h?: LibraryHit) => `${a.id}@${h ? h.start : "all"}`;
  const make = (a: LibraryAsset, h?: LibraryHit) => start(async () => {
    const r = await makeLibraryClip(orgId, { id: a.id, kind: a.kind, name: a.name, caption: a.caption, collection: a.collection, durationSec: a.durationSec }, h ? { start: h.start, end: h.end } : undefined);
    setToast({ ok: r.ok, text: r.ok ? r.message : r.error });
    if (r.ok) { setMade((m) => new Set(m).add(keyOf(a, h))); router.refresh(); }
    setTimeout(() => setToast(null), 5000);
  });

  const shown = hits ? hits : assets.filter((a) => kind === "all" || a.kind === kind).map((a) => ({ asset: a, start: 0, end: 0, rank: 0, plain: true }));
  const groups = [...new Set(collections.map((c) => c.group))];

  return (
    <div className="grid h-full min-h-0 grid-cols-[232px_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[10px] border border-border bg-card" style={{ boxShadow: "var(--shadow-panel)" }}>
      {/* collections rail */}
      <aside className="min-h-0 overflow-y-auto border-r border-border px-2.5 py-3.5" aria-label="ScorePlay collections">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">ScorePlay collections</p>
        <Link href={qs(null)} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px]", !active ? "bg-[var(--selected)] font-semibold text-accent-foreground" : "text-ink-2 hover:bg-secondary hover:text-foreground")}>
          Everything<span className="ml-auto text-xs tabular-nums text-ink-3">{total}</span>
        </Link>
        {groups.map((g) => (
          <div key={g}>
            <p className="px-2 pb-1 pt-3 text-xs font-semibold text-ink-3">{g}</p>
            {collections.filter((c) => c.group === g).map((c) => (
              <Link key={c.key} href={qs(c.key)} title={c.kind === "video" ? `${c.searchable} of ${c.count} searchable in TwelveLabs` : "Found by the photographer's caption"}
                className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px]", active === c.key ? "bg-[var(--selected)] font-semibold text-accent-foreground" : "text-ink-2 hover:bg-secondary hover:text-foreground")}>
                <span className={cn("size-1.5 shrink-0 rounded-full", c.kind === "photo" || c.searchable ? "bg-primary" : "border border-ink-4")} aria-hidden />
                <span className="truncate">{c.name}</span><span className="ml-auto text-xs tabular-nums text-ink-3">{c.count}</span>
              </Link>
            ))}
          </div>
        ))}
        <p className="mx-2 mt-4 text-[11.5px] leading-relaxed text-ink-3">A dot means you can search it with TwelveLabs. Photos are found by the photographer&apos;s caption.</p>
      </aside>

      {/* search + grid */}
      <section className="min-h-0 min-w-0 overflow-y-auto px-6 pb-10 pt-5">
        <form onSubmit={(e) => { e.preventDefault(); runSearch(q); }} className="relative flex max-w-3xl gap-2" role="search">
          <Search size={19} className="pointer-events-none absolute left-3.5 top-3.5 text-ink-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Describe the moment you want…" aria-label={`Search ${clubName}'s footage with TwelveLabs`}
            className="h-12 flex-1 rounded-[10px] border border-input bg-card pl-11 pr-4 text-[15px] shadow-[var(--shadow-panel)] outline-none focus:border-transparent focus:ring-2 focus:ring-ring" />
          <Button type="submit" size="lg" className="h-12 rounded-[10px] px-5" disabled={searching}>{searching ? <Loader2 className="animate-spin" /> : "Search"}</Button>
        </form>
        <div className="mb-5 mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-ink-3">Try</span>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => runSearch(s)} className="rounded-full border border-border bg-card px-3 py-1 text-[12.5px] text-ink-2 hover:border-primary hover:text-accent-foreground">{s}</button>
          ))}
          <span className="ml-auto text-xs text-ink-3">{indexLabel}</span>
        </div>

        <div className="mb-3.5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.015em]">{hits ? `“${query}”` : activeCol?.name ?? "Everything"}</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">
              {hits
                ? searching ? "Searching the club's footage…" : searchErr ?? `${hits.length} moments from TwelveLabs · each starts at the moment, not the start of the file`
                : activeCol ? `${activeCol.count} ${activeCol.kind === "photo" ? "photos" : "videos"} in ScorePlay${activeCol.kind === "video" ? ` · ${activeCol.searchable} searchable` : ""}`
                : `Videos from every collection · pick a collection for photos`}
            </p>
          </div>
          {hits ? (
            <button type="button" onClick={() => runSearch("")} className="shrink-0 text-[13px] font-semibold text-accent-foreground hover:underline">Clear search</button>
          ) : !activeCol && (
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-border" role="tablist" aria-label="Type">
              {(["all", "video", "photo"] as const).map((k) => (
                <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
                  className={cn("px-3 py-1.5 text-[12.5px] font-medium capitalize", kind === k ? "bg-secondary font-semibold text-foreground" : "text-ink-2", k !== "all" && "border-l border-border")}>{k === "all" ? "All" : k === "video" ? "Video" : "Photos"}</button>
              ))}
            </div>
          )}
        </div>

        {shown.length === 0 && !searching ? (
          <div className="rounded-[10px] border border-dashed border-input px-6 py-14 text-center text-sm text-ink-3">
            {hits ? "No moments matched. Try different words, or browse a collection on the left." : "Nothing of this type here."}
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5" aria-label="Assets">
            {shown.map((row) => {
              const a = row.asset; const h = "plain" in row ? undefined : (row as LibraryHit);
              const k = keyOf(a, h);
              const done = made.has(k) || (!h && a.clipped);
              const canMake = (a.kind === "photo" || a.searchable) && a.collection !== "Full Match";
              return (
                <li key={k}>
                  <article onClick={() => setSel({ asset: a, hit: h })}
                    className={cn("flex h-full cursor-pointer flex-col overflow-hidden rounded-[10px] border bg-card transition-[border-color,box-shadow]", sel && keyOf(sel.asset, sel.hit) === k ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-[#c7d2fe] hover:shadow-sm")}>
                    <Thumb asset={a} hit={h} />
                    <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-2.5">
                      <p className="line-clamp-2 min-h-[35px] text-[13px] font-semibold leading-snug" title={title(a)}>{title(a)}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.kind === "video" ? (a.searchable ? <span className="pill tone-blue">Searchable</span> : <span className="pill tone-gray" title="Not in this club's TwelveLabs index">Not indexed</span>) : <span className="pill tone-gray">Photo</span>}
                        <span className="truncate text-[11.5px] text-ink-3">{a.collection}{h ? ` · hit #${h.rank}` : ""}</span>
                      </div>
                      <div className="mt-auto pt-1">
                        {done ? <span className="inline-flex h-7 items-center gap-1 rounded-md bg-[var(--success-bg,#ecfdf3)] px-2.5 text-[12.5px] font-semibold text-success-fg"><Check size={14} /> In the inbox</span>
                          : canMake ? <Button size="sm" className="h-7" disabled={pending} onClick={(e) => { e.stopPropagation(); make(a, h); }}>Make clip</Button>
                          : <span className="text-[11.5px] text-ink-4">{a.collection === "Full Match" ? "Clip it on Live match" : "Not searchable yet"}</span>}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        {!hits && hasMore && (
          <div className="mt-5 text-center"><Button variant="outline" size="sm" disabled={pending} onClick={loadMore}>{pending ? <Loader2 className="animate-spin" /> : null} Load more</Button></div>
        )}
      </section>

      {/* detail drawer */}
      {sel && <Drawer sel={sel} made={made.has(keyOf(sel.asset, sel.hit)) || (!sel.hit && sel.asset.clipped)} pending={pending} onClose={() => setSel(null)} onMake={() => make(sel.asset, sel.hit)} />}

      {toast && (
        <div role="status" className={cn("fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-[13px] text-white shadow-lg", toast.ok ? "bg-[#111827]" : "bg-[var(--danger)]")}>
          {toast.text}{toast.ok && <Link href={`/?org=${orgId}`} className="ml-3 font-semibold underline">Open inbox</Link>}
        </div>
      )}
    </div>
  );
}

function Thumb({ asset, hit, big = false }: { asset: LibraryAsset; hit?: LibraryHit; big?: boolean }) {
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-[#111827]", big && "rounded-lg")}>
      {asset.thumb
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={asset.thumb} alt="" loading="lazy" className="size-full object-cover" />
        : <span className="absolute inset-0 grid place-items-center text-white/40">{asset.kind === "photo" ? <ImageIcon /> : <Play />}</span>}
      {hit && <span className="absolute bottom-2 left-2 rounded bg-primary px-1.5 text-[11px] font-semibold leading-[18px] text-white tabular-nums">{fmt(hit.start)}–{fmt(hit.end)}</span>}
      <span className="absolute bottom-2 right-2 rounded bg-black/65 px-1.5 text-[11px] font-semibold leading-[18px] text-white tabular-nums">{asset.kind === "video" ? fmt(asset.durationSec) : "Photo"}</span>
    </div>
  );
}

function Drawer({ sel, made, pending, onClose, onMake }: { sel: { asset: LibraryAsset; hit?: LibraryHit }; made: boolean; pending: boolean; onClose: () => void; onMake: () => void }) {
  const { asset: a, hit: h } = sel;
  const canMake = (a.kind === "photo" || a.searchable) && a.collection !== "Full Match";
  const s = h ? h.start : 0, e = h ? h.end : Math.min(a.durationSec || 15, 15), L = Math.max(a.durationSec, e, 1);
  const facts: [string, string][] = a.kind === "photo"
    ? [["Type", "Photo"], ["Named from", "The photographer's caption"], ["Rights", "Checked when you make the clip"]]
    : [["Type", "Video"], ["Length", fmt(a.durationSec)], ...(h ? [["Moment", `${fmt(h.start)}–${fmt(h.end)} (search hit #${h.rank})`] as [string, string]] : []), ["TwelveLabs", a.searchable ? "Indexed, searchable" : "Not indexed"], ["Rights", "Checked when you make the clip"]];
  return (
    <aside className="relative min-h-0 w-[340px] overflow-y-auto border-l border-border px-[18px] pb-6 pt-[18px]" aria-label="Asset details">
      <button type="button" onClick={onClose} className="absolute right-2.5 top-2 grid size-8 place-items-center rounded-md text-ink-3 hover:bg-secondary" aria-label="Close"><X size={18} /></button>
      <div className="mb-3.5"><Thumb asset={a} hit={h} big /></div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{a.collection} · ScorePlay {a.id}</p>
      <h3 className="mb-3 mt-1 text-[15px] font-semibold leading-snug">{title(a)}</h3>
      <dl className="mb-3.5 grid grid-cols-[96px_1fr] gap-x-2.5 gap-y-1.5 text-[12.5px]">
        {facts.map(([k, v]) => (<Fragment key={k}><dt className="text-ink-3">{k}</dt><dd>{v}</dd></Fragment>))}
      </dl>
      {a.kind === "video" && (
        <div className="mb-3.5">
          <div className="mb-1.5 flex justify-between text-xs text-ink-2"><span>Clip window</span><span className="tabular-nums">{fmt(s)}–{fmt(e)} of {fmt(a.durationSec)}</span></div>
          <div className="relative h-6 overflow-hidden rounded-md bg-secondary"><div className="absolute inset-y-0 rounded-md border-2 border-primary bg-primary/20" style={{ left: `${(s / L) * 100}%`, width: `${Math.max(2, ((e - s) / L) * 100)}%` }} /></div>
          <p className="mt-1.5 text-[11.5px] text-ink-3">{h ? "Starts at the search hit. Pegasus tightens it to the play; adjust the trim in the Inbox." : "No search yet: Pegasus finds the best moment in the first 15 seconds."}</p>
        </div>
      )}
      {made ? <div className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--success-bg,#ecfdf3)] text-[13px] font-semibold text-success-fg"><Check size={15} /> In the inbox</div>
        : <Button className="h-10 w-full" disabled={!canMake || pending} onClick={onMake}><Clapperboard /> {canMake ? "Make clip" : a.collection === "Full Match" ? "Clip it on Live match" : "Not searchable yet"}</Button>}
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">Runs the normal pipeline: Pegasus checks the moment, rights are screened, and a draft lands in the Inbox for approval. Nothing is published.</p>
    </aside>
  );
}
