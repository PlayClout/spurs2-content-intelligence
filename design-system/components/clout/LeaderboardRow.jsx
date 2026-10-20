import React from 'react';
import { Avatar } from '../layout/Avatar.jsx';
import { Icon } from '../core/Icon.jsx';

/* Clout LeaderboardRow — ranked standing. Top 3 get medal coloring; the current user's
   row is highlighted and should stay pinned when scrolled out of view. */
const MEDAL = { 1: '#FFC53D', 2: '#C7D0DB', 3: '#E08A4B' };

export function LeaderboardRow({
  rank, name, avatar, meta, score, delta, isCurrentUser = false, prize, onClick, style, ...rest
}) {
  const medal = MEDAL[rank];
  return (
    <div
      onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box', width: '100%',
        minHeight: 'var(--touch-min)', padding: '10px 12px',
        background: isCurrentUser ? 'var(--interactive-bg-selected)' : 'transparent',
        border: isCurrentUser ? 'var(--border-w-hairline) solid var(--border-accent)' : 'var(--border-w-hairline) solid transparent',
        borderBottom: isCurrentUser ? undefined : 'var(--border-w-hairline) solid var(--border-subtle)',
        borderRadius: isCurrentUser ? 'var(--radius-md)' : 0,
        cursor: onClick ? 'pointer' : 'default', ...style,
      }} {...rest}>
      <span style={{
        flex: 'none', width: 26, textAlign: 'center',
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: medal ? 'var(--text-xl)' : 'var(--text-md)',
        color: medal || 'var(--fg-muted)',
      }}>{rank}</span>

      <Avatar name={name} src={avatar} size="sm" ring={rank === 1 ? 'action' : 'none'} />

      <span style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: isCurrentUser ? 700 : 600,
          color: 'var(--fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}{isCurrentUser && <span style={{ color: 'var(--accent-bright)', fontWeight: 700 }}> · You</span>}</span>
        {(meta || prize) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {prize && <span style={{
              flex: 'none', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'var(--text-xs)', color: 'var(--value-default)',
            }}>{prize}</span>}
            {meta && <span style={{
              minWidth: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{meta}</span>}
          </span>
        )}
      </span>

      {delta != null && (
        <span style={{
          flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 2,
          color: delta > 0 ? 'var(--success-fg)' : delta < 0 ? 'var(--danger-fg)' : 'var(--fg-muted)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
        }}>
          {delta !== 0 && (
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: delta < 0 ? 'rotate(180deg)' : 'none' }}><path d="M12 19V6M6 12l6-6 6 6" /></svg>
          )}
          {delta === 0 ? '–' : Math.abs(delta)}
        </span>
      )}

      <span style={{
        flex: 'none', textAlign: 'right',
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
        fontSize: 'var(--text-lg)', color: 'var(--fg-default)', fontVariantNumeric: 'tabular-nums',
      }}>{score}</span>
    </div>
  );
}
