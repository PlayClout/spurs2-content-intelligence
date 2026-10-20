import React from 'react';

/* Clout PickemCard — the flagship ACTION type: a prediction on a real-world outcome.
   FREE TO PLAY. There is no stake, entry fee or wager. Fans predict and earn XP.
   Options carry an XP VALUE (never odds, never a payout multiplier).
   States: open · locked (event started) · correct · incorrect (graded against the result). */
const OUTCOME = {
  open:      { border: 'var(--border-default)' },
  locked:    { border: 'var(--border-subtle)' },
  correct:   { border: 'var(--success-border)' },
  incorrect: { border: 'var(--danger-border)' },
};

export function PickemCard({
  subject, meta, line, options = [], selected, onSelect,
  state = 'open', xpValue, lockLabel, style, ...rest
}) {
  const s = OUTCOME[state] || OUTCOME.open;
  const graded = state === 'correct' || state === 'incorrect';
  const disabled = state === 'locked' || graded;

  return (
    <div style={{
      boxSizing: 'border-box', width: '100%', padding: 16,
      background: 'var(--bg-surface)',
      border: `var(--border-w-default) solid ${s.border}`,
      borderRadius: 'var(--radius-xl)', opacity: state === 'locked' ? 0.6 : 1,
      transition: 'var(--transition-colors)', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
            fontSize: 'var(--text-xl)', textTransform: 'uppercase', color: 'var(--fg-default)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{subject}</div>
          {meta && <div style={{
            marginTop: 2, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)',
          }}>{meta}</div>}
        </div>
        {xpValue && (
          <span style={{
            flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 'var(--radius-pill)',
            background: 'var(--accent-subtle)', color: 'var(--accent-bright)',
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-sm)',
          }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M9 9l3 6 3-6" />
            </svg>
            {xpValue}
          </span>
        )}
      </div>

      {line && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-sunken)', textAlign: 'center',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)',
        }}>{line}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, options.length)}, 1fr)`, gap: 10, marginTop: 12 }}>
        {options.map((o) => {
          const on = o.id === selected;
          const right = graded && on && state === 'correct';
          const wrong = graded && on && state === 'incorrect';
          return (
            <button key={o.id} type="button" disabled={disabled}
              onClick={() => onSelect && onSelect(o.id)}
              aria-pressed={on}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                minHeight: 'var(--touch-min)', padding: '10px 8px', boxSizing: 'border-box',
                background: right ? 'var(--success-subtle)' : wrong ? 'var(--danger-subtle)'
                  : on ? 'var(--accent-subtle)' : 'var(--interactive-bg)',
                border: `var(--border-w-strong) solid ${
                  right ? 'var(--success-default)' : wrong ? 'var(--danger-default)'
                  : on ? 'var(--accent-default)' : 'transparent'}`,
                borderRadius: 'var(--radius-md)',
                color: right ? 'var(--success-fg)' : wrong ? 'var(--danger-fg)'
                  : on ? 'var(--fg-default)' : 'var(--fg-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'var(--transition-colors)',
              }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
                fontSize: 'var(--text-lg)', textTransform: 'uppercase',
              }}>{o.label}</span>
              {o.detail && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', opacity: 0.75 }}>{o.detail}</span>}
            </button>
          );
        })}
      </div>

      {(lockLabel || graded) && (
        <div style={{
          marginTop: 10, textAlign: 'center', fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: state === 'correct' ? 'var(--success-fg)' : state === 'incorrect' ? 'var(--danger-fg)' : 'var(--fg-muted)',
        }}>{graded ? (state === 'correct' ? 'Correct' : 'Incorrect') : lockLabel}</div>
      )}
    </div>
  );
}
