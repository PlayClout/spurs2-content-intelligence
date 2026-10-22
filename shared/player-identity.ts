export interface PlayerIdentity {
  id: string;
  orgKey: string;
  displayName: string;
  sport: "soccer" | "basketball";
  scoreplayPlayerId?: number;
  aliases: string[];
}

export const DEMO_PLAYERS: PlayerIdentity[] = [
  { id: "solanke", orgKey: "tottenham-hotspur", displayName: "Dominic Solanke", sport: "soccer", scoreplayPlayerId: 736578, aliases: ["solanke", "dominic solanke", "dominic ayodele solanke-mitchell"] },
  { id: "savio", orgKey: "tottenham-hotspur", displayName: "Sávio", sport: "soccer", scoreplayPlayerId: 736557, aliases: ["savio", "sávio", "savio moreira", "sávio moreira de oliveira"] },
  { id: "kudus", orgKey: "tottenham-hotspur", displayName: "Mohammed Kudus", sport: "soccer", aliases: ["kudus", "mo kudus", "mohammed kudus"] },
  { id: "wembanyama", orgKey: "san-antonio-spurs", displayName: "Victor Wembanyama", sport: "basketball", scoreplayPlayerId: 736583, aliases: ["wemby", "wembanyama", "victor wembanyama"] },
  { id: "harper", orgKey: "san-antonio-spurs", displayName: "Dylan Harper", sport: "basketball", scoreplayPlayerId: 736584, aliases: ["harper", "dylan harper"] },
  { id: "fox", orgKey: "san-antonio-spurs", displayName: "De'Aaron Fox", sport: "basketball", scoreplayPlayerId: 736586, aliases: ["fox", "deaaron fox", "de'aaron fox"] },
];

const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function resolveDemoPlayer(query: string, players = DEMO_PLAYERS) {
  const q = norm(query);
  const matches = players.filter((p) => p.aliases.some((a) => norm(a) === q) || norm(p.displayName) === q);
  if (matches.length === 1) return { status: "resolved" as const, player: matches[0] };
  if (matches.length > 1) return { status: "ambiguous" as const, matches };
  return { status: "not_found" as const, matches: [] as PlayerIdentity[] };
}
