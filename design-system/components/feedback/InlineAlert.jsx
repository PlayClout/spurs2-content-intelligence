import React from 'react';
import { STATUS, StatusIcon } from './StatusIcon.jsx';

/* Clout InlineAlert — persistent, in-flow message tied to a region of the page.
   Use Toast for transient confirmations; use FormField messages for single fields. */
export function InlineAlert({ status = 'info', title, children, onDismiss, action, style, ...rest }) {
  const s = STATUS[status] || STATUS.info;
  return (
    <div role={status === 'error' ? 'alert' : 'status'} style={{
      display: 'flex', gap: 12, width: '100%', boxSizing: 'border-box', padding: '14px 16px',
      background: s.subtle, border: `var(--border-w-hairline) solid ${s.border}`,
      borderRadius: 'var(--radius-md)', ...style,
    }} {...rest}>
      <span style={{ marginTop: 1 }}><StatusIcon status={status} /></span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {title && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--fg-default)' }}>{title}</div>}
        {children && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 'var(--leading-snug)' }}>{children}</div>}
        {action && <div style={{ marginTop: 6 }}>{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" style={{
          flex: 'none', width: 28, height: 28, display: 'grid', placeItems: 'center',
          background: 'transparent', border: 'none', borderRadius: 'var(--radius-xs)',
          color: 'var(--fg-muted)', cursor: 'pointer',
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      )}
    </div>
  );
}
