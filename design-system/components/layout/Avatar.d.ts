import React from 'react';
export interface AvatarProps {
  src?: string;
  /** Used for initials fallback and alt text. */
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Gradient/solid identity ring — e.g. `action` for a top-ranked player. */
  ring?: 'none' | 'accent' | 'action' | 'success';
  /** Pink live dot. */
  live?: boolean;
  style?: React.CSSProperties;
}
export interface AvatarGroupProps {
  users: Array<{ src?: string; name?: string }>;
  size?: 'xs' | 'sm' | 'md';
  /** Max shown before the overflow count. */
  max?: number;
  style?: React.CSSProperties;
}
/** User / team identity with initials fallback, status ring and live dot. */
export function Avatar(props: AvatarProps): JSX.Element;
/** Overlapping avatar stack with an overflow count. */
export function AvatarGroup(props: AvatarGroupProps): JSX.Element;
