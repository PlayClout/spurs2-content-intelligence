/**
 * pnpm seed — reset to a perfect demo state in one command.
 * Loads: 2 orgs (Spurs, Tottenham), mock game-event + fan-reaction feeds (simulated:true).
 * Idempotent: truncates and reloads.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import * as s from "../shared/db-schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

async function main() {
  await db.execute(sql`truncate orgs, assets, moments, signals, opportunities, jobs, published_assets, performance_snapshots cascade`);

  const [spurs, thfc] = await db.insert(s.orgs).values([
    { name: "San Antonio Spurs", sport: "basketball", league: "NBA" },
    { name: "Tottenham Hotspur", sport: "soccer", league: "Premier League" },
  ]).returning();

  const events = JSON.parse(readFileSync("data/fallback-assets/mock-game-events.json", "utf8")).events;
  const reactions = JSON.parse(readFileSync("data/fallback-assets/mock-fan-reactions.json", "utf8")).reactions;
  const orgFor = (sport: string) => (sport === "basketball" ? spurs.id : thfc.id);

  await db.insert(s.signals).values([
    ...events.map((e: any) => ({
      orgId: orgFor(e.sport), kind: "game_event" as const, simulated: true, sport: e.sport,
      payload: e, eventText: e.eventText, weight: e.weight, occurredAt: new Date(e.occurredAt),
    })),
    ...reactions.map((r: any) => ({
      orgId: orgFor(r.sport), kind: "social_reaction" as const, simulated: true, sport: r.sport,
      payload: r, eventText: r.refEventText, weight: r.velocity, occurredAt: new Date(),
    })),
  ]);

  const counts = await db.execute(sql`select (select count(*) from orgs) as orgs, (select count(*) from signals) as signals`);
  console.log("Seeded:", counts[0]);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
