import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout RewardCard — a prize earned through participation and redeemed with Coins/XP.
   This is the celebratory moment in the product; split-light treatment and one glow.
   States: locked (not yet earned) · unlocked (redeemable) · redeemed · shipped.
   ELIGIBILITY: age/geo/KYC is checked at REDEMPTION, never at signup. Pass
   requiresEligibility to surface that the next step is a verification gate. */
export function RewardCard({
  title, value, image, state = 'unlocked', requirement, redeemedOn,
  requiresEligibility = false, onRedeem, compact = false, style, ...rest
}) {
  const claimable = state === 'unlocked';
  const dim = state === 'locked';

  return (
    <div style={{
      position: 'relative', boxSizing: 'border-box', width: '100%', overflow: 'hidden',
      padding: compact ? 14 : 18, borderRadius: 'var(--radius-xl)',
      background: claimable
        ? 'radial-gradient(90% 100% at 15% 0%, rgba(18,107,255,0.28), rgba(18,107,255,0) 55%), radial-gradient(90% 100% at 90% 100%, rgba(255,49,87,0.22), rgba(255,49,87,0) 55%), var(--bg-surface)'
        : 'var(--bg-surface)',
      border: `var(--border-w-default) solid ${claimable ? 'var(--border-accent)' : 'var(--border-default)'}`,
      boxShadow: claimable ? 'var(--shadow-card)' : 'none',
      opacity: dim ? 0.5 : 1, ...style,
    }} {...rest}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{
          flex: 'none', width: compact ? 52 : 64, height: compact ? 52 : 64, display: 'grid', placeItems: 'center',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          background: 'var(--bg-surface-sunken)', border: 'var(--border-w-hairline) solid var(--border-default)',
        }}>
          {image
            ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon name={dim ? 'clock' : 'gift'} size={compact ? 24 : 28} color={claimable ? 'var(--value-default)' : 'var(--fg-muted)'} />}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {value && <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
            fontSize: compact ? 'var(--text-2xl)' : 'var(--text-3xl)', lineHeight: 0.95,
            background: 'var(--action-default)', WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', display: 'inline-block', paddingRight: '0.14em', marginRight: '-0.14em',
          }}>{value}</div>}
          <div style={{
            marginTop: 3, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600,
            fontSize: compact ? 'var(--text-md)' : 'var(--text-lg)', textTransform: 'uppercase',
            color: 'var(--fg-default)', lineHeight: 'var(--leading-tight)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{title}</div>
          {(requirement || redeemedOn) && <div style={{
            marginTop: 3, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)',
          }}>{state === 'redeemed' || state === 'shipped' ? redeemedOn : requirement}</div>}
          {claimable && requiresEligibility && <div style={{
            marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--warning-fg)',
          }}>
            <Icon name="check" size={12} color="currentColor" />18+ · verification required to redeem
          </div>}
        </div>

        {claimable && onRedeem && (
          <button type="button" onClick={onRedeem} style={{
            flex: 'none', minHeight: 'var(--touch-min)', padding: '0 18px', border: 'none',
            borderRadius: 'var(--radius-pill)', background: 'var(--action-default)',
            color: 'var(--fg-on-action)', cursor: 'pointer', boxShadow: 'var(--glow-action)',
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
            fontSize: 'var(--text-md)', textTransform: 'uppercase', letterSpacing: '0.03em',
          }}>Redeem</button>
        )}
        {(state === 'redeemed' || state === 'shipped') && (
          <span style={{
            flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--success-fg)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <Icon name="check" size={16} color="currentColor" />{state}
          </span>
        )}
      </div>
    </div>
  );
}
