import React from 'react';
import { Icon } from '../core/Icon.jsx';

/* Clout PassCard — a Pass groups a set of free actions and challenges.
   The free Clout Pass is ALWAYS available; upgrade passes are an optional CONTENT purchase
   (more actions, challenges and marketplace access) — never an entry fee, stake or wager.
   Tiers: free · upgrade (Action-gradient rim) · locked. Shows progress toward completion. */
const TIER = {
  free:     { border: 'var(--border-default)', glow: 'none', label: 'var(--fg-secondary)' },
  upgrade:  { border: 'transparent', glow: 'var(--glow-action)', label: 'var(--value-default)' },
  locked:   { border: 'var(--border-subtle)', glow: 'none', label: 'var(--fg-muted)' },
};

export function PassCard({
  name = 'Clout Pass', sport, tier = 'free', status = 'Active',
  progress, progressLabel, prizes, actionsLeft, expiresIn,
  locked = false, onClick, style, ...rest
}) {
  const t = TIER[locked ? 'locked' : tier] || TIER.free;
  const [press, setPress] = React.useState(false);
  const premium = tier === 'upgrade' && !locked;

  return (
    <div
      onClick={locked ? undefined : onClick}
      role={onClick ? 'button' : undefined} tabIndex={onClick && !locked ? 0 : undefined}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)} onMouseLeave={() => setPress(false)}
      style={{
        position: 'relative', boxSizing: 'border-box', width: '100%', overflow: 'hidden',
        padding: premium ? 2 : 0, borderRadius: 'var(--radius-xl)',
        background: premium ? 'var(--action-default)' : 'transparent',
        boxShadow: t.glow, opacity: locked ? 0.55 : 1,
        transform: press && !locked ? 'scale(var(--press-scale-tile))' : 'scale(1)',
        transition: 'var(--transition-transform), var(--transition-shadow)',
        cursor: locked ? 'not-allowed' : onClick ? 'pointer' : 'default', ...style,
      }} {...rest}>
      <div style={{
        position: 'relative', padding: 18, borderRadius: premium ? 'calc(var(--radius-xl) - 2px)' : 'var(--radius-xl)',
        background: 'var(--bg-surface)', border: premium ? 'none' : `var(--border-w-default) solid ${t.border}`,
        overflow: 'hidden',
      }}>
        <span aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(80% 90% at 85% 0%, rgba(18,107,255,0.22), rgba(18,107,255,0) 60%)',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {sport && <div style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-bright)',
            }}>{sport}</div>}
            <div style={{
              marginTop: 4, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
              fontSize: 'var(--text-2xl)', textTransform: 'uppercase', lineHeight: 'var(--leading-tight)',
              color: 'var(--fg-default)',
            }}>{name}</div>
          </div>
          {locked
            ? <Icon name="clock" size={22} color="var(--fg-muted)" />
            : <span style={{
                flex: 'none', padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                background: premium ? 'var(--value-subtle)' : 'var(--interactive-bg)',
                color: t.label, fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>{premium ? 'Upgrade' : status}</span>}
        </div>

        {(prizes || actionsLeft || expiresIn) && (
          <div style={{ position: 'relative', display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
            {prizes && <Meta icon="trophy" label="In prizes" value={prizes} tone="value" />}
            {actionsLeft && <Meta icon="target" label="Actions left" value={actionsLeft} />}
            {expiresIn && <Meta icon="clock" label="Expires" value={expiresIn} />}
          </div>
        )}

        {progress != null && (
          <div style={{ position: 'relative', marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Progress</span>
              {progressLabel && <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--fg-default)' }}>{progressLabel}</span>}
            </div>
            <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--interactive-bg-active)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: 'var(--action-default)', borderRadius: 'var(--radius-pill)', transition: 'width var(--motion-slow) var(--ease-out)' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ icon, label, value, tone }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon name={icon} size={14} color="var(--fg-muted)" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{label}</span>
      </span>
      <span style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 'var(--text-lg)',
        color: tone === 'value' ? 'var(--value-default)' : 'var(--fg-default)',
      }}>{value}</span>
    </span>
  );
}
