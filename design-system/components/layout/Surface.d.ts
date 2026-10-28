import React from 'react';
export interface SurfaceProps {
  /** default (card) · raised (menu/popover) · sunken (well) · accent (featured, blue hairline) */
  variant?: 'default' | 'raised' | 'sunken' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: string;
  /** Adds hover lift + press compress; implied when `onClick` is set. */
  interactive?: boolean;
  /** Selected state — accent ring (pick'em selections, plan choice). */
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
/**
 * The product card primitive — Carbon fill, hairline border, brand radii.
 * @startingPoint section="Layout" subtitle="Card surface variants" viewport="700x260"
 */
export function Surface(props: SurfaceProps): JSX.Element;
