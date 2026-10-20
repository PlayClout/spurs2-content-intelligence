import React from 'react';

/* Clout Checkbox — 24px box, accent fill when checked, supports indeterminate. */
export function Checkbox({
  checked, defaultChecked, indeterminate = false, label, description,
  disabled = false, status, onChange, id, name, style, ...rest
}) {
  const [on, setOn] = React.useState(defaultChecked ?? false);
  const isOn = checked ?? on;
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const errored = status === 'error';

  const toggle = (e) => {
    if (disabled) return;
    if (checked === undefined) setOn(!isOn);
    onChange && onChange(!isOn, e);
  };

  const box = {
    width: 24, height: 24, flex: 'none', borderRadius: 'var(--radius-xs)', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: isOn || indeterminate ? 'var(--accent-default)' : 'var(--bg-surface-sunken)',
    border: `var(--border-w-default) solid ${
      errored ? 'var(--danger-border)'
      : isOn || indeterminate ? 'var(--accent-default)'
      : hover && !disabled ? 'var(--border-input-hover)' : 'var(--border-input)'}`,
    boxShadow: focus ? 'var(--focus-ring)' : 'none',
    transition: 'var(--transition-colors), var(--transition-shadow)',
  };

  return (
    <label
      htmlFor={id}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: description ? 'flex-start' : 'center', gap: 12,
        minHeight: 'var(--touch-min)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, ...style,
      }}
    >
      <input
        id={id} name={name} type="checkbox" checked={isOn} disabled={disabled}
        onChange={toggle} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        aria-invalid={errored || undefined}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest}
      />
      <span style={{ ...box, marginTop: description ? 2 : 0 }} aria-hidden="true">
        {indeterminate
          ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--fg-on-action)" strokeWidth="3" strokeLinecap="round"><path d="M6 12h12"/></svg>
          : isOn && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--fg-on-action)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>}
      </span>
      {(label || description) && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--fg-default)' }}>{label}</span>}
          {description && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', lineHeight: 'var(--leading-snug)' }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
