"use server";

/**
 * Demo fan identity (U1.2/U1.3). Real auth is post-hackathon; a fan profile is a demo persona plus editable
 * preferences, held in an httpOnly cookie on this device. Preferences hold canonical player IDs and the shared
 * interest vocabulary, the same IDs the editor confirms on each clip, so ranking never guesses from names.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEMO_FAN_PERSONAS } from "@shared/fan-ranking";
import { PLAYERS } from "@shared/player-identity";
import { FAN_INTERESTS } from "@shared/fan-catalog";

const COOKIE = "spursx2_fan";

export interface FanProfile { personaId: string; label: string; favoritePlayerIds: string[]; interestTags: string[] }

function sanitize(p: Partial<FanProfile>): FanProfile {
  const players = new Set(PLAYERS.map((x) => x.id));
  const interests = new Set<string>(FAN_INTERESTS);
  return {
    personaId: String(p.personaId ?? "custom").slice(0, 40),
    label: String(p.label ?? "My feed").slice(0, 60),
    favoritePlayerIds: [...new Set((p.favoritePlayerIds ?? []).filter((x) => players.has(x)))],
    interestTags: [...new Set((p.interestTags ?? []).filter((x) => interests.has(x)))],
  };
}

export async function getFanProfile(): Promise<FanProfile> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (raw) {
    try { return sanitize(JSON.parse(raw)); } catch { /* fall through to default */ }
  }
  const p = DEMO_FAN_PERSONAS[0];
  return sanitize({ personaId: p.id, label: p.label, favoritePlayerIds: [...p.favoritePlayerIds], interestTags: [...p.interestTags] });
}

async function write(profile: FanProfile) {
  (await cookies()).set(COOKIE, JSON.stringify(profile), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  revalidatePath("/fan", "layout");
}

export async function selectPersona(personaId: string) {
  const p = DEMO_FAN_PERSONAS.find((x) => x.id === personaId);
  if (!p) return { ok: false as const, error: "Unknown persona" };
  await write(sanitize({ personaId: p.id, label: p.label, favoritePlayerIds: [...p.favoritePlayerIds], interestTags: [...p.interestTags] }));
  return { ok: true as const };
}

export async function savePreferences(favoritePlayerIds: string[], interestTags: string[]) {
  const current = await getFanProfile();
  await write(sanitize({ ...current, personaId: "custom", label: "My feed", favoritePlayerIds, interestTags }));
  return { ok: true as const };
}

export async function clearPreferences() {
  await write(sanitize({ personaId: "balanced", label: "Balanced feed", favoritePlayerIds: [], interestTags: [] }));
  return { ok: true as const };
}
