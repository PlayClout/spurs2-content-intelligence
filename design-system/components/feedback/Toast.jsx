import React from 'react';
import { STATUS, StatusIcon } from './StatusIcon.jsx';

/* Clout Toast — transient confirmation. Raised surface, status-tinted left edge,
   auto-dismiss. Mobile: full-width above the tab bar. Web: bottom-right. */
export function Toast({ status = 'success', title, children, onDismiss, style, ...rest }) {
  const s = STATUS[status] || STATUS.success;
  return (
    <div role="status" aria-live="polite" style={{
      display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', maxWidth: 420, boxSizing: 'border-box',
      padding: '14px 16px', background: 'var(--bg-surface-raised)',
      border: `var(--border-w-hairline) solid var(--border-default)`,
      borderLeft: `var(--border-w-emphasis) solid ${s.solid}`,
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-float)',
      zIndex: 'var(--z-toast)', ...style,
    }} {...rest}>
      <span style={{ marginTop: 1 }}><StatusIcon status={status} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--fg-default)' }}>{title}</div>}
        {children && <div style={{ marginTop: 2, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 'var(--leading-snug)' }}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" style={{
          flex: 'none', width: 28, height: 28, display: 'grid', placeItems: 'center',
          background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer',
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      )}
    </div>
  );
}
