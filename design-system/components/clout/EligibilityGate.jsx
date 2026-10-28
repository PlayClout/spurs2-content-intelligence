import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout EligibilityGate — the age / geo / KYC verification step in the REDEMPTION flow.
   PLACEMENT RULE (non-negotiable): this gate belongs at the point a fan redeems a real-world
   prize, NEVER at signup or before play. Participation is always free and open; eligibility is
   a prize-fulfilment requirement (sweepstakes compliance), not an entry condition.
   Render inside a Modal (presentation="sheet" on mobile) with dismissible={false}. */

const STEP_STATE = {
  pending:  { color: 'var(--fg-muted)',     icon: 'clock' },
  active:   { color: 'var(--accent-bright)', icon: 'target' },
  complete: { color: 'var(--success-fg)',    icon: 'check' },
  blocked:  { color: 'var(--danger-fg)',     icon: 'close' },
};

export function EligibilityGate({
  prizeName, steps = [], note, blockedReason, children, style, ...rest
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, ...style }} {...rest}>
      <div style={{
        display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--warning-subtle)', border: 'var(--border-w-hairline) solid var(--warning-border)',
      }}>
        <Icon name="medal" size={20} color="var(--warning-fg)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--fg-default)' }}>
            Verify to redeem
          </div>
          <div style={{ marginTop: 3, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 'var(--leading-snug)' }}>
            {prizeName
              ? <>Real-world prizes like <strong style={{ color: 'var(--fg-default)' }}>{prizeName}</strong> require a one-time eligibility check. Your XP, Coins and streak are unaffected.</>
              : 'Real-world prizes require a one-time eligibility check. Your XP, Coins and streak are unaffected.'}
          </div>
        </div>
      </div>

      {steps.length > 0 && (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {steps.map((s, i) => {
            const st = STEP_STATE[s.state] || STEP_STATE.pending;
            return (
              <li key={s.id ?? i} style={{
                display: 'flex', alignItems: 'center', gap: 12, minHeight: 'var(--touch-min)',
                padding: '8px 0',
                borderBottom: i === steps.length - 1 ? 'none' : 'var(--border-w-hairline) solid var(--border-subtle)',
              }}>
                <span style={{
                  flex: 'none', width: 32, height: 32, display: 'grid', placeItems: 'center',
                  borderRadius: '50%', background: 'var(--interactive-bg)', color: st.color,
                }}>
                  <Icon name={st.icon} size={17} color="currentColor" />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
                    fontWeight: s.state === 'active' ? 700 : 600,
                    color: s.state === 'pending' ? 'var(--fg-secondary)' : 'var(--fg-default)',
                  }}>{s.label}</span>
                  {s.detail && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>{s.detail}</span>}
                </span>
                <span style={{
                  flex: 'none', fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: st.color,
                }}>{s.state}</span>
              </li>
            );
          })}
        </ol>
      )}

      {blockedReason && (
        <div role="alert" style={{
          display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--danger-subtle)', border: 'var(--border-w-hairline) solid var(--danger-border)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--danger-fg)',
          lineHeight: 'var(--leading-snug)',
        }}>
          <Icon name="close" size={18} color="currentColor" />
          <span>{blockedReason}</span>
        </div>
      )}

      {children}

      <p style={{
        margin: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
        color: 'var(--fg-muted)', lineHeight: 'var(--leading-snug)',
      }}>
        {note || 'Clout is free to play. No purchase is necessary to earn or redeem. Eligibility is required only to fulfil real-world prizes and varies by jurisdiction. 18+.'}
      </p>
    </div>
  );
}
