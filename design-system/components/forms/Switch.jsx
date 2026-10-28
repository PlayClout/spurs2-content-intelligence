import React from 'react';

/* Clout Switch — immediate-effect binary toggle (settings, notifications).
   Use Checkbox instead when the change only applies on form submit. */
const SIZES = { sm: { w: 40, h: 24, k: 18 }, md: { w: 52, h: 30, k: 24 } };

export function Switch({
  checked, defaultChecked, size = 'md', label, description,
  disabled = false, loading = false, onChange, id, name, style, ...rest
}) {
  const [on, setOn] = React.useState(defaultChecked ?? false);
  const isOn = checked ?? on;
  const [focus, setFocus] = React.useState(false);
  const s = SIZES[size] || SIZES.md;

  const toggle = (e) => {
    if (disabled || loading) return;
    if (checked === undefined) setOn(!isOn);
    onChange && onChange(!isOn, e);
  };

  return (
    <label htmlFor={id} style={{
      display: 'flex', alignItems: description ? 'flex-start' : 'center', gap: 14,
      minHeight: 'var(--touch-min)', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, justifyContent: 'space-between', ...style,
    }}>
      {(label || description) && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--fg-default)' }}>{label}</span>}
          {description && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', lineHeight: 'var(--leading-snug)' }}>{description}</span>}
        </span>
      )}
      <input id={id} name={name} type="checkbox" role="switch" checked={isOn} disabled={disabled || loading}
        onChange={toggle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
      <span aria-hidden="true" style={{
        position: 'relative', width: s.w, height: s.h, flex: 'none', borderRadius: 'var(--radius-pill)',
        background: isOn ? 'var(--action-default)' : 'var(--interactive-bg-active)',
        boxShadow: focus ? 'var(--focus-ring)' : (isOn ? 'var(--glow-action)' : 'none'),
        transition: 'background var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard)',
        marginTop: description ? 2 : 0,
      }}>
        <span style={{
          position: 'absolute', top: (s.h - s.k) / 2, left: isOn ? s.w - s.k - (s.h - s.k) / 2 : (s.h - s.k) / 2,
          width: s.k, height: s.k, borderRadius: '50%',
          background: loading ? 'transparent' : 'var(--fg-default)',
          border: loading ? '2px solid rgba(245,245,243,0.3)' : 'none',
          borderTopColor: loading ? 'var(--fg-default)' : undefined,
          boxSizing: 'border-box',
          animation: loading ? 'clout-spin 800ms linear infinite' : 'none',
          transition: 'left var(--motion-base) var(--ease-standard)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }} />
        <style>{'@keyframes clout-spin{to{transform:rotate(360deg)}}'}</style>
      </span>
    </label>
  );
}
