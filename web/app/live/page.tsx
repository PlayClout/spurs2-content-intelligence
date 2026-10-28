import { connection } from "next/server";
import { Shell, shellContext, NoOrg } from "@/components/producer/shell";
import { LiveDeskView } from "@/components/producer/live-desk";
import { LiveReplayView } from "@/components/producer/live-replay";
import { liveDesk } from "@/lib/live";
import type { LiveMatch } from "@shared/live-match";
import type { RecordedSession } from "@shared/live-replay";
import liveMatch from "../../../data/live/mnu-tot-full-match.json" with { type: "json" };
import recording from "../../../data/live/recorded-session.json" with { type: "json" };

/**
 * Live match desk. Locally (worker + ScorePlay stream available) it drives the live engine. On the hosted demo it
 * replays the recorded live session of the same match second by second: the broadcast feed was time-boxed to the event
 * and a serverless host cannot run the engine, but every decision the engine made live is in the recording.
 * `?mode=replay` shows the replay locally too.
 */
export default async function LivePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection(); // live state, never prerendered
  const sp = await searchParams;
  const ctx = await shellContext(sp);
  if (!ctx.org) return <NoOrg />;
  if (process.env.VERCEL || sp.mode === "replay") {
    return (
      <Shell ctx={ctx} active="live">
        <h1 className="sr-only">Live match replay</h1>
        <LiveReplayView orgId={ctx.org.id} match={liveMatch as unknown as LiveMatch} recording={recording as unknown as RecordedSession} />
      </Shell>
    );
  }
  const desk = await liveDesk(ctx.org.id);
  return (
    <Shell ctx={ctx} active="live">
      <h1 className="sr-only">Live match</h1>
      <LiveDeskView orgId={ctx.org.id} initial={desk} />
    </Shell>
  );
}
