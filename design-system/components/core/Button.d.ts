import React from 'react';

/**
 * Clout CTA button props.
 * @startingPoint section="Core" subtitle="Primary CTA button — Action gradient pill" viewport="700x220"
 */
export interface ButtonProps {
  children: React.ReactNode;
  /** Conversion hierarchy. primary = solid Action-gradient (default). secondary = dark + gradient
   *  stroke (use when a solid fill competes with busy hero art). dark = Carbon + hairline (bright
   *  surfaces). outline = transparent + white (minimal/quiet contexts). */
  family?: 'primary' | 'secondary' | 'dark' | 'outline';
  /** large (64px) or small (48px). */
  size?: 'large' | 'small';
  /** Trailing circular-arrow glyph. */
  icon?: 'arrow-right' | 'chevron-right' | 'external';
  /** Show the trailing circular arrow badge. */
  showArrow?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/** Clout CTA button — the strongest ACTIONABLE element on any layout. */
export function Button(props: ButtonProps): JSX.Element;
