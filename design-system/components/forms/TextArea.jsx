import React from 'react';

/* Clout TextArea — multi-line input. Same state model as Input. */
const STATUS = {
  success: { border: 'var(--success-border)', ring: 'rgba(0,217,130,0.35)' },
  warning: { border: 'var(--warning-border)', ring: 'rgba(255,176,32,0.35)' },
  error:   { border: 'var(--danger-border)',  ring: 'rgba(255,41,66,0.35)' },
  info:    { border: 'var(--info-border)',    ring: 'rgba(0,163,255,0.35)' },
};

export function TextArea({
  value, defaultValue, placeholder = '', rows = 4, status, disabled = false, readOnly = false,
  maxLength, showCount = false, onChange, id, name, style, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [len, setLen] = React.useState((value ?? defaultValue ?? '').length);
  const st = status ? STATUS[status] : null;

  const borderColor = disabled ? 'var(--border-subtle)'
    : st ? st.border : focus ? 'var(--border-input-focus)'
    : hover ? 'var(--border-input-hover)' : 'var(--border-input)';

  return (
    <div style={{ width: '100%', ...style }}>
      <textarea
        id={id} name={name} rows={rows} value={value} defaultValue={defaultValue}
        placeholder={placeholder} disabled={disabled} readOnly={readOnly} maxLength={maxLength}
        aria-invalid={status === 'error' || undefined}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { setLen(e.target.value.length); onChange && onChange(e); }}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', resize: 'vertical',
          background: disabled ? 'var(--interactive-bg-disabled)' : 'var(--bg-surface-sunken)',
          border: `var(--border-w-default) solid ${borderColor}`, borderRadius: 'var(--radius-md)',
          boxShadow: focus && !disabled ? (st ? `0 0 0 3px ${st.ring}` : 'var(--focus-ring)') : 'none',
          color: disabled ? 'var(--fg-disabled)' : 'var(--fg-default)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', lineHeight: 'var(--leading-normal)',
          outline: 'none', transition: 'var(--transition-colors), var(--transition-shadow)',
          cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.6 : 1,
        }}
        {...rest}
      />
      {showCount && maxLength && (
        <div style={{
          marginTop: 6, textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
          color: len > maxLength * 0.9 ? 'var(--warning-fg)' : 'var(--fg-muted)',
        }}>{len} / {maxLength}</div>
      )}
    </div>
  );
}
