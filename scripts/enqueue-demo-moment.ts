/**
 * Demo: enqueue one real pipeline moment into an EXISTING org (default San Antonio Spurs) so it appears in the
 * producer UI next to the seeded cards. Then run the worker (`npm run worker` or --once) to process it.
 *   npx tsx --env-file=.env scripts/enqueue-demo-moment.ts [spurs|thfc]
 * Uses: ScorePlay fixture media + recorded live TwelveLabs manifest (or live TwelveLabs if asset id + key, MOCK_MODE unset).
 */
import postgres from "postgres";
const which = (process.argv[2] ?? "spurs") as "spurs" | "thfc";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const orgName = which === "spurs" ? "San Antonio Spurs" : "Tottenham Hotspur";
const [org] = await sql`select id from orgs where name = ${orgName}`;
if (!org) { console.error(`org '${orgName}' not found (run npm run seed)`); process.exit(1); }
const input = which === "spurs"
  ? {
      orgKey: "san-antonio-spurs", competition: "NBA Regular Season", scorePlayMediaId: 46000301, startSec: 6, endSec: 12,
      headline: "Castle at the buzzer", kicker: "Spurs 112 · Thunder 110 · Q4 0:00.3", statLine: "Game-winning dunk with 0.3 left · SIMULATED game data",
      trigger: { kind: "game_event", text: "Game-winning dunk at the buzzer, Q4 0:00.3 (simulated feed)", simulated: true },
      twelvelabsAssetId: "6ad81fcb030b76724d10e3c5",
      manifestFixture: "data/fallback-assets/fixtures/twelvelabs-manifest.json",
    }
  : {
      orgKey: "tottenham-hotspur", competition: "Premier League", scorePlayMediaId: 46000302, startSec: 4, endSec: 12,
      headline: "North London is white", kicker: "Spurs 2 · Arsenal 1 · 88'", statLine: "Late winner in the derby · SIMULATED game data",
      trigger: { kind: "social_reaction", text: "derby winner trending (simulated fan feed)", simulated: true },
      twelvelabsAssetId: "6ad81fdb960d8ea7bdcdc32b",
      manifestFixture: "data/fallback-assets/fixtures/twelvelabs-manifest.json",
    };
const [job] = await sql`insert into jobs (type, payload, status) values ('process_moment', ${sql.json({ orgId: org.id, input })}, 'queued') returning id`;
console.log(`queued process_moment ${job.id} for ${orgName}`);
await sql.end();
