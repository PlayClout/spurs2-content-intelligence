import React from 'react';

/* Clout Tooltip — brief label on hover/focus. POINTER ONLY: never put essential
   information here, and never rely on it for touch — mobile uses inline helper text. */
export function Tooltip({ label, placement = 'top', children, style, ...rest }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' },
    bottom: { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' },
    left: { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' },
    right: { left: '100%', top: '50%', transform: 'translate(8px, -50%)' },
  }[placement];

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}
      {...rest}>
      {children}
      {show && (
        <span role="tooltip" style={{
          position: 'absolute', ...pos, zIndex: 'var(--z-tooltip)',
          padding: '7px 11px', maxWidth: 240, width: 'max-content',
          background: 'var(--bg-surface-raised)',
          border: 'var(--border-w-hairline) solid var(--border-strong)',
          borderRadius: 'var(--radius-xs)', boxShadow: 'var(--shadow-float)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)',
          color: 'var(--fg-default)', pointerEvents: 'none',
        }}>{label}</span>
      )}
    </span>
  );
}
