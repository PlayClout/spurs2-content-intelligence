import React from 'react';

/* Clout Input — text field with the full product state set.
   States: default · hover · focus · filled · disabled · readOnly · loading · success · warning · error
   Height follows --control-h-*; 48px default so it clears Android's 48dp target. */

const H = { sm: 'var(--control-h-sm)', md: 'var(--control-h-md)', lg: 'var(--control-h-lg)' };
const FS = { sm: 'var(--text-sm)', md: 'var(--text-md)', lg: 'var(--text-base)' };

export const STATUS_COLOR = {
  success: { border: 'var(--success-border)', fg: 'var(--success-fg)', ring: 'rgba(0,217,130,0.35)' },
  warning: { border: 'var(--warning-border)', fg: 'var(--warning-fg)', ring: 'rgba(255,176,32,0.35)' },
  error:   { border: 'var(--danger-border)',  fg: 'var(--danger-fg)',  ring: 'rgba(255,41,66,0.35)' },
  info:    { border: 'var(--info-border)',    fg: 'var(--info-fg)',    ring: 'rgba(0,163,255,0.35)' },
};

export function Input({
  value, defaultValue, placeholder = '', type = 'text', size = 'md',
  status, disabled = false, readOnly = false, loading = false,
  leadingIcon, trailingIcon, onChange, onFocus, onBlur, id, name, style, inputStyle, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const st = status ? STATUS_COLOR[status] : null;

  const borderColor = disabled ? 'var(--border-subtle)'
    : st ? st.border
    : focus ? 'var(--border-input-focus)'
    : hover ? 'var(--border-input-hover)'
    : 'var(--border-input)';

  const shell = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box',
    height: H[size], padding: '0 14px',
    background: disabled ? 'var(--interactive-bg-disabled)' : 'var(--bg-surface-sunken)',
    border: `var(--border-w-default) solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    boxShadow: focus && !disabled ? (st ? `0 0 0 3px ${st.ring}` : 'var(--focus-ring)') : 'none',
    transition: 'var(--transition-colors), var(--transition-shadow)',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1, ...style,
  };
  const field = {
    flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
    color: disabled ? 'var(--fg-disabled)' : 'var(--fg-default)',
    fontFamily: 'var(--font-body)', fontSize: FS[size], fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'text', ...inputStyle,
  };

  return (
    <div style={shell}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {leadingIcon && <span style={{ display: 'flex', color: st ? st.fg : 'var(--fg-muted)', flex: 'none' }}>{leadingIcon}</span>}
      <input
        id={id} name={name} type={type} value={value} defaultValue={defaultValue}
        placeholder={placeholder} disabled={disabled} readOnly={readOnly}
        aria-invalid={status === 'error' || undefined}
        onChange={onChange}
        onFocus={(e) => { setFocus(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        style={field} {...rest}
      />
      {loading
        ? <Spinner16 />
        : trailingIcon && <span style={{ display: 'flex', color: st ? st.fg : 'var(--fg-muted)', flex: 'none' }}>{trailingIcon}</span>}
    </div>
  );
}

function Spinner16() {
  return (
    <span style={{
      width: 16, height: 16, flex: 'none', borderRadius: '50%',
      border: '2px solid rgba(245,245,243,0.18)', borderTopColor: 'var(--accent-bright)',
      animation: 'clout-spin 800ms linear infinite',
    }}>
      <style>{'@keyframes clout-spin{to{transform:rotate(360deg)}}'}</style>
    </span>
  );
}
