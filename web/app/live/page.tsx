import { connection } from "next/server";
import { Shell, shellContext, NoOrg } from "@/components/producer/shell";
import { LiveDeskView } from "@/components/producer/live-desk";
import { liveDesk } from "@/lib/live";

export default async function LivePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection(); // live state, never prerendered
  const sp = await searchParams;
  const ctx = await shellContext(sp);
  if (!ctx.org) return <NoOrg />;
  if (process.env.VERCEL) {
    return (
      <Shell ctx={ctx} active="live">
        <h1 className="sr-only">Live match</h1>
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h2 className="text-lg font-semibold text-foreground">Live match desk</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            The live desk replays the full match broadcast from the venue feed (ScorePlay) while the engine works it
            in real time with Twelve Labs. That live feed was a time-boxed event feed and isn&apos;t available in this
            hosted demo. Everything the desk produces is here to explore: see <b>Inbox</b> for the review queue,{" "}
            <b>Library</b> for live Twelve Labs semantic search, and the <b>Fan app</b> for the published output.
          </p>
        </div>
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
