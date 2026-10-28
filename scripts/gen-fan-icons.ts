/** One-off: generate fan PWA icons (standard + maskable) into web/public/icons. Run: npx tsx scripts/gen-fan-icons.ts */
import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "web/public/icons");
mkdirSync(out, { recursive: true });

function draw(size: number, maskable: boolean) {
  const c = createCanvas(size, size);
  const g = c.getContext("2d");
  g.fillStyle = "#050811";
  g.fillRect(0, 0, size, size);
  // maskable icons keep content inside the central 80% safe zone
  const inset = maskable ? size * 0.2 : size * 0.08;
  const grad = g.createLinearGradient(inset, inset, size - inset, size - inset);
  grad.addColorStop(0, "#126bff");
  grad.addColorStop(1, "#7047eb");
  g.fillStyle = grad;
  const r = (size - inset * 2) * 0.22;
  const x = inset, y = inset, w = size - inset * 2, h = size - inset * 2;
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.fill();
  g.fillStyle = "#f5f5f3";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `italic bold ${Math.round(w * 0.5)}px sans-serif`;
  g.fillText("S", size / 2 - w * 0.06, size / 2 + w * 0.02);
  g.font = `italic bold ${Math.round(w * 0.24)}px sans-serif`;
  g.fillText("2", size / 2 + w * 0.22, size / 2 - w * 0.16);
  return c.toBuffer("image/png");
}

for (const size of [192, 512]) {
  writeFileSync(join(out, `fan-${size}.png`), draw(size, false));
  writeFileSync(join(out, `fan-maskable-${size}.png`), draw(size, true));
}
writeFileSync(join(out, "fan-apple-180.png"), draw(180, false));
console.log("icons written to", out);
