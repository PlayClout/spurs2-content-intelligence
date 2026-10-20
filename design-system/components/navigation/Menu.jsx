import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout Menu — action list surfaced from a trigger (overflow menu, profile menu).
   On mobile present it as a bottom Sheet; on web anchor it as a popover. */
export function Menu({ items = [], onSelect, style, ...rest }) {
  return (
    <div role="menu" style={{
      minWidth: 220, padding: 6, boxSizing: 'border-box',
      background: 'var(--bg-surface-raised)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-float)',
      zIndex: 'var(--z-popover)', ...style,
    }} {...rest}>
      {items.map((it, i) => it.divider ? (
        <div key={`d${i}`} style={{ height: 1, background: 'var(--border-default)', margin: '6px 4px' }} />
      ) : (
        <MenuItem key={it.id} item={it} onSelect={onSelect} />
      ))}
    </div>
  );
}

function MenuItem({ item, onSelect }) {
  const [hover, setHover] = React.useState(false);
  const danger = item.tone === 'danger';
  return (
    <button type="button" role="menuitem" disabled={item.disabled}
      onClick={() => onSelect && onSelect(item.id)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', boxSizing: 'border-box',
        minHeight: 44, padding: '0 12px', textAlign: 'left', cursor: item.disabled ? 'not-allowed' : 'pointer',
        background: hover && !item.disabled ? 'var(--interactive-bg-hover)' : 'transparent',
        border: 'none', borderRadius: 'var(--radius-xs)',
        color: item.disabled ? 'var(--fg-disabled)' : danger ? 'var(--danger-fg)' : 'var(--fg-default)',
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
        transition: 'var(--transition-colors)',
      }}>
      {item.icon && <Icon name={item.icon} size={20} color="currentColor" />}
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
      {item.meta && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)' }}>{item.meta}</span>}
      {item.checked && <Icon name="check" size={18} color="var(--accent-bright)" />}
    </button>
  );
}
