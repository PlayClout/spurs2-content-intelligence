import { connection } from "next/server";
import { compilationTrayData } from "@/lib/compilation";
import { Shell, shellContext, PageHead, NoOrg } from "@/components/producer/shell";
import { CompilationTray } from "@/components/compilation-tray";

export default async function MontagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const ctx = await shellContext(await searchParams);
  if (!ctx.org) return <NoOrg />;
  const tray = await compilationTrayData(ctx.org.id);
  return (
    <Shell ctx={ctx} active="montages" refresh>
      <PageHead title="Montages" sub={`Combine ${tray.limits.minEntries} to ${tray.limits.maxEntries} approved clips into one ${tray.limits.minSec} to ${tray.limits.maxSec} second cut.`} />
      <CompilationTray orgId={ctx.org.id} candidates={tray.candidates} suggested={tray.suggested} limits={tray.limits} recent={tray.recent} />
    </Shell>
  );
}
