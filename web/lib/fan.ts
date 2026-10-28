"use server";

/**
 * Fan catalog server layer: publish/withdraw (editor), feed/search/detail/playback (fan).
 * Every fan read goes through `currentViewableVersions`, which applies canViewPublication. Drafts, unpublished
 * opportunities and raw ScorePlay media are never reachable from here.
 */
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { db, schema as s } from "@/lib/db";
import type { Compliance } from "@shared/schemas";
import { canViewPublication, publicationStateAt, type PublicationVersion } from "@shared/publication";
import { fanRightsStatus, revisionHash, artifactHash, pickFanArtifact, FAN_POLICY_VERSION, FAN_INTERESTS, suggestInterestTags } from "@shared/fan-catalog";
import { rankForFan, DEMO_FAN_PERSONAS } from "@shared/fan-ranking";
import { allowedIndexedAssetIds, buildFanSearchRequest, mapHitsToPublishedDerivatives, metadataSearch } from "@shared/fan-search";
import { PLAYERS, playersFor, playerById, suggestPlayers, matchSquadName } from "@shared/player-identity";
import { captionPlayer } from "@shared/library";
import footageMap from "../../data/footage-map.json" with { type: "json" };
import timeline from "../../data/replays/thfc-mnu-week6.json" with { type: "json" };
import themes from "../../pipeline/club-themes.json" with { type: "json" };
import { RENDER_ROOT, renderSegments } from "@/lib/serve-file";

type VersionRow = typeof s.publicationVersions.$inferSelect;
type OppRow = typeof s.opportunities.$inferSelect;

const tlVideoByMedia = new Map(
  (footageMap as { media: { scorePlayMediaId: number; twelvelabsVideoId?: string }[] }).media
    .filter((m) => m.twelvelabsVideoId)
    .map((m) => [m.scorePlayMediaId, m.twelvelabsVideoId!]),
);
const playerName = (id: string) => playerById(id)?.displayName ?? id;

function toContract(v: VersionRow): PublicationVersion {
  return {
    id: v.id, publicationId: v.publicationId, version: v.version, orgId: v.orgId, state: v.state as PublicationVersion["state"],
    approvedRevisionHash: v.approvedRevisionHash, artifactId: v.artifactId, artifactHash: v.artifactHash, renderPath: v.renderPath,
    twelveLabsAssetId: v.twelvelabsAssetId, indexedAssetId: v.indexedAssetId, durationSec: v.durationSec,
    featuredPlayerIds: (v.featuredPlayerIds as string[]) ?? [], interestTags: (v.interestTags as string[]) ?? [], claimIds: (v.claimIds as string[]) ?? [],
    rightsDecisionId: v.rightsDecisionId ?? "00000000-0000-0000-0000-000000000000",
    validFrom: v.validFrom.toISOString(), validUntil: v.validUntil?.toISOString() ?? null,
    destination: v.destination as PublicationVersion["destination"],
  };
}

function oppMetadata(opp: OppRow) {
  const d = (opp.delivery ?? {}) as { fanMetadata?: { featuredPlayerIds: string[]; interestTags: string[]; reviewedBy?: string; reviewedAt?: string }; featuredPlayerIds?: string[]; scoreplay?: { mediaId?: number }; tightWindow?: { start: number; end: number } };
  return {
    featuredPlayerIds: d.fanMetadata?.featuredPlayerIds ?? [],
    interestTags: d.fanMetadata?.interestTags ?? [],
    reviewed: !!d.fanMetadata?.reviewedAt,
    mediaId: d.scoreplay?.mediaId ?? null,
    tightWindow: d.tightWindow ?? null,
  };
}

// ── editor: metadata review (B8.7) ─────────────────────────────────────────────────────
export async function saveFanMetadata(opportunityId: string, featuredPlayerIds: string[], interestTags: string[]) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };
  const known = new Set(PLAYERS.map((p) => p.id));
  const unknown = featuredPlayerIds.filter((p) => !known.has(p));
  if (unknown.length) return { ok: false as const, error: `Unknown player id(s): ${unknown.join(", ")}` };
  const delivery = { ...((opp.delivery ?? {}) as Record<string, unknown>), fanMetadata: { featuredPlayerIds: [...new Set(featuredPlayerIds)], interestTags: [...new Set(interestTags)], reviewedBy: "editor", reviewedAt: new Date().toISOString() } };
  await db.update(s.opportunities).set({ delivery }).where(eq(s.opportunities.id, opportunityId));
  await db.insert(s.approvalAudits).values({ orgId: opp.orgId, opportunityId, actor: "editor", action: "metadata_review", payload: { featuredPlayerIds, interestTags } });
  revalidatePath("/");
  return { ok: true as const };
}

// ── editor: publish to fan catalog (B4.4) ──────────────────────────────────────────────
export async function publishToFanCatalog(opportunityId: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!opp) return { ok: false as const, error: "Opportunity not found" };
  if (!["approved", "rendered", "exported"].includes(opp.status)) return { ok: false as const, error: "Approve the clip before publishing to the fan app" };

  const artifact = pickFanArtifact(opp.finalPaths as Record<string, string>);
  if (!artifact) return { ok: false as const, error: "No final render yet: publishing waits for the approved final (drafts never publish)" };

  const d = (opp.delivery ?? {}) as { requiresReview?: boolean };
  const rights = fanRightsStatus(opp.compliance as Compliance, !!d.requiresReview);
  if (rights !== "cleared") return { ok: false as const, error: `Fan app requires cleared rights; current status: ${rights.replace(/_/g, " ")}` };

  const meta = oppMetadata(opp);
  if (!meta.reviewed) return { ok: false as const, error: "Review clip metadata (featured players, interests) before publishing" };

  const segs = renderSegments(artifact.renderPath);
  let fingerprint = "missing";
  if (segs) {
    try { const st = await stat(resolve(RENDER_ROOT, ...segs)); fingerprint = `${st.size}:${st.mtimeMs}`; } catch { /* file on another laptop */ }
  }
  if (fingerprint === "missing") return { ok: false as const, error: "Final render file is not on this machine; run the web app on the worker laptop" };

  const trim = (opp.trimOverride as { startSec: number; endSec: number } | null) ?? null;
  const copy = (opp.generatedCopy as Record<string, string>)[artifact.channel] ?? opp.headline;
  const approvedRevisionHash = revisionHash({ opportunityId, trim, copy, renderPath: artifact.renderPath, featuredPlayerIds: meta.featuredPlayerIds, interestTags: meta.interestTags });
  const range = trim ? { start: trim.startSec, end: trim.endSec } : meta.tightWindow;
  const now = new Date();
  const destination = { orgId: opp.orgId, platform: "fan_app", territories: [] as string[], use: "owned_fan_web" as const, language: "en", releaseAt: now.toISOString(), policyVersion: FAN_POLICY_VERSION };

  const [decision] = await db.insert(s.rightsDecisions).values({
    orgId: opp.orgId, subjectType: "opportunity", subjectId: opportunityId, context: destination, status: rights,
    ruleSetVersion: FAN_POLICY_VERSION, artifactHash: approvedRevisionHash,
  }).returning();
  for (const reason of (opp.compliance as Compliance)?.reasons ?? []) {
    await db.insert(s.rightsFindings).values({ decisionId: decision.id, ruleId: "compliance-stamp", status: rights, rationale: reason });
  }

  let [pub] = await db.select().from(s.publications).where(eq(s.publications.opportunityId, opportunityId));
  if (!pub) [pub] = await db.insert(s.publications).values({ orgId: opp.orgId, opportunityId, state: "preparing" }).returning();
  const prior = await db.select().from(s.publicationVersions).where(eq(s.publicationVersions.publicationId, pub.id)).orderBy(desc(s.publicationVersions.version));
  if (prior[0] && prior[0].approvedRevisionHash === approvedRevisionHash && prior[0].state === "published") {
    return { ok: true as const, message: "Already published (same approved revision)" };
  }

  const [version] = await db.insert(s.publicationVersions).values({
    publicationId: pub.id, orgId: opp.orgId, version: (prior[0]?.version ?? 0) + 1, state: "published",
    approvedRevisionHash, artifactId: `${opportunityId}:${artifact.channel}`, artifactHash: artifactHash(artifact.renderPath, fingerprint),
    renderPath: artifact.renderPath, twelvelabsAssetId: null,
    indexedAssetId: meta.mediaId ? tlVideoByMedia.get(meta.mediaId) ?? null : null,
    durationSec: range ? Math.max(0, range.end - range.start) : 0,
    sourceRanges: range ? [range] : [], featuredPlayerIds: meta.featuredPlayerIds, interestTags: meta.interestTags,
    rightsDecisionId: decision.id, destination, validFrom: now,
  }).returning();
  // Atomic replace (B4.6): old version is superseded only after the new one exists.
  if (prior.length) await db.update(s.publicationVersions).set({ state: "withdrawn" }).where(and(eq(s.publicationVersions.publicationId, pub.id), inArray(s.publicationVersions.id, prior.map((p) => p.id))));
  await db.update(s.publications).set({ currentVersionId: version.id, state: "published", updatedAt: now }).where(eq(s.publications.id, pub.id));
  await db.insert(s.approvalAudits).values({ orgId: opp.orgId, opportunityId, actor: "editor", action: "publish_fan_app", payload: { versionId: version.id, approvedRevisionHash } });

  revalidatePath("/"); revalidatePath("/fan");
  return { ok: true as const, message: `Published v${version.version} to fan app` };
}

// ── editor: withdraw (B4.5) ────────────────────────────────────────────────────────────
export async function withdrawFromFanCatalog(opportunityId: string, reason: string) {
  const [pub] = await db.select().from(s.publications).where(eq(s.publications.opportunityId, opportunityId));
  if (!pub) return { ok: false as const, error: "Not published to the fan app" };
  await db.update(s.publicationVersions).set({ state: "withdrawn" }).where(eq(s.publicationVersions.publicationId, pub.id));
  await db.update(s.publications).set({ state: "withdrawn", updatedAt: new Date() }).where(eq(s.publications.id, pub.id));
  await db.insert(s.approvalAudits).values({ orgId: pub.orgId, opportunityId, actor: "editor", action: "withdraw_fan_app", reasonCode: reason || "editor_withdrawal", payload: {} });
  revalidatePath("/"); revalidatePath("/fan");
  return { ok: true as const };
}

export async function fanPublicationStatus(opportunityId: string) {
  const [pub] = await db.select().from(s.publications).where(eq(s.publications.opportunityId, opportunityId));
  if (!pub?.currentVersionId) return { state: pub?.state ?? "unpublished", version: null as number | null };
  const [v] = await db.select().from(s.publicationVersions).where(eq(s.publicationVersions.id, pub.currentVersionId));
  return { state: v ? publicationStateAt(toContract(v)) : pub.state, version: v?.version ?? null };
}

// ── fan reads ──────────────────────────────────────────────────────────────────────────
export interface FanClip {
  versionId: string; opportunityId: string | null; headline: string; caption: string; renderPath: string; posterPath: string | null;
  kind: "video" | "photo"; durationSec: number; featuredPlayerIds: string[]; playerNames: string[]; interestTags: string[];
  editorScore: number; publishedAt: string; sourceLabel: string;
}

async function currentViewableVersions(orgId: string) {
  const pubs = await db.select().from(s.publications).where(and(eq(s.publications.orgId, orgId), eq(s.publications.state, "published")));
  const ids = pubs.map((p) => p.currentVersionId).filter(Boolean) as string[];
  if (!ids.length) return [];
  const versions = await db.select().from(s.publicationVersions).where(inArray(s.publicationVersions.id, ids));
  return versions.filter((v) => canViewPublication(toContract(v), { orgId, use: "owned_fan_web" }).ok);
}

async function toFanClips(versions: VersionRow[]): Promise<FanClip[]> {
  const oppIds = [...new Set(versions.map((v) => v.artifactId.split(":")[0]))];
  const opps = oppIds.length ? await db.select().from(s.opportunities).where(inArray(s.opportunities.id, oppIds)) : [];
  const oppById = new Map(opps.map((o) => [o.id, o]));
  return versions.map((v) => {
    const [oppId, channel] = v.artifactId.split(":");
    const opp = oppById.get(oppId);
    const drafts = (opp?.draftPaths ?? {}) as Record<string, string>;
    const poster = Object.values(drafts).find((p) => /\.(jpe?g|png|webp)$/i.test(p)) ?? null;
    const players = (v.featuredPlayerIds as string[]) ?? [];
    return {
      versionId: v.id, opportunityId: opp?.id ?? null, headline: opp?.headline ?? "Clip",
      caption: (opp?.generatedCopy as Record<string, string> | undefined)?.[channel] ?? opp?.headline ?? "",
      renderPath: v.renderPath, posterPath: poster, kind: /\.mp4$/i.test(v.renderPath) ? "video" : "photo",
      durationSec: v.durationSec, featuredPlayerIds: players, playerNames: players.map(playerName),
      interestTags: (v.interestTags as string[]) ?? [], editorScore: opp?.score ?? 50, publishedAt: v.validFrom.toISOString(),
      sourceLabel: (timeline as { title?: string }).title ?? "Tottenham Hotspur vs Manchester United",
    };
  });
}

export async function fanOrgs() {
  return db.select({ id: s.orgs.id, name: s.orgs.name }).from(s.orgs).orderBy(s.orgs.name);
}

export async function fanFeed(orgId: string, prefs: { favoritePlayerIds: string[]; interestTags: string[] }) {
  const clips = await toFanClips(await currentViewableVersions(orgId));
  return rankForFan(clips.map((c) => ({ ...c, id: c.versionId, sourcePlayKey: c.opportunityId })), prefs, new Date(), playerName);
}

export async function fanPlayerClips(orgId: string, playerId: string) {
  const clips = await toFanClips(await currentViewableVersions(orgId));
  return clips.filter((c) => c.featuredPlayerIds.includes(playerId));
}

/** How many published clips feature each player (the fan Players list puts players with clips first). */
export async function fanClipCountsByPlayer(orgId: string) {
  const counts = new Map<string, number>();
  for (const v of await currentViewableVersions(orgId)) for (const id of (v.featuredPlayerIds as string[]) ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

export async function fanClip(orgId: string, versionId: string) {
  const versions = await currentViewableVersions(orgId);
  const v = versions.find((x) => x.id === versionId);
  if (!v) return null; // withdrawn/expired/unknown look identical: not available
  return (await toFanClips([v]))[0];
}

/** Playback grant (U5.2/U5.4): checked on EVERY media request, so withdrawal stops new playback immediately. */
export async function playbackPathFor(versionId: string): Promise<string | null> {
  const [v] = await db.select().from(s.publicationVersions).where(eq(s.publicationVersions.id, versionId));
  if (!v) return null;
  const [pub] = await db.select().from(s.publications).where(eq(s.publications.id, v.publicationId));
  if (!pub || pub.currentVersionId !== v.id || pub.state !== "published") return null;
  if (!canViewPublication(toContract(v), { orgId: v.orgId, use: "owned_fan_web" }).ok) return null;
  return v.renderPath;
}

export async function fanSearch(orgId: string, query: string) {
  const q = query.trim();
  if (!q) return { mode: "empty" as const, results: [] as (FanClip & { offsetStartSec?: number })[] };
  const versions = await currentViewableVersions(orgId);
  const clips = await toFanClips(versions);
  const clipById = new Map(clips.map((c) => [c.versionId, c]));
  const items = versions.map((v) => ({
    publicationVersionId: v.id, orgId: v.orgId, indexedAssetId: v.indexedAssetId ?? "", state: "published" as const, canView: true,
    sourceRanges: (v.sourceRanges as { start: number; end: number }[]) ?? [], durationSec: v.durationSec,
  }));
  const req = buildFanSearchRequest((timeline as { indexId: string }).indexId, q, allowedIndexedAssetIds(items));

  if (req.ok && process.env.TWELVELABS_API_KEY && process.env.MOCK_MODE !== "1") {
    try {
      const { searchMoments } = await import("@shared/clients/twelvelabs");
      const r = (await searchMoments(req.indexId, req.query, req.filter.id)) as { data?: { video_id: string; start: number; end: number; rank: number }[] };
      const mapped = mapHitsToPublishedDerivatives(r.data ?? [], items);
      return { mode: "ai" as const, results: mapped.flatMap((m) => { const c = clipById.get(m.publicationVersionId); return c ? [{ ...c, offsetStartSec: m.offsetStartSec }] : []; }) };
    } catch {
      /* fall through to the labelled metadata fallback */
    }
  }
  const hits = metadataSearch(q, clips.map((c) => ({ publicationVersionId: c.versionId, text: `${c.headline} ${c.caption}`, playerNames: c.playerNames, interestTags: c.interestTags })));
  return { mode: req.ok ? ("metadata_fallback" as const) : ("no_catalog" as const), results: hits.flatMap((h) => { const c = clipById.get(h.publicationVersionId); return c ? [c] : []; }) };
}

export async function demoPersonas() {
  return DEMO_FAN_PERSONAS.map((p) => ({ id: p.id, label: p.label, favoritePlayerIds: [...p.favoritePlayerIds], interestTags: [...p.interestTags] }));
}

/** Fan app club: ?org=<id> when valid, else Tottenham (the club with indexed real footage), else the first org. */
export async function resolveFanOrg(orgParam?: string) {
  const orgs = await db.select({ id: s.orgs.id, name: s.orgs.name }).from(s.orgs).orderBy(s.orgs.name);
  const org = orgs.find((o) => o.id === orgParam) ?? orgs.find((o) => o.name === "Tottenham Hotspur") ?? orgs[0] ?? null;
  const key = org ? Object.entries(themes as Record<string, { displayName?: string }>).find(([, t]) => t.displayName === org.name)?.[0] ?? null : null;
  return { org, orgKey: key, orgs };
}

export async function fanPlayersFor(orgKey: string | null) {
  return playersFor(orgKey).map((p) => ({ id: p.id, displayName: p.displayName, role: p.role ?? "player" }));
}

/** Editor review-pane props for the fan app panel. Suggestions come from moment text; the editor confirms. */
export async function fanAppPanelProps(opportunityId: string) {
  const [opp] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!opp) return null;
  const [org] = await db.select().from(s.orgs).where(eq(s.orgs.id, opp.orgId));
  const orgKey = org ? Object.entries(themes as Record<string, { displayName?: string }>).find(([, t]) => t.displayName === org.name)?.[0] ?? null : null;
  const players = playersFor(orgKey);
  const d = (opp.delivery ?? {}) as { fanMetadata?: { featuredPlayerIds: string[]; interestTags: string[]; reviewedAt?: string }; requiresReview?: boolean };
  const [moment] = await db.select().from(s.moments).where(eq(s.moments.id, opp.momentId));
  // suggestions come from text the club wrote or the analysis produced (headline, photographer caption / summary),
  // matched against the club's ScorePlay squad; the editor confirms before anything is published. A photographer's
  // caption names its SUBJECT first ("Sávio ... celebrates the goal scored by Dominic Solanke"): suggest the subject only.
  const text = `${opp.headline} ${moment?.description ?? ""}`;
  const team = org?.name ?? "";
  const subject = team ? captionPlayer(moment?.description ?? "", team) : null;
  const subjectHit = subject ? matchSquadName(subject.name, players) : null;
  const suggestedPlayers = subjectHit ? [subjectHit.id] : suggestPlayers(text, players);
  return {
    players: players.map((p) => ({ id: p.id, displayName: p.displayName, role: p.role ?? "player" })),
    interests: FAN_INTERESTS,
    suggested: { featuredPlayerIds: suggestedPlayers, interestTags: suggestInterestTags(text) },
    reviewed: d.fanMetadata ?? null,
    publication: await fanPublicationStatus(opportunityId),
    rightsLabel: fanRightsStatus(opp.compliance as Compliance, !!d.requiresReview).replace(/_/g, " "),
  };
}
