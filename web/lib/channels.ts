import profiles from "@pipeline/channel-profiles.json";

export type ChannelKey = keyof typeof profiles extends infer K
  ? K extends `$${string}`
    ? never
    : K
  : never;

export interface ChannelProfile {
  label: string;
  aspect: string;
  width: number;
  height: number;
  maxDurationSec: number;
  targetDurationSec: number[];
  safeZone: { top: number; bottom: number; left: number; right: number };
  captions: { burnIn: boolean; position: string; fontSize: number };
  copy: { maxChars: number; hashtags: boolean; tone: string };
}

export const channelProfiles = Object.fromEntries(
  Object.entries(profiles).filter(([k]) => !k.startsWith("$"))
) as unknown as Record<string, ChannelProfile>;

export const channelLabel = (c: string) => channelProfiles[c]?.label ?? c;
