import React from 'react';
/**
 * Achievement / status badge props.
 * @startingPoint section="Badges" subtitle="Achievement & status badges" viewport="700x300"
 */
export interface BadgeProps {
  /** circle (achievement) · square (rank tier) · shield (verification) · ribbon (placement) · hexagon (XP). */
  shape?: 'circle' | 'square' | 'shield' | 'ribbon' | 'hexagon';
  title?: string;
  subtitle?: string;
  /** Rim gradient: 'action' (warm/achievement) or 'atmosphere' (status/tier). */
  rim?: 'action' | 'atmosphere';
  /** Square px size. Min legible 96. */
  size?: number;
  style?: React.CSSProperties;
}
/** Achievement / status badge for Clout's gamified engagement system. */
export function Badge(props: BadgeProps): JSX.Element;
