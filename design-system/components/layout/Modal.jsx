import React from 'react';

/* Clout Modal & Sheet — the same dialog primitive with two presentations.
   PLATFORM RULE: mobile (<768px) presents as a bottom Sheet; tablet/web as a centered Modal. */
export function Modal({
  open = true, title, description, children, footer, onClose,
  presentation = 'modal', size = 'md', dismissible = true, style, ...rest
}) {
  if (!open) return null;
  const sheet = presentation === 'sheet';
  const maxW = { sm: 400, md: 520, lg: 720 }[size];

  return (
    <div
      role="presentation"
      style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: sheet ? 'flex-end' : 'center', justifyContent: 'center',
        background: 'var(--bg-overlay)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        padding: sheet ? 0 : 20, boxSizing: 'border-box', zIndex: 'var(--z-modal)',
      }}
      onClick={dismissible && onClose ? onClose : undefined}
    >
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: sheet ? 'none' : maxW, boxSizing: 'border-box',
          maxHeight: sheet ? '88%' : '90%', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-surface-raised)',
          border: 'var(--border-w-hairline) solid var(--border-default)',
          borderRadius: sheet ? 'var(--radius-sheet) var(--radius-sheet) 0 0' : 'var(--radius-xl)',
          boxShadow: 'var(--shadow-float)',
          paddingBottom: sheet ? 'var(--safe-bottom)' : 0,
          animation: `${sheet ? 'clout-sheet-in' : 'clout-modal-in'} var(--motion-slow) var(--ease-out)`,
          ...style,
        }} {...rest}>
        <style>{'@keyframes clout-sheet-in{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes clout-modal-in{from{transform:scale(0.97);opacity:0}to{transform:scale(1);opacity:1}}'}</style>

        {sheet && (
          <span aria-hidden="true" style={{
            width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)',
            margin: '10px auto 2px', flex: 'none',
          }} />
        )}

        {(title || dismissible) && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 0', flex: 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <div style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
                fontSize: 'var(--text-2xl)', textTransform: 'uppercase', lineHeight: 'var(--leading-tight)',
                color: 'var(--fg-default)',
              }}>{title}</div>}
              {description && <div style={{
                marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
                color: 'var(--fg-secondary)', lineHeight: 'var(--leading-normal)',
              }}>{description}</div>}
            </div>
            {dismissible && onClose && (
              <button type="button" onClick={onClose} aria-label="Close" style={{
                flex: 'none', width: 36, height: 36, display: 'grid', placeItems: 'center',
                background: 'var(--interactive-bg)', border: 'none', borderRadius: 'var(--radius-pill)',
                color: 'var(--fg-secondary)', cursor: 'pointer',
              }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            )}
          </div>
        )}

        {children && <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px' }}>{children}</div>}

        {footer && (
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap',
            padding: '14px 20px 20px', flex: 'none',
            borderTop: 'var(--border-w-hairline) solid var(--border-subtle)',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
