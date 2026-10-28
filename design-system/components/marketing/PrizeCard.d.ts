import React from 'react';
/**
 * Hero prize card props.
 * @startingPoint section="Marketing" subtitle="Hero prize card" viewport="700x340"
 */
export interface PrizeCardProps {
  /** Small blue kicker chip, e.g. "WIN A". */
  kicker?: string;
  /** Dominant prize value, e.g. "$500". */
  value?: string;
  /** Product / offer label, e.g. "GIFT CARD". */
  label?: string;
  /** Render the value in the Action gradient (clipped to text). */
  valueGradient?: boolean;
  style?: React.CSSProperties;
}
/** Hero prize card — Carbon surface, blue kicker, dominant italic value, gradient underline. */
export function PrizeCard(props: PrizeCardProps): JSX.Element;
