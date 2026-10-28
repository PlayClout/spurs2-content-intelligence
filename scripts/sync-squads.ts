/**
 * npm run squads:sync -> data/squads.json
 *
 * Each club's squad from ScorePlay (GET /players?team_season_id=...), so every player can be tagged on a clip and
 * followed in the fan app. Only records linked to league data (external_id from Opta / NBA) are taken: they are the
 * current squad and staff. Unlinked records are counted and reported, not used.
 *
 * ScorePlay holds legal names ("Dominic Ayodele Solanke-Mitchell"); fans know "Dominic Solanke". The known-as name and
 * the staff role come from the club's OWN photographer captions in ScorePlay ("Dominic Solanke of Tottenham Hotspur
 * ...", "Tottenham Hotspur head coach Roberto De Zerbi ..."), matched to the record with shared/player-identity.ts.
 * Players never captioned fall back to first given name + family name from ScorePlay. Nothing is guessed from faces.
 *
 * Writes ids + names only (no media, no keys). Safe to re-run; the six original demo ids are kept.
 */
import { writeFileSync } from "node:fs";
import * as sp from "../shared/clients/scoreplay";
import { matchSquadName, normName, type PlayerIdentity } from "../shared/player-identity";

const CLUBS = [
  { orgKey: "tottenham-hotspur", team: "Tottenham Hotspur", sport: "soccer" as const, teamSeasonId: 72209, captionCollections: [1536077, 1536083, 1536080] },
  { orgKey: "san-antonio-spurs", team: "San Antonio Spurs", sport: "basketball" as const, teamSeasonId: 72210, captionCollections: [1536706] },
];
/** the ids the demo started with: kept so saved fan preferences and published clips keep resolving */
const LEGACY_IDS: Record<number, string> = { 736578: "solanke", 736557: "savio", 736581: "kudus", 736583: "wembanyama", 736584: "harper", 736586: "fox" };
/** widely used nicknames fans search by (curated; ScorePlay holds legal names only) */
const NICKNAMES: Record<number, string[]> = { 736583: ["Wemby"], 736581: ["Mo Kudus"] };

const KEY = process.env.SCOREPLAY_API_KEY;
if (!KEY) throw new Error("SCOREPLAY_API_KEY is required (reads the club's squad from ScorePlay)");
type Row = { ID: number; first_name: string; last_name: string; full_name: string; external_id?: string; ai_name?: string };
async function roster(teamSeasonId: number): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; page < 20; page++) {
    const r = await fetch(`https://media.scoreplay.io/v1/players?team_season_id=${teamSeasonId}&page=${page}&limit=100`, { headers: { "X-ScorePlay-Api-Key": KEY!, Accept: "application/json" } });
    if (!r.ok) throw new Error(`ScorePlay /players ${teamSeasonId} -> ${r.status}`);
    const rows = (await r.json()) as Row[];
    if (!Array.isArray(rows)) throw new Error("Malformed roster response");
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}
async function captions(collections: number[]) {
  const out: string[] = [];
  for (const ev of collections) {
    for (let page = 1; page < 20; page++) {
      const r = await sp.mediaSearch({ media_type: "photo", event_id: ev }, page, 50);
      out.push(...r.data.media.map((m) => ((m as { description?: string }).description ?? "").replace(/\s+/g, " ").replace(/\(Photo by [^)]*\)/gi, "").trim()).filter(Boolean));
      if (page >= (r.data.total_pages ?? 1)) break;
    }
  }
  return out;
}
const slug = (s: string) => normName(s).replace(/ /g, "-");
const titleCase = (s: string) => s.split(" ").map((w) => (/^(van|de|der|den|von|da|di|dos|del|le|la)$/i.test(w) ? w.toLowerCase() : w.replace(/(^|['-])(\p{Ll})/gu, (_, a, b) => a + b.toUpperCase()))).join(" ");

const file: { generatedAt: string; source: string; clubs: unknown[] } = { generatedAt: new Date().toISOString(), source: "ScorePlay /players (team_season) + club photographer captions", clubs: [] };
for (const c of CLUBS) {
  const rows = await roster(c.teamSeasonId);
  const linked = rows.filter((r) => r.external_id);
  const base = linked.map((r) => ({
    scoreplayPlayerId: r.ID, fullName: r.full_name,
    fallbackName: titleCase(`${r.first_name.split(" ")[0]} ${r.last_name}`.trim()),
    aliases: [r.full_name, r.ai_name ?? "", r.last_name].filter(Boolean), displayName: r.full_name,
  }));

  // names as the club writes them, from its own captions
  const caps = await captions(c.captionCollections);
  const seen = new Map<number, Map<string, number>>();
  const staff = new Set<number>();
  const unmatched = new Map<string, number>();
  // a name is capitalised words, with lowercase particles inside it ("Micky van de Ven", "Jan Paul van Hecke")
  const W = `(?:[\\p{Lu}][\\p{L}'.-]*|van|de|der|den|von|da|di|dos|del|le|la)`;
  const nameRe = new RegExp(`([\\p{Lu}][\\p{L}'.-]*(?:\\s${W})*?)\\s(?:\\((?:L|R|C)\\)\\s)?of ${c.team}\\b`, "gu");
  const nbaRe = new RegExp(`${c.team} (?:guard|forward|center) ((?:[\\p{Lu}][\\p{L}'.-]*\\s?)+?)(?=\\s[\\p{Ll}]|[,.]|$)`, "gu");
  const staffRe = new RegExp(`${c.team} (?:[Hh]ead [Cc]oach|[Aa]ssistant [Cc]oach|[Mm]anager) ((?:[\\p{Lu}][\\p{L}'.-]*\\s?)+?)(?=\\s[\\p{Ll}(]|[,.]|$)`, "gu");
  const note = (name: string, isStaff = false) => {
    const n = name.replace(/^(The match shirts? of|A general view of)\s+/i, "").trim();
    if (!n || n.split(" ").length > 5) return;
    const hit = matchSquadName(n, base);
    if (!hit) { unmatched.set(n, (unmatched.get(n) ?? 0) + 1); return; }
    const m = seen.get(hit.scoreplayPlayerId) ?? new Map<string, number>();
    m.set(n, (m.get(n) ?? 0) + 1); seen.set(hit.scoreplayPlayerId, m);
    if (isStaff) staff.add(hit.scoreplayPlayerId);
  };
  for (const cap of caps) {
    for (const m of cap.matchAll(nameRe)) note(m[1]);
    for (const m of cap.matchAll(nbaRe)) note(m[1]);
    for (const m of cap.matchAll(staffRe)) note(m[1], true);
  }

  const used = new Set<string>();
  const players: PlayerIdentity[] = base.map((b) => {
    const forms = [...(seen.get(b.scoreplayPlayerId) ?? new Map()).entries()].sort((x, y) => y[1] - x[1]);
    const displayName = forms[0]?.[0] ?? b.fallbackName;
    let id = LEGACY_IDS[b.scoreplayPlayerId] ?? slug(displayName);
    if (used.has(id)) id = `${id}-${b.scoreplayPlayerId}`;
    used.add(id);
    const aliases = [...new Set([displayName, ...forms.map(([f]) => f), ...b.aliases, ...(NICKNAMES[b.scoreplayPlayerId] ?? [])].map((a) => a.trim()).filter(Boolean))];
    return { id, orgKey: c.orgKey, displayName, sport: c.sport, scoreplayPlayerId: b.scoreplayPlayerId, role: staff.has(b.scoreplayPlayerId) ? "staff" : "player", aliases, fullName: b.fullName } as PlayerIdentity & { fullName: string };
  });
  players.sort((a, b) => (a.role === b.role ? 0 : a.role === "staff" ? 1 : -1) || a.displayName.localeCompare(b.displayName));
  file.clubs.push({ orgKey: c.orgKey, team: c.team, sport: c.sport, teamSeasonId: c.teamSeasonId, scorePlayRecords: rows.length, linkedToLeagueData: linked.length, unlinkedNotUsed: rows.length - linked.length, players });

  const named = players.filter((p) => seen.has(p.scoreplayPlayerId!)).length;
  console.log(`${c.team}: ${rows.length} ScorePlay records, ${linked.length} linked to league data (used), ${rows.length - linked.length} unlinked (not used)`);
  console.log(`  ${players.length} people: ${players.filter((p) => p.role === "player").length} players, ${players.filter((p) => p.role === "staff").length} staff; ${named} named from ${caps.length} captions`);
  console.log(`  e.g. ${players.slice(0, 6).map((p) => `${p.displayName} [${p.id}]`).join(", ")}`);
  const um = [...unmatched.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (um.length) console.log(`  caption names not on the squad (opponents, staff without a record...): ${um.map(([n, k]) => `${n} x${k}`).join("; ")}`);
}
writeFileSync("data/squads.json", JSON.stringify(file, null, 2) + "\n");
console.log("wrote data/squads.json");
