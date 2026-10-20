import React from 'react';
export interface PassCardProps {
  /** Pass name — follows the `[Event/Partner] Pass` convention. */
  name?: string;
  /** Sport / league kicker, e.g. "NFL · Week 12". */
  sport?: string;
  /** `free` (the always-available Clout Pass) · `upgrade` (optional content purchase that
   *  unlocks premium actions, challenges and marketplace — NOT an entry fee or stake) ·
   *  `locked` (dims and disables). */
  tier?: 'free' | 'upgrade' | 'locked';
  /** Short status word shown in the pill (Active, Ended, Soon). */
  status?: string;
  /** Completion percentage 0–100. */
  progress?: number;
  /** Caption beside the progress bar, e.g. "4 / 7 picks". */
  progressLabel?: string;
  /** Total prize value available, e.g. "$50K". */
  prizes?: string;
  /** Remaining free actions in this pass, e.g. "3". */
  actionsLeft?: string;
  expiresIn?: string;
  locked?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** A set of free actions and challenges. Free tier always available; upgrades are optional content. */
export function PassCard(props: PassCardProps): JSX.Element;
