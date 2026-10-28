/**
 * npm run seed — reset to a perfect demo state in one command.
 * Loads: 2 orgs (Spurs, Tottenham), mock game-event + fan-reaction feeds (simulated:true),
 * 2 fixture assets + moments, and ~6 demo opportunities (mixed orgs/audiences/statuses,
 * varied scores + compliance states) with generated SVG posters so the UI is photogenic.
 * Idempotent: truncates and reloads.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import * as s from "../shared/db-schema";

if (new URL(process.env.DATABASE_URL!).pathname === "/demo") throw new Error("seed truncates every table, so it never runs against the demo database");
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

// ── SVG poster generation (placeholder thumbnails, Spursx2 AI-branded) ──
const POSTER_DIR = "web/public/posters";
const posterPalettes: Record<string, [string, string]> = {
  basketball: ["#126BFF", "#7047EB"],
  soccer: ["#00A3FF", "#FF006B"],
};
function writePoster(slug: string, title: string, sub: string, sport: string): string {
  const [c1, c2] = posterPalettes[sport];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <radialGradient id="g1" cx="15%" cy="15%" r="90%"><stop offset="0%" stop-color="${c1}" stop-opacity="0.55"/><stop offset="60%" stop-color="${c1}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="88%" cy="88%" r="90%"><stop offset="0%" stop-color="${c2}" stop-opacity="0.45"/><stop offset="60%" stop-color="${c2}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="640" height="360" fill="#050811"/>
  <rect width="640" height="360" fill="url(#g1)"/>
  <rect width="640" height="360" fill="url(#g2)"/>
  <rect x="1" y="1" width="638" height="358" fill="none" stroke="rgba(245,245,243,0.12)" stroke-width="2"/>
  <text x="40" y="190" font-family="Arial Narrow, sans-serif" font-size="44" font-weight="bold" font-style="italic" fill="#F5F5F3" text-transform="uppercase">${title.toUpperCase()}</text>
  <text x="40" y="230" font-family="Arial, sans-serif" font-size="20" fill="#8B93A3">${sub}</text>
  <text x="40" y="320" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" fill="#5AA2FF">SPURSX2 AI</text>
  <polygon points="540,160 540,220 590,190" fill="rgba(245,245,243,0.85)"/>
  <circle cx="560" cy="190" r="46" fill="none" stroke="rgba(245,245,243,0.4)" stroke-width="3"/>
</svg>`;
  mkdirSync(POSTER_DIR, { recursive: true });
  const file = `${POSTER_DIR}/${slug}.svg`;
  writeFileSync(file, svg);
  return `/posters/${slug}.svg`;
}

const hash = (x: string) => createHash("sha1").update(x).digest("hex").slice(0, 16);
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);

async function main() {
  await db.execute(sql`truncate orgs, assets, moments, signals, opportunities, jobs, published_assets, performance_snapshots cascade`);

  const [spurs, thfc] = await db.insert(s.orgs).values([
    { name: "San Antonio Spurs", sport: "basketball", league: "NBA" },
    { name: "Tottenham Hotspur", sport: "soccer", league: "Premier League" },
  ]).returning();

  const events = JSON.parse(readFileSync("data/fallback-assets/mock-game-events.json", "utf8")).events;
  const reactions = JSON.parse(readFileSync("data/fallback-assets/mock-fan-reactions.json", "utf8")).reactions;
  const orgFor = (sport: string) => (sport === "basketball" ? spurs.id : thfc.id);

  const insertedSignals = await db.insert(s.signals).values([
    ...events.map((e: any) => ({
      orgId: orgFor(e.sport), kind: "game_event" as const, simulated: true, sport: e.sport,
      payload: e, eventText: e.eventText, weight: e.weight, occurredAt: new Date(e.occurredAt),
    })),
    ...reactions.map((r: any) => ({
      orgId: orgFor(r.sport), kind: "social_reaction" as const, simulated: true, sport: r.sport,
      payload: r, eventText: r.refEventText, weight: r.velocity, occurredAt: new Date(),
    })),
  ]).returning();

  // Disjoint signal slices per opportunity so each card's "surfaced Ns after the play"
  // timer is computed from its OWN signals (overlapping slices previously corrupted timers).
  const sportCursors: Record<string, number> = {};
  const sigsFor = (sport: string, n: number) => {
    const pool = insertedSignals.filter((x) => x.sport === sport);
    const start = sportCursors[sport] ?? 0;
    const out = pool.slice(start, start + n);
    sportCursors[sport] = start + n;
    return out.length ? out : pool.slice(0, n);
  };

  // ── Fixture assets + moments ──
  const [spursAsset, thfcAsset] = await db.insert(s.assets).values([
    {
      orgId: spurs.id, source: "fixture", sport: "basketball",
      title: "Spurs vs Thunder — 2026-10-22 full game", filePath: "data/fixtures/spurs-okc-20261022.mp4",
      durationSec: 8440, indexStatus: "ready", twelvelabsVideoId: "mock-tl-spurs-001",
    },
    {
      orgId: thfc.id, source: "fixture", sport: "soccer",
      title: "Spurs vs Arsenal — North London Derby full match", filePath: "data/fixtures/thfc-ars-20261018.mp4",
      durationSec: 6780, indexStatus: "ready", twelvelabsVideoId: "mock-tl-thfc-001",
    },
  ]).returning();

  const momentDefs = [
    { asset: spursAsset, label: "dunk", description: "Castle rises for the game-winning dunk at the buzzer", startSec: 8322, endSec: 8339, confidence: 0.97 },
    { asset: spursAsset, label: "dunk", description: "Wembanyama transition poster dunk over defender", startSec: 5141, endSec: 5156, confidence: 0.91 },
    { asset: spursAsset, label: "milestone", description: "Wembanyama career-high 42nd point, crowd eruption", startSec: 7820, endSec: 7844, confidence: 0.88 },
    { asset: thfcAsset, label: "goal", description: "Johnson stoppage-time winner, top corner from the edge of the box", startSec: 6510, endSec: 6534, confidence: 0.96 },
    { asset: thfcAsset, label: "save", description: "Vicario triple save sequence in the six-yard box", startSec: 3922, endSec: 3941, confidence: 0.86 },
    { asset: thfcAsset, label: "celebration", description: "Bench and away-end celebration after the winner", startSec: 6535, endSec: 6556, confidence: 0.82 },
  ];
  const moments = await db.insert(s.moments).values(
    momentDefs.map((m) => ({
      assetId: m.asset.id, label: m.label, description: m.description,
      startSec: m.startSec, endSec: m.endSec, confidence: m.confidence,
      detector: "marengo_search" as const,
    }))
  ).returning();

  // ── Demo opportunities (photogenic mix) ──
  const cleared = (channels: string[]) => ({
    rightsSource: "mock", territories: ["US", "CA", "GB", "EU"], platformsAllowed: channels,
    sponsorRestrictions: [], expiresAt: hoursFromNow(48).toISOString(),
    status: "cleared", reasons: ["No restrictions apply to the requested channels"],
  });
  const restricted = (channels: string[]) => ({
    rightsSource: "mock", territories: ["US", "CA"], platformsAllowed: channels.filter((c) => c !== "tiktok"),
    sponsorRestrictions: ["Betting sponsor overlay prohibited for under-18 audiences"],
    expiresAt: hoursFromNow(24).toISOString(),
    status: "restricted", reasons: [
      "League rule: no TikTok distribution within 2h of final whistle",
      "Territory restriction: UK broadcast exclusivity window active until 22:00 local",
    ],
  });

  const oppDefs = [
    {
      org: spurs, moment: moments[0], sport: "basketball", audience: "superfan",
      contentType: "highlight_clip", channels: ["instagram_reel", "tiktok", "x_post"],
      score: 94, breakdown: { momentConfidence: 0.97, eventWeight: 1.0, socialVelocity: 0.95, recencyDecay: 0.99, audienceFit: 0.96 },
      headline: "CASTLE WINS IT AT THE BUZZER",
      copy: {
        instagram_reel: "STEPHON CASTLE CALLED GAME 🚨 Buzzer-beating dunk to take down OKC 112-110. #GoSpursGo #NBA",
        tiktok: "he really did that at the buzzer 😭🔥 #spurs #nba #buzzerbeater #stephoncastle",
        x_post: "STEPHON CASTLE AT THE BUZZER. Spurs 112, Thunder 110. Ice in his veins. 🥶",
      },
      status: "draft_ready", compliance: cleared(["instagram_reel", "tiktok", "x_post"]),
      poster: ["castle-buzzer", "Castle wins it", "Q4 0:00.3 · Spurs 112–110 OKC", "basketball"],
      createdMinsAgo: 6,
    },
    {
      org: spurs, moment: moments[1], sport: "basketball", audience: "casual",
      contentType: "reel", channels: ["instagram_reel", "youtube_short"],
      score: 87, breakdown: { momentConfidence: 0.91, eventWeight: 0.85, socialVelocity: 0.88, recencyDecay: 0.93, audienceFit: 0.9 },
      headline: "WEMBY POSTER DUNK IN TRANSITION",
      copy: {
        instagram_reel: "7'4\" and he moves like THAT?! Wemby poster in transition 😤 #Spurs #Wembanyama",
        youtube_short: "Wembanyama POSTER dunk you have to see #shorts",
      },
      status: "draft_ready", compliance: cleared(["instagram_reel", "youtube_short"]),
      poster: ["wemby-poster", "Wemby poster dunk", "Q3 7:12 · transition", "basketball"],
      createdMinsAgo: 48,
    },
    {
      org: spurs, moment: moments[2], sport: "basketball", audience: "regional",
      contentType: "milestone_graphic", channels: ["x_post", "instagram_story"],
      score: 73, breakdown: { momentConfidence: 0.88, eventWeight: 0.9, socialVelocity: 0.62, recencyDecay: 0.85, audienceFit: 0.78 },
      headline: "CAREER-HIGH 42 FOR WEMBANYAMA",
      copy: {
        x_post: "42 PIECE. A new career high for Victor Wembanyama tonight in San Antonio. 🕷️",
        instagram_story: "",
      },
      status: "approved", compliance: cleared(["x_post", "instagram_story"]),
      poster: ["wemby-42", "Career-high 42", "Milestone · Q4 4:30", "basketball"],
      createdMinsAgo: 95,
    },
    {
      org: thfc, moment: moments[3], sport: "soccer", audience: "international",
      contentType: "highlight_clip", channels: ["instagram_reel", "tiktok", "x_post", "youtube_short"],
      score: 91, breakdown: { momentConfidence: 0.96, eventWeight: 1.0, socialVelocity: 0.9, recencyDecay: 0.97, audienceFit: 0.88 },
      headline: "JOHNSON WINS THE DERBY IN STOPPAGE TIME",
      copy: {
        instagram_reel: "90+3' BRENNAN JOHNSON WINS THE NORTH LONDON DERBY 🤍 Scenes at the Lane. #COYS #THFC",
        tiktok: "stoppage time winner in the DERBY?? the away end 😭 #coys #tottenham #premierleague",
        x_post: "BRENNAN JOHNSON. 90+3. NORTH LONDON IS WHITE. 🤍",
        youtube_short: "Johnson wins the North London Derby in stoppage time #shorts",
      },
      status: "draft_ready", compliance: restricted(["instagram_reel", "tiktok", "x_post", "youtube_short"]),
      poster: ["johnson-derby", "Derby winner 90+3", "NLD · Spurs 2–1 Arsenal", "soccer"],
      createdMinsAgo: 12,
    },
    {
      org: thfc, moment: moments[4], sport: "soccer", audience: "superfan",
      contentType: "reel", channels: ["instagram_reel", "tiktok"],
      score: 68, breakdown: { momentConfidence: 0.86, eventWeight: 0.7, socialVelocity: 0.58, recencyDecay: 0.9, audienceFit: 0.82 },
      headline: "VICARIO TRIPLE SAVE SEQUENCE",
      copy: {
        instagram_reel: "Guglielmo Vicario said NOT TODAY. Triple save in the six-yard box 🧤 #THFC",
        tiktok: "goalkeeping masterclass from vicario 🧤 #coys #goalkeeper",
      },
      status: "draft_pending", compliance: cleared(["instagram_reel", "tiktok"]),
      poster: ["vicario-saves", "Vicario triple save", "63' · six-yard box", "soccer"],
      createdMinsAgo: 31,
    },
    {
      org: thfc, moment: moments[5], sport: "soccer", audience: "casual",
      contentType: "story", channels: ["instagram_story"],
      score: 55, breakdown: { momentConfidence: 0.82, eventWeight: 0.6, socialVelocity: 0.49, recencyDecay: 0.88, audienceFit: 0.7 },
      headline: "AWAY END ERUPTS FOR THE WINNER",
      copy: { instagram_story: "" },
      status: "rejected", rejectReason: "Crowd shot includes visible pitch-invasion steward incident — hold",
      compliance: cleared(["instagram_story"]),
      poster: ["away-end", "Away end erupts", "Full time scenes", "soccer"],
      createdMinsAgo: 120,
    },
  ] as const;

  for (const o of oppDefs) {
    const posterPath = writePoster(o.poster[0], o.poster[1], o.poster[2], o.poster[3]);
    const sigs = sigsFor(o.sport, 2);
    const createdAt = minsAgo(o.createdMinsAgo);
    // Make contributing signals precede opportunity creation by a believable 35–70s
    for (let i = 0; i < sigs.length; i++) {
      const t = new Date(createdAt.getTime() - (35 + i * 14) * 1000);
      await db.update(s.signals).set({ occurredAt: t, momentId: o.moment.id }).where(sql`id = ${sigs[i].id}`);
    }
    await db.insert(s.opportunities).values({
      orgId: o.org.id,
      dedupeKey: hash(`${o.moment.assetId}:${o.moment.startSec}:${o.contentType}`),
      momentId: o.moment.id,
      signalIds: sigs.map((x) => x.id),
      sport: o.sport,
      audience: o.audience,
      contentType: o.contentType,
      channels: [...o.channels],
      score: o.score,
      scoreBreakdown: o.breakdown,
      headline: o.headline,
      generatedCopy: o.copy,
      compliance: o.compliance,
      status: o.status,
      rejectReason: "rejectReason" in o ? (o as any).rejectReason : null,
      draftPaths: Object.fromEntries(o.channels.map((c) => [c, posterPath])),
      finalPaths: {},
      trimOverride: null,
      expiresAt: hoursFromNow(48),
      createdAt,
    });
  }

  // A few jobs so the latency debug drawer has real stage timestamps.
  const now = Date.now();
  await db.insert(s.jobs).values([
    { type: "sweep_moments", payload: { assetId: spursAsset.id }, status: "done", queuedAt: new Date(now - 540_000), startedAt: new Date(now - 538_000), finishedAt: new Date(now - 531_000) },
    { type: "fuse_signals", payload: { sport: "basketball" }, status: "done", queuedAt: new Date(now - 530_000), startedAt: new Date(now - 529_800), finishedAt: new Date(now - 529_650) },
    { type: "score_opportunities", payload: { sport: "basketball" }, status: "done", queuedAt: new Date(now - 529_600), startedAt: new Date(now - 529_500), finishedAt: new Date(now - 528_900) },
    { type: "render_draft", payload: { note: "stream-copy rough cut" }, status: "done", queuedAt: new Date(now - 528_800), startedAt: new Date(now - 528_700), finishedAt: new Date(now - 522_400) },
    { type: "render_final", payload: { note: "seed placeholder (no opportunityId), shown for the latency drawer only" }, status: "done", queuedAt: new Date(now - 60_000), startedAt: new Date(now - 59_000), finishedAt: new Date(now - 57_700) },
  ]);

  const counts = await db.execute(sql`select (select count(*) from orgs) as orgs, (select count(*) from signals) as signals, (select count(*) from moments) as moments, (select count(*) from opportunities) as opportunities, (select count(*) from jobs) as jobs`);
  console.log("Seeded:", counts[0]);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
