import React from 'react';

/* Stat Chip — proof / engagement stat. Clout Black surface, white hairline, italic value
   (pink for prize value, white/blue otherwise) over a wide-tracked label. */
export function StatChip({ value = '$50K', label = 'TOTAL PRIZES', valueColor = 'var(--clout-pink)', style, ...rest }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', gap: 4, minWidth: 200, boxSizing: 'border-box',
      background: 'var(--clout-black)', border: '1.5px solid var(--border-hairline)',
      borderRadius: 'var(--radius-chip)', padding: '18px 24px', ...style,
    }} {...rest}>
      <span style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 34,
        lineHeight: 1, color: valueColor,
      }}>{value}</span>
      <span style={{
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--clout-slate)',
      }}>{label}</span>
    </div>
  );
}
