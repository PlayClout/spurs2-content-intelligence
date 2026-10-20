import React from 'react';

/* Pass Tag — campaign / pass label as a gradient-OUTLINE pill (secondary-CTA style) so it never
   competes with the primary CTA. Name pattern: "[Event/Partner] Pass". */
export function PassTag({ name = 'OPEN PASS', style, ...rest }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '14px 34px', borderRadius: 'var(--radius-pill)',
      border: '3px solid transparent',
      background: 'linear-gradient(var(--clout-black),var(--clout-black)) padding-box, var(--clout-gradient-action) border-box',
      fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 26,
      textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--clout-white)', ...style,
    }} {...rest}>{name}</span>
  );
}
