import React from 'react';

/* Clout Chip — compact metadata / filter token. Distinct from Button (an action)
   and StatusBadge (a state flag). Tones map to the semantic palette. */
const TONE = {
  neutral: { bg: 'var(--interactive-bg)', fg: 'var(--fg-secondary)', border: 'var(--border-default)' },
  accent:  { bg: 'var(--accent-subtle)', fg: 'var(--accent-bright)', border: 'var(--border-accent)' },
  value:   { bg: 'var(--value-subtle)', fg: 'var(--value-default)', border: 'rgba(255,0,107,0.4)' },
  success: { bg: 'var(--success-subtle)', fg: 'var(--success-fg)', border: 'var(--success-border)' },
  warning: { bg: 'var(--warning-subtle)', fg: 'var(--warning-fg)', border: 'var(--warning-border)' },
  danger:  { bg: 'var(--danger-subtle)', fg: 'var(--danger-fg)', border: 'var(--danger-border)' },
};

export function Chip({
  children, tone = 'neutral', size = 'md', selectable = false, selected = false,
  onSelect, onRemove, leadingIcon, style, ...rest
}) {
  const t = TONE[tone] || TONE.neutral;
  const sm = size === 'sm';
  const active = selected;
  const Tag = selectable ? 'button' : 'span';
  return (
    <Tag
      type={selectable ? 'button' : undefined}
      onClick={selectable ? onSelect : undefined}
      aria-pressed={selectable ? active : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, boxSizing: 'border-box',
        height: sm ? 26 : 32, padding: sm ? '0 10px' : '0 12px',
        background: active ? 'var(--accent-default)' : t.bg,
        border: `var(--border-w-hairline) solid ${active ? 'var(--accent-default)' : t.border}`,
        borderRadius: 'var(--radius-pill)',
        color: active ? 'var(--fg-on-action)' : t.fg,
        fontFamily: 'var(--font-body)', fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        cursor: selectable ? 'pointer' : 'default',
        transition: 'var(--transition-colors)', ...style,
      }} {...rest}>
      {leadingIcon}
      {children}
      {onRemove && (
        <span role="button" aria-label="Remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ display: 'flex', marginRight: -2, cursor: 'pointer', opacity: 0.7 }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </span>
      )}
    </Tag>
  );
}
