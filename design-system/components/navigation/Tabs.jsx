import React from 'react';

/* Clout Tabs — in-page section switcher. Underline indicator in the Action gradient.
   Scrollable when the set overflows (sport filters, contest types). */
export function Tabs({ items = [], active, onChange, scrollable = true, style, ...rest }) {
  return (
    <div role="tablist" style={{
      display: 'flex', gap: 4, width: '100%', boxSizing: 'border-box',
      overflowX: scrollable ? 'auto' : 'visible', scrollbarWidth: 'none',
      borderBottom: 'var(--border-w-hairline) solid var(--border-default)', ...style,
    }} {...rest}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} type="button" role="tab" aria-selected={on}
            onClick={() => onChange && onChange(it.id)}
            style={{
              position: 'relative', flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 'var(--control-h-md)', padding: '0 14px', background: 'transparent', border: 'none',
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: on ? 700 : 500,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: on ? 'var(--fg-default)' : 'var(--fg-muted)',
              transition: 'var(--transition-colors)',
            }}>
            {it.label}
            {it.count != null && (
              <span style={{
                padding: '2px 7px', borderRadius: 'var(--radius-pill)',
                background: on ? 'var(--value-subtle)' : 'var(--interactive-bg)',
                color: on ? 'var(--value-default)' : 'var(--fg-muted)',
                fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 0,
              }}>{it.count}</span>
            )}
            {on && <span style={{
              position: 'absolute', bottom: -1, left: 8, right: 8, height: 3,
              borderRadius: '3px 3px 0 0', background: 'var(--action-default)',
            }} />}
          </button>
        );
      })}
    </div>
  );
}
