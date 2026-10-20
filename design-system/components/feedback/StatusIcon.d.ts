import React from 'react';
export interface StatusIconProps {
  status?: 'success' | 'warning' | 'error' | 'info';
  size?: number;
}
export interface StatusConfig {
  fg: string; solid: string; subtle: string; border: string; glyph: string;
}
/** Status glyph so feedback never relies on color alone (WCAG 1.4.1). */
export function StatusIcon(props: StatusIconProps): JSX.Element;
/** Shared status config consumed by every feedback surface. */
export const STATUS: Record<'success' | 'warning' | 'error' | 'info', StatusConfig>;
