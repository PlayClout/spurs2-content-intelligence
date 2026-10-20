import React from 'react';

/* Clout Spinner — indeterminate loading. Only for waits under ~2s or inside buttons;
   use Skeleton for content areas so layout doesn't jump. */
export function Spinner({ size = 24, tone = 'accent', label = 'Loading', style, ...rest }) {
  const color = tone === 'action' ? 'var(--value-default)' : tone === 'neutral' ? 'var(--fg-secondary)' : 'var(--accent-bright)';
  return (
    <span role="status" aria-label={label} style={{
      display: 'inline-block', width: size, height: size, flex: 'none', borderRadius: '50%',
      border: `${Math.max(2, Math.round(size / 10))}px solid rgba(245,245,243,0.14)`,
      borderTopColor: color, animation: 'clout-spin 800ms linear infinite', ...style,
    }} {...rest}>
      <style>{'@keyframes clout-spin{to{transform:rotate(360deg)}}'}</style>
    </span>
  );
}
