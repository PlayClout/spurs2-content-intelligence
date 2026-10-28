import React from 'react';

/* Clout Avatar — user/team identity. Initials fallback, optional status ring and live dot. */
const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };
const RING = { none: null, accent: 'var(--accent-default)', action: 'var(--action-default)', success: 'var(--success-default)' };

export function Avatar({ src, name = '', size = 'md', ring = 'none', live = false, style, ...rest }) {
  const px = SIZES[size] || SIZES.md;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const ringBg = RING[ring];
  const pad = ringBg ? Math.max(2, Math.round(px * 0.06)) : 0;

  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: 'none', ...style }} {...rest}>
      <span style={{
        display: 'grid', placeItems: 'center', width: px, height: px, borderRadius: '50%',
        background: ringBg || 'transparent', padding: pad, boxSizing: 'border-box',
      }}>
        <span style={{
          display: 'grid', placeItems: 'center', width: '100%', height: '100%', borderRadius: '50%',
          overflow: 'hidden', background: 'var(--bg-surface-raised)',
          border: ringBg ? '2px solid var(--bg-canvas)' : 'var(--border-w-hairline) solid var(--border-default)',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
          fontSize: px * 0.38, color: 'var(--fg-secondary)', letterSpacing: '0.02em',
        }}>
          {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (initials || '?')}
        </span>
      </span>
      {live && (
        <span aria-label="Live" style={{
          position: 'absolute', right: 0, bottom: 0, width: Math.max(8, px * 0.24), height: Math.max(8, px * 0.24),
          borderRadius: '50%', background: 'var(--value-default)',
          border: '2px solid var(--bg-canvas)', boxShadow: 'var(--glow-pink)', boxSizing: 'border-box',
        }} />
      )}
    </span>
  );
}

/* AvatarGroup — overlapping stack with an overflow count. */
export function AvatarGroup({ users = [], size = 'sm', max = 4, style }) {
  const px = SIZES[size] || SIZES.sm;
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      {shown.map((u, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -px * 0.3, border: '2px solid var(--bg-canvas)', borderRadius: '50%', display: 'flex' }}>
          <Avatar src={u.src} name={u.name} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span style={{
          marginLeft: -px * 0.3, width: px, height: px, borderRadius: '50%', display: 'grid', placeItems: 'center',
          background: 'var(--bg-surface-raised)', border: '2px solid var(--bg-canvas)', boxSizing: 'border-box',
          fontFamily: 'var(--font-body)', fontSize: px * 0.34, fontWeight: 700, color: 'var(--fg-secondary)',
        }}>+{rest}</span>
      )}
    </span>
  );
}
