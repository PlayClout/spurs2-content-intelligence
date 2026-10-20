import React from 'react';
export interface StatusBadgeProps {
  status?: 'live' | 'new' | 'ending';
  /** Optional label override. */
  label?: string;
  style?: React.CSSProperties;
}
/** Small status flag — live (pink, dot), new (blue), ending (orange). */
export function StatusBadge(props: StatusBadgeProps): JSX.Element;
