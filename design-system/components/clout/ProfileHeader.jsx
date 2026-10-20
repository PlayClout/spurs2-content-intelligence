import React from 'react';
import { Avatar } from '../layout/Avatar.jsx';
import { Icon } from '../core/Icon.jsx';

/* Clout ProfileHeader — identity + rank + XP progress at the top of the profile screen.
   Sits on the split-light treatment; the only place a large avatar appears. */
export function ProfileHeader({
  name, handle, avatar, tier = 'Rookie', rank, xp, xpMax, level,
  stats = [], onEdit, style, ...rest
}) {
  const pct = xp != null && xpMax ? Math.min(100, (xp / xpMax) * 100) : null;
  return (
    <div style={{
      position: 'relative', boxSizing: 'border-box', width: '100%', overflow: 'hidden',
      padding: '24px 20px', borderRadius: 'var(--radius-xl)',
      background: 'radial-gradient(90% 100% at 15% 0%, rgba(18,107,255,0.3), rgba(18,107,255,0) 55%), radial-gradient(80% 100% at 90% 100%, rgba(255,49,87,0.2), rgba(255,49,87,0) 55%), var(--bg-surface)',
      border: 'var(--border-w-default) solid var(--border-default)', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar name={name} src={avatar} size="xl" ring="action" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
            fontSize: 'var(--text-3xl)', textTransform: 'uppercase', lineHeight: 'var(--leading-tight)',
            color: 'var(--fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
            {handle && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>{handle}</span>}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
              borderRadius: 'var(--radius-pill)', background: 'var(--value-subtle)',
              color: 'var(--value-default)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              <Icon name="medal" size={13} color="currentColor" />{tier}
            </span>
            {rank && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>Rank {rank}</span>}
          </div>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} aria-label="Edit profile" style={{
            flex: 'none', width: 44, height: 44, display: 'grid', placeItems: 'center',
            background: 'var(--interactive-bg)', border: 'none', borderRadius: 'var(--radius-pill)',
            color: 'var(--fg-secondary)', cursor: 'pointer',
          }}>
            <Icon name="user" size={20} color="currentColor" />
          </button>
        )}
      </div>

      {pct != null && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
              {level ? `Level ${level}` : 'XP'}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--fg-default)' }}>
              {xp.toLocaleString()} / {xpMax.toLocaleString()} XP
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--interactive-bg-active)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--action-default)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--glow-action)', transition: 'width var(--motion-slow) var(--ease-out)' }} />
          </div>
        </div>
      )}

      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <span key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
                fontSize: 'var(--text-2xl)', lineHeight: 0.95,
                color: s.tone === 'value' ? 'var(--value-default)' : 'var(--fg-default)',
              }}>{s.value}</span>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)',
              }}>{s.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
