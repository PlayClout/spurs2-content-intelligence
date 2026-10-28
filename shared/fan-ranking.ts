export interface FanPreferences {
  favoritePlayerIds: readonly string[];
  interestTags: readonly string[];
}

export const DEMO_FAN_PERSONAS = [
  { id: "fan-solanke", label: "Fan A - Solanke goals", favoritePlayerIds: ["solanke"], interestTags: ["goal", "comeback"] },
  { id: "fan-crowd", label: "Fan B - crowd energy", favoritePlayerIds: [], interestTags: ["crowd", "celebration"] },
] as const;

export interface FanRankCandidate {
  id: string;
  editorScore?: number; // 0-100 from the editor desk
  featuredPlayerIds: string[];
  interestTags: string[];
  publishedAt?: string | Date | null;
  sourcePlayKey?: string | null;
}

export interface FanRankResult<T extends FanRankCandidate = FanRankCandidate> {
  item: T;
  score: number;
  reasons: string[];
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const daysOld = (d: string | Date | null | undefined, now: Date) => d ? Math.max(0, (now.getTime() - new Date(d).getTime()) / 86_400_000) : 999;

export function rankForFan<T extends FanRankCandidate>(items: T[], prefs: FanPreferences, now = new Date(), nameOf: (playerId: string) => string = (id) => id): FanRankResult<T>[] {
  const seenPlay = new Map<string, number>();
  return items.map((item) => {
    const favoriteMatches = item.featuredPlayerIds.filter((p) => prefs.favoritePlayerIds.includes(p));
    const interestMatches = item.interestTags.filter((t) => prefs.interestTags.includes(t));
    const favorite = prefs.favoritePlayerIds.length ? (favoriteMatches.length ? 1 : 0) : 0.5;
    const interest = prefs.interestTags.length ? Math.min(1, interestMatches.length / Math.max(1, prefs.interestTags.length)) : 0.5;
    const editor = clamp01((item.editorScore ?? 50) / 100);
    const recency = clamp01(1 - daysOld(item.publishedAt, now) / 7);
    const exploration = favoriteMatches.length || interestMatches.length ? 0 : 1;
    const repeatCount = item.sourcePlayKey ? (seenPlay.get(item.sourcePlayKey) ?? 0) : 0;
    if (item.sourcePlayKey) seenPlay.set(item.sourcePlayKey, repeatCount + 1);
    const repeatPenalty = Math.min(0.35, repeatCount * 0.15);
    const raw = 0.45 * favorite + 0.25 * interest + 0.15 * editor + 0.10 * recency + 0.05 * exploration - repeatPenalty;
    const reasons = [
      ...favoriteMatches.map((p) => `Because you follow ${nameOf(p)}`),
      ...interestMatches.map((t) => `You picked ${t}`),
      ...(editor >= 0.8 ? ["Editor's pick"] : []),
      ...(exploration && !(favoriteMatches.length || interestMatches.length) ? ["Discovery slot"] : []),
      ...(repeatPenalty ? ["Similar play de-prioritized"] : []),
    ];
    return { item, score: Math.round(clamp01(raw) * 100), reasons: reasons.length ? reasons : ["Balanced feed"] };
  }).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}
