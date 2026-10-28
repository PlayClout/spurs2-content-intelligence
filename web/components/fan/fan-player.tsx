"use client";

import { useRef } from "react";

export function FanPlayer({ src, poster, kind, startAt, title }: { src: string; poster: string | null; kind: "video" | "photo"; startAt: number; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  if (kind === "photo") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={title} className="w-full rounded-[var(--radius-lg)] border border-border" />;
  }
  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      onLoadedMetadata={() => { if (ref.current && startAt > 0) ref.current.currentTime = startAt; }}
      className="aspect-video w-full rounded-[var(--radius-lg)] border border-border bg-black"
    />
  );
}
