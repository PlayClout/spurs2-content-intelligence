/**
 * Worker: plain Node loop polling the `jobs` table (architecture.md). Runs on the M5 next to ffmpeg.
 *   npx tsx --env-file=.env pipeline/worker.ts            # loop
 *   npx tsx --env-file=.env pipeline/worker.ts --once     # drain queue once, exit (tests / smoke)
 *
 * Claim is atomic (UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED)), so multiple workers / restarts
 * never double-process a job. Jobs stuck "running" > STALE_MS are re-queued at startup (crash recovery).
 *
 * Handlers:
 *   process_moment  {orgId, input: MomentInput}  -> 2 opportunities (casual reel + superfan card), status draft_ready
 *   render_final    {opportunityId, channels, trimOverride}  (queued by the UI's Approve)
 *                   -> final render of the approved variant (honors trim) -> PUBLISH-TIME rights re-check
 *                   -> ScorePlay write-back: video log on the source media (+ upload when live) -> status rendered
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { join } from "node:path";
import * as s from "../shared/db-schema";
import * as sp from "../shared/clients/scoreplay";
import { restrictionsFromScorePlay } from "../shared/clients/scoreplay-rights";
import { evaluate } from "../shared/compliance";
import type { Channel, Compliance } from "../shared/schemas";
import { processMoment, renderDir, publicPathFor, type MomentInput, type ProcessedMoment, type Variant } from "./moment";
import { getRenderBackend } from "./render-backend";
import { overlapRatio, SAME_PLAY } from "./watchlist";
import { scoreFit } from "../shared/clients/decisions";
import { generateCopy } from "../shared/copy";

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 3 });
export const db = drizzle(client, { schema: s });
const STALE_MS = 5 * 60_000;
const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 1000);
const WORKER_ID = `${process.env.HOSTNAME ?? "m5"}:${process.pid}`;

type JobRow = typeof s.jobs.$inferSelect;
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

export async function claimJob(): Promise<JobRow | null> {
  const rows = await db.execute<JobRow>(sql`
    update jobs set status = 'running', started_at = now(), attempts = attempts + 1
    where id = (select id from jobs where status = 'queued' and type in ('process_moment','render_final')
                order by queued_at for update skip locked limit 1)
    returning id, type, payload, status, error, attempts, queued_at as "queuedAt", started_at as "startedAt", finished_at as "finishedAt"`);
  return (rows as unknown as JobRow[])[0] ?? null;
}

async function finish(id: string, error?: string) {
  await db.update(s.jobs).set({ status: error ? "failed" : "done", error: error ?? null, finishedAt: new Date() }).where(eq(s.jobs.id, id));
}

export async function requeueStale() {
  const r = await db.execute(sql`update jobs set status = 'queued', error = 'requeued after stale running' where status = 'running' and started_at < now() - (${STALE_MS} || ' milliseconds')::interval returning id`);
  if ((r as unknown as unknown[]).length) log(`requeued ${(r as unknown as unknown[]).length} stale job(s)`);
}

// ── process_moment ─────────────────────────────────────────────────────────────────────
const hash = (x: string) => createHash("sha1").update(x).digest("hex").slice(0, 16);

function complianceStamp(p: ProcessedMoment, channels: Channel[], source: string): Compliance {
  const rows = p.compliance.filter((c) => channels.includes(c.channel));
  const allowed = rows.filter((r) => r.status !== "blocked").map((r) => r.channel);
  const status = (allowed.length === 0 ? "blocked" : rows.some((r) => r.status === "restricted") || allowed.length < channels.length ? "restricted" : "cleared") as Compliance["status"];
  return {
    rightsSource: source,
    territories: p.content.territoryBlocks.length ? [`blocked: ${p.content.territoryBlocks.join(", ")}`] : ["all requested"],
    platformsAllowed: allowed,
    sponsorRestrictions: p.content.triggeredRules.filter((r) => r.startsWith("SPONSOR")),
    expiresAt: null,
    status,
    reasons: rows[0]?.reasons ?? [],
  };
}

/** A trigger for a play that already has cards MERGES into them: new signal + corroboration, no new analysis/render.
 * Same play = same org + same ScorePlay media + windows overlapping >= SAME_PLAY. Cheap filter before the expensive path. */
async function mergeIntoExisting(job: JobRow, orgId: string, sport: string, input: MomentInput) {
  const rows = await db.select().from(s.opportunities).where(sql`${s.opportunities.orgId} = ${orgId}
    and ${s.opportunities.status} not in ('rejected','expired')
    and (${s.opportunities.delivery}->'scoreplay'->>'mediaId')::bigint = ${input.scorePlayMediaId}`);
  const w = { start: input.startSec, end: input.endSec };
  // compare TRIGGER windows (what pickNew compares), never the padded analysis window: padding swallows neighbours
  const same = rows.filter((o) => {
    const d = o.delivery as { triggerWindows?: { start: number; end: number }[]; tightWindow?: { start: number; end: number } };
    const ws = d?.triggerWindows ?? (d?.tightWindow ? [d.tightWindow] : []);
    return ws.some((t) => overlapRatio(t, w) >= SAME_PLAY);
  });
  if (!same.length) return null;
  const [signal] = await db.insert(s.signals).values({
    orgId, kind: input.trigger.kind === "ai_watchlist" ? "context" : input.trigger.kind, simulated: input.trigger.simulated, sport,
    payload: input.trigger, eventText: input.trigger.text, weight: 1, occurredAt: new Date(job.queuedAt), momentId: same[0].momentId,
  }).returning();
  for (const o of same) {
    const d = (o.delivery ?? {}) as Record<string, unknown> & { triggers?: unknown[]; triggerWindows?: unknown[]; ranking?: Ranking };
    const triggers = [...(d.triggers ?? []), input.trigger];
    const triggerWindows = [...(d.triggerWindows ?? []), w];
    const ranking = d.ranking ? rank(d.ranking.eventWeight, d.ranking.audienceFit, triggers as MomentInput["trigger"][], d.ranking.backend, d.ranking.confidence) : undefined;
    await db.update(s.opportunities).set({
      signalIds: [...((o.signalIds as string[]) ?? []), signal.id],
      delivery: { ...d, triggers, triggerWindows, ...(ranking ? { ranking } : {}) },
      ...(ranking ? { score: ranking.score, scoreBreakdown: ranking.breakdown } : {}),
    }).where(eq(s.opportunities.id, o.id));
  }
  return same.map((o) => o.id);
}

export interface Ranking {
  score: number; eventWeight: number; audienceFit: number; corroboration: number; triggers: number;
  backend: string; confidence: number; lowConfidence: boolean; breakdown: Record<string, number>;
}
/** Nova's calibration: Jev answers below 0.7 confidence are not trustworthy on their own. We keep the score (it still
 * orders sensibly) but flag it so the UI never presents it as settled. Floor policy itself lives in decisions.ts (Nova). */
export const CONFIDENCE_FLOOR = 0.7;
/** 0-100. Significance and audience fit (decision layer) dominate; each extra independent trigger corroborates. */
export function rank(eventWeight: number, audienceFit: number, triggers: MomentInput["trigger"][], backend: string, confidence: number): Ranking {
  const kinds = new Set(triggers.map((t) => t.kind));
  const corroboration = Math.min(1, (kinds.size - 1) / 2 + (triggers.length > kinds.size ? 0.25 : 0));
  const score = Math.round(100 * (0.5 * eventWeight + 0.35 * audienceFit + 0.15 * corroboration));
  return {
    score, eventWeight, audienceFit, corroboration, triggers: triggers.length, backend, confidence,
    lowConfidence: backend !== "formula" && confidence < CONFIDENCE_FLOOR,
    breakdown: { momentConfidence: 0, eventWeight, socialVelocity: kinds.has("social_reaction") ? 1 : 0, recencyDecay: 1, audienceFit },
  };
}

async function handleProcessMoment(job: JobRow) {
  const { orgId, input, slug } = job.payload as { orgId?: string; input?: MomentInput; slug?: string };
  if (!orgId || !input) throw new Error(`process_moment payload needs {orgId, input} (got keys ${Object.keys(job.payload ?? {}).join(",") || "none"})`);
  const [org] = await db.select().from(s.orgs).where(eq(s.orgs.id, orgId));
  if (!org) throw new Error(`org ${orgId} not found`);
  const merged = await mergeIntoExisting(job, orgId, org.sport, input);
  if (merged) {
    log(`process_moment merged ${input.trigger.kind} into ${merged.length} existing card(s) (no new analysis)`);
    return merged;
  }
  const runSlug = slug ?? `m-${input.scorePlayMediaId}-${Math.round(input.startSec)}`;
  const t0 = performance.now();
  const p = await processMoment(input, runSlug);
  const processMs = Math.round(performance.now() - t0);

  // asset + moment rows (sport-agnostic; sport comes from the org)
  const [asset] = await db.insert(s.assets).values({
    orgId, source: p.scoreplay.mode === "live" ? "scoreplay" : "fixture", sourceRef: String(p.scoreplay.mediaId), sport: org.sport,
    title: input.headline, filePath: `scoreplay:${p.scoreplay.mediaId}`, durationSec: null, twelvelabsVideoId: input.twelvelabsAssetId ?? null, indexStatus: "ready",
  }).returning();
  const [moment] = await db.insert(s.moments).values({
    assetId: asset.id, label: p.manifest.moments[0]?.label ?? "moment", description: p.manifest.summary,
    startSec: p.tightWindow.start, endSec: p.tightWindow.end,
    confidence: 0, // Pegasus gives no calibrated confidence; UI must not show a fake number for this field
    detector: "pegasus_analyze", raw: p.manifest,
  }).returning();
  const [signal] = await db.insert(s.signals).values({
    orgId, kind: input.trigger.kind === "ai_watchlist" ? "context" : input.trigger.kind, simulated: input.trigger.simulated, sport: org.sport,
    payload: input.trigger, eventText: input.trigger.text, weight: 1, occurredAt: new Date(job.queuedAt), momentId: moment.id,
  }).returning();

  const inputs = {
    trigger: { source: input.trigger.kind, text: input.trigger.text, real: !input.trigger.simulated },
    footage: { source: `ScorePlay media ${p.scoreplay.mediaId}`, real: p.scoreplay.mode === "live", note: p.scoreplay.mode === "live" ? "live ScorePlay" : "fixture: ScorePlay-shaped record, local fallback b-roll" },
    videoUnderstanding: { source: "TwelveLabs Pegasus 1.6 (windowed analyze)", real: true, mode: p.manifestMode, note: p.manifestMode === "live" ? "called live for this moment" : "recorded live response replayed" },
    rights: { source: "content rules + ScorePlay rights fields", real: p.scoreplay.mode === "live", rulesNote: "representative demo rules, not club policy", scoreplayFields: p.scoreplay.rightsFieldsUsed },
  };

  // ranking (decision layer: Jev -> Haiku -> formula) + post copy (Haiku -> template), per variant, in parallel
  const described = { label: p.manifest.moments[0]?.label ?? "moment", description: `${input.headline}. ${input.trigger.text}. ${p.manifest.summary}` };
  const extras = await Promise.all(p.variants.map(async (v) => {
    const [fit, copy] = await Promise.all([
      scoreFit(described, v.audience),
      generateCopy({ orgKey: input.orgKey, audience: v.audience, channels: v.channels, headline: input.headline, kicker: input.kicker, statLine: input.statLine, summary: p.manifest.summary }),
    ]);
    return { ranking: rank(fit.eventWeight, fit.audienceFit, [input.trigger], fit.backend, fit.confidence), copy };
  }));

  const ids: string[] = [];
  for (const [i, v] of p.variants.entries()) {
    const { ranking, copy } = extras[i];
    const [opp] = await db.insert(s.opportunities).values({
      orgId, dedupeKey: hash(`${orgId}:${runSlug}:${v.contentType}:${v.audience}`), momentId: moment.id, signalIds: [signal.id],
      sport: org.sport, audience: v.audience, contentType: v.contentType, channels: v.channels,
      score: ranking.score, scoreBreakdown: ranking.breakdown,
      headline: input.headline.toUpperCase(), generatedCopy: copy.copy,
      compliance: complianceStamp(p, v.channels, p.scoreplay.mode === "live" ? "scoreplay_metadata" : "scoreplay_fixture"),
      status: "draft_ready",
      draftPaths: Object.fromEntries(v.channels.map((c) => [c, v.posterPublicPath])),
      finalPaths: {},
      delivery: {
        variant: v, inputs: { ...inputs, copy: { source: copy.backend === "haiku" ? `Claude ${copy.model}` : "template", real: copy.backend === "haiku", note: copy.error ? `fallback: ${copy.error}` : "producer edits before publish" } },
        content: p.content, window: p.window, tightWindow: p.tightWindow, scoreplay: p.scoreplay, processMs, slug: runSlug, orgKey: input.orgKey,
        draftVideo: v.contentType === "reel" ? v.publicPath : null, triggers: [input.trigger], triggerWindows: [{ start: input.startSec, end: input.endSec }], ranking,
      },
      expiresAt: new Date(Date.now() + 48 * 3600_000),
    }).onConflictDoUpdate({
      target: s.opportunities.dedupeKey,
      set: { status: "draft_ready", delivery: sql`excluded.delivery`, draftPaths: sql`excluded.draft_paths`, compliance: sql`excluded.compliance`, score: sql`excluded.score`, scoreBreakdown: sql`excluded.score_breakdown`, generatedCopy: sql`excluded.generated_copy` },
      // belt and braces: never let a dedupe collision touch another org's row (the key includes orgId too)
      setWhere: sql`${s.opportunities.orgId} = excluded.org_id`,
    }).returning();
    if (!opp) throw new Error(`dedupe key collided with another org's opportunity; refusing cross-org update (org ${orgId})`);
    ids.push(opp.id);
  }
  log(`process_moment ${runSlug}: ${ids.length} opportunities in ${processMs}ms (manifest ${p.manifestMode}, scoreplay ${p.scoreplay.mode}, verdict ${p.content.verdict}, rank ${extras.map((e) => `${e.ranking.score}/${e.ranking.backend}`).join(",")}, copy ${extras.map((e) => e.copy.backend).join(",")})`);
  return ids;
}

// ── render_final ───────────────────────────────────────────────────────────────────────
async function handleRenderFinal(job: JobRow) {
  const { opportunityId, trimOverride } = job.payload as { opportunityId?: string; trimOverride?: { startSec: number; endSec: number } | null };
  if (!opportunityId) throw new Error(`render_final payload has no opportunityId (got ${JSON.stringify(job.payload).slice(0, 120)}); placeholder/seed job, nothing to render`);
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!opp) throw new Error(`opportunity ${opportunityId} not found`);
  const d = (opp.delivery ?? {}) as { variant?: Variant; tightWindow?: { start: number; end: number }; scoreplay?: ProcessedMoment["scoreplay"]; content?: ProcessedMoment["content"]; slug?: string; orgKey?: string; [k: string]: unknown };
  if (!d.variant || !d.scoreplay || !d.tightWindow || !d.slug) {
    // seeded demo cards have no pipeline provenance: mark honestly instead of pretending to render
    await db.update(s.opportunities).set({ status: "rendered", delivery: { ...d, final: { skipped: "seed card without pipeline provenance (demo fixture)" } } }).where(eq(s.opportunities.id, opp.id));
    return;
  }
  await db.update(s.opportunities).set({ status: "rendering" }).where(eq(s.opportunities.id, opp.id));

  // PUBLISH-TIME rights re-check (windows expire between draft and approve)
  const media = (await sp.getMedia(d.scoreplay.mediaId)).data;
  const channels = opp.channels as Channel[];
  const recheck = evaluate(channels, [...(d.content?.restrictions ?? []), ...restrictionsFromScorePlay(media)]);
  if (recheck.status === "blocked") {
    await db.update(s.opportunities).set({ status: "draft_ready", compliance: { ...(opp.compliance as Compliance), status: "blocked", reasons: recheck.reasons }, delivery: { ...d, final: { blockedAt: new Date().toISOString(), reasons: recheck.reasons } } }).where(eq(s.opportunities.id, opp.id));
    throw new Error(`blocked at publish-time re-check: ${recheck.reasons.join("; ")}`);
  }

  const win = trimOverride ?? { startSec: d.tightWindow.start, endSec: d.tightWindow.end };
  const slug = d.slug; // the SAME folder the drafts were rendered into (never recomputed from times)
  const outDir = renderDir(slug);
  const fm = await sp.downloadFormats(d.scoreplay.mediaId);
  const best = sp.bestSource(fm.data, "video");
  const srcPath = best?.file_url?.startsWith("file:") ? new URL(best.file_url).pathname : join(outDir, `source-${d.scoreplay.mediaId}.mp4`);
  const backend = await getRenderBackend();
  const finals: Record<string, string> = {};
  const t0 = performance.now();
  if (d.variant.contentType === "reel") {
    const r = await backend.render({
      orgId: opp.orgId, sourcePath: srcPath, startSec: win.startSec, endSec: win.endSec, channel: "instagram_reel", mode: "final", cropXOffset: undefined,
      ...({ club: d.orgKey ?? orgKeyFor(opp.sport), captionText: { headline: opp.headline }, outDir, slug: "reel", renderActions: d.content?.renderActions } as object),
    } as never);
    for (const c of channels) finals[c] = publicPathFor(slug, r.outPath);
  } else {
    for (const c of channels) finals[c] = d.variant.publicPath; // photo card is already final quality
  }
  const renderMs = Math.round(performance.now() - t0);

  // ScorePlay write-back: the approved moment as a video log on its source media (idempotent per opportunity)
  const wb = await sp.writeMomentAsVideoLog({
    mediaId: d.scoreplay.mediaId, companyId: d.scoreplay.companyId, startSec: win.startSec, endSec: win.endSec,
    ref: opp.id, label: `${opp.headline} (${opp.audience})`, tags: ["clout-approved", d.variant.contentType],
  });
  await db.update(s.opportunities).set({
    status: "rendered", finalPaths: finals,
    compliance: { ...(opp.compliance as Compliance), status: recheck.status, reasons: recheck.reasons },
    delivery: { ...d, final: { renderMs, window: win, recheckedAt: new Date().toISOString() }, scoreplayWriteBack: { mode: wb.mode, created: wb.data.created, logId: wb.data.entry?.id ?? null, wouldSend: wb.wouldSend ?? null } },
  }).where(eq(s.opportunities.id, opp.id));
  log(`render_final ${opp.id}: ${renderMs}ms, write-back ${wb.mode} (log ${wb.data.entry?.id ?? "n/a"}, created=${wb.data.created})`);
}

const orgKeyFor = (sport: string) => (sport === "soccer" ? "tottenham-hotspur" : "san-antonio-spurs");

// ── loop ───────────────────────────────────────────────────────────────────────────────
export async function runOnce(): Promise<number> {
  let n = 0;
  for (let job = await claimJob(); job; job = await claimJob()) {
    n++;
    try {
      if (job.type === "process_moment") await handleProcessMoment(job);
      else if (job.type === "render_final") await handleRenderFinal(job);
      await finish(job.id);
    } catch (e) {
      log(`job ${job.id} (${job.type}) failed: ${(e as Error).message}`);
      await finish(job.id, (e as Error).message.slice(0, 1000));
    }
  }
  return n;
}

export async function close() { await client.end(); }

if (import.meta.url === `file://${process.argv[1]}`) {
  await requeueStale();
  if (process.argv.includes("--once")) {
    const n = await runOnce();
    log(`--once: processed ${n} job(s)`);
    await close();
  } else {
    log(`worker ${WORKER_ID} polling every ${POLL_MS}ms (scoreplay ${sp.mode()}, twelvelabs ${process.env.TWELVELABS_API_KEY && process.env.MOCK_MODE !== "1" ? "live" : "fixture"})`);
    let stop = false;
    process.on("SIGINT", () => { stop = true; });
    process.on("SIGTERM", () => { stop = true; });
    while (!stop) {
      const n = await runOnce();
      if (!n) await new Promise((r) => setTimeout(r, POLL_MS));
    }
    await close();
  }
}
