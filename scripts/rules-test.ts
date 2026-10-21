/**
 * Content rules tests.
 *   npx tsx scripts/rules-test.ts
 * A: golden file — rights-desk expected-decisions.json (verdict, triggered rules, allowed/blocked uses, reasons).
 * B: integration with the compliance hard gate (evaluate()) on real Channel ids.
 * C: manifest schema — parse a Pegasus-shaped response; reject a malformed one.
 */
import { readFileSync } from "node:fs";
import { evaluateContent } from "../shared/content-rules";
import { evaluate } from "../shared/compliance";
import { parseManifest, PEGASUS_MANIFEST_SCHEMA } from "../shared/moment-manifest";

let fail = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fail++; };
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const assets = read("data/rights-fixtures/sample-assets.json") as { id: string; club: string; competition: string; eventDate: string; platformsRequested: string[] }[];
const manifests = read("data/rights-fixtures/sample-video-manifests.json");
const expected = read("data/rights-fixtures/expected-decisions.json");
const orgKey = (club: string) => (club === "Tottenham Hotspur" ? "tottenham-hotspur" : "san-antonio-spurs");
const same = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// ── A: golden decisions ────────────────────────────────────────────────────────────────
for (const a of assets) {
  const v = evaluateContent(manifests[a.id], { orgKey: orgKey(a.club), competition: a.competition, eventDate: a.eventDate }, a.platformsRequested);
  const e = expected[a.id];
  check(v.verdict === e.verdict, `${a.id}: verdict ${v.verdict} (want ${e.verdict})`);
  check(same(v.triggeredRules, e.triggeredRules), `${a.id}: triggered [${v.triggeredRules}] (want [${e.triggeredRules}])`);
  check(same(v.allowedUses, e.allowedUses), `${a.id}: allowed [${v.allowedUses}] (want [${e.allowedUses}])`);
  check(same(v.blockedUses, e.blockedUses), `${a.id}: blocked [${v.blockedUses}] (want [${e.blockedUses}])`);
  const text = v.reasons.join(" ").toLowerCase();
  const missing = (e.reasoningIncludes as string[]).filter((s) => !text.includes(s.toLowerCase()));
  check(!missing.length, `${a.id}: reasons mention ${JSON.stringify(e.reasoningIncludes)}${missing.length ? ` MISSING ${JSON.stringify(missing)}` : ""}`);
}

// sponsor policy is per-org, not a name string: same telecom signage is NOT a conflict for Tottenham's policy
const fancam = manifests["asset_saspurs_partner_003"];
const asThfc = evaluateContent(fancam, { orgKey: "tottenham-hotspur", competition: "Premier League" }, ["instagram", "partner_site"]);
check(!asThfc.triggeredRules.includes("SPONSOR-COMPETITOR-CATEGORY-REVIEW"), "sponsor conflict is org-policy driven (telecom fine under THFC demo policy)");

// music rule carries a render action
const goal = evaluateContent(manifests["asset_spurs_goal_001"], { orgKey: "tottenham-hotspur", competition: "Premier League", eventDate: "2026-10-18" }, ["instagram"]);
check(goal.renderActions.includes("mute_audio"), "MUSIC-SYNC-VERIFY -> render action mute_audio");
check(goal.reasons.some((r) => r.includes("Cooldown ends 2026-10-20 00:00 UTC")), "PL cooldown reason carries computed expiry");

// ── B: compliance gate on Channel ids ──────────────────────────────────────────────────
const g = evaluate(["instagram_reel", "x_photo"], goal.restrictions, new Date());
check(g.status === "restricted" && g.allowedChannels.length === 2, "AMBER goal -> gate 'restricted', owned channels still allowed");
const blockIg = evaluate(["instagram_reel", "instagram_feed", "x_photo"], [{ kind: "platform", rule: "test: no instagram", blockedPlatforms: ["instagram"] }], new Date());
check(blockIg.allowedChannels.length === 1 && blockIg.allowedChannels[0] === "x_photo" && blockIg.status === "restricted", "blockedPlatforms removes every channel in the family");
const all = evaluate(["instagram_reel"], [{ kind: "platform", rule: "test", blockedPlatforms: ["instagram"] }], new Date());
check(all.status === "blocked", "all requested channels blocked -> gate 'blocked' (approve hard-gate fires)");
const green = evaluateContent(manifests["asset_spurs_training_002"], { orgKey: "tottenham-hotspur", competition: "Training" }, ["instagram_reel"]);
check(green.verdict === "GREEN" && evaluate(["instagram_reel"], green.restrictions, new Date()).status === "restricted", "GREEN training still surfaces its clearance note (advisory), never a silent pass");

// ── C: manifest schema ─────────────────────────────────────────────────────────────────
const sample = {
  summary: "Castle rises for a dunk at the buzzer; bench erupts.",
  moments: [{ label: "dunk", description: "Game-winning dunk", start: 6.0, end: 9.5 }],
  subjectX: 0.62,
  detectedSponsors: [{ name: "Arena signage", category: "beverage" }],
  identifiablePeople: [{ type: "player", label: "home player" }],
  competitionMarkings: ["NBA scorebug"],
  crowdPrivacy: { facesVisible: true, closeUps: false },
  audioRisks: [{ type: "crowd_chant" }],
  suggestedUse: "Vertical reel for casual fans.",
};
const parsed = parseManifest({ data: JSON.stringify(sample) });
check(parsed.subjectX === 0.62 && parsed.moments[0].end === 9.5, "parseManifest accepts a Pegasus-shaped response");
const shifted = parseManifest({ data: JSON.stringify(sample) }, 40);
check(shifted.moments[0].start === 46 && shifted.moments[0].end === 49.5, "parseManifest shifts window-relative times by window start (verified live behavior)");
const rec = read("data/fallback-assets/fixtures/twelvelabs-manifest.json");
const recM = parseManifest(rec.response, rec.request.start_time);
check(recM.moments.every((x) => x.start >= rec.request.start_time - 0.01 && x.end <= rec.request.end_time + 0.5), "RECORDED live manifest validates + lands inside its window after shift");
let threw = ""; try { parseManifest({ data: JSON.stringify({ ...sample, crowdPrivacy: { facesVisible: "yes" } }) }); } catch (e) { threw = (e as Error).message; }
check(threw.includes("crowdPrivacy"), "parseManifest rejects malformed fields with a path");
check(PEGASUS_MANIFEST_SCHEMA.required[0] === Object.keys(PEGASUS_MANIFEST_SCHEMA.properties)[0], "json_schema: first declared property is required (TwelveLabs constraint)");
const ts = PEGASUS_MANIFEST_SCHEMA.properties.moments.items.properties.start;
check(ts.type === "timestamp" && ts.format === "seconds", "json_schema: timestamps declare format (else 400, per Nova's empirical test)");

console.log(`\n${fail ? `${fail} FAILED` : "ALL PASS"}`);
process.exit(fail ? 1 : 0);
