/**
 * Demo: enqueue ONE moment from the real-footage timeline (Man United 1-1 Tottenham, the team's ScorePlay workspace)
 * into the seeded Tottenham org so it appears in the producer UI. Then run the worker (`npm run worker` or --once).
 *   npx tsx --env-file=.env scripts/enqueue-demo-moment.ts [eventIndex=0]
 * Live ScorePlay (proxy download) + live TwelveLabs (official index) when keys are set; feed triggers are SIMULATED.
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";
import type { Timeline } from "../pipeline/replay";
import themes from "../pipeline/club-themes.json" with { type: "json" };

const tl = JSON.parse(readFileSync("data/replays/thfc-mnu-week6.json", "utf8")) as Timeline;
const ev = tl.events.filter((e) => e.kind !== "ai_watchlist")[Number(process.argv[2] ?? 0)];
if (!ev) { console.error(`no feed event at index ${process.argv[2]}`); process.exit(1); }
const f = tl.footage[ev.footage as string];
const orgName = (themes as Record<string, { displayName?: string }>)[f.orgKey]?.displayName ?? "";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const [org] = await sql`select id from orgs where name = ${orgName}`;
if (!org) { console.error(`org '${orgName}' not found (run npm run seed)`); process.exit(1); }
const input = {
  orgKey: f.orgKey, competition: f.competition, scorePlayMediaId: f.scorePlayMediaId, twelvelabsAssetId: f.twelvelabsAssetId,
  startSec: ev.start, endSec: ev.end, headline: ev.headline, kicker: ev.kicker, statLine: ev.statLine,
  trigger: { kind: ev.kind, text: `${ev.text} (simulated feed)`, simulated: true },
  manifestFixture: tl.manifestFixture,
};
const [job] = await sql`insert into jobs (type, payload, status) values ('process_moment', ${sql.json({ orgId: org.id, input } as never)}, 'queued') returning id`;
console.log(`queued process_moment ${job.id} for ${orgName}: ${ev.headline}`);
await sql.end();
