import React from 'react';
export interface LeaderboardRowProps {
  rank: number;
  name: string;
  avatar?: string;
  /** Secondary line, e.g. "14-week streak". */
  meta?: string;
  score: string;
  /** Rank movement since last update. Positive = climbed. */
  delta?: number;
  /** Highlights and labels the row as the signed-in user. Keep it pinned when scrolled away. */
  isCurrentUser?: boolean;
  /** Prize shown for reward-eligible positions, e.g. "$500". */
  prize?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Ranked standing row — medal coloring for the top 3, highlight for the current user. */
export function LeaderboardRow(props: LeaderboardRowProps): JSX.Element;
