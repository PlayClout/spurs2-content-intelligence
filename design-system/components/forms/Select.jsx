import React from 'react';

/* Clout Select — native select styled to match Input (native picker on iOS/Android is correct;
   do not hand-roll a listbox for simple option sets). */
const H = { sm: 'var(--control-h-sm)', md: 'var(--control-h-md)', lg: 'var(--control-h-lg)' };

export function Select({
  value, defaultValue, options = [], placeholder = 'Select…', size = 'md',
  status, disabled = false, onChange, id, name, style, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const borderColor = disabled ? 'var(--border-subtle)'
    : status === 'error' ? 'var(--danger-border)'
    : status === 'success' ? 'var(--success-border)'
    : focus ? 'var(--border-input-focus)'
    : hover ? 'var(--border-input-hover)' : 'var(--border-input)';

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box',
        height: H[size], background: disabled ? 'var(--interactive-bg-disabled)' : 'var(--bg-surface-sunken)',
        border: `var(--border-w-default) solid ${borderColor}`, borderRadius: 'var(--radius-md)',
        boxShadow: focus && !disabled ? 'var(--focus-ring)' : 'none',
        transition: 'var(--transition-colors), var(--transition-shadow)',
        opacity: disabled ? 0.6 : 1, ...style,
      }}>
      <select
        id={id} name={name} value={value} defaultValue={defaultValue} disabled={disabled}
        onChange={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        aria-invalid={status === 'error' || undefined}
        style={{
          appearance: 'none', WebkitAppearance: 'none', width: '100%', height: '100%',
          padding: '0 40px 0 14px', background: 'transparent', border: 'none', outline: 'none',
          color: disabled ? 'var(--fg-disabled)' : 'var(--fg-default)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }} {...rest}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', right: 12, pointerEvents: 'none' }}>
        <path d="M5 9l7 7 7-7" />
      </svg>
    </div>
  );
}
