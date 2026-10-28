"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Pause, Play, Square, Volume2, VolumeX, Clapperboard, Search, Sparkles, CircleSlash, Flag, Film, AlertTriangle, RotateCcw, RotateCw, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { liveDesk, startLive, setLivePaused, endLive, refreshLiveStream, restartLive, type LiveDesk } from "@/lib/live";
import { clockAt, scoreAt, liveEdge, periodAt, dvrSeek, isAtLive, behindLabel, SCAN_EVERY_SEC, type LiveLogEntry } from "@shared/live-match";
import { statusTone, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const POLL_MS = 2000;
const DRIFT_SEC = 3; // re-sync the player when it drifts more than this from the live edge

/** Live match desk: the real full match streams from ScorePlay as if live, and the engine works on it in step. */
export function LiveDeskView({ orgId, initial }: { orgId: string; initial: LiveDesk }) {
  const [desk, setDesk] = useState(initial);
  const [skew, setSkew] = useState(0); // server clock - browser clock
  // first render uses the server's clock so the hydrated text (clock, score) matches what the server drew
  const [now, setNow] = useState(() => initial.serverNow);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const poll = useCallback(async () => {
    const t0 = Date.now();
    const d = await liveDesk(orgId);
    setSkew(d.serverNow - (t0 + Date.now()) / 2);
    setDesk(d);
  }, [orgId]);
  useEffect(() => {
    const id = setInterval(() => { void poll().catch(() => undefined); }, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    const r = await fn();
    setErr(r.ok ? null : r.error ?? "Failed");
    await poll();
  });

  const ses = desk.session && desk.session.status !== "ended" ? desk.session : null;
  if (!ses) return <StartPanel desk={desk} pending={pending} err={err} onStart={(sec) => act(() => startLive(orgId, sec))} />;

  const edge = liveEdge(ses, now + skew, desk.match.durationSec);
  // fits the screen: stream + timeline stay put, the clips list and the engine log scroll inside their own panels
  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_380px] grid-rows-[minmax(0,1fr)] gap-4">
      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        <DvrDesk key={ses.id} desk={desk} session={ses} edge={edge} pending={pending}
          onStreamError={() => act(refreshLiveStream)}
          onPauseMatch={() => act(() => setLivePaused(ses.status !== "paused"))}
          onRestart={(sec) => { if (confirm(`Restart the match from ${clockAt(desk.match, sec).minute}? Clips from earlier live runs that you have not approved or rejected are cleared; everything else stays.`)) act(() => restartLive(orgId, sec)); }}
          onEnd={() => { if (confirm("End the live match? Clips already made stay in the inbox.")) act(endLive); }} />
        {err && <p className="text-xs text-danger-fg" role="alert">{err}</p>}
        <ClipsPanel desk={desk} orgId={orgId} />
      </div>
      <EnginePanel desk={desk} edge={edge} paused={ses.status === "paused"} />
    </div>
  );
}

/** The viewer's own playhead (DVR) over the live session. `watching` is what the producer sees; `edge` is live, and the
 * engine always works on the edge. Following = glued to the edge; otherwise the producer has paused or rewound. */
function DvrDesk({ desk, session, edge, pending, onStreamError, onPauseMatch, onRestart, onEnd }: {
  desk: LiveDesk; session: NonNullable<LiveDesk["session"]>; edge: number; pending: boolean;
  onStreamError: () => void; onPauseMatch: () => void; onRestart: (sec: number) => void; onEnd: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [following, setFollowing] = useState(true);
  const [viewPaused, setViewPaused] = useState(false);
  const [watching, setWatching] = useState(edge);
  const matchPaused = session.status === "paused";
  const seek = useCallback((sec: number) => {
    const t = dvrSeek(sec, edge);
    setFollowing(isAtLive(t, edge));
    setWatching(t);
    if (ref.current) ref.current.currentTime = t;
  }, [edge]);
  const goLive = useCallback(() => { setFollowing(true); setViewPaused(false); setWatching(edge); if (ref.current) ref.current.currentTime = edge; }, [edge]);
  const togglePlay = useCallback(() => {
    if (matchPaused) return onPauseMatch(); // the whole match is paused: resume it
    if (!viewPaused) { setWatching(ref.current?.currentTime ?? edge); setFollowing(false); }
    setViewPaused((p) => !p);
  }, [matchPaused, onPauseMatch, viewPaused, edge]);

  // following: stay on the edge (the engine and the screen show the same second; `watching` is read as `edge` then).
  // Rewound: play on from there; catching up to the edge = following again (handled in onTime, from the video itself)
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (following && Math.abs(v.currentTime - edge) > DRIFT_SEC) v.currentTime = edge;
    if (!following && v.currentTime > edge) v.currentTime = edge;
    const stop = matchPaused || viewPaused;
    if (stop && !v.paused) v.pause();
    if (!stop && v.paused) void v.play().catch(() => undefined);
  }, [edge, following, matchPaused, viewPaused]);
  const onTime = (t: number) => {
    if (following) return;
    if (!viewPaused && !matchPaused && t >= edge - 0.5) { setFollowing(true); return; }
    setWatching(t);
  };

  // keyboard: space play/pause, J/L or arrows 10s back/forward, Shift+L or End = live. Never while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select,[contenteditable]")) return;
      const at = ref.current?.currentTime ?? watching;
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowLeft" || e.key === "j") { e.preventDefault(); seek(at - 10); }
      else if ((e.key === "ArrowRight" || e.key === "l") && !e.shiftKey) { e.preventDefault(); seek(at + 10); }
      else if (e.key === "End" || (e.key === "L" && e.shiftKey)) { e.preventDefault(); goLive(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goLive, seek, togglePlay, watching]);

  return (
    <>
      <Player desk={desk} session={session} videoRef={ref} watching={following ? edge : watching} edge={edge} following={following}
        viewPaused={viewPaused} onTime={onTime} onReady={(v) => { v.currentTime = edge; }}
        onStreamError={onStreamError} onGoLive={goLive} />
      <Controls desk={desk} edge={edge} watching={following ? edge : watching} following={following} paused={matchPaused || viewPaused}
        matchPaused={matchPaused} pending={pending} onPlayPause={togglePlay} onSeek={seek} onGoLive={goLive}
        onPauseMatch={onPauseMatch} onRestart={onRestart} onEnd={onEnd} />
    </>
  );
}

// ── not live: pick where the match starts ─────────────────────────────────────────────
function StartPanel({ desk, pending, err, onStart }: { desk: LiveDesk; pending: boolean; err: string | null; onStart: (sec: number) => void }) {
  const m = desk.match;
  const [pick, setPick] = useState(m.joinPresets[0].videoSec);
  const ended = desk.session?.status === "ended";
  return (
    <div className="mx-auto max-w-[760px] space-y-4 pt-4">
      <section className="panel p-6" aria-label="Start a live match">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Radio size={22} aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{m.competitionLabel}</p>
            <h2 className="mt-0.5 text-xl font-semibold">{m.home.name} v {m.away.name}</h2>
            <p className="mt-1 text-[13px] text-ink-2">
              The full broadcast streams from ScorePlay as if it were live. While it plays, the engine watches it with TwelveLabs and
              puts clips in your inbox a few seconds after each moment airs.
            </p>
          </div>
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 text-[13px] font-semibold">Join the match at</legend>
          <div className="grid grid-cols-2 gap-2">
            {m.joinPresets.map((p) => (
              <label key={p.videoSec} className={cn("flex cursor-pointer gap-3 rounded-lg border px-3.5 py-3", pick === p.videoSec ? "border-primary bg-accent" : "border-border hover:bg-subtle")}>
                <input type="radio" name="join" className="mt-1 accent-[var(--primary)]" checked={pick === p.videoSec} onChange={() => setPick(p.videoSec)} />
                <span>
                  <span className="block text-[14px] font-semibold">{p.label}</span>
                  <span className="block text-xs text-ink-3">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex items-center gap-3">
          <Button size="lg" disabled={pending} onClick={() => onStart(pick)}><Radio /> Go live</Button>
          {!desk.engineOk && <span className="text-xs text-ink-3">The live engine starts working as soon as it is running (<code className="rounded bg-secondary px-1">npm run live</code>).</span>}
        </div>
        {err && <p className="mt-3 text-xs text-danger-fg" role="alert">{err}</p>}
      </section>
      <p className="px-1 text-xs text-ink-4">
        Source: ScorePlay media {m.scorePlayMediaId} (full match, {Math.round(m.durationSec / 60)} min). Match data (kick-off, goals) is a replay of
        what happened in this match; everything the engine finds and clips is decided live on the footage.
        {ended && desk.clips.length > 0 && ` Your last session made ${new Set(desk.clips.map((c) => c.at)).size} clips; they are in the inbox.`}
      </p>
    </div>
  );
}

// ── the stream ────────────────────────────────────────────────────────────────────────
function Player({ desk, session, videoRef, watching, edge, following, viewPaused, onTime, onReady, onStreamError, onGoLive }: {
  desk: LiveDesk; session: NonNullable<LiveDesk["session"]>; videoRef: React.RefObject<HTMLVideoElement | null>;
  watching: number; edge: number; following: boolean; viewPaused: boolean;
  onTime: (t: number) => void; onReady: (v: HTMLVideoElement) => void; onStreamError: () => void; onGoLive: () => void;
}) {
  const [muted, setMuted] = useState(true); // browsers only autoplay muted video
  const [ready, setReady] = useState(false);
  // the server-rendered <video> starts loading before React attaches its handlers: catch an error or metadata that
  // arrived first, so a dead link still gets refreshed and a fast load still counts as ready
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.error) onStreamError();
    else if (v.readyState >= 1) { onReady(v); setReady(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.stream?.url]);
  const matchPaused = session.status === "paused";
  const m = desk.match;
  // the scorebug shows the moment ON SCREEN (rewound to 10' = the 10' score), the badge says how far behind live
  const clock = clockAt(m, watching);
  const score = scoreAt(m.feed, watching);
  const period = periodAt(m, watching);
  const behind = !following && !isAtLive(watching, edge);
  return (
    <section className="panel shrink-0 overflow-hidden" aria-label="Match stream">
      <div className="relative mx-auto aspect-video max-h-[52vh] bg-black">
        {session.stream?.url && (
          <video ref={videoRef} src={session.stream.url} muted={muted} playsInline preload="auto" className="size-full"
            onLoadedMetadata={(e) => { onReady(e.currentTarget); setReady(true); }}
            onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
            onError={onStreamError} aria-label={`${m.home.name} v ${m.away.name}, ${behind ? "replaying" : "live"}`} />
        )}
        {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-white/70">Connecting to the ScorePlay stream…</div>}
        <div className="absolute left-3 top-3 flex items-center gap-2" aria-live="polite">
          {matchPaused ? (
            <span className="rounded bg-black/70 px-2 py-1 text-[11px] font-bold tracking-wide text-white">MATCH PAUSED</span>
          ) : behind ? (
            <button type="button" onClick={onGoLive} title="Jump back to the live edge"
              className="flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 text-[11px] font-bold tracking-wide text-white hover:bg-black/85" data-testid="dvr-behind">
              <span className="size-1.5 rounded-full bg-white/50" aria-hidden />
              {viewPaused ? "PAUSED" : "REPLAY"} <span className="font-semibold tabular-nums text-white/80">{behindLabel(watching, edge)}</span>
            </button>
          ) : viewPaused ? (
            <span className="rounded bg-black/70 px-2 py-1 text-[11px] font-bold tracking-wide text-white">PAUSED</span>
          ) : (
            <span className="live-badge rounded bg-[var(--danger)] px-2 py-1 text-[11px] font-bold tracking-wide text-white">LIVE</span>
          )}
          <span className="flex items-center gap-2 rounded bg-black/70 px-2.5 py-1 text-[13px] font-semibold text-white tabular-nums" data-testid="live-scorebug">
            {m.home.short} <span className="text-[15px]">{score.home} – {score.away}</span> {m.away.short}
            <span className="ml-1 border-l border-white/30 pl-2">{clock.running ? clock.label : period.label}</span>
          </span>
        </div>
        <button type="button" onClick={() => setMuted((x) => !x)} className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label={muted ? "Unmute" : "Mute"}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
      </div>
    </section>
  );
}

// ── timeline + controls ───────────────────────────────────────────────────────────────
export function Controls({ desk, edge, watching, following, paused, matchPaused, pending, onPlayPause, onSeek, onGoLive, onPauseMatch, onRestart, onEnd }: {
  desk: LiveDesk; edge: number; watching: number; following: boolean; paused: boolean; matchPaused: boolean; pending: boolean;
  onPlayPause: () => void; onSeek: (sec: number) => void; onGoLive: () => void; onPauseMatch: () => void; onRestart: (sec: number) => void; onEnd: () => void;
}) {
  const m = desk.match;
  const pct = (v: number) => `${((v / m.durationSec) * 100).toFixed(3)}%`;
  const clipsByAt = useMemo(() => [...new Map(desk.clips.map((c) => [c.at, c])).values()], [desk.clips]);
  const goals = m.feed.filter((e) => e.type === "goal");
  const atLive = following || isAtLive(watching, edge);
  const barRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const secAt = (clientX: number) => {
    const r = barRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * m.durationSec;
  };
  // drag to scrub; the bar beyond the live edge has not aired, so it is not a target
  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeek(secAt(e.clientX));
  };
  const hoverSec = hover === null ? null : Math.min(hover, edge);
  // a 3-column grid: the phase labels sit in the bar's own column, so they stay under the right points whatever
  // the buttons say (Pause / Play change width)
  return (
    <section className="panel shrink-0 px-4 py-3" aria-label="Match timeline">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={pending} onClick={onPlayPause} aria-label={paused ? "Play" : "Pause"} title={paused ? "Play (space)" : "Pause (space)"}>
            {paused ? <Play className="fill-current" /> : <Pause />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onSeek(watching - 10)} aria-label="Back 10 seconds" title="Back 10s (←)"><RotateCcw /></Button>
          <Button variant="ghost" size="sm" disabled={atLive} onClick={() => onSeek(watching + 10)} aria-label="Forward 10 seconds" title="Forward 10s (→)"><RotateCw /></Button>
        </div>
        <div ref={barRef} className="relative h-8 cursor-pointer touch-none select-none" role="slider" tabIndex={0}
          aria-label="Match timeline: drag to rewind" aria-valuemin={0} aria-valuemax={Math.round(edge)} aria-valuenow={Math.round(watching)}
          aria-valuetext={`${clockAt(m, watching).minute}${atLive ? ", live" : `, ${behindLabel(watching, edge)} behind live`}. ${goals.length} goals, ${clipsByAt.length} clips`}
          onPointerDown={onDown} onPointerMove={(e) => { setHover(secAt(e.clientX)); if (e.buttons === 1) onSeek(secAt(e.clientX)); }} onPointerLeave={() => setHover(null)}>
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-secondary">
            {m.periods.filter((p) => p.id === "HT").map((p) => {
              const next = m.periods.find((x) => x.from > p.from)?.from ?? m.durationSec;
              return <div key={p.id} className="absolute inset-y-0 bg-border" style={{ left: pct(p.from), width: pct(next - p.from) }} />;
            })}
            {/* aired = can be rewound into; watched = up to the playhead */}
            <div className="absolute inset-y-0 left-0 bg-primary/25" style={{ width: pct(edge) }} data-testid="dvr-aired" />
            <div className="absolute inset-y-0 left-0 bg-primary/70" style={{ width: pct(watching) }} />
          </div>
          {goals.map((g) => (
            <span key={g.id} title={`${clockAt(m, g.at).minute} ${g.text}`} className="absolute top-0 h-2.5 w-px -translate-x-1/2 bg-foreground" style={{ left: pct(g.at) }} aria-hidden>
              <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full border-[1.5px] border-foreground bg-card" />
            </span>
          ))}
          {clipsByAt.map((c) => (
            <span key={c.at} title={`${clockAt(m, c.at).minute} ${c.label}`} className="absolute bottom-0 size-2 -translate-x-1/2 rounded-full bg-primary ring-2 ring-card" style={{ left: pct(c.at) }} aria-hidden />
          ))}
          {/* the live edge (thin red line) and the playhead (the knob) separate when rewound */}
          <span className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-[var(--danger)]" style={{ left: pct(edge) }} aria-hidden data-testid="dvr-edge" />
          <span className={cn("absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow", atLive ? "bg-[var(--danger)]" : "bg-foreground")} style={{ left: pct(watching) }} aria-hidden />
          {hoverSec !== null && (
            <span className="pointer-events-none absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background tabular-nums" style={{ left: pct(hoverSec) }} aria-hidden>
              {clockAt(m, hoverSec).minute}{hover! > edge ? " · not aired yet" : ""}
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-1">
          <span className="w-14 text-right text-[13px] font-semibold tabular-nums">{clockAt(m, watching).minute}</span>
          <Button variant={atLive ? "ghost" : "outline"} size="sm" disabled={atLive} onClick={onGoLive} title="Jump to the live edge (End)" data-testid="go-live"
            className={cn(!atLive && "border-[var(--danger)] text-danger-fg")}>
            <span className="size-1.5 rounded-full bg-[var(--danger)]" aria-hidden /> {atLive ? "Live" : "Go live"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMenu((x) => !x)} aria-label="Match controls" aria-expanded={menu}><MoreHorizontal /></Button>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-64 rounded-lg border border-border bg-card p-1.5 shadow-lg" role="menu" onMouseLeave={() => setMenu(false)}>
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">Restart the match from</p>
              {m.joinPresets.map((p) => (
                <button key={p.videoSec} role="menuitem" type="button" disabled={pending} onClick={() => { setMenu(false); onRestart(p.videoSec); }}
                  className="flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-secondary">
                  <RotateCcw size={13} className="shrink-0 translate-y-0.5 text-ink-3" aria-hidden /><span className="font-semibold">{p.label}</span><span className="truncate text-xs text-ink-3">{p.hint}</span>
                </button>
              ))}
              <div className="my-1.5 h-px bg-border" role="separator" />
              <p className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">This match</p>
              <button role="menuitem" type="button" disabled={pending} onClick={() => { setMenu(false); onPauseMatch(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-secondary">
                {matchPaused ? <Play size={13} className="fill-current" /> : <Pause size={13} />} {matchPaused ? "Resume the match" : "Pause the match (engine too)"}
              </button>
              <button role="menuitem" type="button" disabled={pending} onClick={() => { setMenu(false); onEnd(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-secondary">
                <Square size={13} /> End the match
              </button>
            </div>
          )}
        </div>
        <span aria-hidden />
        <div className="relative h-4 text-[10.5px] text-ink-4" aria-hidden>
          {m.periods.filter((p) => p.id === "1H" || p.id === "2H" || p.id === "FT").map((p) => (
            <span key={p.id} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(p.from) }}>{p.id === "1H" ? "Kick-off" : p.id === "2H" ? "2nd half" : "Full time"}</span>
          ))}
        </div>
        <span aria-hidden />
      </div>
    </section>
  );
}

// ── clips this match produced ─────────────────────────────────────────────────────────
export function ClipsPanel({ desk, orgId }: { desk: LiveDesk; orgId: string }) {
  const m = desk.match;
  const reels = desk.clips.filter((c) => c.contentType === "reel");
  return (
    <section className="panel flex min-h-0 flex-1 flex-col" aria-label="Clips from this match">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold">Clips from this match</h2>
        <span className="text-xs text-ink-3">{reels.length ? `${reels.length} so far · each also has a photo card` : ""}</span>
        <Link href={`/?org=${orgId}`} className="ml-auto text-[13px] font-semibold text-accent-foreground hover:underline">Open inbox</Link>
      </div>
      {reels.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-3">
          Nothing yet. Clips appear here, and in your inbox, a few seconds after a moment airs{desk.pending ? " (a goal is being cut now)" : ""}.
        </p>
      ) : (
        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2 overflow-y-auto p-3">
          {reels.map((c) => {
            const [label, tone] = statusTone(c.status);
            return (
              <li key={c.id}>
                <Link href={`/?org=${orgId}&opp=${c.id}`} className="group flex gap-3 rounded-lg border border-border p-2 hover:bg-subtle">
                  <div className="relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {c.poster && <Image src={c.poster} alt="" fill unoptimized className="object-cover" />}
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className="text-xs font-semibold tabular-nums text-ink-3">{clockAt(m, c.at).minute} · {c.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-snug group-hover:text-accent-foreground">{titleCase(c.headline)}</p>
                    <span className={cn("pill dot mt-1.5", tone)}>{label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ── what the engine is doing ──────────────────────────────────────────────────────────
const LOG_ICON: Record<LiveLogEntry["kind"], typeof Flag> = { feed: Flag, scan: Search, clip: Film, skip: CircleSlash, error: AlertTriangle };
const LOG_TONE: Record<LiveLogEntry["kind"], string> = { feed: "text-ink-2", scan: "text-accent-foreground", clip: "text-success-fg", skip: "text-ink-4", error: "text-danger-fg" };

/** `replay`: the desk is replaying a recorded live session (hosted demo), not driving the live engine. */
export function EnginePanel({ desk, edge, paused, replay }: { desk: LiveDesk; edge: number; paused: boolean; replay?: { recordedOn: string } }) {
  const m = desk.match;
  const inPlay = ["1H", "2H"].includes(periodAt(m, edge).id);
  const nextScan = desk.lastScanAt === null ? 0 : Math.max(0, Math.ceil(desk.lastScanAt + SCAN_EVERY_SEC - edge));
  const watching = paused ? "Paused" : !inPlay ? "Resting (ball not in play)" : `Looking for saves, chances and woodwork · next look in ${nextScan}s`;
  const rows: [string, React.ReactNode, boolean][] = replay ? [
    ["Venue broadcast", "Full match, worked live on " + replay.recordedOn + " (the feed is not redistributed in this demo)", true],
    ["Match data", "Kick-off, goals and full time from this match", true],
    ["TwelveLabs watch-list", watching, true],
    ["Pegasus check", `Watches each find and keeps only real highlights for ${m[m.clubSide].name}`, true],
  ] : [
    ["ScorePlay stream", `Full match, streaming at ${desk.session?.stream?.quality ?? "720p"}`, true],
    ["Match data", "Kick-off, goals and full time from this match", true],
    ["TwelveLabs watch-list", !desk.engineOk ? "Waiting for the live engine" : watching, desk.engineOk],
    ["Pegasus check", `Watches each find and keeps only real highlights for ${m[m.clubSide].name}`, desk.engineOk],
  ];
  return (
    <aside className="panel flex h-full min-h-0 flex-col overflow-hidden" aria-label="Live engine">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold">Live engine</h2>
        {replay ? (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-success-fg"><span className="status-dot ok" />{paused ? "Replay paused" : "Replaying"}</span>
        ) : (
          <span className={cn("ml-auto flex items-center gap-1.5 text-xs font-semibold", desk.engineOk ? "text-success-fg" : "text-danger-fg")}>
            <span className={cn("status-dot", desk.engineOk ? "ok" : "bad")} />{desk.engineOk ? "Running" : "Not running"}
          </span>
        )}
      </div>
      {!replay && !desk.engineOk && (
        <div className="callout callout-amber mx-4 mt-3"><AlertTriangle size={16} className="mt-px shrink-0" aria-hidden />
          <div>The stream is playing but nothing is being clipped. Start the live engine on this machine: <code className="rounded bg-white/60 px-1">npm run live</code></div>
        </div>
      )}
      <dl className="space-y-2 border-b border-border px-4 py-3 text-[13px]">
        {rows.map(([k, v, ok]) => (
          <div key={k} className="flex items-start gap-2">
            <span className={cn("status-dot mt-1.5 shrink-0", ok ? "ok" : "bad")} aria-hidden />
            <dt className="w-[132px] shrink-0 font-medium">{k}</dt>
            <dd className="min-w-0 text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="px-4 pb-1 pt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Activity</h3>
      <ol className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-live="polite" aria-label="Engine activity">
        {desk.log.length === 0 && <li className="py-6 text-center text-sm text-ink-3">What the engine finds and decides appears here as the match plays.</li>}
        {desk.log.map((e, i) => {
          const Icon = LOG_ICON[e.kind] ?? Sparkles;
          return (
            <li key={`${e.wall}-${i}`} className="flex gap-2.5 border-b border-border py-2 last:border-b-0">
              <span className="w-11 shrink-0 pt-px text-right text-xs font-semibold tabular-nums text-ink-3">{clockAt(m, e.at).minute}</span>
              <Icon size={15} className={cn("mt-0.5 shrink-0", LOG_TONE[e.kind])} aria-hidden />
              <div className="min-w-0">
                <p className={cn("text-[13px] leading-snug", e.kind === "skip" ? "text-ink-3" : "text-foreground", e.kind === "clip" && "font-semibold")}>{e.text}</p>
                {e.detail && <p className="mt-0.5 text-xs leading-snug text-ink-4">{e.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 text-[11.5px] text-ink-4"><Clapperboard size={13} aria-hidden />
        {replay ? `Replay of the engine's live run on ${replay.recordedOn}: every look, verdict and clip at the second it happened.` : "Clips land in the inbox for your approval; nothing is posted."}</p>
    </aside>
  );
}
