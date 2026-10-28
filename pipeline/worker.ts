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
import { processMoment, renderDir, publicPathFor, releaseSource, sourceForRender, SkipMoment, type MomentInput, type ProcessedMoment, type Variant } from "./moment";
import { sourceWindowOf } from "./live-source";
import { logMoment, tickLive } from "./live-director";
import { LIVE_LANE } from "../shared/live-match";
import { getRenderBackend } from "./render-backend";
import { overlapRatio, SAME_PLAY } from "./watchlist";
import { storageMode } from "../shared/storage";
import { purgeLocalMedia } from "./local-media";
import { workerHealth } from "./health";
import { scoreFit } from "../shared/clients/decisions";
import { generateCopy } from "../shared/copy";
import { configureWriteStore, enqueueWrite, sendWrite, writeStatus } from "../shared/clients/writeback";
import { createDbWriteStore, sendableJobIds } from "../shared/write-store";
import { approvalRevision, sourceLogRequest } from "../shared/approval";
import { planCompilation, compilationStillValid, COMPILATION_LIMITS } from "../shared/compilation";
import { renderCompilation, renderVariants, variantHash, compilationHash } from "./production";
import { planPackaging, packagingSourceFromRow, type PackagingSource } from "../shared/packaging";
import type { RenderChannel } from "./render-backend";

storageMode();

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 3 });
export const db = drizzle(client, { schema: s });
// The ONE ScorePlay write path (B10): durable queue + send-time gates. No inline writes anywhere in the worker.
configureWriteStore(createDbWriteStore(db));
const STALE_MS = 5 * 60_000;
const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 1000);
const WORKER_ID = `${process.env.HOSTNAME ?? "m5"}:${process.pid}`;
/** Workers only claim jobs in their lane (payload.lane, default "default"). Tests run in a private lane so the
 * always-on production workers (Fargate, M5) can never steal a test's jobs, and vice versa. */
const LANE = process.env.WORKER_LANE ?? "default";

type JobRow = typeof s.jobs.$inferSelect;
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

export async function claimJob(): Promise<JobRow | null> {
  const rows = await db.execute<JobRow>(sql`
    update jobs set status = 'running', started_at = now(), attempts = attempts + 1
    where id = (select id from jobs where status = 'queued' and queued_at <= now() and type in ('process_moment','render_final','render_compilation','render_package')
                and coalesce(payload->>'lane', 'default') = ${LANE}
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
  const rows = (await db.select().from(s.opportunities).where(sql`${s.opportunities.orgId} = ${orgId}
    and ${s.opportunities.status} not in ('rejected','expired')
    and (${s.opportunities.delivery}->'scoreplay'->>'mediaId')::bigint = ${input.scorePlayMediaId}`))
    // a live match is one long media: only merge within the same live session (a re-run of the match starts fresh)
    .filter((o) => (o.delivery as { live?: { sessionId?: string } })?.live?.sessionId === input.live?.sessionId);
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
/** Calibration note: Jev answers below 0.7 confidence are not trustworthy on their own. We keep the score (it still
 * orders sensibly) but flag it so the UI never presents it as settled. Floor policy itself lives in decisions.ts. */
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
  const live = input.live as (MomentInput["live"] & { happenedAt?: string; label?: string }) | undefined;
  let p: ProcessedMoment;
  try {
    p = await processMoment(input, runSlug);
  } catch (e) {
    if (e instanceof SkipMoment && live) {
      await logMoment(db, live.sessionId, { at: input.startSec, kind: "skip", text: `Not clipped: ${e.reason}`, detail: e.verification?.description ? `Pegasus: ${e.verification.description}` : undefined });
      log(`process_moment ${runSlug}: skipped (${e.reason})`);
      return [];
    }
    throw e;
  }
  const processMs = Math.round(performance.now() - t0);
  const headline = p.live?.headline ?? input.headline, kicker = p.live?.kicker || input.kicker;

  // asset + moment rows (sport-agnostic; sport comes from the org)
  const [asset] = await db.insert(s.assets).values({
    orgId, source: p.scoreplay.mode === "live" ? "scoreplay" : "fixture", sourceRef: String(p.scoreplay.mediaId), sport: org.sport,
    title: headline, filePath: `scoreplay:${p.scoreplay.mediaId}`, durationSec: null, twelvelabsVideoId: input.twelvelabsAssetId ?? null, indexStatus: "ready",
  }).returning();
  const [moment] = await db.insert(s.moments).values({
    assetId: asset.id, label: p.manifest.moments[0]?.label ?? "moment", description: p.manifest.summary,
    startSec: p.tightWindow.start, endSec: p.tightWindow.end,
    confidence: 0, // Pegasus gives no calibrated confidence; UI must not show a fake number for this field
    detector: "pegasus_analyze", raw: p.manifest,
  }).returning();
  const [signal] = await db.insert(s.signals).values({
    orgId, kind: input.trigger.kind === "ai_watchlist" ? "context" : input.trigger.kind, simulated: input.trigger.simulated, sport: org.sport,
    payload: input.trigger, eventText: input.trigger.text, weight: 1, occurredAt: new Date(live?.happenedAt ?? job.queuedAt), momentId: moment.id,
  }).returning();

  const inputs = {
    trigger: { source: input.trigger.kind, text: input.trigger.text, real: !input.trigger.simulated },
    footage: { source: `ScorePlay media ${p.scoreplay.mediaId}`, real: p.scoreplay.mode === "live", note: p.scoreplay.mode === "live" ? "live ScorePlay" : "fixture: ScorePlay-shaped record, local fallback b-roll" },
    footageCut: p.live ? { source: `ScorePlay full match, cut ${p.live.cut.start.toFixed(0)}s to ${p.live.cut.end.toFixed(0)}s off the ${p.live.proxy} stream`, real: true, note: `cut in ${(p.live.cutMs / 1000).toFixed(1)}s; working copy deleted after rendering` } : undefined,
    videoUnderstanding: p.photo
      ? { source: "Club photographer's caption (ScorePlay)", real: true, mode: "photo", note: "a still: names and the activation come from the photographer's own caption, not from faces or player tags" }
      : { source: p.live ? "TwelveLabs Pegasus 1.6 (this cut, with a highlight check)" : "TwelveLabs Pegasus 1.6 (windowed analyze)", real: true, mode: p.manifestMode, note: p.manifestMode === "live" ? (p.live?.verification && live?.verify ? `confirmed: ${p.live.verification.description}` : "called live for this moment") : "recorded live response replayed" },
    format: input.format ? { source: input.format.label, real: true, note: "library mode: a kind of club footage, not a match moment" } : undefined,
    rights: { source: "content rules + ScorePlay rights fields", real: p.scoreplay.mode === "live", rulesNote: "representative demo rules, not club policy", scoreplayFields: p.scoreplay.rightsFieldsUsed },
  };

  // ranking (decision layer: Jev -> Haiku -> formula) + post copy (Haiku -> template), per variant, in parallel
  const described = { label: p.manifest.moments[0]?.label ?? "moment", description: `${headline}. ${input.trigger.text}. ${p.manifest.summary}` };
  const extras = await Promise.all(p.variants.map(async (v) => {
    const [fit, copy] = await Promise.all([
      scoreFit(described, v.audience),
      generateCopy({ orgKey: input.orgKey, audience: v.audience, channels: v.channels, headline, kicker, statLine: input.statLine, summary: p.manifest.summary }),
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
      headline: headline.toUpperCase(), generatedCopy: copy.copy,
      compliance: complianceStamp(p, v.channels, p.scoreplay.mode === "live" ? "scoreplay_metadata" : "scoreplay_fixture"),
      status: p.requiresReview ? "needs_review" : "draft_ready",
      draftPaths: Object.fromEntries(v.channels.map((c) => [c, v.posterPublicPath])),
      finalPaths: {},
      delivery: {
        variant: v, requiresReview: p.requiresReview, rightsInputs: p.rightsInputs, featuredPlayerIds: p.featuredPlayerIds, inputs: { ...inputs, copy: { source: copy.backend === "haiku" ? `Claude ${copy.model}` : "template", real: copy.backend === "haiku", note: copy.error ? `fallback: ${copy.error}` : "producer edits before publish" } },
        content: p.content, window: p.window, tightWindow: p.tightWindow, scoreplay: p.scoreplay, processMs, slug: runSlug, orgKey: input.orgKey,
        draftVideo: v.contentType === "reel" ? v.publicPath : null, triggers: [input.trigger], triggerWindows: [{ start: input.startSec, end: input.endSec }], ranking,
        ...(input.format ? { format: input.format } : {}), ...(p.photo ? { photo: true } : {}),
        ...(p.live && live ? { live: { sessionId: live.sessionId, matchId: live.matchId, cut: p.live.cut, label: p.live.label, verification: p.live.verification, happenedAt: live.happenedAt ?? null, kicker: p.live.kicker, cutMs: p.live.cutMs, analyzeMs: p.live.analyzeMs } } : {}),
      },
      expiresAt: new Date(Date.now() + 48 * 3600_000),
    }).onConflictDoUpdate({
      target: s.opportunities.dedupeKey,
      set: { status: p.requiresReview ? "needs_review" : "draft_ready", delivery: sql`excluded.delivery`, draftPaths: sql`excluded.draft_paths`, compliance: sql`excluded.compliance`, score: sql`excluded.score`, scoreBreakdown: sql`excluded.score_breakdown`, generatedCopy: sql`excluded.generated_copy` },
      // belt and braces: never let a dedupe collision touch another org's row (the key includes orgId too)
      setWhere: sql`${s.opportunities.orgId} = excluded.org_id`,
    }).returning();
    if (!opp) throw new Error(`dedupe key collided with another org's opportunity; refusing cross-org update (org ${orgId})`);
    ids.push(opp.id);
  }
  if (live) await logMoment(db, live.sessionId, { at: input.startSec, kind: "clip", text: `New clip in the inbox: ${headline.charAt(0) + headline.slice(1).toLowerCase()}`, detail: `${(processMs / 1000).toFixed(0)}s from trigger to draft (cut ${((p.live?.cutMs ?? 0) / 1000).toFixed(0)}s, Pegasus ${((p.live?.analyzeMs ?? 0) / 1000).toFixed(0)}s)` });
  log(`process_moment ${runSlug}: ${ids.length} opportunities in ${processMs}ms (manifest ${p.manifestMode}, scoreplay ${p.scoreplay.mode}, verdict ${p.content.verdict}, rank ${extras.map((e) => `${e.ranking.score}/${e.ranking.backend}`).join(",")}, copy ${extras.map((e) => e.copy.backend).join(",")})`);
  return ids;
}

// ── render_final ───────────────────────────────────────────────────────────────────────
async function handleRenderFinal(job: JobRow) {
  const { opportunityId, trimOverride } = job.payload as { opportunityId?: string; trimOverride?: { startSec: number; endSec: number } | null };
  if (!opportunityId) throw new Error(`render_final payload has no opportunityId (got ${JSON.stringify(job.payload).slice(0, 120)}); placeholder/seed job, nothing to render`);
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!opp) throw new Error(`opportunity ${opportunityId} not found`);
  if (!["approved", "rendering", "rendered"].includes(opp.status)) throw new Error("Final render requires an approved opportunity");
  const d = (opp.delivery ?? {}) as { variant?: Variant; tightWindow?: { start: number; end: number }; scoreplay?: ProcessedMoment["scoreplay"]; content?: ProcessedMoment["content"]; slug?: string; orgKey?: string; [k: string]: unknown };
  if (d.requiresReview) throw new Error("Needs review: analysis/rights evidence is incomplete");
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
  const analysed = d.window as { start: number; end: number } | undefined;
  if (!Number.isFinite(win.startSec) || !Number.isFinite(win.endSec) || win.startSec < 0 || win.endSec <= win.startSec || !analysed || win.startSec < analysed.start || win.endSec > analysed.end) {
    throw new Error("Trim requires analysis/review of the entire requested source window");
  }
  const slug = d.slug; // the SAME folder the drafts were rendered into (never recomputed from times)
  const outDir = renderDir(slug);
  const backend = await getRenderBackend();
  const finals: Record<string, string> = {};
  const t0 = performance.now();
  if (d.variant.contentType === "reel") {
    // Re-fetch the source HERE: with several workers (Fargate + M5) the draft's worker may not be this one, and the
    // draft step already deleted its transient copy. Released in finally: club footage never outlives the render.
    // A live-match clip re-cuts only its own window off the stream (offsetSec maps absolute times onto that copy).
    const src = await sourceForRender(d.scoreplay.mediaId, outDir, d);
    try {
      const r = await backend.render({
        orgId: opp.orgId, sourcePath: src.local, startSec: win.startSec - src.offsetSec, endSec: win.endSec - src.offsetSec, channel: "instagram_reel", mode: "final", cropXOffset: undefined,
        ...({ club: d.orgKey ?? orgKeyFor(opp.sport), captionText: { headline: opp.headline }, outDir, slug: "reel", renderActions: d.content?.renderActions } as object),
      } as never);
      for (const c of channels) finals[c] = publicPathFor(slug, r.outPath);
    } finally {
      await releaseSource(src);
    }
  } else {
    for (const c of channels) finals[c] = d.variant.publicPath; // photo card is already final quality
  }
  const renderMs = Math.round(performance.now() - t0);

  // ScorePlay write-back through the single durable path (B10.4/B10.6): the approval's source-log job (same idempotency
  // key whether the UI or this worker enqueued it) is sent with send-time gates. Fixture/dry-run/kill-switch => held
  // with the exact would-send payload; retries reconcile by marker, never a second POST.
  const approved = { ...opp, trimOverride: trimOverride ?? opp.trimOverride };
  const reqd = sourceLogRequest(approved, approvalRevision(approved), "editor");
  let writeBack: Record<string, unknown> = { state: "skipped", reason: reqd.ok ? undefined : reqd.reason };
  if (reqd.ok) {
    const job = await enqueueWrite(reqd.request);
    await sendWrite(job.id);
    const after = await writeStatus(job.id);
    const r = (after?.result ?? {}) as { mode?: string; body?: unknown; path?: string; data?: { created?: boolean; entry?: { id?: number } | null }; wouldSend?: unknown };
    writeBack = {
      jobId: job.id, state: after?.state, error: after?.error ?? null, mode: r.mode ?? null,
      created: r.data?.created ?? false, logId: r.data?.entry?.id ?? null,
      wouldSend: r.mode === "dry_run" ? { path: r.path, body: r.body } : r.wouldSend ?? null,
    };
  }
  await db.update(s.opportunities).set({
    status: "rendered", finalPaths: finals,
    compliance: { ...(opp.compliance as Compliance), status: recheck.status, reasons: recheck.reasons },
    delivery: { ...d, final: { renderMs, window: win, recheckedAt: new Date().toISOString() }, scoreplayWriteBack: writeBack },
  }).where(eq(s.opportunities.id, opp.id));
  log(`render_final ${opp.id}: ${renderMs}ms, write-back ${writeBack.state} (job ${writeBack.jobId ?? "n/a"})`);
}

/** Retry pending/failed/held write jobs with backoff; held jobs resume automatically once writes are enabled. */
export async function drainWriteBacks(): Promise<number> {
  const ids = await sendableJobIds(db);
  for (const id of ids) {
    try { await sendWrite(id); } catch (e) { log(`write-back ${id} error: ${(e as Error).message}`); }
  }
  return ids.length;
}

// ── render_compilation ─────────────────────────────────────────────────────────────────
/**
 * Three-clip montage (A3.5/B5.3). Payload: {compilationId, entries:[{opportunityId}], revision}. The worker re-reads
 * every source opportunity, re-plans (approved, not blocked, budget) and requires the SAME ordered revision the editor
 * approved, so a clip that was un-approved or blocked after queueing fails the job instead of rendering.
 * Sources are transient copies, released in finally (club footage never outlives the render).
 */
async function handleRenderCompilation(job: JobRow) {
  const { compilationId, entries, revision } = job.payload as { compilationId?: string; entries?: { opportunityId: string }[]; revision?: string };
  if (!compilationId || !entries?.length || !revision || !/^[a-zA-Z0-9_-]+$/.test(compilationId)) throw new Error("render_compilation payload needs {compilationId, entries, revision}");
  const ids = entries.map((e) => e.opportunityId);
  const rows = await db.select().from(s.opportunities).where(sql`${s.opportunities.id} in ${ids}`);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const candidates = ids.map((id) => {
    const o = byId.get(id);
    if (!o) throw new Error(`compilation entry ${id} no longer exists`);
    const d = (o.delivery ?? {}) as { requiresReview?: boolean; scoreplay?: { mediaId?: number }; tightWindow?: { start: number; end: number } };
    const t = o.trimOverride as { startSec: number; endSec: number } | null;
    return { opportunityId: o.id, headline: o.headline, status: o.status, complianceStatus: (o.compliance as Compliance)?.status ?? "unknown",
      requiresReview: !!d.requiresReview, mediaId: d.scoreplay?.mediaId ?? null, window: t ? { start: t.startSec, end: t.endSec } : d.tightWindow ?? null, score: o.score, orgId: o.orgId, orgKey: (o.delivery as { orgKey?: string })?.orgKey };
  });
  const plan = planCompilation(candidates);
  if (!plan.ok) throw new Error(`compilation no longer valid: ${plan.errors.join("; ")}`);
  if (plan.revision !== revision) throw new Error("compilation changed since approval (order, trim or source); re-approve");
  if (new Set(candidates.map((c) => c.orgId)).size !== 1) throw new Error("compilation entries must belong to one org");

  const outDir = renderDir(`compilation-${compilationId}`);
  const sources = new Map<string, Awaited<ReturnType<typeof sourceForRender>>>();
  const deliveryOf = new Map(rows.map((r) => [r.id, r.delivery]));
  // one working copy per source clip (a live clip's copy covers only its own window, so key by clip, not by media)
  const keyOf = (e: { opportunityId: string; mediaId: number }) => (sourceWindowOf(deliveryOf.get(e.opportunityId)) ? `opp:${e.opportunityId}` : `media:${e.mediaId}`);
  try {
    for (const e of plan.entries) if (!sources.has(keyOf(e))) sources.set(keyOf(e), await sourceForRender(e.mediaId, outDir, deliveryOf.get(e.opportunityId)));
    const club = candidates[0].orgKey ?? orgKeyFor(rows[0].sport);
    const variants = plan.entries.map((e, i) => {
      const src = sources.get(keyOf(e))!;
      const recipe = { id: `part${i}`, sourcePath: src.local, sourceMediaId: e.mediaId, startSec: e.startSec - src.offsetSec, endSec: e.endSec - src.offsetSec,
        channel: COMPILATION_LIMITS.channel, club, context: { use: "owned_fan_web", opportunityId: e.opportunityId, role: e.role }, policyVersion: "illustrative v0", cropXOffset: 0.5, muteAudio: true };
      return { ...recipe, approvedHash: variantHash(recipe) };
    });
    const manifest = { id: compilationId, entries: variants, targetDurationSec: COMPILATION_LIMITS.maxSec, channel: COMPILATION_LIMITS.channel };
    const approved = { ...manifest, approvedHash: compilationHash(manifest) };
    // Authorization re-checks the live rows at render start AND after intermediate renders (permissions can change).
    const stillApproved = async () => {
      const live = await db.select().from(s.opportunities).where(sql`${s.opportunities.id} in ${ids}`);
      return compilationStillValid(ids, new Map(live.map((r) => [r.id, { status: r.status, complianceStatus: (r.compliance as Compliance)?.status ?? "unknown" }]))).ok;
    };
    const t0 = performance.now();
    const r = await renderCompilation(approved, outDir, stillApproved, stillApproved);
    const out = { compilationId, revision, outPath: publicPathFor(`compilation-${compilationId}`, r.outPath), posterPath: publicPathFor(`compilation-${compilationId}`, r.posterPath),
      durationSec: r.durationSec, renderMs: Math.round(performance.now() - t0), entries: plan.entries };
    await db.update(s.jobs).set({ payload: { ...(job.payload as object), result: out } }).where(eq(s.jobs.id, job.id));
    log(`render_compilation ${compilationId}: ${plan.entries.length} clips, ${r.durationSec.toFixed(1)}s in ${out.renderMs}ms`);
    return out;
  } finally {
    for (const src of sources.values()) await releaseSource(src);
  }
}

const orgKeyFor = (sport: string) => (sport === "soccer" ? "tottenham-hotspur" : "san-antonio-spurs");

// ── render_package ─────────────────────────────────────────────────────────────────────
/** Build the packaging source for an opportunity row (shared by the worker and its tests). */
export async function packagingSourceFor(o: typeof s.opportunities.$inferSelect): Promise<PackagingSource> {
  const [m] = await db.select({ raw: s.moments.raw }).from(s.moments).where(eq(s.moments.id, o.momentId));
  return packagingSourceFromRow(o, m?.raw ?? null);
}

/**
 * Render the editor-approved destination variants (B12.3). Payload: {opportunityId, approved: {channel: revision}}.
 * The plan is rebuilt from the LIVE row; a destination renders only if it is still eligible AND its revision equals the
 * one approved (an edit after approval holds just that destination). Each destination succeeds or fails on its own;
 * successful ones are never re-rendered on retry. One transient source copy per job, released in finally.
 */
async function handleRenderPackage(job: JobRow) {
  const { opportunityId, approved } = job.payload as { opportunityId?: string; approved?: Record<string, string> };
  if (!opportunityId || !approved || !Object.keys(approved).length) throw new Error("render_package payload needs {opportunityId, approved}");
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!opp) throw new Error(`opportunity ${opportunityId} not found`);
  const d = (opp.delivery ?? {}) as { scoreplay?: { mediaId?: number }; slug?: string; orgKey?: string; packaging?: { variants?: Record<string, { status: string; revision?: string }> } } & Record<string, unknown>;
  if (!d.scoreplay?.mediaId || !d.slug) throw new Error("no ScorePlay source lineage on this card");
  const plan = planPackaging(await packagingSourceFor(opp));
  const prior = d.packaging?.variants ?? {};
  const results: Record<string, { status: "done" | "failed" | "held"; revision?: string; path?: string; width?: number; height?: number; durationSec?: number; error?: string; at: string }> = {};
  const at = new Date().toISOString();
  const todo: { channel: string; recipe: NonNullable<(typeof plan)[number]["recipe"]>; revision: string }[] = [];
  for (const [channel, revision] of Object.entries(approved)) {
    const p = plan.find((x) => x.channel === channel);
    if (!p) { results[channel] = { status: "failed", error: "unknown destination", at }; continue; }
    if (!p.eligible || !p.recipe) { results[channel] = { status: "held", error: p.reasons.join("; ") || "not eligible", at }; continue; }
    if (p.revision !== revision) { results[channel] = { status: "held", error: "changed since approval; approve this destination again", at }; continue; }
    if (prior[channel]?.status === "done" && prior[channel]?.revision === revision) continue; // already rendered: never re-render
    todo.push({ channel, recipe: p.recipe, revision });
  }
  const outDir = renderDir(d.slug);
  const finals = { ...((opp.finalPaths ?? {}) as Record<string, string>) };
  if (todo.length) {
    const src = await sourceForRender(d.scoreplay.mediaId, outDir, d);
    try {
      const club = d.orgKey ?? orgKeyFor(opp.sport);
      const manifests = todo.map(({ channel, recipe, revision }) => {
        const m = { id: `pkg-${channel}`, sourcePath: src.local, sourceMediaId: d.scoreplay!.mediaId!, startSec: recipe.startSec - src.offsetSec, endSec: recipe.endSec - src.offsetSec,
          channel: channel as RenderChannel, club, context: { use: channel === "fan_app" ? "owned_fan_web" : "owned_social", opportunityId, revision },
          policyVersion: "illustrative v0", cropXOffset: recipe.cropXOffset, muteAudio: recipe.muteAudio, caption: { headline: recipe.caption } };
        return { ...m, approvedHash: variantHash(m) };
      });
      // Authorize each exact recipe again at render start: the row may have been un-approved or blocked meanwhile.
      const authorize = async (v: { id: string; context: Record<string, unknown> }) => {
        const [live] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
        if (!live) return false;
        const lp = planPackaging(await packagingSourceFor(live)).find((x) => x.channel === v.id.replace(/^pkg-/, ""));
        return !!lp?.eligible && lp.revision === v.context.revision;
      };
      const rendered = await renderVariants(manifests, outDir, authorize);
      for (const r of rendered) {
        const channel = r.id.replace(/^pkg-/, "");
        const revision = todo.find((t) => t.channel === channel)!.revision;
        if (r.status === "done") {
          const path = publicPathFor(d.slug, r.outPath);
          results[channel] = { status: "done", revision, path, durationSec: r.durationSec, at };
          finals[channel] = path;
        } else results[channel] = { status: "failed", revision, error: r.error, at };
      }
    } finally {
      await releaseSource(src);
    }
  }
  const [fresh] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  const fd = (fresh.delivery ?? {}) as Record<string, unknown> & { packaging?: Record<string, unknown> & { variants?: Record<string, unknown> } };
  await db.update(s.opportunities).set({
    finalPaths: finals,
    delivery: { ...fd, packaging: { ...(fd.packaging ?? {}), variants: { ...(fd.packaging?.variants ?? {}), ...results } } },
  }).where(eq(s.opportunities.id, opportunityId));
  const summary = Object.entries(results).map(([c, r]) => `${c}:${r.status}`).join(" ");
  log(`render_package ${opportunityId}: ${summary || "nothing new to render"}`);
  if (Object.values(results).some((r) => r.status === "failed")) throw new Error(`some destinations failed: ${summary}`);
}

// ── loop ───────────────────────────────────────────────────────────────────────────────
export async function runOnce(): Promise<number> {
  let n = 0;
  for (let job = await claimJob(); job; job = await claimJob()) {
    n++;
    try {
      if (job.type === "process_moment") await handleProcessMoment(job);
      else if (job.type === "render_final") await handleRenderFinal(job);
      else if (job.type === "render_compilation") await handleRenderCompilation(job);
      else if (job.type === "render_package") await handleRenderPackage(job);
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
  log("startup media sweep", await purgeLocalMedia());
  await requeueStale();
  if (process.argv.includes("--once")) {
    const n = await runOnce();
    log(`--once: processed ${n} job(s)`);
    await close();
  } else {
    log(`worker ${WORKER_ID} polling every ${POLL_MS}ms (scoreplay ${sp.mode()}, twelvelabs ${process.env.TWELVELABS_API_KEY && process.env.MOCK_MODE !== "1" ? "live" : "fixture"})`);
    // tiny HTTP health endpoint so a container host (Fargate/Railway/etc.) can health-check the worker,
    // which otherwise has no open port. Off unless WORKER_HEALTH_PORT is set.
    let healthServer: import("node:http").Server | undefined;
    const hp = Number(process.env.WORKER_HEALTH_PORT ?? process.env.PORT ?? 0);
    if (hp) {
      const http = await import("node:http");
      let lastOk = Date.now();
      healthServer = http.createServer(async (_req, res) => {
        const health = await workerHealth(WORKER_ID, LANE, lastOk);
        res.writeHead(health.ok ? 200 : 503, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify(health));
      }).listen(hp, () => log(`health endpoint on :${hp}`));
      (globalThis as { __markLoop?: () => void }).__markLoop = () => { lastOk = Date.now(); };
    }
    let stop = false;
    process.on("SIGINT", () => { stop = true; });
    process.on("SIGTERM", () => { stop = true; });
    // the live lane also runs the live director: it advances the match and queues moments as they air
    const liveTick = LANE === LIVE_LANE ? setInterval(() => { void tickLive(db, log); }, 1000) : null;
    if (liveTick) log("live director on: watching the live match session");
    while (!stop) {
      const n = await runOnce();
      const w = await drainWriteBacks().catch((e) => { log(`write-back drain error: ${(e as Error).message}`); return 0; });
      (globalThis as { __markLoop?: () => void }).__markLoop?.();
      if (!n && !w) await new Promise((r) => setTimeout(r, POLL_MS));
    }
    if (liveTick) clearInterval(liveTick);
    healthServer?.close();
    await close();
  }
}
