import React from 'react';

/* Clout Skeleton — loading placeholder that reserves final layout so nothing jumps.
   Default for any content region that fetches. */
export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-xs)', circle = false, style, ...rest }) {
  const size = circle ? { width: height, height, borderRadius: '50%' } : { width, height, borderRadius: radius };
  return (
    <span aria-hidden="true" style={{
      display: 'block', ...size,
      background: 'linear-gradient(90deg, rgba(245,245,243,0.05) 0%, rgba(245,245,243,0.11) 50%, rgba(245,245,243,0.05) 100%)',
      backgroundSize: '200% 100%', animation: 'clout-shimmer var(--skeleton-duration) linear infinite', ...style,
    }} {...rest}>
      <style>{'@keyframes clout-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </span>
  );
}

/* SkeletonText — n shimmer lines with a short last line. */
export function SkeletonText({ lines = 3, gap = 8, style }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </span>
  );
}
