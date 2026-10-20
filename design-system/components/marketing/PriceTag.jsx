import React from 'react';

/* Prize Tag — solid Action-gradient tag with dark (Clout Black) text. High-emphasis value
   presentation for total prize value available; do not use as a button. Prizes are earned
   through free participation — never a pooled stake. */
export function PriceTag({ label = 'IN PRIZES', value = '$10,000', style, ...rest }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'var(--clout-gradient-action)', borderRadius: 'var(--radius-tag)',
      padding: '16px 40px', boxShadow: 'var(--glow-action)', ...style,
    }} {...rest}>
      <span style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 18,
        textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clout-black)',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 40,
        lineHeight: 1, color: 'var(--clout-black)',
      }}>{value}</span>
    </div>
  );
}
