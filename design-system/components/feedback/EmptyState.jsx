import React from 'react';

/* Clout EmptyState — zero-data, no-results and error-recovery screens.
   Always give the user one clear next action. */
export function EmptyState({ icon, title, description, action, secondaryAction, compact = false, style, ...rest }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      gap: compact ? 10 : 16, padding: compact ? '28px 20px' : '56px 24px',
      maxWidth: 420, margin: '0 auto', ...style,
    }} {...rest}>
      {icon && (
        <span style={{
          width: compact ? 48 : 64, height: compact ? 48 : 64, display: 'grid', placeItems: 'center',
          borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--accent-bright)',
          marginBottom: 2,
        }}>{icon}</span>
      )}
      <div style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: compact ? 'var(--text-xl)' : 'var(--text-2xl)', textTransform: 'uppercase',
        color: 'var(--fg-default)', lineHeight: 'var(--leading-tight)',
      }}>{title}</div>
      {description && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--fg-secondary)', lineHeight: 'var(--leading-normal)' }}>{description}</div>
      )}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 6 }}>
          {action}{secondaryAction}
        </div>
      )}
    </div>
  );
}
