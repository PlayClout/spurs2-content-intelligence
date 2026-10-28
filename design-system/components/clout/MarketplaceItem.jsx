import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout MarketplaceItem — an item redeemable with earned Coins. Coins cannot be
   purchased and never cash out; the marketplace is redemption, not commerce.
   Vertical tile for grids (2-col mobile, 3–4-col web). States: available · low-stock · sold-out · owned. */
export function MarketplaceItem({
  name, brand, image, cost, currency = 'coin', stock, state = 'available', onClick, style, ...rest
}) {
  const [press, setPress] = React.useState(false);
  const soldOut = state === 'sold-out';
  const owned = state === 'owned';

  return (
    <div
      onClick={soldOut ? undefined : onClick}
      role={onClick ? 'button' : undefined} tabIndex={onClick && !soldOut ? 0 : undefined}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)} onMouseLeave={() => setPress(false)}
      style={{
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box', width: '100%', overflow: 'hidden',
        background: 'var(--bg-surface)', border: 'var(--border-w-default) solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', opacity: soldOut ? 0.5 : 1,
        transform: press && !soldOut ? 'scale(var(--press-scale-tile))' : 'scale(1)',
        cursor: soldOut ? 'not-allowed' : onClick ? 'pointer' : 'default',
        transition: 'var(--transition-transform), var(--transition-shadow)', ...style,
      }} {...rest}>
      <div style={{
        position: 'relative', aspectRatio: '1 / 1', width: '100%',
        background: 'radial-gradient(70% 70% at 50% 40%, rgba(18,107,255,0.18), rgba(18,107,255,0) 60%), var(--bg-surface-sunken)',
        display: 'grid', placeItems: 'center', overflow: 'hidden',
      }}>
        {image
          ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Icon name="gift" size={34} color="var(--fg-muted)" />}
        {(state === 'low-stock' || soldOut || owned) && (
          <span style={{
            position: 'absolute', top: 8, left: 8, padding: '4px 9px', borderRadius: 'var(--radius-pill)',
            background: owned ? 'var(--success-subtle)' : soldOut ? 'var(--interactive-bg-active)' : 'var(--warning-subtle)',
            border: `1px solid ${owned ? 'var(--success-border)' : soldOut ? 'var(--border-strong)' : 'var(--warning-border)'}`,
            color: owned ? 'var(--success-fg)' : soldOut ? 'var(--fg-secondary)' : 'var(--warning-fg)',
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>{owned ? 'Owned' : soldOut ? 'Sold out' : 'Low stock'}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 12 }}>
        {brand && <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-bright)',
        }}>{brand}</span>}
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
          color: 'var(--fg-default)', lineHeight: 'var(--leading-snug)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{name}</span>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 5 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name={currency === 'xp' ? 'xp' : 'coin'} size={15}
              color={currency === 'xp' ? 'var(--accent-bright)' : 'var(--value-default)'} />
            <span style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-lg)',
              color: 'var(--fg-default)',
            }}>{cost}</span>
          </span>
          {stock && !soldOut && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>{stock}</span>}
        </span>
      </div>
    </div>
  );
}
