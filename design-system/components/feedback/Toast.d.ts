import React from 'react';
export interface ToastProps {
  status?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
/** Transient confirmation toast. Mobile: full-width above the tab bar. Web: bottom-right, max 420px. */
export function Toast(props: ToastProps): JSX.Element;
