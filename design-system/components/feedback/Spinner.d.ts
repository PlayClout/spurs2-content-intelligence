import React from 'react';
export interface SpinnerProps {
  size?: number;
  tone?: 'accent' | 'action' | 'neutral';
  /** Accessible label; defaults to "Loading". */
  label?: string;
  style?: React.CSSProperties;
}
/** Indeterminate spinner for short waits and in-button loading. Use Skeleton for content areas. */
export function Spinner(props: SpinnerProps): JSX.Element;
