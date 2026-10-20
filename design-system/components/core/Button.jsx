import React from 'react';
import { Icon } from './Icon.jsx';

/* Clout CTA button — the strongest ACTIONABLE element (not necessarily the dominant visual).
   Families: primary (solid Action-gradient), secondary (dark fill + gradient stroke),
   dark (Carbon fill + hairline), outline (transparent + white outline). Full-radius pill,
   athletic italic caps, ONE glow, trailing circular arrow badge. */

const SIZES = {
  large: { h: 64, px: 30, fs: 20, gap: 14, badge: 40, iconSize: 20 },
  small: { h: 48, px: 22, fs: 15, gap: 10, badge: 30, iconSize: 15 },
};

export function Button({
  children, family = 'primary', size = 'large', icon = 'arrow-right',
  showArrow = true, disabled = false, onClick, style, ...rest
}) {
  const s = SIZES[size] || SIZES.large;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
    height: s.h, padding: `0 ${showArrow ? s.px - 8 : s.px}px 0 ${s.px}px`,
    border: 'none', borderRadius: 'var(--radius-pill)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
    fontSize: s.fs, textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap',
    transition: 'transform var(--dur-fast) var(--ease-standard), filter var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)',
    transform: press ? 'scale(0.975)' : 'scale(1)',
    opacity: disabled ? 0.4 : 1, WebkitFontSmoothing: 'antialiased', ...style,
  };

  const families = {
    primary: {
      background: 'var(--clout-gradient-action)', color: 'var(--clout-white)',
      boxShadow: disabled ? 'none' : (hover ? '0 10px 38px rgba(255,49,87,0.55)' : 'var(--glow-action)'),
      filter: hover && !disabled ? 'brightness(1.06)' : 'none',
    },
    secondary: {
      background: 'var(--clout-carbon)', color: 'var(--clout-white)',
      boxShadow: `inset 0 0 0 2px transparent`,
      backgroundImage: 'linear-gradient(var(--clout-carbon),var(--clout-carbon)), var(--clout-gradient-action)',
      backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box',
      border: '2px solid transparent',
      filter: hover && !disabled ? 'brightness(1.15)' : 'none',
    },
    dark: {
      background: 'var(--clout-carbon)', color: 'var(--clout-white)',
      border: '1.5px solid var(--border-hairline)',
      boxShadow: hover && !disabled ? 'var(--shadow-panel)' : 'none',
      filter: hover && !disabled ? 'brightness(1.2)' : 'none',
    },
    outline: {
      background: 'transparent', color: 'var(--clout-white)',
      border: '2px solid rgba(245,245,243,0.85)',
      filter: hover && !disabled ? 'brightness(1.1)' : 'none',
      backgroundColor: hover && !disabled ? 'rgba(245,245,243,0.08)' : 'transparent',
    },
  };

  // trailing circular arrow badge
  const badgeStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: s.badge, height: s.badge, borderRadius: 'var(--radius-pill)', flex: 'none',
  };
  const badgeBg = {
    primary: { background: 'var(--clout-black)' },
    secondary: { background: 'var(--clout-gradient-action)' },
    dark: { background: 'var(--clout-gradient-action)' },
    outline: { background: 'transparent', border: '1.5px solid rgba(245,245,243,0.7)' },
  }[family];
  const arrowColor = family === 'primary' ? 'var(--clout-pink)'
    : family === 'outline' ? 'var(--clout-white)' : 'var(--clout-white)';

  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{ ...base, ...families[family] }} {...rest}
    >
      <span>{children}</span>
      {showArrow && (
        <span style={{ ...badgeStyle, ...badgeBg }}>
          <Icon name={icon} size={s.iconSize} color={arrowColor} strokeWidth={2.4} />
        </span>
      )}
    </button>
  );
}
