import React from 'react';

/* Countdown — urgency. Three Carbon blocks (days / hrs / min) with italic numerals. */
function Block({ n, unit }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      background: 'var(--clout-carbon)', border: '1.5px solid var(--border-hairline)',
      borderRadius: 'var(--radius-chip)', padding: '16px 20px', minWidth: 88,
    }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 44,
        lineHeight: 0.9, color: 'var(--clout-white)',
      }}>{String(n).padStart(2, '0')}</span>
      <span style={{
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--clout-slate)',
      }}>{unit}</span>
    </div>
  );
}
export function Countdown({ days = 2, hours = 14, minutes = 30, style, ...rest }) {
  return (
    <div style={{ display: 'inline-flex', gap: 12, ...style }} {...rest}>
      <Block n={days} unit="Days" /><Block n={hours} unit="Hrs" /><Block n={minutes} unit="Min" />
    </div>
  );
}
