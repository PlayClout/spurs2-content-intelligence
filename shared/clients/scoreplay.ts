/**
 * ScorePlay adapter, built against the public OpenAPI spec (docs/vendor/scoreplay-openapi-2026-10-20.yaml).
 * Base https://media.scoreplay.io/v1 (dev: https://media.dev.scoreplay.io/v1). Auth: X-ScorePlay-Api-Key.
 *
 * Modes (per call, so tests and the UI can tell them apart):
 *   live    — SCOREPLAY_API_KEY set and MOCK_MODE != 1. Real HTTP.
 *   fixture — otherwise. Reads data/fallback-assets/fixtures/scoreplay-fixtures.json (SYNTHESIZED from the
 *             spec's own schemas + examples, not recorded; replace with recorded responses once keyed).
 *             Writes are NOT sent; they return the exact payload that WOULD be sent (`wouldSend`) so the
 *             demo can show it, labeled simulated.
 * Every function returns { mode, data } so the honesty label travels with the data.
 *
 * Spec facts this file depends on (all VERIFIED-DOC, unverified against a live key):
 *  - POST /video/logs body = { company_id, video_logs:[{ media_id, log:{ start_offset, end_offset, ... } }] },
 *    offsets in SECONDS; response is `true` (no log id). Read back via GET /media/{id}/logs, where
 *    start/end_timestamp are MILLISECONDS. VideoLog.external_id is the EVENT/MATCH external id used to
 *    find the media, NOT an id for the log — we never set it; we tag our logs via a comment marker.
 *  - 500 on /video/logs also means "invalid payload" -> never retried.
 *  - formats/download needs `can_do_media_download`; file_url is presigned, valid 24h.
 *  - Upload: POST /upload/event/{eventId}?parts=N -> PUT parts to presigned urls -> POST /upload/complete/{mediaId}.
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { canWrite, filterTags, rightsTagIds, type WriteRequest } from "./writeback";

export type Mode = "live" | "fixture";
export interface Result<T> { mode: Mode; data: T; wouldSend?: unknown }

// ── Response shapes (subset we read; spec has more fields) ──────────────────────────────
export interface SPMedia {
  ID: number;
  name: string;
  type: string; // photo | video
  date?: number;
  company_id: number;
  event_id?: number;
  team_id?: number;
  duration?: number; // seconds
  width?: number;
  height?: number;
  description?: string;
  validated?: boolean;
  is_private?: boolean;
  can_be_shared?: boolean;
  usage?: string; // e.g. "editorial"
  custom_terms?: string;
  accessible_from?: number; // unix s, 0 = unset
  accessible_until?: number; // unix s, 0 = unset
  external_accounts_drms?: { media_id: number; external_account_id: number; accessible_from: number; accessible_until: number }[] | null;
  player_ids?: number[];
  sponsor_ids?: number[];
  tag_option_ids?: number[];
  raw_tags?: string[] | null;
  thumbnail_url?: string;
  proxy_large?: string;
}
export interface SPMediaSearchResult { media: SPMedia[]; count?: number; page?: number; per_page?: number; total_pages?: number; next_cursor?: string }
export interface SPFormatFile { id: string; type: string; file_name: string; size: number; mime_type: string; file_url?: string; media_version_id: number; status?: string; is_scoreplay: boolean }
export interface SPMediaFormats { common_formats: string[] | null; items: Record<string, SPFormatFile[]> }
export interface SPVideoLogEntry {
  id: number; media_id: number; name?: string; external_id?: string;
  timestamp?: number; start_timestamp?: number; end_timestamp?: number; // seconds / ms / ms
  comment?: string | null; thumbnail_url?: string; sprite_url?: string; playback_url?: string;
  tags?: string[]; players?: { id: number; external_id?: string; name?: string }[];
}
export interface SPVideoLogList { items: SPVideoLogEntry[]; total: number; page: number; limit: number }
export interface SPTagSearch { tags: { ID: number; name: string; label: string }[]; players: { ID: number; full_name: string; external_id?: string }[]; sponsors: { ID: number; name: string; label: string }[] }
export interface SPWhoami { user_id: number; user_type: string; company: { name: string; subdomain: string } | null; rights: string[]; scope: { sponsor_id: number; team_ids: number[]; only_shared_content: boolean; require_validation: boolean; validator: boolean } }

// ── Config / transport ──────────────────────────────────────────────────────────────────
export const DEFAULT_BASE = "https://media.scoreplay.io/v1";
const base = () => (process.env.SCOREPLAY_API_BASE || DEFAULT_BASE).replace(/\/$/, "");
export function mode(): Mode {
  return process.env.SCOREPLAY_API_KEY && process.env.MOCK_MODE !== "1" ? "live" : "fixture";
}
/** Live WRITES are opt-in: until SCOREPLAY_WRITES=1 (set after ScorePlay signs off our taxonomy, docs/TAXONOMY.md),
 * live write calls return the exact request as `wouldSend` and send nothing. Reads are unaffected. */
export const writesEnabled = () => mode() === "live" && process.env.SCOREPLAY_WRITES === "1" && process.env.SCOREPLAY_WRITE_KILL_SWITCH === "0";

let fetchImpl: typeof fetch = (...a) => fetch(...a);
/** test seam: swap the transport to exercise the live request path without a key */
export function __setFetch(f: typeof fetch) { fetchImpl = f; }

export class ScorePlayError extends Error {
  constructor(public status: number, public path: string, public apiMessage: string, hint?: string) {
    super(`ScorePlay ${path} -> ${status} ${apiMessage}${hint ? ` (${hint})` : ""}`);
  }
}

const HINTS: Record<number, string> = {
  401: "invalid/missing key, or key lacks the permission for this endpoint (check GET /whoami rights)",
  404: "not found, or not visible to this key's scope",
};

async function api<T>(path: string, init: RequestInit & { retry?: boolean } = {}): Promise<T> {
  const retry = init.retry ?? true;
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(`${base()}${path}`, {
      ...init,
      headers: { "X-ScorePlay-Api-Key": process.env.SCOREPLAY_API_KEY ?? "", Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
    if (res.ok) {
      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T;
    }
    // Rate limits are undocumented: back off on 429/502/503/504 only. Never retry 500 (ScorePlay uses it for invalid payloads).
    if (retry && attempt < 2 && [429, 502, 503, 504].includes(res.status)) {
      const wait = Number(res.headers.get("Retry-After")) || 2 ** attempt;
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    let msg = "";
    try { msg = ((await res.json()) as { message?: string }).message ?? ""; } catch { /* non-JSON */ }
    throw new ScorePlayError(res.status, path, msg, HINTS[res.status]);
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────────────────────
interface Fixtures {
  whoami: SPWhoami;
  tagSearch: Record<string, SPTagSearch>;
  media: SPMedia[];
  formats: Record<string, SPMediaFormats>;
  logs: Record<string, SPVideoLogEntry[]>;
}
let fx: Fixtures | null = null;
const fixtureLogs = new Map<number, SPVideoLogEntry[]>(); // fixture-mode write-back store (per process)
let nextFixtureLogId = 900000;
async function fixtures(): Promise<Fixtures> {
  if (!fx) fx = JSON.parse(await readFile(new URL("../../data/fallback-assets/fixtures/scoreplay-fixtures.json", import.meta.url), "utf8")) as Fixtures;
  return fx;
}
/** fixture download urls point at repo files; resolve to absolute file:// at read time. Lazy: the web bundle
 * (Turbopack) evaluates this module at build time where import.meta.url is not a file URL. */
const repoRoot = () => {
  try { const u = new URL("./", import.meta.url); if (u.protocol === "file:") return new URL("../../", u); } catch { /* bundled */ }
  return pathToFileURL(`${process.cwd().endsWith("/web") ? join(process.cwd(), "..") : process.cwd()}/`);
};

// ── Read ────────────────────────────────────────────────────────────────────────────────
export async function whoami(): Promise<Result<SPWhoami>> {
  if (mode() === "fixture") return { mode: "fixture", data: (await fixtures()).whoami };
  return { mode: "live", data: await api<SPWhoami>("/whoami") };
}

export async function tagSearch(query: string): Promise<Result<SPTagSearch>> {
  if (query.length > 60) throw new Error("tag/search query max 60 chars (spec)");
  if (mode() === "fixture") {
    const f = await fixtures();
    const hit = f.tagSearch[query.toLowerCase()] ?? { tags: [], players: [], sponsors: [] };
    return { mode: "fixture", data: hit };
  }
  return { mode: "live", data: await api<SPTagSearch>(`/tag/search?query=${encodeURIComponent(query)}`) };
}

export interface MediaSearchBody {
  media_type?: "photo" | "video";
  event_id?: number;
  event_ids?: number[];
  players?: number[]; // AND
  any_players?: number[]; // OR
  tag_options?: number[];
  start_date?: number;
  end_date?: number;
  description?: string;
  smart_filter?: boolean;
  order_by?: string;
  validated_accessible?: boolean;
}
export async function mediaSearch(body: MediaSearchBody, page = 1, perPage = 50): Promise<Result<SPMediaSearchResult>> {
  if (mode() === "fixture") {
    const all = (await fixtures()).media;
    const m = all.filter((x) =>
      (!body.media_type || x.type === body.media_type) &&
      (!body.event_id || x.event_id === body.event_id) &&
      (!body.event_ids?.length || body.event_ids.includes(x.event_id ?? -1)) &&
      (!body.players?.length || body.players.every((p) => x.player_ids?.includes(p))) &&
      (!body.any_players?.length || body.any_players.some((p) => x.player_ids?.includes(p))) &&
      (!body.start_date || (x.date ?? 0) >= body.start_date) &&
      (!body.end_date || (x.date ?? 0) <= body.end_date));
    return { mode: "fixture", data: { media: m, count: m.length, page: 1, per_page: perPage, total_pages: 1 } };
  }
  return { mode: "live", data: await api<SPMediaSearchResult>(`/media/search?page=${page}&per_page=${perPage}`, { method: "POST", body: JSON.stringify(body) }) };
}

export async function getMedia(id: number): Promise<Result<SPMedia>> {
  if (mode() === "fixture") {
    const m = (await fixtures()).media.find((x) => x.ID === id);
    if (!m) throw new ScorePlayError(404, `/media/${id}`, "MEDIA_NOT_FOUND", "fixture");
    return { mode: "fixture", data: m };
  }
  return { mode: "live", data: await api<SPMedia>(`/media/${id}`) };
}

export async function downloadFormats(id: number): Promise<Result<SPMediaFormats>> {
  if (mode() === "fixture") {
    const f = (await fixtures()).formats[String(id)];
    if (!f) throw new ScorePlayError(404, `/media/${id}/formats/download`, "MEDIA_NOT_FOUND", "fixture");
    return { mode: "fixture", data: f };
  }
  return { mode: "live", data: await api<SPMediaFormats>(`/media/${id}/formats/download`) };
}

/** Best downloadable source for rendering. Video: the 1080p proxy first (ScorePlay's brief: "fetch the proxy"; ~6x
 * smaller than the original, same 1080 frame we output), then 720p, then original. Photo: original > photo > compressed.
 * Returns a fetchable URL (presigned when live, file:// in fixture). */
export function bestSource(f: SPMediaFormats, kind: "video" | "photo" = "video"): SPFormatFile | null {
  const order = kind === "video" ? ["video_large", "video_medium", "original", "video_small"] : ["original", "photo", "compressed"];
  const files = Object.values(f.items).flat().filter((x) => x.size !== -1 && x.file_url);
  for (const t of order) {
    const hit = files.find((x) => x.type === t);
    if (hit) return { ...hit, file_url: hit.file_url!.startsWith("repo:") ? new URL(hit.file_url!.slice(5), repoRoot()).href : hit.file_url };
  }
  return null;
}

export async function listVideoLogs(mediaId: number, page = 1, limit = 200): Promise<Result<SPVideoLogList>> {
  if (mode() === "fixture") {
    const items = [...((await fixtures()).logs[String(mediaId)] ?? []), ...(fixtureLogs.get(mediaId) ?? [])];
    return { mode: "fixture", data: { items, total: items.length, page: 1, limit } };
  }
  // live responses carry {items, page, limit} and no `total` (observed 2026-10-22): derive it
  const r = await api<Omit<SPVideoLogList, "total"> & { total?: number }>(`/media/${mediaId}/logs?page=${page}&limit=${limit}`);
  return { mode: "live", data: { ...r, items: r.items ?? [], total: r.total ?? (r.items ?? []).length } };
}

// ── Write-back: approved moment -> ScorePlay video log ────────────────────────────────────
export const CLOUT_MARKER = "clout:";
export interface MomentLog {
  mediaId: number;
  companyId: number;
  startSec: number;
  endSec: number;
  /** stable id for idempotency + read-back (we use the opportunity id) */
  ref: string;
  label: string; // human label, goes in the comment ahead of the marker
  tags?: string[]; // raw_tags, created if not existing
  playerIds?: number[];
}

export function buildVideoLogPayload(m: MomentLog, confirmedRights = false) {
  if (!Number.isFinite(m.startSec) || !Number.isFinite(m.endSec) || m.startSec < 0 || !(m.endSec > m.startSec)) throw new Error("video log: finite nonnegative startSec and endSec > startSec required");
  if (!Number.isSafeInteger(m.mediaId) || m.mediaId <= 0 || !Number.isSafeInteger(m.companyId) || m.companyId <= 0) throw new Error("video log: invalid media/company id");
  if (!m.ref || /[\[\]\r\n]/.test(m.ref)) throw new Error("video log: invalid marker reference");
  if (m.playerIds?.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error("video log: invalid player id");
  const keys = ["mediaId", "companyId", "startSec", "endSec", "ref", "label", "tags", "playerIds"];
  if (Object.keys(m).some((key) => !keys.includes(key))) throw new Error("video log: field outside write allow-list");
  const tags = filterTags(m.tags, confirmedRights);
  if (tags.dropped.length) console.warn("ScorePlay raw_tags dropped (not allowed):", tags.dropped.join(", "));
  return {
    company_id: m.companyId,
    video_logs: [{
      media_id: m.mediaId,
      log: {
        start_offset: Number(m.startSec.toFixed(3)),
        end_offset: Number(m.endSec.toFixed(3)),
        comment: `${m.label} [${CLOUT_MARKER}${m.ref}]`,
        ...(tags.allowed.length ? { raw_tags: tags.allowed } : {}),
        ...(m.playerIds?.length ? { player_ids: m.playerIds } : {}),
      },
    }],
  };
}

export function findOurLog(items: SPVideoLogEntry[], ref: string) {
  return items.find((x) => x.comment?.includes(`[${CLOUT_MARKER}${ref}]`)) ?? null;
}

/** Never conclude "not found" from only the first page. */
async function existingLog(mediaId: number, ref: string) {
  for (let page = 1; page <= 100; page++) {
    const r = (await listVideoLogs(mediaId, page)).data;
    const found = findOurLog(r.items, ref);
    if (found) return found;
    if (mode() === "fixture" || r.items.length < 200) return null;
  }
  throw new Error("Log pagination incomplete; refusing a duplicate-prone write");
}

/**
 * Idempotent write-back. Skips the POST if a log with our marker already exists (webhook/worker retries are safe).
 * Live: POST then re-read to return the created entry (ScorePlay returns only `true`; preview urls arrive later).
 */
export async function writeMomentAsVideoLog(m: MomentLog, confirmation?: Pick<WriteRequest, "confirmedBy" | "confirmedAt" | "source"> & { kind?: WriteRequest["kind"] }, reconcileOnly = false, currentApproval?: () => Promise<boolean>): Promise<Result<{ created: boolean; entry: SPVideoLogEntry | null }>> {
  const payload = buildVideoLogPayload(m, confirmation?.kind === "rights_record");
  const existing = await existingLog(m.mediaId, m.ref);
  if (existing) return { mode: mode(), data: { created: false, entry: existing } };

  if (reconcileOnly && mode() === "live") return { mode: "live", data: { created: false, entry: null }, wouldSend: {
    method: "POST", path: "/video/logs", body: payload, held: "Previous attempt ambiguous; reconcile provider marker before any resend",
  } };
  if (mode() === "fixture" || !writesEnabled()) {
    if (mode() === "live") return { mode: "live", data: { created: false, entry: null }, wouldSend: { method: "POST", path: "/video/logs", body: payload, held: "SCOREPLAY_WRITES!=1 (awaiting taxonomy sign-off)" } };
    const entry: SPVideoLogEntry = {
      id: nextFixtureLogId++, media_id: m.mediaId, name: m.label, comment: payload.video_logs[0].log.comment,
      start_timestamp: Math.round(m.startSec * 1000), end_timestamp: Math.round(m.endSec * 1000), tags: payload.video_logs[0].log.raw_tags ?? [],
    };
    fixtureLogs.set(m.mediaId, [...(fixtureLogs.get(m.mediaId) ?? []), entry]);
    return { mode: "fixture", data: { created: true, entry }, wouldSend: { method: "POST", path: "/video/logs", body: payload } };
  }
  if (!confirmation?.confirmedBy || !Number.isFinite(Date.parse(confirmation.confirmedAt)) || !["live", "cache"].includes(confirmation.source)) {
    return { mode: "live", data: { created: false, entry: null }, wouldSend: { method: "POST", path: "/video/logs", body: payload, held: "Requires confirmed live record through write-back queue" } };
  }
  const gate = await canWrite();
  if (!gate.allowed) return { mode: "live", data: { created: false, entry: null }, wouldSend: { method: "POST", path: "/video/logs", body: payload, held: gate.reason } };
  if (!currentApproval || !await currentApproval()) return { mode: "live", data: { created: false, entry: null }, wouldSend: { method: "POST", path: "/video/logs", body: payload, held: "Current approval unavailable or changed before send" } };
  const ok = await api<boolean>("/video/logs", { method: "POST", body: JSON.stringify(payload), retry: false });
  if (ok !== true) throw new ScorePlayError(200, "/video/logs", `unexpected response ${JSON.stringify(ok)}`);
  const entry = await existingLog(m.mediaId, m.ref);
  return { mode: "live", data: { created: true, entry }, ...(entry ? {} : { wouldSend: {
    method: "POST", path: "/video/logs", body: payload, held: "POST accepted; awaiting provider marker reconciliation (do not resend)",
  } }) };
}

/** Rendered media uploads are deferred. Club files stay on the local laptop. */
export async function uploadToEvent(eventId: number, filePath: string, meta: { description?: string; tags?: string[] }): Promise<Result<{ mediaId: number | null }>> {
  const tags = filterTags(meta.tags);
  return { mode: mode(), data: { mediaId: null }, wouldSend: {
    method: "POST", path: `/upload/event/${eventId}`, held: "Media uploads disabled: local-only event build",
    body: { name: basename(filePath), description: meta.description, raw_tags: tags.allowed },
  } };
}

/** Permission check against GET /whoami. Only `can_do_media_download` is named in the spec for our reads;
 * write permissions for video logs / upload are undocumented -> reported as unknown until a write test. */
export async function preflightRights() {
  const w = await whoami();
  const has = (r: string) => w.data.rights.includes(r);
  return {
    mode: w.mode,
    company: w.data.company,
    scope: w.data.scope,
    rights: w.data.rights,
    canDownload: has("can_do_media_download"),
    canWriteLogs: "unknown (undocumented permission; prove with a write test)" as const,
    canUpload: "unknown (undocumented permission; prove with a write test)" as const,
  };
}

export interface SPRosterPlayer { ID: number; full_name: string; external_id?: string }
export interface SPExternalGroup { id: number; name: string; active: boolean }
export type RightsInputs = {
  status: "available"; mode: Mode; media: SPMedia; roster: SPRosterPlayer[]; externalGroups: SPExternalGroup[]; fetchedAt: string;
} | { status: "needs_review"; mode: Mode; reason: string };
const rightsCache = new Map<string, { until: number; value: RightsInputs }>();
export function clearRightsCache() { rightsCache.clear(); }
/** Cached read facts only. "available" never means cleared. Failures are not cached or replaced by empty facts. */
export async function getRightsInputs(mediaId: number, opts: { teamSeasonId?: number; refresh?: boolean; ttlMs?: number } = {}): Promise<RightsInputs> {
  const key = JSON.stringify([base(), process.env.SCOREPLAY_API_KEY, mode(), mediaId, opts.teamSeasonId]);
  const cached = rightsCache.get(key);
  if (!opts.refresh && cached && cached.until > Date.now()) return structuredClone(cached.value);
  try {
    if (!Number.isSafeInteger(mediaId) || mediaId <= 0 || (opts.teamSeasonId !== undefined && (!Number.isSafeInteger(opts.teamSeasonId) || opts.teamSeasonId <= 0))) throw new Error("Invalid rights lookup IDs");
    const media = (await getMedia(mediaId)).data;
    if (media.ID !== mediaId || !Number.isSafeInteger(media.company_id) || media.company_id <= 0) throw new Error("Malformed media evidence");
    let roster: SPRosterPlayer[] = [], externalGroups: SPExternalGroup[] = [];
    if (mode() === "fixture") {
      roster = [...new Map(Object.values((await fixtures()).tagSearch).flatMap((t) => t.players).map((p) => [p.ID, p])).values()];
    } else {
      // Explicit season avoids silently treating the cross-season roster as current.
      if (!opts.teamSeasonId) return { status: "needs_review", mode: mode(), reason: "Current teamSeasonId is required for roster evidence" };
      for (let page = 1; ; page++) {
        const rows = await api<SPRosterPlayer[]>(`/players?team_season_id=${opts.teamSeasonId}&page=${page}&limit=100`);
        if (!Array.isArray(rows)) throw new Error("Malformed roster response");
        roster.push(...rows);
        if (rows.length < 100) break;
        if (page >= 100) throw new Error("Roster pagination limit reached; incomplete evidence");
      }
      for (let page = 1; ; page++) {
        const r = await api<{ items: SPExternalGroup[]; total?: number }>(`/external-groups?page=${page}&limit=100`);
        if (!Array.isArray(r.items)) throw new Error("Malformed external-groups response");
        externalGroups.push(...r.items);
        if (r.items.length < 100 || (r.total !== undefined && externalGroups.length >= r.total)) break;
        if (page >= 100) throw new Error("External-group pagination limit reached; incomplete evidence");
      }
    }
    const value: RightsInputs = { status: "available", mode: mode(), media, roster, externalGroups, fetchedAt: new Date().toISOString() };
    if (rightsCache.size >= 200) rightsCache.clear();
    rightsCache.set(key, { until: Date.now() + Math.max(0, Math.min(opts.ttlMs ?? 60_000, 60_000)), value });
    return structuredClone(value);
  } catch {
    rightsCache.delete(key);
    return { status: "needs_review", mode: mode(), reason: "ScorePlay rights metadata read failed; no clearance inferred" };
  }
}

/** Narrow transport used only by the single confirmed-rights queue. Checks settings immediately before mutation. */
export async function writeRightsTagOptions(mediaId: number, method: "POST" | "DELETE", ids: number[], owned: number[], confirmation: WriteRequest, currentApproval: () => Promise<boolean>) {
  if (!["POST", "DELETE"].includes(method) || confirmation.kind !== "rights_record" || !confirmation.confirmedBy || !Number.isFinite(Date.parse(confirmation.confirmedAt)) || !["live", "cache"].includes(confirmation.source)) throw new Error("Tags require a confirmed live rights record");
  const allowedIds = Object.values(rightsTagIds());
  if (!Number.isSafeInteger(mediaId) || mediaId <= 0 || !ids.length || ids.some((id) => !allowedIds.includes(id) || (method === "DELETE" && !owned.includes(id)))) throw new Error("Tag mutation outside owned allow-list");
  const body = { tag_option_ids: [...new Set(ids)] };
  const gate = await canWrite();
  if (!gate.allowed) return { sent: false as const, method, path: `/media/${mediaId}/tags`, body, held: gate.reason };
  if (!await currentApproval()) return { sent: false as const, method, path: `/media/${mediaId}/tags`, body, held: "Approval changed before send" };
  await api(`/media/${mediaId}/tags`, { method, body: JSON.stringify(body), retry: false });
  clearRightsCache();
  return { sent: true as const };
}
