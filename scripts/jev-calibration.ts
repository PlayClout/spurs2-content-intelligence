/**
 * Jev calibration test — 15 hand-labeled signal→event fusion examples.
 * Based on data/fallback-assets mock feeds + adversarial cases (wrong player,
 * previous-game reference, generic hype). Measures per-call latency, agreement
 * with labels, and calibration sanity (high-confidence more accurate than low).
 * Run: npx tsx scripts/jev-calibration.ts
 */
import { fuseSignal } from "../shared/clients/decisions";

const bball = [
  { id: "e1", eventText: "Game-winning dunk at the buzzer by Stephon Castle, Q4 0:00.3", occurredAt: "2026-10-22T21:47:00Z" },
  { id: "e2", eventText: "Poster dunk over defender in transition by Victor Wembanyama, Q3 7:12", occurredAt: "2026-10-22T21:05:00Z" },
  { id: "e3", eventText: "Career-high 42 points milestone reached by Victor Wembanyama, Q4 4:30", occurredAt: "2026-10-22T21:38:00Z" },
];
const soccer = [
  { id: "s1", eventText: "Stoppage-time winning goal by Brennan Johnson, 90+3'", occurredAt: "2026-10-22T21:50:00Z" },
  { id: "s2", eventText: "Bicycle-kick goal by Dominic Solanke, 61'", occurredAt: "2026-10-22T21:05:00Z" },
];

interface Case { name: string; text: string; platform: string; velocity: number; candidates: typeof bball; label: string /* expected top event id or "none" */ }

const cases: Case[] = [
  // --- straightforward matches (from mock feeds) ---
  { name: "buzzer euphoria", text: "CASTLE AT THE BUZZER!!! greatest finish of the season, Spurs win", platform: "x", velocity: 0.97, candidates: bball, label: "e1" },
  { name: "wemby poster", text: "Wemby poster dunk in transition... he's not human", platform: "tiktok", velocity: 0.78, candidates: bball, label: "e2" },
  { name: "career high", text: "career high 42 for Wemby tonight. MVP campaign is real", platform: "reddit", velocity: 0.6, candidates: bball, label: "e3" },
  { name: "johnson 90+3", text: "JOHNSON 90+3 WINNER!!! COYS scenes at the lane", platform: "x", velocity: 0.95, candidates: soccer, label: "s1" },
  { name: "solanke bicycle", text: "Solanke with an absurd bicycle kick, goal of the month", platform: "x", velocity: 0.7, candidates: soccer, label: "s2" },
  // --- paraphrases, no shared keywords ---
  { name: "paraphrase buzzer", text: "last-second slam seals it for San Antonio, unreal ending", platform: "x", velocity: 0.9, candidates: bball, label: "e1" },
  { name: "paraphrase milestone", text: "the big fella just set a new personal scoring record", platform: "reddit", velocity: 0.5, candidates: bball, label: "e3" },
  { name: "paraphrase stoppage", text: "scored in added time to take all three points, limbs everywhere", platform: "x", velocity: 0.9, candidates: soccer, label: "s1" },
  // --- adversarial: wrong player attribution ---
  { name: "wrong player dunk", text: "Castle with the poster dunk in transition!!", platform: "x", velocity: 0.7, candidates: bball, label: "e2" }, // play matches e2 even though fans credit wrong player
  { name: "wrong scorer", text: "Johnson bicycle kick!! take a bow", platform: "x", velocity: 0.6, candidates: soccer, label: "s2" },
  // --- adversarial: previous game reference ---
  { name: "previous game", text: "still not over Castle's 30-piece against the Lakers last week", platform: "reddit", velocity: 0.3, candidates: bball, label: "none" },
  { name: "last season ref", text: "remember when Solanke scored that header vs Arsenal last season? this team is back", platform: "x", velocity: 0.4, candidates: soccer, label: "none" },
  // --- adversarial: generic hype, no specific play ---
  { name: "generic hype", text: "SPURS NATION WE ARE SO BACK 🔥🔥🔥", platform: "x", velocity: 0.8, candidates: bball, label: "none" },
  { name: "generic coys", text: "what a night to be a Spurs fan, COYS forever", platform: "x", velocity: 0.75, candidates: soccer, label: "none" },
  { name: "off-topic", text: "halftime concessions line is 40 minutes long, fix this", platform: "x", velocity: 0.2, candidates: bball, label: "none" },
];

const THRESH = 0.5; // top candidate must clear this, else predicted = none

async function main() {
  let correct = 0;
  const rows: { name: string; label: string; pred: string; conf: number; ms: number; ok: boolean; backend: string }[] = [];
  for (const c of cases) {
    const t0 = performance.now();
    const d = await fuseSignal({ text: c.text, platform: c.platform, velocity: c.velocity }, c.candidates);
    const ms = Math.round(performance.now() - t0);
    const top = Object.entries(d.eventMatch).sort((a, b) => b[1] - a[1])[0];
    const pred = top && top[1] >= THRESH ? top[0] : "none";
    const ok = pred === c.label;
    if (ok) correct++;
    rows.push({ name: c.name, label: c.label, pred, conf: d.confidence, ms, ok, backend: d.backend });
    console.log(`${ok ? "✅" : "❌"} ${c.name.padEnd(22)} label=${c.label.padEnd(5)} pred=${pred.padEnd(5)} conf=${d.confidence.toFixed(2)} ${ms}ms [${d.backend}]`);
  }
  const lat = rows.map((r) => r.ms).sort((a, b) => a - b);
  const med = lat[Math.floor(lat.length / 2)];
  const sorted = [...rows].sort((a, b) => b.conf - a.conf);
  const hi = sorted.slice(0, Math.floor(rows.length / 2));
  const lo = sorted.slice(Math.floor(rows.length / 2));
  const acc = (xs: typeof rows) => xs.filter((r) => r.ok).length / xs.length;
  console.log(`\nagreement: ${correct}/${cases.length} (${((correct / cases.length) * 100).toFixed(0)}%)`);
  console.log(`latency ms: min=${lat[0]} median=${med} max=${lat[lat.length - 1]} mean=${Math.round(lat.reduce((a, b) => a + b, 0) / lat.length)}`);
  console.log(`calibration: high-conf half accuracy=${(acc(hi) * 100).toFixed(0)}% vs low-conf half=${(acc(lo) * 100).toFixed(0)}% (sane if high ≥ low)`);
  console.log(`backend: ${rows[0]?.backend}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
