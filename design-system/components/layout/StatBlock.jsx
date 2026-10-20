import React from 'react';

/* Clout StatBlock — product-side KPI display (distinct from the marketing StatChip).
   Italic value, uppercase label, optional delta with direction. */
export function StatBlock({
  value, label, delta, deltaDirection = 'up', tone = 'default', icon, size = 'md', style, ...rest
}) {
  const valueColor = {
    default: 'var(--fg-default)', value: 'var(--value-default)',
    accent: 'var(--accent-bright)', success: 'var(--success-fg)',
  }[tone];
  const fs = size === 'lg' ? 'var(--text-4xl)' : size === 'sm' ? 'var(--text-xl)' : 'var(--text-3xl)';
  const deltaColor = deltaDirection === 'up' ? 'var(--success-fg)' : deltaDirection === 'down' ? 'var(--danger-fg)' : 'var(--fg-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: fs,
          lineHeight: 0.95, color: valueColor, letterSpacing: '0.01em',
        }}>{value}</span>
        {delta && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2, color: deltaColor,
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 700,
          }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: deltaDirection === 'down' ? 'rotate(180deg)' : 'none' }}>
              <path d="M12 19V6M6 12l6-6 6 6" />
            </svg>
            {delta}
          </span>
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</span>
    </div>
  );
}
