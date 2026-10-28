import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout TabBar — primary mobile navigation (iOS tab bar / Android bottom nav).
   3–5 destinations, always labelled, active item uses the brand pink + glow dot.
   Respects the bottom safe-area inset. */
export function TabBar({ items = [], active, onChange, style, ...rest }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch', width: '100%', boxSizing: 'border-box',
      height: `calc(var(--tabbar-h) + var(--safe-bottom))`, paddingBottom: 'var(--safe-bottom)',
      background: 'rgba(16,19,28,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderTop: 'var(--border-w-hairline) solid var(--border-default)',
      zIndex: 'var(--z-tabbar)', ...style,
    }} {...rest}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} type="button" onClick={() => onChange && onChange(it.id)}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4, background: 'transparent', border: 'none',
              minHeight: 'var(--touch-min)', cursor: 'pointer', padding: '6px 2px', position: 'relative',
              color: on ? 'var(--value-default)' : 'var(--fg-muted)',
              transition: 'var(--transition-colors)',
            }}>
            <span style={{ position: 'relative', display: 'flex' }}>
              <Icon name={it.icon} size={24} color="currentColor" />
              {it.badge ? (
                <span style={{
                  position: 'absolute', top: -3, right: -6, minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 'var(--radius-pill)', background: 'var(--danger-default)',
                  color: '#fff', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  display: 'grid', placeItems: 'center', boxSizing: 'border-box',
                }}>{it.badge}</span>
              ) : null}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: on ? 700 : 500,
              letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
            }}>{it.label}</span>
            {on && <span style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 28, height: 3, borderRadius: '0 0 3px 3px', background: 'var(--action-default)',
            }} />}
          </button>
        );
      })}
    </nav>
  );
}
