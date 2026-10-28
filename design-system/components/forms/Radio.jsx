import React from 'react';

/* Clout Radio — single-select within a named group. Use RadioGroup for the set. */
export function Radio({ checked, label, description, disabled = false, value, name, onChange, id, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  return (
    <label htmlFor={id}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: description ? 'flex-start' : 'center', gap: 12,
        minHeight: 'var(--touch-min)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, ...style,
      }}>
      <input id={id} type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={(e) => onChange && onChange(value, e)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
      <span aria-hidden="true" style={{
        width: 24, height: 24, flex: 'none', borderRadius: '50%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-surface-sunken)',
        border: `var(--border-w-strong) solid ${checked ? 'var(--accent-default)' : hover && !disabled ? 'var(--border-input-hover)' : 'var(--border-input)'}`,
        boxShadow: focus ? 'var(--focus-ring)' : 'none',
        transition: 'var(--transition-colors), var(--transition-shadow)',
        marginTop: description ? 2 : 0,
      }}>
        {checked && <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent-default)' }} />}
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

/* RadioGroup — owns selection for a set of Radios. */
export function RadioGroup({ name, value, options = [], onChange, disabled = false, style, ...rest }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }} {...rest}>
      {options.map((o) => (
        <Radio key={o.value} id={`${name}-${o.value}`} name={name} value={o.value}
          label={o.label} description={o.description}
          checked={value === o.value} disabled={disabled || o.disabled} onChange={onChange} />
      ))}
    </div>
  );
}
