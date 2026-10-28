import Link from "next/link";
import type { FanClip } from "@/lib/fan";

export function FanClipCard({ clip, reasons, orgId, offsetStartSec }: { clip: FanClip; reasons?: string[]; orgId?: string; offsetStartSec?: number }) {
  const params = new URLSearchParams();
  if (orgId) params.set("org", orgId);
  if (offsetStartSec !== undefined) params.set("t", offsetStartSec.toFixed(1));
  const href = `/fan/clips/${clip.versionId}${params.size ? `?${params}` : ""}`;
  return (
    <Link href={href} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card transition-colors hover:border-[var(--clout-blue-tint)]">
      <div className="relative aspect-video bg-black">
        {clip.posterPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.posterPath} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        ) : (
          <div className="absolute inset-0 bg-[var(--clout-carbon-2)]" />
        )}
        {clip.kind === "video" && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            {Math.round(clip.durationSec)}s
          </span>
        )}
        {offsetStartSec !== undefined && (
          <span className="absolute bottom-2 left-2 rounded-full bg-[var(--clout-electric-blue)] px-2 py-0.5 text-[11px] font-semibold text-white">
            Plays from {offsetStartSec.toFixed(0)}s
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className="display line-clamp-2 text-lg" style={{ lineHeight: 1.05 }}>{clip.headline}</p>
        {(clip.playerNames.length > 0 || clip.interestTags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {clip.playerNames.map((p) => (
              <span key={p} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground">{p}</span>
            ))}
            {clip.interestTags.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] capitalize text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
        {reasons && reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span key={r} className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--clout-blue-tint)]">{r}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
