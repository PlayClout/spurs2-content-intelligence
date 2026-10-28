import React from 'react';
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: string;
  /** Render as a circle sized by `height` (avatars). */
  circle?: boolean;
  style?: React.CSSProperties;
}
export interface SkeletonTextProps {
  lines?: number;
  gap?: number;
  style?: React.CSSProperties;
}
/** Shimmer placeholder that reserves final layout — the default loading state for content regions. */
export function Skeleton(props: SkeletonProps): JSX.Element;
/** Multi-line text skeleton with a shortened last line. */
export function SkeletonText(props: SkeletonTextProps): JSX.Element;
