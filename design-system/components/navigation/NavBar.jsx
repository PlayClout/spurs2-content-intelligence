import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout NavBar — top app bar. Mobile: back/title/action. Web: logo/nav/actions.
   Sticky with a translucent blur so cinematic backgrounds stay visible behind it. */
export function NavBar({
  title, onBack, leading, actions, transparent = false, centerTitle = true, style, ...rest
}) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
      height: `calc(var(--navbar-h-mobile) + var(--safe-top))`, paddingTop: 'var(--safe-top)',
      padding: `var(--safe-top) 8px 0 8px`,
      background: transparent ? 'transparent' : 'rgba(5,8,17,0.82)',
      backdropFilter: transparent ? 'none' : 'blur(18px)', WebkitBackdropFilter: transparent ? 'none' : 'blur(18px)',
      borderBottom: transparent ? 'none' : 'var(--border-w-hairline) solid var(--border-default)',
      position: 'sticky', top: 0, zIndex: 'var(--z-navbar)', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: centerTitle ? '0 0 auto' : 1, minWidth: centerTitle ? 44 : undefined }}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" style={navBtn}>
            <Icon name="arrow-left" size={24} color="currentColor" />
          </button>
        )}
        {leading}
      </div>
      <div style={{
        flex: 1, minWidth: 0, textAlign: centerTitle ? 'center' : 'left',
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: 'var(--text-lg)', textTransform: 'uppercase', letterSpacing: '0.02em',
        color: 'var(--fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: centerTitle ? '0 0 auto' : undefined, minWidth: centerTitle ? 44 : undefined, justifyContent: 'flex-end' }}>
        {actions}
      </div>
    </header>
  );
}

const navBtn = {
  width: 44, height: 44, display: 'grid', placeItems: 'center', flex: 'none',
  background: 'transparent', border: 'none', borderRadius: 'var(--radius-md)',
  color: 'var(--fg-default)', cursor: 'pointer',
};

/* NavIconButton — 44px icon action for the bar (meets iOS target). */
export function NavIconButton({ icon, label, badge, onClick, style, ...rest }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} style={{ ...navBtn, position: 'relative', ...style }} {...rest}>
      <Icon name={icon} size={22} color="currentColor" />
      {badge ? <span style={{
        position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
        background: 'var(--danger-default)', boxShadow: '0 0 0 2px var(--bg-canvas)',
      }} /> : null}
    </button>
  );
}
