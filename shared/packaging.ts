/**
 * Destination packaging (A3b.1-A3b.4, B12.1-B12.3). Pure: no DB, no network, no media I/O.
 * One approved clip -> one recipe per destination (social channels + the fan app). Each recipe carries its own cut,
 * aspect/size, crop, audio, caption and copy, plus an exact revision hash. Editing a recipe changes only that
 * destination's revision, so unchanged approved variants stay valid. The worker rebuilds the recipe from the live
 * row and refuses any destination whose revision no longer matches what the editor approved.
 */
import { createHash } from "node:crypto";
import profiles from "../pipeline/channel-profiles.json" with { type: "json" };
import { evaluate, type Restriction } from "./compliance";
import { beatsFrom, smartTrim, targetFor, trimModeOf, type Beat } from "./smart-trim";
import type { Channel } from "./schemas";

export interface DestinationProfile {
  label: string; kind?: string; aspect: string; width: number; height: number;
  maxDurationSec: number; targetDurationSec: number[]; copy: { maxChars: number };
}
const PROFILES = Object.fromEntries(Object.entries(profiles).filter(([k]) => !k.startsWith("$"))) as unknown as Record<string, DestinationProfile>;
export const DESTINATIONS = Object.keys(PROFILES);
export const FAN_APP = "fan_app";

export interface PackagingSource {
  opportunityId: string;
  headline: string;
  status: string;
  complianceStatus: string;
  requiresReview: boolean;
  /** stored content-rule restrictions (JSON: dates arrive as strings) */
  restrictions: unknown[];
  renderActions: string[];
  /** approved trim, else the tight window */
  window: { start: number; end: number } | null;
  /** the full window the AI analysed; cuts may never leave it */
  analysedWindow: { start: number; end: number } | null;
  subjectX: number | null;
  generatedCopy: Record<string, string>;
  /** TwelveLabs beats in the analysed window; with trimMode "smart" each channel gets its own smart cut */
  beats?: Beat[];
  /** "manual" = the editor set the cut; channels fit around it instead of re-cutting from beats */
  trimMode?: "smart" | "manual";
  /** per-destination editor overrides */
  overrides?: Record<string, Partial<Pick<VariantRecipe, "startSec" | "endSec" | "cropXOffset" | "copy" | "muteAudio">>>;
  /** the source is a ScorePlay photo: only photo destinations apply (a still cannot become a reel) */
  photo?: boolean;
}

export interface VariantRecipe {
  channel: string; label: string; kind: "video" | "photo"; aspect: string; width: number; height: number;
  startSec: number; endSec: number; cropXOffset: number; muteAudio: boolean; caption: string; copy: string;
}
export interface DestinationPlan {
  channel: string; label: string; eligible: boolean; reasons: string[]; notes: string[];
  recipe: VariantRecipe | null; revision: string | null;
}

const APPROVED = ["approved", "rendering", "rendered", "exported"];
const r3 = (x: number) => Math.round(x * 1000) / 1000;

type Win = { start: number; end: number };
/** Opportunity row (+ its moment's stored manifest) -> packaging source. One mapping for the worker and the web app. */
export function packagingSourceFromRow(o: { id: string; headline: string; status: string; compliance: unknown; delivery: unknown; trimOverride: unknown; generatedCopy: unknown }, momentRaw: unknown): PackagingSource {
  const d = (o.delivery ?? {}) as { requiresReview?: boolean; tightWindow?: Win; window?: Win; photo?: boolean;
    content?: { restrictions?: unknown[]; renderActions?: string[] }; packaging?: { overrides?: PackagingSource["overrides"] } };
  const t = o.trimOverride as { startSec: number; endSec: number } | null;
  const sx = (momentRaw as { subjectX?: number } | null)?.subjectX;
  return {
    opportunityId: o.id, headline: o.headline, status: o.status, complianceStatus: (o.compliance as { status?: string } | null)?.status ?? "unknown",
    requiresReview: !!d.requiresReview, restrictions: d.content?.restrictions ?? [], renderActions: d.content?.renderActions ?? [],
    window: t ? { start: t.startSec, end: t.endSec } : d.tightWindow ?? null, analysedWindow: d.window ?? null,
    subjectX: typeof sx === "number" ? sx : null, generatedCopy: (o.generatedCopy ?? {}) as Record<string, string>, overrides: d.packaging?.overrides,
    beats: beatsFrom(momentRaw, d.window ?? null), trimMode: trimModeOf(o.delivery, t), photo: !!d.photo,
  };
}

function reviveRestrictions(rs: unknown[]): Restriction[] {
  return rs.map((r) => {
    const x = { ...(r as Restriction) } as Restriction & { expiresAt?: Date | string; notBefore?: Date | string };
    if (x.expiresAt) x.expiresAt = new Date(x.expiresAt);
    if (x.notBefore) x.notBefore = new Date(x.notBefore);
    return x;
  });
}

/** Stable revision over exactly what a reviewer signs off on for one destination. */
export function variantRevision(opportunityId: string, recipe: VariantRecipe) {
  const k = [opportunityId, recipe.channel, r3(recipe.startSec), r3(recipe.endSec), r3(recipe.cropXOffset), recipe.muteAudio, recipe.caption, recipe.copy];
  return createHash("sha256").update(JSON.stringify(k)).digest("hex");
}

/** Fit a cut to a destination: shorten to the target max from the start; lengthen toward the target min inside the analysed window. */
function suggestCut(src: PackagingSource, p: DestinationProfile, notes: string[]) {
  const w = src.window!;
  let start = w.start, end = w.end;
  const [tMin, tMax] = p.targetDurationSec;
  const hardMax = p.maxDurationSec;
  if (p.kind === "photo") return { start, end };
  if (src.trimMode !== "manual" && src.beats?.length && src.analysedWindow) {
    const t = smartTrim({ beats: src.beats, analysed: src.analysedWindow, focus: w, target: targetFor(p) });
    notes.push(t.note ?? `smart trim: ${t.reason}`);
    return { start: t.start, end: t.end };
  }
  if (tMax && end - start > tMax) { end = start + tMax; notes.push(`cut to ${tMax}s (channel target ${tMin}-${tMax}s)`); }
  if (tMin && end - start < tMin && src.analysedWindow) {
    const need = tMin - (end - start);
    const a = src.analysedWindow;
    const before = Math.min(need / 2, start - a.start);
    const after = Math.min(need - before, a.end - end);
    const more = Math.min(need - before - after, start - before - a.start);
    start -= before + Math.max(0, more); end += after;
    if (end - start < tMin) notes.push(`shorter than the ${tMin}s target: only ${(end - start).toFixed(1)}s was analysed`);
    else notes.push(`extended to ${(end - start).toFixed(1)}s within the analysed footage`);
  }
  if (hardMax && end - start > hardMax) end = start + hardMax;
  return { start: r3(start), end: r3(end) };
}

export function planPackaging(src: PackagingSource, now = new Date()): DestinationPlan[] {
  const socials = DESTINATIONS.filter((c) => c !== FAN_APP) as Channel[];
  const gate = evaluate(socials, reviveRestrictions(src.restrictions), now);
  const approved = APPROVED.includes(src.status);
  // a photo has no time window: it packages to photo destinations only, from the still itself
  const destinations = src.photo ? DESTINATIONS.filter((c) => PROFILES[c].kind === "photo") : DESTINATIONS;
  return destinations.map((channel) => {
    const p = PROFILES[channel];
    const reasons: string[] = [];
    const notes: string[] = [];
    if (!approved) reasons.push("Approve the clip first");
    if (src.requiresReview) reasons.push("Clip needs review (analysis or rights evidence incomplete)");
    if (src.complianceStatus === "blocked") reasons.push("Blocked by rights");
    if (!src.window || !(src.window.end > src.window.start)) reasons.push("No source window");
    if (channel !== FAN_APP && !gate.allowedChannels.includes(channel as Channel)) reasons.push(gate.reasons.find((r) => r) ?? "Channel blocked by a content rule");
    if (reasons.length || !src.window) return { channel, label: p.label, eligible: false, reasons, notes, recipe: null, revision: null };

    const cut = src.photo ? src.window : suggestCut(src, p, notes);
    const o = src.overrides?.[channel] ?? {};
    const startSec = o.startSec ?? cut.start;
    const endSec = o.endSec ?? cut.end;
    const a = src.analysedWindow;
    if (a && (startSec < a.start - 1e-6 || endSec > a.end + 1e-6)) reasons.push(`Cut ${startSec}-${endSec}s leaves the analysed window ${a.start}-${a.end}s`);
    if (!(endSec > startSec)) reasons.push("Cut end must be after start");
    if (p.kind !== "photo" && endSec - startSec > p.maxDurationSec) reasons.push(`Longer than ${p.label}'s ${p.maxDurationSec}s limit`);
    const crop = o.cropXOffset ?? src.subjectX ?? 0.5;
    if (src.subjectX === null && o.cropXOffset === undefined && p.aspect === "9:16") notes.push("subject position unknown: centred crop, check framing");
    const max = p.copy.maxChars;
    const baseCopy = o.copy ?? src.generatedCopy[channel] ?? src.headline;
    if (max > 0 && baseCopy.length > max && o.copy === undefined) notes.push(`copy trimmed to ${max} characters`);
    if (max > 0 && o.copy !== undefined && o.copy.length > max) reasons.push(`Copy is ${o.copy.length}/${max} characters`);
    const copy = max === 0 ? "" : baseCopy.length > max ? `${baseCopy.slice(0, max - 1).trimEnd()}…` : baseCopy;
    if (reasons.length) return { channel, label: p.label, eligible: false, reasons, notes, recipe: null, revision: null };
    const recipe: VariantRecipe = {
      channel, label: p.label, kind: p.kind === "photo" ? "photo" : "video", aspect: p.aspect, width: p.width, height: p.height,
      startSec, endSec, cropXOffset: Math.min(1, Math.max(0, crop)),
      muteAudio: o.muteAudio ?? src.renderActions.includes("mute_audio"),
      caption: src.headline, copy,
    };
    return { channel, label: p.label, eligible: true, reasons: [], notes, recipe, revision: variantRevision(src.opportunityId, recipe) };
  });
}
