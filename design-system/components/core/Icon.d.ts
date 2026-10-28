import React from 'react';

export interface IconProps {
  /** Icon name from the 27-glyph Clout set. */
  name:
    | 'arrow-left' | 'arrow-right' | 'chevron-right' | 'chevron-down' | 'external' | 'close' | 'menu'
    | 'play' | 'pause' | 'live' | 'stream'
    | 'controller' | 'trophy' | 'medal' | 'target' | 'fire'
    | 'gift' | 'coin' | 'star' | 'xp' | 'bolt'
    | 'heart' | 'clock' | 'user' | 'share' | 'check' | 'bell';
  /** Pixel size (square). 24 default; min legible 16. */
  size?: number;
  /** Any CSS color / var. White by default; Electric Blue or a gradient for emphasis. */
  color?: string;
  /** Stroke weight — keep 2 at 24px, scale proportionally. */
  strokeWidth?: number;
  style?: React.CSSProperties;
}

/** Clout line icon (24px grid, 2px stroke, round caps) rendered with currentColor. */
export function Icon(props: IconProps): JSX.Element | null;
export const ICON_NAMES: string[];
