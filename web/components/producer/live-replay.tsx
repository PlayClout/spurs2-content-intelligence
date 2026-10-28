"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Radio, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Controls, ClipsPanel, EnginePanel } from "@/components/producer/live-desk";
import type { LiveDesk } from "@/lib/live";
import { clockAt, scoreAt, periodAt, type LiveMatch } from "@shared/live-match";
import { planReplay, replayView, replayPresets, type RecordedSession, type ReplayView } from "@shared/live-replay";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 5, 20] as const;
const DEFAULT_SPEED = 5;
const TICK_MS = 200;

/** The replay's clock: the edge is anchored at (edge0, t0) and runs at `speed` while not paused. */
interface Run { joinAt: number; edge0: number; t0: number; speed: number; paused: boolean }

const recordedOn = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Live match desk, REPLAY mode (hosted demo). Replays a recorded live session of the engine on this match second by
 * second: the same timeline, clips panel and engine panel as the live desk, driven by a clock in the browser over the
 * recording (shared/live-replay). Nothing is written anywhere; restarting is free.
 */
export function LiveReplayView({ orgId, match, recording }: { orgId: string; match: LiveMatch; recording: RecordedSession }) {
  const presets = useMemo(() => replayPresets(match, recording), [match, recording]);
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(0);
  const on = recordedOn(recording.recordedAt);

  useEffect(() => {
    if (!run || run.paused) return;
    const id = setInterval(() => setNow(performance.now()), TICK_MS);
    return () => clearInterval(id);
  }, [run]);

  const edgeOf = useCallback((r: Run, t: number) => (r.paused ? r.edge0 : Math.min(match.durationSec, r.edge0 + ((t - r.t0) / 1000) * r.speed)), [match.durationSec]);
  // re-anchor the clock at the current edge, then apply a change (speed, pause, seek)
  const reanchor = (fn: (r: Run, edge: number) => Partial<Run>) => {
    const t = performance.now();
    setNow(t);
    setRun((r) => (r ? { ...r, edge0: edgeOf(r, t), t0: t, ...fn(r, edgeOf(r, t)) } : r));
  };
  const begin = (joinAt: number, speed: number) => { const t = performance.now(); setNow(t); setRun({ joinAt, edge0: joinAt, t0: t, speed, paused: false }); };

  const plan = useMemo(() => (run ? planReplay(match, recording, run.joinAt) : null), [match, recording, run?.joinAt]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!run || !plan) return <ReplayStartPanel match={match} recording={recording} presets={presets} on={on} onStart={begin} />;

  const edge = edgeOf(run, now || run.t0);
  const view = replayView(match, plan, edge);
  const desk = {
    match: { ...match, joinPresets: presets, feed: view.feed },
    session: { id: recording.sessionId, matchId: match.id, orgId, status: run.paused ? "paused" : "live", anchorVideoSec: run.edge0, anchorAt: recording.recordedAt, speed: run.speed, joinedAtVideoSec: run.joinAt, startedAt: recording.recordedAt, stream: null },
    edge, engineOk: true, engineAt: null, serverNow: 0,
    log: view.log, scans: view.scans, lastScanAt: view.lastScanAt, pending: view.pending,
    clips: view.clips.map((c) => ({ id: c.id, headline: c.headline, contentType: c.contentType, status: c.status, label: c.label, at: c.at, end: c.end, poster: c.poster, createdAt: c.createdAt, happenedAt: c.happenedAt })),
  } as unknown as LiveDesk;
  const togglePause = () => reanchor((r) => ({ paused: !r.paused }));

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_380px] grid-rows-[minmax(0,1fr)] gap-4">
      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        <ReplayScreen match={match} edge={edge} view={view} paused={run.paused} speed={run.speed} on={on}
          onSpeed={(s) => reanchor(() => ({ speed: s }))} />
        <Controls desk={desk} edge={edge} watching={edge} following paused={run.paused} matchPaused={run.paused} pending={false}
          onPlayPause={togglePause} onPauseMatch={togglePause} onGoLive={() => undefined}
          onSeek={(sec) => reanchor((_, e) => ({ edge0: Math.max(0, Math.min(e, sec)) }))}
          onRestart={(sec) => begin(sec, run.speed)} onEnd={() => setRun(null)} />
        <ClipsPanel desk={desk} orgId={orgId} />
      </div>
      <EnginePanel desk={desk} edge={edge} paused={run.paused} replay={{ recordedOn: on }} />
    </div>
  );
}

// ── the screen: the latest clip the engine cut, over the match clock ──────────────────
function ReplayScreen({ match: m, edge, view, paused, speed, on, onSpeed }: {
  match: LiveMatch; edge: number; view: ReplayView; paused: boolean; speed: number; on: string; onSpeed: (s: number) => void;
}) {
  const clock = clockAt(m, edge);
  const score = scoreAt(view.feed, edge);
  const period = periodAt(m, edge);
  const ended = period.id === "FT" && edge >= m.durationSec;
  const latest = view.latest;
  return (
    <section className="panel shrink-0 overflow-hidden" aria-label="Match replay">
      <div className="relative mx-auto aspect-video max-h-[52vh] overflow-hidden bg-black">
        {latest?.video ? (
          <>
            {latest.poster && <Image src={latest.poster} alt="" fill unoptimized aria-hidden className="scale-110 object-cover opacity-35 blur-xl" />}
            <video key={latest.id} src={latest.video} poster={latest.poster ?? undefined} autoPlay muted loop playsInline
              className="relative mx-auto block h-full w-auto" aria-label={`Latest clip: ${titleCase(latest.headline)}`} data-testid="replay-latest-clip" />
            <div className="absolute bottom-3 left-3 max-w-[60%] rounded bg-black/70 px-2.5 py-1.5 text-white">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/70">Latest clip the engine cut · {clockAt(m, latest.at).minute}</p>
              <p className="text-[13px] font-semibold leading-snug">{titleCase(latest.headline)} · {latest.label}</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center px-10 text-center">
            <div>
              <Radio size={22} className="mx-auto text-white/50" aria-hidden />
              <p className="mt-2 text-[13px] font-semibold text-white/90">Venue broadcast feed</p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-white/60">
                In production the club&apos;s own broadcast feed plays here. A public demo can&apos;t redistribute it, so this replay shows
                each clip the engine cuts, the moment it cuts it. {view.pending ? "A goal is being cut now." : ""}
              </p>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2" aria-live="polite">
          <span className={cn("rounded px-2 py-1 text-[11px] font-bold tracking-wide text-white", ended ? "bg-black/70" : paused ? "bg-black/70" : "live-badge bg-[var(--danger)]")}
            title={`Replay of the live session of ${on}`} data-testid="replay-badge">
            {ended ? "FULL TIME" : paused ? "PAUSED" : "REPLAY"}
          </span>
          <span className="flex items-center gap-2 rounded bg-black/70 px-2.5 py-1 text-[13px] font-semibold text-white tabular-nums" data-testid="live-scorebug">
            {m.home.short} <span className="text-[15px]">{score.home} – {score.away}</span> {m.away.short}
            <span className="ml-1 border-l border-white/30 pl-2">{clock.running ? clock.label : period.label}</span>
          </span>
        </div>
        <div className="absolute right-3 top-3 flex overflow-hidden rounded bg-black/70 text-[11px] font-bold text-white" role="group" aria-label="Replay speed">
          {SPEEDS.map((s) => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => onSpeed(s)}
              className={cn("px-2 py-1 tabular-nums", speed === s ? "bg-white text-black" : "hover:bg-white/15")}>{s}×</button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── not started: pick where to join and how fast ──────────────────────────────────────
function ReplayStartPanel({ match: m, recording, presets, on, onStart }: {
  match: LiveMatch; recording: RecordedSession; presets: LiveMatch["joinPresets"]; on: string; onStart: (sec: number, speed: number) => void;
}) {
  const [pick, setPick] = useState(presets[0]?.videoSec ?? recording.joinedAtVideoSec);
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED);
  const reels = recording.clips.filter((c) => c.contentType === "reel").length;
  const finds = recording.log.filter((e) => e.kind === "scan").length;
  const turnedDown = recording.log.filter((e) => e.kind === "skip").length;
  return (
    <div className="mx-auto max-w-[760px] space-y-4 pt-4">
      <section className="panel p-6" aria-label="Replay the live match">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Radio size={22} aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{m.competitionLabel}</p>
            <h2 className="mt-0.5 text-xl font-semibold">{m.home.name} v {m.away.name} · live session replay</h2>
            <p className="mt-1 text-[13px] text-ink-2">
              On {on} the engine worked this full match live: the broadcast played as if live while TwelveLabs watched it,
              Pegasus checked every find, and clips landed in the inbox seconds after each moment aired. This replays that
              session second by second: every look, every verdict (including the ones it turned down) and every clip, at the
              moment it happened.
            </p>
          </div>
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 text-[13px] font-semibold">Join the match at</legend>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
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
        <fieldset className="mt-4">
          <legend className="mb-2 text-[13px] font-semibold">Speed</legend>
          <div className="flex gap-2" role="radiogroup">
            {SPEEDS.map((s) => (
              <label key={s} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px]", speed === s ? "border-primary bg-accent" : "border-border hover:bg-subtle")}>
                <input type="radio" name="speed" className="accent-[var(--primary)]" checked={speed === s} onChange={() => setSpeed(s)} />
                <span className="font-semibold tabular-nums">{s}×</span>
                <span className="text-xs text-ink-3">{s === 1 ? "real time" : s === DEFAULT_SPEED ? "recommended" : "fast"}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex items-center gap-3">
          <Button size="lg" onClick={() => onStart(pick, speed)} data-testid="start-replay"><Play className="fill-current" /> Start replay</Button>
          <span className="text-xs text-ink-3">Change speed, pause, rewind or restart any time.</span>
        </div>
      </section>
      <p className="px-1 text-xs text-ink-4">
        Recorded {on} on ScorePlay media {m.scorePlayMediaId} (full match, {Math.round(m.durationSec / 60)} min): {finds} watch-list finds,
        {" "}{turnedDown} turned down by Pegasus, {reels} clips. The engine&apos;s output is replayed as it happened; match data (kick-off,
        goals) is the real match. The broadcast itself is the venue feed and is not redistributed in this demo.
      </p>
    </div>
  );
}
