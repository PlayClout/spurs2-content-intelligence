import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout ListRow — the workhorse row for settings, leaderboards, transactions, menus.
   48px minimum height. Leading slot / title+subtitle / trailing value / chevron. */
export function ListRow({
  leading, title, subtitle, value, valueTone = 'default', trailing,
  chevron = false, selected = false, disabled = false, onClick, divider = true, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const clickable = !!onClick;
  const valueColor = {
    default: 'var(--fg-default)', muted: 'var(--fg-muted)',
    value: 'var(--value-default)', success: 'var(--success-fg)', danger: 'var(--danger-fg)',
  }[valueTone];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', boxSizing: 'border-box',
        minHeight: 'var(--touch-min)', padding: '12px 16px',
        background: selected ? 'var(--interactive-bg-selected)'
          : clickable && hover && !disabled ? 'var(--interactive-bg-hover)' : 'transparent',
        borderBottom: divider ? 'var(--border-w-hairline) solid var(--border-subtle)' : 'none',
        cursor: disabled ? 'not-allowed' : clickable ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        transform: clickable && press && !disabled ? 'scale(var(--press-scale-tile))' : 'scale(1)',
        transition: 'var(--transition-colors), var(--transition-transform)',
        ...style,
      }} {...rest}>
      {leading && <span style={{ display: 'flex', flex: 'none' }}>{leading}</span>}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600,
          color: 'var(--fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</span>
        {subtitle && <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{subtitle}</span>}
      </span>
      {value != null && <span style={{
        flex: 'none', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: 'var(--text-lg)', color: valueColor,
      }}>{value}</span>}
      {trailing}
      {chevron && <Icon name="chevron-right" size={20} color="var(--fg-muted)" />}
    </div>
  );
}
