import React from 'react';
export interface EmptyStateProps {
  /** Icon element — use the Clout `Icon` component. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Primary next action — always provide one. */
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** Tighter padding for in-card empty regions. */
  compact?: boolean;
  style?: React.CSSProperties;
}
/** Zero-data, no-results and error-recovery state. Always offers one clear next action. */
export function EmptyState(props: EmptyStateProps): JSX.Element;
