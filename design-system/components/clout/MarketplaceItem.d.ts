import React from 'react';
export interface MarketplaceItemProps {
  name: string;
  /** Partner / brand kicker. */
  brand?: string;
  image?: string;
  /** Redemption cost in the given currency, e.g. "2,500". */
  cost: string;
  /** `coin` (redemption currency, pink) or `xp` (accent blue). No cash option —
   *  items are redeemed with earned Coins, never bought with money. */
  currency?: 'coin' | 'xp';
  /** Inventory caption, e.g. "12 left". */
  stock?: string;
  state?: 'available' | 'low-stock' | 'sold-out' | 'owned';
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Coin-redeemable marketplace tile — 2-col grid on mobile, 3–4-col on web. */
export function MarketplaceItem(props: MarketplaceItemProps): JSX.Element;
