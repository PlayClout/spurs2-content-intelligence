/**
 * Demo driver: play a match timeline against the live DB; cards appear in the producer UI (5s refresh).
 *   npm run demo:replay                         # data/replays/demo-broll.json, real time, runs the worker inline
 *   npm run demo:replay -- --speed=5            # 5x faster
 *   npm run demo:replay -- --timeline=data/replays/<match>.json --no-worker   # when `npm run worker` runs separately
 * Orgs are resolved by club display name (seeded orgs). Reset first with `npm run seed` for a clean queue.
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { runTimeline, type Timeline } from "../pipeline/replay";
import themes from "../pipeline/club-themes.json" with { type: "json" };

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const tl = JSON.parse(readFileSync(arg("timeline") ?? "data/replays/demo-broll.json", "utf8")) as Timeline;
const speed = Number(arg("speed") ?? 1);
const inline = !process.argv.includes("--no-worker");

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const orgIds: Record<string, string> = {};
for (const key of new Set(Object.values(tl.footage).map((f) => f.orgKey))) {
  const name = (themes as Record<string, { displayName?: string }>)[key]?.displayName;
  const [row] = await sql`select id from orgs where name = ${name ?? ""}`;
  if (!row) throw new Error(`org '${name}' not found (run npm run seed)`);
  orgIds[key] = row.id;
}

const w = inline ? await import("../pipeline/worker") : null;
let drain = Promise.resolve();
console.log(`replay "${tl.name}" at ${speed}x, ${tl.events.length} events, worker ${inline ? "inline" : "external"}`);
await runTimeline(tl, {
  speed,
  enqueue: async (orgKey, input) => {
    await sql`insert into jobs (type, payload, status) values ('process_moment', ${sql.json({ orgId: orgIds[orgKey], input } as never)}, 'queued')`;
    if (w) drain = drain.then(() => w.runOnce().then(() => undefined));
  },
});
await drain;
console.log("replay complete");
await sql.end();
if (w) await w.close();
