import React from 'react';

/* Prize Card — hero prize presentation. Carbon surface, low-opacity blue hairline, blue "WIN A"
   kicker chip, dominant italic prize value, Action-gradient underline, product label. */
export function PrizeCard({
  kicker = 'WIN A', value = '$500', label = 'GIFT CARD',
  valueGradient = false, style, ...rest
}) {
  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 460, boxSizing: 'border-box',
      background: 'var(--clout-carbon)', border: '2px solid var(--border-blue)',
      borderRadius: 'var(--radius-card)', padding: '28px 32px 34px', overflow: 'hidden',
      boxShadow: 'var(--shadow-card)', ...style,
    }} {...rest}>
      <span style={{
        display: 'inline-block', padding: '6px 14px', borderRadius: 'var(--radius-pill)',
        background: 'rgba(18,107,255,0.18)', color: 'var(--clout-hyper-blue)',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, letterSpacing: '0.12em',
      }}>{kicker}</span>
      <div style={{
        marginTop: 22, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: 'clamp(56px, 9vw, 88px)', lineHeight: 0.9, textTransform: 'uppercase',
        color: valueGradient ? 'transparent' : 'var(--clout-white)',
        background: valueGradient ? 'var(--clout-gradient-action)' : 'none',
        WebkitBackgroundClip: valueGradient ? 'text' : 'border-box',
        backgroundClip: valueGradient ? 'text' : 'border-box',
      }}>{value}</div>
      <div style={{ width: 160, height: 6, borderRadius: 3, background: 'var(--clout-gradient-action)', margin: '18px 0 16px' }} />
      <div style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 26,
        textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--clout-white)',
      }}>{label}</div>
    </div>
  );
}
