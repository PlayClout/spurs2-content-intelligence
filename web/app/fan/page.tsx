import { connection } from "next/server";
import { fanFeed, resolveFanOrg, fanPlayersFor, demoPersonas } from "@/lib/fan";
import { getFanProfile } from "@/lib/fan-prefs";
import { FAN_INTERESTS } from "@shared/fan-catalog";
import { FanClipCard } from "@/components/fan/fan-clip-card";
import { PersonaSwitcher, PreferencesPanel } from "@/components/fan/fan-profile";

export default async function FanHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const [{ org, orgKey }, profile, personas] = await Promise.all([resolveFanOrg(sp.org), getFanProfile(), demoPersonas()]);
  if (!org) return <p className="py-16 text-center text-sm text-muted-foreground">No club configured yet.</p>;
  const [ranked, squad] = await Promise.all([fanFeed(org.id, profile), fanPlayersFor(orgKey)]);
  const players = squad.filter((p) => p.role !== "staff");

  return (
    <div className="space-y-4">
      <div>
        <p className="kicker">{org.name}</p>
        <h1 className="display mt-1 text-3xl">For you</h1>
      </div>
      <PersonaSwitcher personas={[...personas, { id: "balanced", label: "Balanced" }]} current={profile.personaId} />
      <PreferencesPanel profile={profile} players={players} interests={FAN_INTERESTS} />

      {ranked.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-14 text-center">
          <p className="display text-xl">No clips yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Clips appear here once the club&apos;s editor approves and publishes them. Nothing reaches this app without that step.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ranked.map(({ item, reasons }) => (
            <FanClipCard key={item.versionId} clip={item} reasons={reasons} orgId={sp.org} />
          ))}
        </div>
      )}
    </div>
  );
}
