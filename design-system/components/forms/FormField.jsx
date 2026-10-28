import React from 'react';

/* Clout FormField — the labelled wrapper every input must ship inside.
   Owns label, required marker, helper text, and the status message.
   ACCESSIBILITY: the message is text + icon, never color alone. */
const MSG = {
  success: { color: 'var(--success-fg)', glyph: 'M5 13l4 4L19 7' },
  warning: { color: 'var(--warning-fg)', glyph: 'M12 8v5M12 17h.01' },
  error:   { color: 'var(--danger-fg)',  glyph: 'M12 8v5M12 17h.01' },
  info:    { color: 'var(--info-fg)',    glyph: 'M12 11v6M12 7h.01' },
};

export function FormField({
  label, htmlFor, required = false, optional = false, helper, status, message, disabled = false, children, style, ...rest
}) {
  const st = status ? MSG[status] : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', opacity: disabled ? 0.6 : 1, ...style }} {...rest}>
      {label && (
        <label htmlFor={htmlFor} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: '0.02em',
          color: 'var(--fg-default)', textTransform: 'uppercase',
        }}>
          {label}
          {required && <span style={{ color: 'var(--value-default)' }} aria-hidden="true">*</span>}
          {optional && <span style={{ color: 'var(--fg-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>}
        </label>
      )}
      {children}
      {message && st && (
        <div role={status === 'error' ? 'alert' : undefined} style={{
          display: 'flex', alignItems: 'flex-start', gap: 6, color: st.color,
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)',
        }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
            <path d={st.glyph} />
          </svg>
          <span>{message}</span>
        </div>
      )}
      {helper && !message && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', lineHeight: 'var(--leading-snug)' }}>{helper}</div>
      )}
    </div>
  );
}
