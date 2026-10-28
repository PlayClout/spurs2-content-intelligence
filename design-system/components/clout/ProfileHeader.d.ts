import React from 'react';
export interface ProfileStat {
  value: string;
  label: string;
  tone?: 'default' | 'value';
}
export interface ProfileHeaderProps {
  name: string;
  handle?: string;
  avatar?: string;
  /** Rank tier name, e.g. "Gold", "Rookie". */
  tier?: string;
  /** Global/league rank, e.g. "#1,204". */
  rank?: string;
  xp?: number;
  xpMax?: number;
  level?: number;
  /** Up to 4 summary stats. */
  stats?: ProfileStat[];
  onEdit?: () => void;
  style?: React.CSSProperties;
}
/** Profile identity block — avatar, tier, XP progress and summary stats on split-light. */
export function ProfileHeader(props: ProfileHeaderProps): JSX.Element;
