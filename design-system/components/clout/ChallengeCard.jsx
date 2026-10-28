import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout ChallengeCard — a time-boxed ACTION that awards XP or Coins for participation.
   Free to enter; nothing is staked. Coins are earned, never purchased, and never cash out.
   States: available · in-progress (shows bar) · complete (claimable) · claimed · expired. */
const STATE = {
  available:   { label: 'Available', color: 'var(--fg-secondary)', border: 'var(--border-default)' },
  'in-progress': { label: 'In progress', color: 'var(--accent-bright)', border: 'var(--border-accent)' },
  complete:    { label: 'Claim reward', color: 'var(--success-fg)', border: 'var(--success-border)' },
  claimed:     { label: 'Claimed', color: 'var(--fg-muted)', border: 'var(--border-subtle)' },
  expired:     { label: 'Expired', color: 'var(--fg-muted)', border: 'var(--border-subtle)' },
};

export function ChallengeCard({
  title, description, icon = 'target', reward, rewardType = 'xp',
  state = 'available', progress, progressLabel, timeLeft, onAction, style, ...rest
}) {
  const s = STATE[state] || STATE.available;
  const dim = state === 'claimed' || state === 'expired';
  const claimable = state === 'complete';

  return (
    <div style={{
      display: 'flex', gap: 14, boxSizing: 'border-box', width: '100%', padding: 16,
      background: 'var(--bg-surface)', border: `var(--border-w-default) solid ${s.border}`,
      borderRadius: 'var(--radius-xl)', opacity: dim ? 0.55 : 1,
      transition: 'var(--transition-colors)', ...style,
    }} {...rest}>
      <span style={{
        flex: 'none', width: 44, height: 44, display: 'grid', placeItems: 'center',
        borderRadius: 'var(--radius-md)',
        background: claimable ? 'var(--success-subtle)' : 'var(--accent-subtle)',
        color: claimable ? 'var(--success-fg)' : 'var(--accent-bright)',
      }}>
        <Icon name={state === 'claimed' ? 'check' : icon} size={22} color="currentColor" />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            flex: 1, minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
            fontWeight: 700, color: 'var(--fg-default)',
          }}>{title}</span>
          {reward && (
            <span style={{
              flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'var(--text-lg)',
              color: rewardType === 'coins' ? 'var(--value-default)' : 'var(--accent-bright)',
            }}>
              <Icon name={rewardType === 'coins' ? 'coin' : 'xp'} size={15} color="currentColor" />
              {reward}
            </span>
          )}
        </div>

        {description && <div style={{
          marginTop: 3, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
          color: 'var(--fg-muted)', lineHeight: 'var(--leading-snug)',
        }}>{description}</div>}

        {progress != null && state === 'in-progress' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--interactive-bg-active)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: 'var(--action-default)', transition: 'width var(--motion-slow) var(--ease-out)' }} />
            </div>
            {progressLabel && <div style={{ marginTop: 5, fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>{progressLabel}</div>}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          {claimable && onAction ? (
            <button type="button" onClick={onAction} style={{
              minHeight: 'var(--touch-min)', padding: '0 18px', border: 'none', borderRadius: 'var(--radius-pill)',
              background: 'var(--action-default)', color: 'var(--fg-on-action)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.03em',
              boxShadow: 'var(--glow-action)',
            }}>Claim</button>
          ) : (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color,
            }}>{s.label}</span>
          )}
          {timeLeft && !dim && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto', color: 'var(--fg-muted)' }}>
              <Icon name="clock" size={13} color="currentColor" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)' }}>{timeLeft}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
