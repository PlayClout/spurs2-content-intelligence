import React from 'react';
export interface NavBarProps {
  title?: string;
  /** Renders a back chevron when provided. */
  onBack?: () => void;
  /** Extra leading content (logo, avatar) after the back button. */
  leading?: React.ReactNode;
  /** Trailing actions — use NavIconButton. */
  actions?: React.ReactNode;
  /** Let a cinematic hero show through (no background/blur/border). */
  transparent?: boolean;
  /** iOS-style centered title (default) vs left-aligned web style. */
  centerTitle?: boolean;
  style?: React.CSSProperties;
}
export interface NavIconButtonProps {
  icon: string;
  /** Accessible label — required, the button is icon-only. */
  label: string;
  /** Shows an unread dot. */
  badge?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
/** Top app bar — sticky, translucent blur, safe-area aware. */
export function NavBar(props: NavBarProps): JSX.Element;
/** 44px icon-only action for the nav bar. */
export function NavIconButton(props: NavIconButtonProps): JSX.Element;
