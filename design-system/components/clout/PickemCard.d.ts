import React from 'react';
export interface PickemOption {
  id: string;
  /** Short outcome label, e.g. "Over" / "Under", or a team name. */
  label: string;
  /** Secondary detail — an XP value or point weight, e.g. "120 XP". NEVER odds. */
  detail?: string;
}
export interface PickemCardProps {
  /** Player, team or event the prediction is about. */
  subject: string;
  /** Context line, e.g. "KC @ BUF · Sun 4:25pm". */
  meta?: string;
  /** The stat line being predicted, e.g. "Passing yards 274.5". */
  line?: string;
  /** Two mutually exclusive outcomes. */
  options: PickemOption[];
  selected?: string;
  onSelect?: (id: string) => void;
  /** open (selectable) · locked (event started) · correct · incorrect (graded vs. the result). */
  state?: 'open' | 'locked' | 'correct' | 'incorrect';
  /** XP earned for a correct prediction, e.g. "120 XP". This is a point weight, never a
   *  payout multiplier or odds — Clout is free to play with no stake. */
  xpValue?: string;
  /** Footer note while open, e.g. "Locks 4:25pm". */
  lockLabel?: string;
  style?: React.CSSProperties;
}
/**
 * The flagship ACTION type — a free-to-play prediction on a real-world outcome.
 * No stake, no entry fee, no wager. Predictions are graded correct/incorrect and earn XP.
 */
export function PickemCard(props: PickemCardProps): JSX.Element;
