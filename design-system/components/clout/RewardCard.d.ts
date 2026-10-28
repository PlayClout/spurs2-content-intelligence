import React from 'react';
export interface RewardCardProps {
  /** Product / prize name, e.g. "PGA Superstore Gift Card". */
  title: string;
  /** Headline value rendered in the Action gradient, e.g. "$500". */
  value?: string;
  /** Product image URL. Falls back to a gift icon. */
  image?: string;
  /** locked (not yet earned) · unlocked (redeemable) · redeemed · shipped. */
  state?: 'locked' | 'unlocked' | 'redeemed' | 'shipped';
  /** Unlock condition shown while locked, e.g. "Reach Tier 3". */
  requirement?: string;
  /** Shown once redeemed, e.g. "Redeemed Mar 4". */
  redeemedOn?: string;
  /** Surfaces the "18+ · verification required" note. Eligibility (age/geo/KYC) is checked
   *  at REDEMPTION, never at signup — anyone may play and earn freely. */
  requiresEligibility?: boolean;
  /** Opens the redemption flow — which must present EligibilityGate when required. */
  onRedeem?: () => void;
  compact?: boolean;
  style?: React.CSSProperties;
}
/** Prize earned through participation and redeemed with Coins — split-light + one glow. */
export function RewardCard(props: RewardCardProps): JSX.Element;
