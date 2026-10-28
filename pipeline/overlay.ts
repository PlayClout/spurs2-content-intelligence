/**
 * Overlay rendering — captions and photo cards are drawn as PNGs with @napi-rs/canvas, then
 * composited by ffmpeg. Why not ffmpeg drawtext: PNGs give us the real brand fonts (Oswald/Inter),
 * rounded panels, auto-fit wrapping and safe-zone layout in one place; drawtext stays a fallback.
 *
 * Brand rule: generated assets are CLUB content, so they wear the club's colors (club-themes.json).
 * Layout follows the PlayClout design system rules: display type is heavy condensed italic
 * uppercase (Oswald + a slight skew, since Oswald ships no italic), body/kickers in Inter,
 * keep the center read zone clear, keep everything inside the channel's safe zone.
 */
import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFile } from "node:fs/promises";
import themes from "./club-themes.json" with { type: "json" };
import profiles from "./channel-profiles.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(here, "assets", "fonts");
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  GlobalFonts.registerFromPath(join(FONT_DIR, "Oswald-Bold.ttf"), "Oswald Bold");
  GlobalFonts.registerFromPath(join(FONT_DIR, "Oswald-SemiBold.ttf"), "Oswald SemiBold");
  GlobalFonts.registerFromPath(join(FONT_DIR, "Inter-SemiBold.ttf"), "Inter SemiBold");
  GlobalFonts.registerFromPath(join(FONT_DIR, "Inter-Regular.ttf"), "Inter");
  fontsReady = true;
}

export type ClubKey = keyof Omit<typeof themes, "$comment">;
export interface ClubTheme {
  displayName: string;
  shortName: string;
  panel: string;
  accent: string;
  text: string;
  subtext: string;
}
export function clubTheme(key: string): ClubTheme {
  const t = (themes as Record<string, unknown>)[key];
  if (!t || key.startsWith("$")) throw new Error(`unknown club theme '${key}'`);
  return t as ClubTheme;
}

export interface ChannelGeom {
  width: number;
  height: number;
  safeZone: { top: number; bottom: number; left: number; right: number };
  captions: { burnIn: boolean; position: string; fontSize: number };
}
export function channelGeom(channel: string): ChannelGeom {
  const p = (profiles as Record<string, unknown>)[channel];
  if (!p || channel.startsWith("$")) throw new Error(`unknown channel profile '${channel}'`);
  return p as ChannelGeom;
}

export interface CaptionText {
  /** small tracked line above the headline, e.g. "SPURS 112 · THUNDER 110 · Q4 0:00.3" */
  kicker?: string;
  /** the hero line, e.g. "CASTLE AT THE BUZZER" */
  headline: string;
}

const SKEW = -0.18; // ~10deg forward slant = brand "italic" on Oswald

/** Wrap text to maxWidth at the given font; returns lines. */
function wrap(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Largest font size (<= start) at which text fits maxLines within maxWidth. */
function fitDisplay(ctx: SKRSContext2D, text: string, maxWidth: number, start: number, maxLines: number) {
  for (let size = start; size >= 28; size -= 2) {
    ctx.font = `${size}px "Oswald Bold"`;
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { size, lines };
  }
  ctx.font = `28px "Oswald Bold"`;
  return { size: 28, lines: wrap(ctx, text, maxWidth).slice(0, maxLines) };
}

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Draws kicker + headline block. Returns the block height. anchorY = block bottom (or top when fromTop).
 * measureOnly: compute geometry without painting (used to choose placement). */
function drawTextBlock(
  ctx: SKRSContext2D,
  theme: ClubTheme,
  text: CaptionText,
  box: { x: number; w: number; anchorY: number; fromTop: boolean },
  opts: { headlineStart: number; maxLines: number; panel: boolean; scale: number; measureOnly?: boolean },
) {
  const padX = Math.round(36 * opts.scale);
  const padY = Math.round(30 * opts.scale);
  const innerW = box.w - padX * 2;
  const kickerSize = Math.round(26 * opts.scale);
  const gap = Math.round(14 * opts.scale);

  const fit = fitDisplay(ctx, text.headline.toUpperCase(), innerW, Math.round(opts.headlineStart), opts.maxLines);
  const lineH = Math.round(fit.size * 1.0);
  const kickerH = text.kicker ? kickerSize + gap : 0;
  const blockH = padY * 2 + kickerH + lineH * fit.lines.length;
  const top = box.fromTop ? box.anchorY : box.anchorY - blockH;
  if (opts.measureOnly) return { top, height: blockH };

  if (opts.panel) {
    ctx.fillStyle = hexA(theme.panel, 0.86);
    roundRect(ctx, box.x, top, box.w, blockH, Math.round(22 * opts.scale));
    ctx.fill();
    // accent rule on the leading edge of the kicker (top bar, not a colored left border card)
    ctx.fillStyle = theme.accent;
    ctx.fillRect(box.x + padX, top + padY - Math.round(10 * opts.scale), Math.round(56 * opts.scale), Math.max(3, Math.round(4 * opts.scale)));
  }

  let y = top + padY;
  if (text.kicker) {
    ctx.font = `${kickerSize}px "Inter SemiBold"`;
    ctx.fillStyle = theme.subtext;
    ctx.textBaseline = "top";
    const k = text.kicker.toUpperCase();
    // wide tracking on small labels (brand kicker rule), drawn char by char
    let kx = box.x + padX;
    const track = kickerSize * 0.12;
    for (const ch of k) {
      ctx.fillText(ch, kx, y);
      kx += ctx.measureText(ch).width + track;
    }
    y += kickerH;
  }

  ctx.font = `${fit.size}px "Oswald Bold"`;
  ctx.fillStyle = theme.text;
  ctx.textBaseline = "top";
  for (const line of fit.lines) {
    ctx.save();
    ctx.translate(box.x + padX, y);
    ctx.transform(1, 0, SKEW, 1, 0, 0);
    ctx.fillText(line, -SKEW * lineH * 0.15, -Math.round(fit.size * 0.06));
    ctx.restore();
    y += lineH;
  }
  return { top, height: blockH };
}

/**
 * Full-frame transparent PNG caption overlay for a channel (e.g. 1080x1920 for Reels).
 * Placement stays inside the channel safe zone and NEVER covers the sharp footage band
 * (avoidBand = where the fitted video sits). Preference: the channel's position hint
 * ("upper..." = above, else below); if the block doesn't fit on that side, use the other side;
 * if neither fits, fall back to the hint position over the footage edge.
 */
export async function renderCaptionOverlay(
  outPath: string,
  channel: string,
  club: string,
  text: CaptionText,
  avoidBand?: { top: number; bottom: number },
) {
  ensureFonts();
  const g = channelGeom(channel);
  const theme = clubTheme(club);
  const canvas = createCanvas(g.width, g.height);
  const ctx = canvas.getContext("2d");
  const scale = g.width / 1080;
  const x = g.safeZone.left;
  const w = g.width - g.safeZone.left - g.safeZone.right;
  const gapPx = Math.round(28 * scale);
  const opts = { headlineStart: Math.max(g.captions.fontSize * 1.9, 64), maxLines: 2, panel: true, scale };

  const safeTop = g.safeZone.top;
  const safeBottom = g.height - g.safeZone.bottom;
  const band = avoidBand ?? { top: g.height, bottom: g.height };
  const h = drawTextBlock(ctx, theme, text, { x, w, anchorY: 0, fromTop: true }, { ...opts, measureOnly: true }).height;

  const below = { fromTop: true, anchorY: band.bottom + gapPx, fits: band.bottom + gapPx + h <= safeBottom };
  const above = { fromTop: false, anchorY: band.top - gapPx, fits: band.top - gapPx - h >= safeTop };
  const preferAbove = g.captions.position.startsWith("upper");
  const order = preferAbove ? [above, below] : [below, above];
  const pick = order.find((o) => o.fits);
  const place = pick ?? (preferAbove
    ? { fromTop: true, anchorY: safeTop + Math.round(g.height * 0.04) }
    : { fromTop: false, anchorY: safeBottom - Math.round(24 * scale) });

  drawTextBlock(ctx, theme, text, { x, w, anchorY: place.anchorY, fromTop: place.fromTop }, opts);

  // club tag, top-left inside safe zone (type only, no crest)
  ctx.font = `${Math.round(28 * scale)}px "Oswald SemiBold"`;
  ctx.fillStyle = theme.text;
  ctx.textBaseline = "top";
  ctx.save();
  ctx.translate(g.safeZone.left, Math.max(g.safeZone.top, Math.round(40 * scale)));
  ctx.transform(1, 0, SKEW, 1, 0, 0);
  ctx.fillText(theme.displayName.toUpperCase(), 0, 0);
  ctx.restore();

  await writeFile(outPath, canvas.toBuffer("image/png"));
  return { width: g.width, height: g.height, placement: pick ? (pick === above ? "above-footage" : "below-footage") : "over-footage-edge" };
}

/**
 * Photo card: a finished still (source photo or frame grab, cover-fit) with a bottom scrim,
 * kicker, headline and an optional stat line. Output is JPEG at the channel's dimensions.
 */
export async function renderPhotoCard(
  outPath: string,
  sourceImagePath: string,
  channel: string,
  club: string,
  text: CaptionText & { statLine?: string; focusX?: number },
) {
  ensureFonts();
  const g = channelGeom(channel);
  const theme = clubTheme(club);
  const canvas = createCanvas(g.width, g.height);
  const ctx = canvas.getContext("2d");
  const scale = Math.min(g.width, g.height) / 1080;

  const img = await loadImage(sourceImagePath);
  const s = Math.max(g.width / img.width, g.height / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  const fx = text.focusX ?? 0.5; // 0..1 horizontal focus (from analysis subject position when known)
  const dx = Math.min(0, Math.max(g.width - dw, g.width / 2 - dw * fx));
  ctx.drawImage(img, dx, (g.height - dh) / 2, dw, dh);

  // bottom scrim in club panel color so type reads on any frame (starts higher on landscape,
  // where the two-line headline takes a larger share of the height)
  const landscape = g.width > g.height;
  const scrimTop = g.height * (landscape ? 0.2 : 0.42);
  const grad = ctx.createLinearGradient(0, scrimTop, 0, g.height);
  grad.addColorStop(0, hexA(theme.panel, 0));
  grad.addColorStop(landscape ? 0.4 : 0.5, hexA(theme.panel, 0.82));
  grad.addColorStop(1, hexA(theme.panel, 0.96));
  ctx.fillStyle = grad;
  ctx.fillRect(0, scrimTop, g.width, g.height - scrimTop);

  const margin = Math.round(64 * scale);
  // the stat line is often the photographer's own caption: wrap it to two lines at word boundaries (never off the card)
  const statSize = Math.round(30 * scale), statLead = Math.round(38 * scale);
  ctx.font = `${statSize}px "Inter"`;
  let statLines = text.statLine ? wrap(ctx, text.statLine, g.width - margin * 2) : [];
  if (statLines.length > 2) {
    let last = statLines[1];
    while (last && ctx.measureText(`${last}…`).width > g.width - margin * 2) last = last.replace(/\s*\S+$/, "");
    statLines = [statLines[0], `${last.replace(/[\s,;:]+$/, "")}…`];
  }
  const statH = statLines.length ? statLead * statLines.length + Math.round(18 * scale) : 0;
  const block = drawTextBlock(
    ctx,
    theme,
    text,
    { x: margin - Math.round(36 * scale), w: g.width - margin * 2 + Math.round(72 * scale), anchorY: g.height - margin - statH, fromTop: false },
    { headlineStart: Math.round((g.width > g.height ? 120 : 128) * scale), maxLines: 2, panel: false, scale },
  );

  if (statLines.length) {
    ctx.font = `${statSize}px "Inter"`;
    ctx.fillStyle = theme.subtext;
    ctx.textBaseline = "top";
    statLines.forEach((l, i) => ctx.fillText(l, margin, block.top + block.height + Math.round(4 * scale) + i * statLead));
  }

  ctx.font = `${Math.round(30 * scale)}px "Oswald SemiBold"`;
  ctx.fillStyle = theme.text;
  ctx.save();
  ctx.translate(margin, margin);
  ctx.transform(1, 0, SKEW, 1, 0, 0);
  ctx.fillText(theme.displayName.toUpperCase(), 0, 0);
  ctx.restore();

  await writeFile(outPath, canvas.toBuffer("image/jpeg", 92));
  return { width: g.width, height: g.height };
}
