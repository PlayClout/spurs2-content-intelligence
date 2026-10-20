import React from 'react';
export interface StatBlockProps {
  value: React.ReactNode;
  label: string;
  /** Change indicator, e.g. "+12%". */
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  tone?: 'default' | 'value' | 'accent' | 'success';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}
/** Product KPI display (the in-app counterpart to the marketing StatChip). */
export function StatBlock(props: StatBlockProps): JSX.Element;
