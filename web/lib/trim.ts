"use server";

/**
 * Smart trim workspace (server). The cut is computed from stored data only: the moment's TwelveLabs beats
 * (moments.raw.moments) inside the analysed window, plus each channel's target length.
 */
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { channelProfiles } from "@/lib/channels";
import { smartTrimFor, trimModeOf } from "@shared/smart-trim";

export async function trimWorkspace(opportunityId: string) {
  const [o] = await db.select().from(s.opportunities).where(eq(s.opportunities.id, opportunityId));
  if (!o || o.contentType !== "reel") return null;
  const [m] = await db.select({ raw: s.moments.raw }).from(s.moments).where(eq(s.moments.id, o.momentId));
  const raw = m?.raw ?? null;
  const channels = (o.channels as string[]).filter((c) => channelProfiles[c]?.targetDurationSec?.[1]);
  const perChannel = channels.flatMap((c) => {
    const t = smartTrimFor(raw, o.delivery, channelProfiles[c]);
    return t ? [{ channel: c, label: channelProfiles[c].label, minSec: channelProfiles[c].targetDurationSec[0], maxSec: channelProfiles[c].targetDurationSec[1], start: t.start, end: t.end, lengthSec: t.lengthSec, reason: t.reason, note: t.note }] : [];
  });
  const lead = smartTrimFor(raw, o.delivery, channelProfiles[channels[0]]);
  if (!lead) return null;
  const manual = o.trimOverride as { startSec: number; endSec: number } | null;
  const mode = trimModeOf(o.delivery, manual);
  return {
    mode,
    // only an editor-set cut pre-fills the manual inputs (after a smart approval, trimOverride holds the smart cut)
    manual: mode === "manual" ? manual : null,
    /** the channel whose cut the final render (and ScorePlay log) uses */
    leadChannel: channels[0], leadLabel: channelProfiles[channels[0]].label,
    analysed: lead.analysed,
    beats: lead.beats.map((b) => ({ label: b.label, start: b.start, end: b.end, key: b === lead.key })),
    perChannel,
  };
}
export type TrimWorkspace = NonNullable<Awaited<ReturnType<typeof trimWorkspace>>>;
