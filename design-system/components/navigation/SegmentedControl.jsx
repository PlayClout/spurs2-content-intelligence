import React from 'react';

/* Clout SegmentedControl — 2–4 mutually exclusive options in a single track.
   Use for view switches (Daily / Weekly / Season). More options → Tabs. */
export function SegmentedControl({ items = [], value, onChange, size = 'md', fullWidth = true, style, ...rest }) {
  // Track min-height grows to keep inner buttons at the 44/48px touch minimum.
  const inner = size === 'sm' ? 44 : 'var(--touch-min)';
  return (
    <div role="tablist" style={{
      display: 'inline-flex', width: fullWidth ? '100%' : 'auto', boxSizing: 'border-box',
      padding: 3, gap: 2, background: 'var(--bg-surface-sunken)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-md)', ...style,
    }} {...rest}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button key={it.id} type="button" role="tab" aria-selected={on}
            disabled={it.disabled} onClick={() => onChange && onChange(it.id)}
            style={{
              flex: 1, minWidth: 0, minHeight: inner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)', cursor: it.disabled ? 'not-allowed' : 'pointer',
              background: on ? 'var(--interactive-bg-active)' : 'transparent',
              boxShadow: on ? 'inset 0 0 0 1px var(--border-default)' : 'none',
              color: on ? 'var(--fg-default)' : 'var(--fg-muted)',
              opacity: it.disabled ? 0.4 : 1,
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: on ? 700 : 500,
              letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              transition: 'var(--transition-colors)',
            }}>{it.label}</button>
        );
      })}
    </div>
  );
}
