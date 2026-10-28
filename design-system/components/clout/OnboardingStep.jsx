import React from 'react';

/* Clout OnboardingStep — a full-screen step in a first-run flow.
   Composition: progress dots → cinematic hero slot → headline → body → actions pinned to base. */
export function OnboardingStep({
  step = 1, total = 3, eyebrow, title, description, hero, primaryAction, secondaryAction, onSkip, style, ...rest
}) {
  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      width: '100%', height: '100%', overflow: 'hidden',
      background: 'radial-gradient(100% 80% at 15% 5%, rgba(18,107,255,0.35), rgba(18,107,255,0) 55%), radial-gradient(90% 70% at 90% 95%, rgba(255,49,87,0.28), rgba(255,49,87,0) 55%), var(--bg-canvas)',
      padding: `calc(var(--safe-top) + 20px) var(--screen-pad-mobile) calc(var(--safe-bottom) + 24px)`,
      ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <span style={{ display: 'flex', gap: 6, flex: 1 }} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: i < step ? 'var(--action-default)' : 'var(--interactive-bg-active)',
              transition: 'background var(--motion-base) var(--ease-standard)',
            }} />
          ))}
        </span>
        {onSkip && (
          <button type="button" onClick={onSkip} style={{
            flex: 'none', minHeight: 'var(--touch-min)', padding: '0 12px', background: 'transparent', border: 'none',
            color: 'var(--fg-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Skip</button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        {hero}
      </div>

      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {eyebrow && <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-bright)',
        }}>{eyebrow}</span>}
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
          fontSize: 'var(--text-4xl)', lineHeight: 0.95, textTransform: 'uppercase',
          color: 'var(--fg-default)', textWrap: 'pretty',
        }}>{title}</h1>
        {description && <p style={{
          margin: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)',
          lineHeight: 'var(--leading-normal)', color: 'var(--fg-secondary)', textWrap: 'pretty',
        }}>{description}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {primaryAction}{secondaryAction}
        </div>
      </div>
    </div>
  );
}
