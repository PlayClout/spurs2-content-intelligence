/**
 * Replay clock: plays a match timeline so triggers fire at their real offsets and cards appear in the producer UI
 * as the moments "happen". Game/social triggers are SIMULATED feeds (labeled). The ai_watchlist trigger runs a real
 * TwelveLabs search at fire time (or its recorded response in MOCK mode) and is labeled REAL.
 */
import socialFixture from "./fixtures/social-replay.json" with { type: "json" };
import type { MomentInput } from "./moment";
import { search, pickNew, type Footage, type Window } from "./watchlist";

export interface TimelineEvent {
  at: number; // seconds from replay start
  clock: string; // match clock shown in logs, e.g. "Q4 0:00.3" / "88'"
  kind: "game_event" | "social_reaction" | "ai_watchlist";
  footage: string | string[]; // key(s) into Timeline.footage (watch-list may watch several)
  text?: string; // trigger text (game/social)
  query?: string; // watch-list search
  start?: number; // trigger window in source seconds (game/social)
  end?: number;
  headline: string;
  kicker?: string;
  statLine?: string;
}
export interface Timeline { name: string; indexId: string; manifestFixture: string; footage: Record<string, Footage>; events: TimelineEvent[] }
export interface Fired { event: TimelineEvent; orgKey: string; input: MomentInput | null; note: string }

export async function runTimeline(
  tl: Timeline,
  opts: { enqueue: (orgKey: string, input: MomentInput) => Promise<void>; speed?: number; log?: (s: string) => void },
): Promise<Fired[]> {
  const speed = opts.speed ?? 1;
  const log = opts.log ?? ((s: string) => console.log(s));
  const t0 = Date.now();
  const fired: { mediaId: number; window: Window }[] = [];
  const out: Fired[] = [];

  for (const ev of [...tl.events].sort((a, b) => a.at - b.at)) {
    const wait = t0 + (ev.at * 1000) / speed - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const keys = Array.isArray(ev.footage) ? ev.footage : [ev.footage];
    const pool = keys.map((k) => { const f = tl.footage[k]; if (!f) throw new Error(`timeline: unknown footage '${k}'`); return f; });

    let input: MomentInput | null = null;
    let note: string;
    if (ev.kind === "ai_watchlist") {
      const { hits, mode } = await search(tl.indexId, ev.query!, pool.map((f) => f.twelvelabsVideoId));
      const pick = pickNew(hits, pool, fired);
      if (!pick) {
        note = `watch-list "${ev.query}": ${hits.length} hit(s), none new`;
        log(`[${ev.clock}] ${note}`);
        out.push({ event: ev, orgKey: pool[0].orgKey, input: null, note });
        continue;
      }
      const { hit, footage: f } = pick;
      input = base(tl, f, ev, hit.start, hit.end, {
        kind: "ai_watchlist",
        text: `TwelveLabs watch-list "${ev.query}" hit #${hit.rank} at ${hit.start.toFixed(1)}-${hit.end.toFixed(1)}s (${mode === "live" ? "live search" : "recorded live search"})`,
        simulated: false, mode: mode === "live" ? "live" : "replay",
      });
      note = input.trigger.text;
    } else {
      input = base(tl, pool[0], ev, ev.start!, ev.end!, { kind: ev.kind, text: `${ev.text} (simulated feed)`, simulated: true, mode: "fixture",
        ...(ev.kind === "social_reaction" ? { evidence: { ...socialFixture.sample, synthetic: true as const, observedAtReplaySec: ev.at } } : {}),
      });
      note = ev.text!;
    }
    fired.push({ mediaId: input.scorePlayMediaId, window: { start: input.startSec, end: input.endSec } });
    await opts.enqueue(input.orgKey, input);
    log(`[${ev.clock}] ${ev.kind} -> ${input.orgKey}: ${note}`);
    out.push({ event: ev, orgKey: input.orgKey, input, note });
  }
  return out;
}

function base(tl: Timeline, f: Footage, ev: TimelineEvent, start: number, end: number, trigger: MomentInput["trigger"]): MomentInput {
  return {
    orgKey: f.orgKey, competition: f.competition, scorePlayMediaId: f.scorePlayMediaId, twelvelabsAssetId: f.twelvelabsAssetId,
    manifestFixture: tl.manifestFixture, startSec: start, endSec: end,
    headline: ev.headline, kicker: ev.kicker, statLine: ev.statLine, trigger,
  };
}
