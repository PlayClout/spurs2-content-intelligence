import React from 'react';
export interface ChipProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'value' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  /** Renders as a toggle button (filter chips). */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** Renders a remove affordance (applied filters). */
  onRemove?: () => void;
  leadingIcon?: React.ReactNode;
  style?: React.CSSProperties;
}
/** Compact metadata / filter token. Not an action (Button) and not a state flag (StatusBadge). */
export function Chip(props: ChipProps): JSX.Element;
