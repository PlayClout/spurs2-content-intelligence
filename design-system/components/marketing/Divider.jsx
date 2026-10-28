import React from 'react';

/* Divider — Action-gradient section separator. Optional centered diamond node. */
export function Divider({ node = true, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', ...style }} {...rest}>
      <span style={{ flex: 1, height: 3, borderRadius: 3, background: 'var(--clout-gradient-action)' }} />
      {node && <span style={{ width: 10, height: 10, transform: 'rotate(45deg)', background: 'var(--clout-hot-coral)', boxShadow: 'var(--glow-pink)' }} />}
      {node && <span style={{ flex: 1, height: 3, borderRadius: 3, background: 'var(--clout-gradient-action)' }} />}
    </div>
  );
}
