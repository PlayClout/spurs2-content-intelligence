import React from 'react';

/* Clout Progress — determinate bar. Action gradient by default; status colors for outcomes.
   Use for XP, pass progress, challenge completion, upload state. */
const H = { sm: 4, md: 8, lg: 12 };
const FILL = {
  action: 'var(--action-default)',
  accent: 'var(--accent-default)',
  success: 'var(--success-default)',
  warning: 'var(--warning-default)',
  danger: 'var(--danger-default)',
};

export function Progress({
  value = 0, max = 100, size = 'md', tone = 'action',
  label, valueLabel, indeterminate = false, style, ...rest
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%', ...style }} {...rest}>
      {(label || valueLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>{label}</span>}
          {valueLabel && <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--fg-default)' }}>{valueLabel}</span>}
        </div>
      )}
      <div
        role="progressbar" aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={0} aria-valuemax={100} aria-label={label}
        style={{
          position: 'relative', width: '100%', height: H[size], borderRadius: 'var(--radius-pill)',
          background: 'var(--interactive-bg-active)', overflow: 'hidden',
        }}>
        <div style={{
          position: 'absolute', inset: 0, width: indeterminate ? '40%' : `${pct}%`,
          background: FILL[tone], borderRadius: 'var(--radius-pill)',
          transition: 'width var(--motion-slow) var(--ease-out)',
          animation: indeterminate ? 'clout-indet 1200ms var(--ease-standard) infinite' : 'none',
        }} />
        <style>{'@keyframes clout-indet{0%{left:-40%}100%{left:100%}}'}</style>
      </div>
    </div>
  );
}
