import React from 'react';
export interface ModalProps {
  open?: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  /** Action row, right-aligned. Primary action last. */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** `sheet` on mobile (<768px), `modal` on tablet/web — this is a platform rule, not a preference. */
  presentation?: 'modal' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  /** Allow scrim click + close button. Set false for blocking flows (age gate, payment). */
  dismissible?: boolean;
  style?: React.CSSProperties;
}
/** Dialog primitive with two presentations: centered Modal (web) and bottom Sheet (mobile). */
export function Modal(props: ModalProps): JSX.Element | null;
