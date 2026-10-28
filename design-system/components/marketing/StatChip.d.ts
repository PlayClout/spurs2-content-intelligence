import React from 'react';
export interface StatChipProps {
  value?: string;
  label?: string;
  /** Value color — pink for prize value, white/blue otherwise. */
  valueColor?: string;
  style?: React.CSSProperties;
}
/** Proof / engagement stat chip — Clout Black surface, hairline, italic value. */
export function StatChip(props: StatChipProps): JSX.Element;
