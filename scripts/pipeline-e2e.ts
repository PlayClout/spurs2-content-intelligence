/**
 * End-to-end pipeline test against the LIVE Supabase DB, isolated in throwaway test orgs (never touches the seeded
 * demo orgs), cleaned up at the end. TwelveLabs = recorded live manifest; ScorePlay = fixture mode.
 *   npx tsx --env-file=.env scripts/pipeline-e2e.ts
 * Flow: enqueue process_moment -> worker --once -> 2 draft_ready opps (reel + card, both files exist, correct dims)
 *       -> simulate UI Approve on the reel (same insert as web/lib/actions.ts approveOpportunity)
 *       -> worker -> rendered, finalPaths set, publish-time re-check stamped, ScorePlay write-back recorded
 *       -> re-run render_final -> write-back idempotent (created=false)
 *       -> expiry case: same moment on THFC media AFTER accessible_until -> render_final blocked, status reverted.
 */
import { eq, inArray, sql } from "drizzle-orm";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

process.env.MOCK_MODE = "1"; // TwelveLabs: recorded fixture; ScorePlay: fixture (no key anyway)
delete process.env.SCOREPLAY_API_KEY;
process.env.WORKER_LANE = `e2e-${process.pid}`; // private lane: always-on workers (Fargate, M5) never touch test jobs
process.env.RENDER_OUT_DIR = "out/e2e-renders"; // RELATIVE on purpose (like the default): must resolve against the repo, not cwd
const w = await import("../pipeline/worker");
const s = await import("../shared/db-schema");
const { FFPROBE } = await import("../pipeline/render-local");
const db = w.db;

let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
const dims = (p: string) => execFileSync(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p]).toString().trim();
const fileOf = (pub: string) => join(process.cwd(), "out/e2e-renders", pub.replace(/^\/renders\//, ""));
const runFrom = (dir: string) => process.chdir(dir); // worker must not depend on its cwd for output paths

const tag = `e2e-${Date.now()}`;
const [orgSpurs, orgThfc] = await db.insert(s.orgs).values([
  { name: `TEST ${tag} Spurs`, sport: "basketball", league: "NBA" },
  { name: `TEST ${tag} THFC`, sport: "soccer", league: "Premier League" },
]).returning();
const orgIds = [orgSpurs.id, orgThfc.id];
const jobIds: string[] = [];

try {
  // ── 0. Lane isolation: a worker never claims another lane's job (prod workers vs tests) ───────────────────
  const [foreign] = await db.insert(s.jobs).values({ type: "process_moment", payload: { lane: `other-${tag}`, note: "must not be claimed" }, status: "queued" }).returning();
  jobIds.push(foreign.id);
  const claimed = await w.claimJob();
  const [fr] = await db.select().from(s.jobs).where(eq(s.jobs.id, foreign.id));
  check(claimed === null && fr.status === "queued", "lane isolation: worker in lane A leaves lane B's job untouched");

  // ── 1. process_moment (Spurs, buzzer-beater) ───────────────────────────────────────
  const input = {
    orgKey: "san-antonio-spurs", competition: "NBA Regular Season", scorePlayMediaId: 46000301, startSec: 6, endSec: 12,
    headline: "Castle at the buzzer", kicker: "Spurs 112 · Thunder 110 · Q4 0:00.3", statLine: "Game-winning dunk with 0.3 left · SIMULATED game data",
    trigger: { kind: "game_event", text: "Game-winning dunk at the buzzer, Q4 0:00.3", simulated: true },
    manifestFixture: "data/fallback-assets/fixtures/twelvelabs-manifest.json",
  };
  const [j1] = await db.insert(s.jobs).values({ type: "process_moment", payload: { lane: process.env.WORKER_LANE, orgId: orgSpurs.id, input, slug: `${tag}-spurs` }, status: "queued" }).returning();
  jobIds.push(j1.id);
  const t0 = performance.now();
  await w.runOnce();
  const moment2cards = Math.round(performance.now() - t0);
  const [j1done] = await db.select().from(s.jobs).where(eq(s.jobs.id, j1.id));
  check(j1done.status === "done", `process_moment job done (${j1done.error ?? "no error"})`);
  const opps = await db.select().from(s.opportunities).where(eq(s.opportunities.orgId, orgSpurs.id));
  check(opps.length === 2, `2 opportunities created (got ${opps.length}) in ${moment2cards}ms moment->cards`);
  const reel = opps.find((o) => o.contentType === "reel");
  const card = opps.find((o) => o.contentType === "milestone_graphic");
  check(reel?.audience === "casual" && card?.audience === "superfan", "audiences: casual reel + superfan photo card");
  check(opps.every((o) => o.status === "draft_ready"), "both draft_ready");
  const rd = reel?.delivery as { draftVideo: string; inputs: Record<string, { real: boolean }>; variant: { posterPublicPath: string } };
  check(!!rd?.draftVideo && existsSync(fileOf(rd.draftVideo)) && dims(fileOf(rd.draftVideo)) === "1080,1920", "reel draft video exists on disk, 1080x1920");
  const cd = card?.delivery as { variant: { publicPath: string } };
  check(!!cd && existsSync(fileOf(cd.variant.publicPath)) && dims(fileOf(cd.variant.publicPath)) === "1080,1350", "photo card exists on disk, 1080x1350");
  check(rd.inputs.trigger.real === false && rd.inputs.videoUnderstanding.real === true && rd.inputs.footage.real === false, "inputs carry honest real/simulated flags (trigger SIM, TwelveLabs REAL, footage fixture)");
  check((reel!.compliance as { rightsSource: string }).rightsSource === "scoreplay_fixture", "compliance rightsSource labels fixture, not live");
  const draftPath = (reel!.draftPaths as Record<string, string>).instagram_reel;
  check(draftPath === rd.variant.posterPublicPath, "draftPaths points UI posters at real rendered frames");

  // ── 2. Approve (same write as approveOpportunity) -> render_final ─────────────────────
  // run this stage from a DIFFERENT cwd: final must still land in the same slug folder as the drafts
  const repo = process.cwd();
  runFrom("/tmp");
  await db.update(s.opportunities).set({ status: "approved" }).where(eq(s.opportunities.id, reel!.id));
  const [j2] = await db.insert(s.jobs).values({ type: "render_final", payload: { lane: process.env.WORKER_LANE, opportunityId: reel!.id, channels: reel!.channels, trimOverride: { startSec: 6.5, endSec: 12.5 } }, status: "queued" }).returning();
  jobIds.push(j2.id);
  await w.runOnce();
  runFrom(repo);
  const [r2] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, reel!.id));
  const [j2done] = await db.select().from(s.jobs).where(eq(s.jobs.id, j2.id));
  check(j2done.status === "done" && r2.status === "rendered", `render_final done -> opportunity rendered (${j2done.error ?? "ok"})`);
  const fp = r2.finalPaths as Record<string, string>;
  check(!!fp.instagram_reel && fp.instagram_reel.split("/")[2] === rd.draftVideo.split("/")[2], `final lands in the SAME slug folder as its draft (${fp.instagram_reel})`);
  const finalFile = fp.instagram_reel ? fileOf(fp.instagram_reel) : "";
  check(!!finalFile && existsSync(finalFile) && dims(finalFile) === "1080,1920", "final reel rendered 1080x1920");
  const dur = Number(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", finalFile]).toString());
  check(Math.abs(dur - 6.0) < 0.3, `final honors producer trim 6.5-12.5s (duration ${dur.toFixed(2)}s)`);
  const del = r2.delivery as { final: { recheckedAt: string }; scoreplayWriteBack: { mode: string; created: boolean; wouldSend: { path: string; body: { video_logs: { log: { start_offset: number } }[] } } } };
  check(!!del.final?.recheckedAt, "publish-time rights re-check stamped");
  check(del.scoreplayWriteBack.mode === "fixture" && del.scoreplayWriteBack.created && del.scoreplayWriteBack.wouldSend.path === "/video/logs" && del.scoreplayWriteBack.wouldSend.body.video_logs[0].log.start_offset === 6.5, "ScorePlay write-back recorded with exact wouldSend payload (trimmed in-point)");

  // idempotent re-run
  await db.update(s.opportunities).set({ status: "approved" }).where(eq(s.opportunities.id, reel!.id));
  const [j3] = await db.insert(s.jobs).values({ type: "render_final", payload: { lane: process.env.WORKER_LANE, opportunityId: reel!.id, channels: reel!.channels, trimOverride: { startSec: 6.5, endSec: 12.5 } }, status: "queued" }).returning();
  jobIds.push(j3.id);
  await w.runOnce();
  const [r3] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, reel!.id));
  check((r3.delivery as typeof del).scoreplayWriteBack.created === false, "re-approve: ScorePlay write-back idempotent (no duplicate log)");

  // ── 3b. Merge: a second trigger for the SAME play adds corroboration to the existing cards, no new analysis ──
  const before = await db.select().from(s.opportunities).where(eq(s.opportunities.orgId, orgSpurs.id));
  const momentsBefore = (await db.select().from(s.moments)).length;
  const [jm] = await db.insert(s.jobs).values({ type: "process_moment", payload: { lane: process.env.WORKER_LANE, orgId: orgSpurs.id, input: { ...input, startSec: 7, endSec: 12, trigger: { kind: "social_reaction", text: "Castle mentions spiking", simulated: true } } }, status: "queued" }).returning();
  jobIds.push(jm.id);
  await w.runOnce();
  const after = await db.select().from(s.opportunities).where(eq(s.opportunities.orgId, orgSpurs.id));
  const momentsAfter = (await db.select().from(s.moments)).length;
  check(after.length === before.length && momentsAfter === momentsBefore, `same-play trigger merged: no new cards or moments (${before.length} cards)`);
  const draftCard = after.find((o) => o.contentType === "milestone_graphic")!;
  const dr = draftCard.delivery as { triggers: unknown[]; ranking: { score: number; triggers: number } };
  const prevScore = before.find((o) => o.id === draftCard.id)!.score;
  check(dr.triggers.length === 2 && dr.ranking.triggers === 2 && draftCard.score > prevScore && (draftCard.signalIds as string[]).length === 2, `merge adds corroboration: rank ${prevScore} -> ${draftCard.score}, 2 signals`);
  check(typeof (before[0].generatedCopy as Record<string, string>).instagram_reel === "string" || typeof (before[0].generatedCopy as Record<string, string>).instagram_feed === "string", "cards carry generated copy");

  // ── 4. Tenant isolation: the SAME moment for two orgs must create separate rows, never touch each other ──
  const [j6] = await db.insert(s.jobs).values({ type: "process_moment", payload: { lane: process.env.WORKER_LANE, orgId: orgThfc.id, input, slug: `${tag}-iso` }, status: "queued" }).returning();
  jobIds.push(j6.id);
  await w.runOnce();
  const spursAfter = await db.select().from(s.opportunities).where(eq(s.opportunities.orgId, orgSpurs.id));
  const isoRows = (await db.select().from(s.opportunities).where(eq(s.opportunities.orgId, orgThfc.id))).filter((o) => (o.delivery as { slug?: string })?.slug === `${tag}-iso`);
  check(isoRows.length === 2, `same moment for a second org -> its own 2 rows (got ${isoRows.length})`);
  check(spursAfter.length === 2 && spursAfter.every((o) => (o.delivery as { slug?: string })?.slug === `${tag}-spurs`), "first org's rows untouched by the second org's identical moment");

  // ── 3. Expiry: THFC asset window ends 2026-10-24 17:00 UTC -> fake the clock past it ───
  const thfcInput = { ...input, orgKey: "tottenham-hotspur", competition: "Premier League", scorePlayMediaId: 46000302, headline: "North London is white", kicker: "Spurs 2 · Arsenal 1 · 88'", trigger: { kind: "social_reaction", text: "derby winner trending", simulated: true } };
  const [j4] = await db.insert(s.jobs).values({ type: "process_moment", payload: { lane: process.env.WORKER_LANE, orgId: orgThfc.id, input: thfcInput, slug: `${tag}-thfc` }, status: "queued" }).returning();
  jobIds.push(j4.id);
  await w.runOnce();
  const [thfcReel] = await db.select().from(s.opportunities).where(sql`${s.opportunities.orgId} = ${orgThfc.id} and ${s.opportunities.contentType} = 'reel' and ${s.opportunities.delivery}->>'slug' = ${`${tag}-thfc`}`);
  check((thfcReel?.compliance as { status: string })?.status === "restricted", "THFC draft: restricted (ScorePlay custom_terms + editorial usage surfaced)");
  const RealDate = Date;
  const future = new RealDate("2026-10-26T12:00:00Z").getTime();
  globalThis.Date = class extends RealDate { constructor(...a: unknown[]) { super(...((a.length ? a : [future]) as [number])); } static now() { return future; } } as DateConstructor;
  try {
    await db.update(s.opportunities).set({ status: "approved" }).where(eq(s.opportunities.id, thfcReel.id));
    const [j5] = await db.insert(s.jobs).values({ type: "render_final", payload: { lane: process.env.WORKER_LANE, opportunityId: thfcReel.id, channels: thfcReel.channels }, status: "queued" }).returning();
    jobIds.push(j5.id);
    await w.runOnce();
    const [after] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, thfcReel.id));
    const [j5done] = await db.select().from(s.jobs).where(eq(s.jobs.id, j5.id));
    check(j5done.status === "failed" && (j5done.error ?? "").includes("publish-time re-check"), "expired window: render_final FAILS at publish-time re-check");
    check(after.status === "draft_ready" && (after.compliance as { status: string }).status === "blocked", "expired window: opportunity reverted to draft_ready + compliance blocked (approve gate will refuse)");
    check(Object.keys(after.finalPaths as object).length === 0, "expired window: nothing rendered or written back");
  } finally { globalThis.Date = RealDate; }
} finally {
  // ── cleanup: only rows this test created ─────────────────────────────────────────────
  const opIds = (await db.select({ id: s.opportunities.id }).from(s.opportunities).where(inArray(s.opportunities.orgId, orgIds))).map((x) => x.id);
  const assetIds = (await db.select({ id: s.assets.id }).from(s.assets).where(inArray(s.assets.orgId, orgIds))).map((x) => x.id);
  if (opIds.length) await db.delete(s.publishedAssets).where(inArray(s.publishedAssets.opportunityId, opIds));
  await db.delete(s.opportunities).where(inArray(s.opportunities.orgId, orgIds));
  await db.delete(s.signals).where(inArray(s.signals.orgId, orgIds));
  if (assetIds.length) await db.delete(s.moments).where(inArray(s.moments.assetId, assetIds));
  await db.delete(s.assets).where(inArray(s.assets.orgId, orgIds));
  if (jobIds.length) await db.delete(s.jobs).where(inArray(s.jobs.id, jobIds));
  await db.delete(s.orgs).where(inArray(s.orgs.id, orgIds));
  const left = await db.select({ id: s.orgs.id }).from(s.orgs).where(inArray(s.orgs.id, orgIds));
  check(left.length === 0, "cleanup: test orgs + all their rows removed");
  rmSync("out/e2e-renders", { recursive: true, force: true });
  await w.close();
}
console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
