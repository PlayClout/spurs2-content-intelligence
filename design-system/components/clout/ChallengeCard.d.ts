import React from 'react';
export interface ChallengeCardProps {
  title: string;
  description?: string;
  /** Icon name from the Clout set. */
  icon?: string;
  /** Reward amount, e.g. "250" (XP) or "500" (Coins). */
  reward?: string;
  /** `xp` (progression, accent blue) or `coins` (redemption currency, brand pink).
   *  Coins are earned only — never purchased, never cashed out. */
  rewardType?: 'xp' | 'coins';
  state?: 'available' | 'in-progress' | 'complete' | 'claimed' | 'expired';
  /** 0–100, shown when state is `in-progress`. */
  progress?: number;
  /** Caption under the bar, e.g. "3 of 5 picks". */
  progressLabel?: string;
  /** Countdown text, e.g. "6h left". */
  timeLeft?: string;
  /** Claim handler — the Claim button only renders when state is `complete`. */
  onAction?: () => void;
  style?: React.CSSProperties;
}
/** Time-boxed free action awarding XP or Coins, with progress and claim states. */
export function ChallengeCard(props: ChallengeCardProps): JSX.Element;
