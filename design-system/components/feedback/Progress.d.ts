import React from 'react';
export interface ProgressProps {
  value?: number;
  max?: number;
  /** Track height: sm 4 · md 8 · lg 12 */
  size?: 'sm' | 'md' | 'lg';
  /** Fill treatment. `action` (gradient) for XP/pass progress; status tones for outcomes. */
  tone?: 'action' | 'accent' | 'success' | 'warning' | 'danger';
  label?: string;
  /** Right-aligned value caption, e.g. "1,240 / 2,000 XP". */
  valueLabel?: string;
  /** Unknown duration — animates a travelling segment. */
  indeterminate?: boolean;
  style?: React.CSSProperties;
}
/** Determinate/indeterminate progress bar for XP, pass progress, challenges and uploads. */
export function Progress(props: ProgressProps): JSX.Element;
