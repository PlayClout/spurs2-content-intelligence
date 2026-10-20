import React from 'react';

/* Clout DataTable — compact tabular data (leaderboards, transactions, admin).
   MOBILE RULE: below --bp-md, do not scroll a table sideways — render the same data
   as a ListRow stack. This component is for tablet/desktop widths. */
export function DataTable({ columns = [], rows = [], highlightRow, dense = false, style, ...rest }) {
  const cellPad = dense ? '10px 12px' : '14px 16px';
  return (
    <div style={{
      width: '100%', overflowX: 'auto', background: 'var(--bg-surface)',
      border: 'var(--border-w-hairline) solid var(--border-default)',
      borderRadius: 'var(--radius-lg)', ...style,
    }} {...rest}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{
                textAlign: c.align || 'left', padding: cellPad, whiteSpace: 'nowrap',
                fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--fg-muted)',
                borderBottom: 'var(--border-w-hairline) solid var(--border-default)',
                width: c.width,
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const hl = highlightRow != null && (r.id ?? i) === highlightRow;
            return (
              <tr key={r.id ?? i} style={{
                background: hl ? 'var(--interactive-bg-selected)' : 'transparent',
              }}>
                {columns.map((c) => (
                  <td key={c.key} style={{
                    textAlign: c.align || 'left', padding: cellPad,
                    fontSize: 'var(--text-sm)',
                    fontFamily: c.emphasis ? 'var(--font-display)' : 'var(--font-body)',
                    fontStyle: c.emphasis ? 'italic' : 'normal',
                    fontWeight: c.emphasis ? 700 : 400,
                    color: c.emphasis ? 'var(--fg-default)' : 'var(--fg-secondary)',
                    borderBottom: i === rows.length - 1 ? 'none' : 'var(--border-w-hairline) solid var(--border-subtle)',
                    fontVariantNumeric: c.numeric ? 'tabular-nums' : 'normal',
                  }}>{r[c.key]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
