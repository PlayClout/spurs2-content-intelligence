/**
 * Library mode: content from a club's ScorePlay library when it is NOT a full match (raw camera clips, finished social
 * edits, interviews, photos). Each format in data/library/<club>.json is one kind of footage. Video formats are found
 * by a real TwelveLabs search over the club's own index, scoped to one ScorePlay collection. Photo formats are picked
 * from the club photographer's CAPTIONS: ScorePlay's player tags were wrong on real photos (a photo tagged Maliq Brown
 * is captioned Tarris Reed Jr.), so names come from the caption the club wrote, never from tags or faces.
 * Pure: no network, no DB (tested in scripts/engine-test.ts).
 */
export interface LibraryQuery { query: string; label: string; headline: string }
export interface LibraryFormat {
  id: string; label: string; collection: string; max: number;
  queries?: LibraryQuery[];
  /** activation: named partner activation; player: one club player in action; scene: any caption matching `captionMatch`
   * (e.g. "match shirt of" in the dressing room), headlined with `headline` */
  photo?: "activation" | "player" | "scene";
  /** ScorePlay collection the photos come from (defaults to the plan's photoCollectionId) */
  photoCollectionId?: number;
  captionMatch?: string; headline?: string;
}
export interface LibraryPlan {
  orgKey: string; competition: string; eventLabel: string; teamSeasonId: number; photoCollectionId: number; formats: LibraryFormat[];
  /** the club as the photographer writes it in captions ("San Antonio Spurs", "Tottenham Hotspur") */
  team?: string;
}
export interface IndexedClip { scorePlayMediaId: number; name: string; collection: string; twelvelabsVideoId: string; twelvelabsAssetId: string }
export interface SearchHit { rank: number; start: number; end: number; video_id: string }
export interface PhotoItem { ID: number; description?: string }
export interface VideoPick { format: string; label: string; headline: string; clip: IndexedClip; start: number; end: number; rank: number; query: string }
export interface PhotoPick { format: string; photo: PhotoItem; headline: string; statLine: string }

/** Same footage, several crops: "X S1 JAM-423A" / "-423B" and "Vic_Dunk_#3_4x5" / "_16x9" are one play. */
export const playKey = (name: string) => name.toLowerCase()
  .replace(/\.[a-z0-9]+$/, "").replace(/[_ -]?(4x5|9x16|16x9|1x1)\b/g, "").replace(/-(\d+)[a-z]-?$/, "-$1").replace(/[^a-z0-9#]+/g, " ").trim();

/** Best hits across a format's queries, round-robin so one strong query cannot crowd out the others; one hit per
 * play, never the same play twice across formats. */
export function pickVideos(format: LibraryFormat, results: { q: LibraryQuery; hits: SearchHit[] }[], clips: IndexedClip[], taken: Set<string>): VideoPick[] {
  const byVideo = new Map(clips.filter((c) => c.collection === format.collection).map((c) => [c.twelvelabsVideoId, c]));
  const queues = results.map(({ q, hits }) => ({ q, hits: [...hits].sort((a, b) => a.rank - b.rank) }));
  const out: VideoPick[] = [];
  while (out.length < format.max && queues.some((x) => x.hits.length)) {
    for (const { q, hits } of queues) {
      if (out.length >= format.max) break;
      for (let h = hits.shift(); h; h = hits.shift()) {
        const clip = byVideo.get(h.video_id);
        if (!clip || !(h.end > h.start) || taken.has(playKey(clip.name))) continue;
        taken.add(playKey(clip.name));
        out.push({ format: format.id, label: q.label, headline: q.headline, clip, start: h.start, end: h.end, rank: h.rank, query: q.query });
        break;
      }
    }
  }
  return out;
}

const tidy = (s: string) => s.replace(/\s+/g, " ").replace(/’/g, "'").trim();
/** Caption body: no "(Photo by ... / Club)" credit and no "October 16, 2026, San Antonio, TX:" dateline. */
const body = (caption: string) => tidy(caption).replace(/\(Photo by [^)]*\)/gi, "").replace(/^[A-Z][a-z]+ \d{1,2}, \d{4}, [^:]{1,40}:\s*/, "").trim();
/** "... in-game activation Whataburger Drop in the Bucket during ..." -> "Whataburger Drop in the Bucket" */
export function captionActivation(caption = ""): string | null {
  return body(caption).match(/in-game activation (.+?) during\b/i)?.[1] ?? null;
}
/** The one club player a caption is about, and what they are doing. Two caption styles, both as the club's photographer
 * writes them:
 *   NBA:     "San Antonio Spurs guard Ja'Kobi Gillespie shoots a three pointer during the fourth quarter"
 *   Premier: "Dominic Solanke of Tottenham Hotspur celebrates scoring a goal for their side to make it 1-1"
 * -> { name, action, period }. Group shots (several club players) and posed photos return null. */
export function captionPlayer(caption = "", team = "San Antonio Spurs"): { name: string; action: string; period: string | null } | null {
  const c = body(caption).replace(/\s*\((?:L|R|C)\)/g, "");
  if (/pose for a photo/i.test(c)) return null;
  const nba = [...c.matchAll(new RegExp(`${team} (?:guard|forward|center) ((?:[A-Z][\\w'.-]* )+?)(?=[a-z])`, "g"))].map((m) => m[1].trim());
  const tail = (rest: string) => ({ action: rest.split(/\b(?:during|against|at the|after|before)\b|[.,]/)[0].trim(), period: rest.match(/during the (\w+ quarter)/)?.[1] ?? null });
  if (nba.length) {
    if (nba.length !== 1) return null;
    return { name: nba[0], ...tail(c.slice(c.indexOf(nba[0]) + nba[0].length).trim()) };
  }
  const marker = ` of ${team} `;
  const parts = c.split(marker);
  if (parts.length !== 2) return null; // no club player named, or several
  const name = parts[0].trim();
  // a name is a few capitalised words (particles like "van de" allowed); "The match shirt of X" or a long clause is not
  if (!/^[A-ZÀ-Þ]/.test(name) || /^(The|A|An)\b/.test(name) || name.split(/\s+/).length > 5 || /\b(?:of|by|and|with)\b/.test(name)) return null;
  return { name, ...tail(parts[1].trim()) };
}

/** "Micky van de Ven" -> "VAN DE VEN", "Ja'Kobi Gillespie" -> "GILLESPIE", "Sávio" -> "SÁVIO" */
export function surnameOf(name: string): string {
  const w = name.replace(/ Jr\.$/, "").split(/\s+/);
  let i = w.length - 1;
  while (i > 0 && /^(van|de|der|den|von|da|di|dos|le|la)$/i.test(w[i - 1])) i--;
  return w.slice(i).join(" ").toUpperCase();
}

/** Captioned actions worth a card (a dunk beats "adjusts his arm band"); STRONG ones (a goal, a dunk) lead. */
const PHOTO_ACTION = /\b(dunks?|shoots?|blocks?|drives?|celebrates?|layup|rebound|steals?|scores?|scoring|tackles?|battles?)\b/i;
const PHOTO_STRONG = /\b(dunks?|scores?|scoring|blocks?)\b/i;

/** Photos for a format, picked from the photographer's captions; one per activation / per player / per scene. Player
 * photos rank a strong moment first (a goal, a dunk, a block), then any in-game action, then plain portraits; a missed
 * shot is never "strong", and warm-ups, arrivals and the tunnel never beat the game. */
export function pickPhotos(format: LibraryFormat, photos: PhotoItem[], taken: Set<number>, eventLabel: string, team = "San Antonio Spurs"): PhotoPick[] {
  const seen = new Set<string>();
  const out: PhotoPick[] = [];
  const order = (p: PhotoItem) => {
    const w = format.photo === "player" ? captionPlayer(p.description, team) : null;
    if (!w) return 99;
    const strong = PHOTO_STRONG.test(w.action) && !/fails to|miss/i.test(w.action);
    const offField = /arriv|warm|pre-match|tunnel|dressing room/i.test(p.description ?? "");
    return (strong ? 0 : PHOTO_ACTION.test(w.action) ? 1 : 3) + (w.period ? 0 : 1) + (offField ? 4 : 0);
  };
  for (const p of [...photos].sort((a, b) => order(a) - order(b) || a.ID - b.ID)) {
    if (out.length >= format.max || taken.has(p.ID)) continue;
    if (format.photo === "activation") {
      const a = captionActivation(p.description);
      if (!a || seen.has(a)) continue;
      seen.add(a);
      out.push({ format: format.id, photo: p, headline: a.toUpperCase(), statLine: `In-game activation · ${eventLabel}` });
    } else if (format.photo === "player") {
      const who = captionPlayer(p.description, team);
      if (!who || seen.has(who.name)) continue;
      seen.add(who.name);
      const what = who.action ? `${who.name} ${who.action}${who.period ? `, ${who.period}` : ""}` : `${who.name} · ${eventLabel}`;
      out.push({ format: format.id, photo: p, headline: surnameOf(who.name), statLine: what });
    } else if (format.photo === "scene") {
      const c = body(p.description ?? "");
      if (!format.captionMatch || !c.toLowerCase().includes(format.captionMatch.toLowerCase()) || seen.has(c)) continue;
      seen.add(c); // the photographer shoots one scene several times with the same caption: one card per scene
      out.push({ format: format.id, photo: p, headline: (format.headline ?? format.label).toUpperCase(), statLine: c.length > 140 ? `${c.slice(0, 137).trimEnd()}...` : c });
    } else continue;
    taken.add(p.ID);
  }
  return out;
}

/** Interleave formats so the inbox fills with a mix (action, voice, photo, action...) instead of one block per type. */
export function interleave<T>(groups: T[][]): T[] {
  const out: T[] = [];
  for (let i = 0; groups.some((g) => i < g.length); i++) for (const g of groups) if (i < g.length) out.push(g[i]);
  return out;
}
