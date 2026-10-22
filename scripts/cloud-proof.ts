/**
 * Cloud proof: enqueue ONE real moment into the live DB with NO local worker running, then assert the FARGATE worker
 * processed it end to end: job done, 2 cards created, delivery records which host ran it, and the drafts are in S3.
 *   npx tsx --env-file=.env scripts/cloud-proof.ts
 * Uses a disposable test org; cleans up DB rows after. (S3 objects are left: harmless, tiny, prefixed cloudproof-.)
 */
import postgres from "postgres";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
const tag = `cloudproof-${Date.now()}`;

const [org] = await sql`insert into orgs (name, sport, league) values (${"TEST " + tag}, 'basketball', 'NBA') returning id`;
const input = {
  orgKey: "san-antonio-spurs", competition: "NBA Regular Season", scorePlayMediaId: 46000301, startSec: 6, endSec: 12,
  headline: "Castle at the buzzer", kicker: "Spurs 112 · Thunder 110", statLine: "Game-winning dunk · SIMULATED",
  trigger: { kind: "game_event", text: "cloud proof", simulated: true },
  twelvelabsAssetId: "6ad81fcb030b76724d10e3c5",
  manifestFixture: "data/fallback-assets/fixtures/twelvelabs-manifest.json",
};
const t0 = Date.now();
const [job] = await sql`insert into jobs (type, payload, status) values ('process_moment', ${sql.json({ orgId: org.id, input, slug: tag } as never)}, 'queued') returning id`;
console.log(`queued ${job.id}; waiting for a worker (M5 worker must be OFF)…`);

let row: { status: string; error: string | null } | undefined;
for (let i = 0; i < 90; i++) {
  [row] = (await sql`select status, error from jobs where id = ${job.id}`) as unknown as [typeof row];
  if (row && (row.status === "done" || row.status === "failed")) break;
  await new Promise((r) => setTimeout(r, 2000));
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);
check(row?.status === "done", `job ${row?.status} in ${secs}s${row?.error ? ` (${row.error.slice(0, 120)})` : ""}`);

// which host ran it: the Fargate worker's CloudWatch log names the slug (the M5 must be off, so it can only be cloud)
const { execFileSync } = await import("node:child_process");
const logs = execFileSync("aws", ["logs", "tail", "/ecs/spurs2-worker", "--since", "10m", "--format", "short", "--profile", "clout-ci", "--region", "us-east-1"], { encoding: "utf8", env: { ...process.env, HOME: "/Users/stu" } });
const line = logs.split("\n").find((l) => l.includes(tag)) ?? "";
check(line.includes("process_moment"), `Fargate CloudWatch log shows it processed this moment: ${line.replace(/^\S+\s+/, "").slice(0, 150)}`);

const opps = await sql`select content_type, status, delivery->'inputs'->'videoUnderstanding'->>'mode' tl from opportunities where org_id = ${org.id}`;
check(opps.length === 2 && opps.every((o) => o.status === "draft_ready"), `2 draft_ready cards created (${opps.map((o) => o.content_type).join(", ")})`);
check(opps.some((o) => o.tl === "live"), `TwelveLabs called LIVE from the cloud (${opps.map((o) => o.tl).join(",")})`);

const s3 = new S3Client({ region: process.env.RENDER_S3_REGION, credentials: { accessKeyId: process.env.RENDER_S3_ACCESS_KEY_ID!, secretAccessKey: process.env.RENDER_S3_SECRET_ACCESS_KEY! } });
const listed = await s3.send(new ListObjectsV2Command({ Bucket: process.env.RENDER_S3_BUCKET, Prefix: `renders/${tag}/` }));
const keys = (listed.Contents ?? []).map((o) => o.Key!.split("/").pop());
check(keys.includes("reel.instagram_reel.draft.mp4") && keys.includes("card.instagram_feed.jpg"), `cloud-rendered drafts are in S3 (${keys.length} files)`);

const momentIds = (await sql`select distinct moment_id from opportunities where org_id = ${org.id}`).map((r) => r.moment_id);
await sql`delete from opportunities where org_id = ${org.id}`;
await sql`delete from signals where org_id = ${org.id}`;
if (momentIds.length) await sql`delete from moments where id in ${sql(momentIds)}`;
await sql`delete from jobs where id = ${job.id}`;
await sql`delete from orgs where id = ${org.id}`;
await sql.end();
console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}  (test org + rows cleaned up)`);
process.exit(fail ? 1 : 0);
