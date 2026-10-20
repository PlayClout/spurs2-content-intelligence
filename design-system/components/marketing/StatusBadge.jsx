import React from 'react';

/* Status Badge — small status flag. live (pink, pulsing dot), new (blue), ending (orange). */
const CFG = {
  live: { color: 'var(--clout-pink)', label: 'LIVE', dot: true },
  new: { color: 'var(--clout-electric-blue)', label: 'NEW', dot: false },
  ending: { color: 'var(--clout-signal-orange)', label: 'ENDING SOON', dot: false },
};
export function StatusBadge({ status = 'live', label, style, ...rest }) {
  const c = CFG[status] || CFG.live;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
      borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${c.color}`, color: c.color,
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em',
      textTransform: 'uppercase', ...style,
    }} {...rest}>
      {c.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}` }} />}
      {label || c.label}
    </span>
  );
}
