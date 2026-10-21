import { Camera, Music2, Hash, Play, MonitorPlay, CircleDot } from "lucide-react";
import { channelLabel } from "@/lib/channels";

// lucide dropped brand icons; use evocative generics.
const iconFor = (channel: string) => {
  if (channel.startsWith("instagram")) return Camera;
  if (channel === "tiktok") return Music2;
  if (channel === "x_post") return Hash;
  if (channel === "youtube_short") return Play;
  if (channel === "youtube_highlight") return MonitorPlay;
  return CircleDot;
};

export function ChannelIcons({ channels, size = 14 }: { channels: string[]; size?: number }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      {channels.map((c) => {
        const Icon = iconFor(c);
        return <Icon key={c} size={size} aria-label={channelLabel(c)} />;
      })}
    </span>
  );
}
