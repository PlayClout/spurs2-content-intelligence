import React from 'react';

/* Clout Surface — the product card primitive. Carbon fill, hairline border, brand radii.
   Variants: default · raised (menus/popovers) · sunken (wells) · accent (blue hairline, featured)
   · interactive (hover lift + press compress, for tappable cards). */
const VARIANT = {
  default:  { bg: 'var(--bg-surface)', border: 'var(--border-default)', shadow: 'none' },
  raised:   { bg: 'var(--bg-surface-raised)', border: 'var(--border-default)', shadow: 'var(--shadow-panel)' },
  sunken:   { bg: 'var(--bg-surface-sunken)', border: 'var(--border-subtle)', shadow: 'none' },
  accent:   { bg: 'var(--bg-surface)', border: 'var(--border-accent)', shadow: 'var(--shadow-card)' },
};
const PAD = { none: 0, sm: 14, md: 18, lg: 24 };

export function Surface({
  variant = 'default', padding = 'md', radius = 'var(--radius-xl)',
  interactive = false, selected = false, disabled = false,
  onClick, children, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const v = VARIANT[variant] || VARIANT.default;
  const clickable = interactive || !!onClick;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        position: 'relative', boxSizing: 'border-box', padding: PAD[padding],
        background: v.bg,
        border: `var(--border-w-default) solid ${selected ? 'var(--accent-default)' : v.border}`,
        borderRadius: radius,
        boxShadow: selected ? '0 0 0 1px var(--accent-default), var(--shadow-card)'
          : clickable && hover && !disabled ? 'var(--shadow-card)' : v.shadow,
        transform: clickable && press && !disabled ? 'scale(var(--press-scale-tile))' : 'scale(1)',
        cursor: disabled ? 'not-allowed' : clickable ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        transition: 'var(--transition-colors), var(--transition-shadow), var(--transition-transform)',
        ...style,
      }} {...rest}>
      {children}
    </div>
  );
}
