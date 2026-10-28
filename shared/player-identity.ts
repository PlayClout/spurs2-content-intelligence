/**
 * Player identity: each club's squad as ScorePlay holds it (data/squads.json, refreshed by `npm run squads:sync`).
 * IDs are stable: the six players the demo started with keep their original ids (solanke, savio, kudus, wembanyama,
 * harper, fox) so saved fan preferences and published clips keep working; everyone else gets a slug of their known-as
 * name. Names are never guessed from faces: a player is matched from a name the club wrote (a photographer's caption,
 * an on-screen graphic, match data) to ScorePlay's own player record.
 */
import squads from "../data/squads.json" with { type: "json" };

export interface PlayerIdentity {
  id: string;
  orgKey: string;
  displayName: string;
  sport: "soccer" | "basketball";
  scoreplayPlayerId?: number;
  role?: "player" | "staff";
  aliases: string[];
}

interface SquadFile { clubs: { orgKey: string; sport: "soccer" | "basketball"; players: PlayerIdentity[] }[] }
export const PLAYERS: PlayerIdentity[] = (squads as unknown as SquadFile).clubs.flatMap((c) => c.players.map((p) => ({ ...p, orgKey: c.orgKey, sport: c.sport })));
/** @deprecated the fixed six-player list is gone; this is the full squad list (kept so older imports still resolve) */
export const DEMO_PLAYERS = PLAYERS;
export const playersFor = (orgKey: string | null | undefined) => PLAYERS.filter((p) => !orgKey || p.orgKey === orgKey);
export const playerById = (id: string) => PLAYERS.find((p) => p.id === id);

export const normName = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (s: string) => normName(s.replace(/-/g, " ")).split(" ").filter(Boolean);
const SUFFIX = new Set(["jr", "sr", "ii", "iii", "iv"]);
const PARTICLE = new Set(["van", "de", "der", "den", "von", "da", "di", "dos", "le", "la", "del"]);

/** Exact alias / display-name lookup (fan search, deep links). */
export function resolveDemoPlayer(query: string, players = PLAYERS) {
  const q = normName(query);
  const matches = players.filter((p) => p.aliases.some((a) => normName(a) === q) || normName(p.displayName) === q);
  if (matches.length === 1) return { status: "resolved" as const, player: matches[0] };
  if (matches.length > 1) return { status: "ambiguous" as const, matches };
  return { status: "not_found" as const, matches: [] as PlayerIdentity[] };
}

/**
 * Match a name the club wrote ("Andy Robertson", "Sávio", "Tarris Reed Jr.") to one record in a squad whose names are
 * legal names ("Andrew Henry Robertson", "Sávio Moreira de Oliveira", "Tarris Jr."). Rules, in order:
 *   1. an alias or the display name equals it;
 *   2. the surname (last word, suffixes like Jr. dropped) is a word of exactly one record's name, and if a first
 *      name is given it does not contradict that record (Andy/Andrew pass on the initial);
 *   3. every word of exactly one record's name appears in it (for short or broken records: "Tarris Jr.").
 * More than one candidate at any step = no match (two Johnsons never resolve on "Johnson"). Never fuzzy.
 */
export function matchSquadName<T extends { aliases: string[]; displayName: string; fullName?: string }>(name: string, squad: T[]): T | null {
  const q = normName(name);
  if (!q) return null;
  const exact = squad.filter((p) => p.aliases.some((a) => normName(a) === q) || normName(p.displayName) === q);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  const words = tokens(name).filter((w) => !SUFFIX.has(w));
  if (!words.length) return null;
  const recordWords = (p: T) => tokens(p.fullName ?? p.aliases.find((a) => a.split(" ").length > 1) ?? p.displayName);
  const surname = words[words.length - 1];
  const first = words.length > 1 && !PARTICLE.has(words[0]) ? words[0] : null;
  const bySurname = squad.filter((p) => {
    const w = recordWords(p);
    if (!w.includes(surname)) return false;
    // a given first name must fit: same word, same initial (Andy/Andrew) or part of a longer given name (Tosin/Oluwatosin)
    return !first || w.some((x) => x === first || x[0] === first[0] || (first.length >= 3 && x.includes(first)));
  });
  if (bySurname.length === 1) return bySurname[0];
  if (bySurname.length > 1) return null;

  const all = new Set(tokens(name));
  const contained = squad.filter((p) => { const w = recordWords(p); return w.length > 0 && w.every((x) => all.has(x)); });
  return contained.length === 1 ? contained[0] : null;
}

/**
 * Players named in a piece of club text (caption, headline, Pegasus summary): whole-word matches on a known-as name or
 * full name, or on a surname that is unique in the squad and written capitalised (a proper noun, so "Kings" never
 * matches King and "fox" in a sentence never matches Fox). Staff are suggested too (a manager's presser).
 */
export function suggestPlayers(text: string, squad: PlayerIdentity[]): string[] {
  // the photographer's credit is not a subject: "(Photo by Tony Garcia/San Antonio Spurs)" must never suggest David Garcia
  const plain = text.replace(/\((?:Photo|Photograph|Image|Video)s? by [^)]*\)/gi, " ").replace(/\b(?:Photo|Photograph) by [^.]*\.?/gi, " ")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const hits = new Set<string>();
  const surnameOf = (p: PlayerIdentity) => p.displayName.split(" ").pop()!;
  const counts = new Map<string, number>();
  for (const p of squad) counts.set(normName(surnameOf(p)), (counts.get(normName(surnameOf(p))) ?? 0) + 1);
  const esc = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const p of squad) {
    const full = [p.displayName, ...p.aliases.filter((a) => a.trim().split(/\s+/).length > 1)];
    if (full.some((n) => new RegExp(`(^|[^\\p{L}])${esc(n)}($|[^\\p{L}])`, "iu").test(plain))) { hits.add(p.id); continue; }
    const s = surnameOf(p);
    if (s.length >= 3 && counts.get(normName(s)) === 1 && new RegExp(`(^|[^\\p{L}])${esc(s)}($|[^\\p{L}])`, "u").test(plain)) hits.add(p.id);
  }
  return [...hits];
}
