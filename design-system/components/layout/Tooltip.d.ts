import React from 'react';
export interface TooltipProps {
  label: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  style?: React.CSSProperties;
}
/** Brief hover/focus label. Pointer-only — never place essential info here; mobile uses helper text. */
export function Tooltip(props: TooltipProps): JSX.Element;
