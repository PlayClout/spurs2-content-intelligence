import React from 'react';
export interface InlineAlertProps {
  status?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children?: React.ReactNode;
  /** Renders a dismiss button when provided. */
  onDismiss?: () => void;
  /** Optional action row (e.g. a small Button). */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
/** Persistent in-flow message for a page region. Use Toast for transient confirmations. */
export function InlineAlert(props: InlineAlertProps): JSX.Element;
