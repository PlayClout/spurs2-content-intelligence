import React from 'react';

/* Clout status system — shared config for every feedback surface.
   Pink (#FF006B) is VALUE, never error. Each status carries an icon so meaning
   never depends on color alone (WCAG 1.4.1). */
export const STATUS = {
  success: { fg: 'var(--success-fg)', solid: 'var(--success-default)', subtle: 'var(--success-subtle)', border: 'var(--success-border)', glyph: 'M5 13l4 4L19 7' },
  warning: { fg: 'var(--warning-fg)', solid: 'var(--warning-default)', subtle: 'var(--warning-subtle)', border: 'var(--warning-border)', glyph: 'M12 3l9 17H3zM12 10v4M12 17h.01' },
  error:   { fg: 'var(--danger-fg)',  solid: 'var(--danger-default)',  subtle: 'var(--danger-subtle)',  border: 'var(--danger-border)',  glyph: 'M12 8v5M12 17h.01M12 3a9 9 0 100 18 9 9 0 000-18z' },
  info:    { fg: 'var(--info-fg)',    solid: 'var(--info-default)',    subtle: 'var(--info-subtle)',    border: 'var(--info-border)',    glyph: 'M12 11v6M12 7h.01M12 3a9 9 0 100 18 9 9 0 000-18z' },
};

export function StatusIcon({ status = 'info', size = 20 }) {
  const s = STATUS[status] || STATUS.info;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: s.fg, flex: 'none' }} aria-hidden="true">
      <path d={s.glyph} />
    </svg>
  );
}
