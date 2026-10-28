import React from 'react';

/* Badge — achievement / status award for the gamified engagement system. Five shapes:
   circle (achievement), square (rank tier), shield (verification), ribbon (placement),
   hexagon (XP/milestone). Rim gradient: 'action' (warm/achievement) or 'atmosphere' (status/tier).
   Carbon fill, inner hairline ring, italic title over a wide-tracked subtitle. */

const CLIP = {
  shield: 'polygon(50% 0%, 100% 15%, 100% 60%, 50% 100%, 0% 60%, 0% 15%)',
  hexagon: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
};
const RADIUS = { circle: '50%', square: '24%', ribbon: '50%' };

export function Badge({
  shape = 'circle', title = 'MVP', subtitle = 'AWARD', rim = 'action', size = 200, style, ...rest
}) {
  const rimBg = rim === 'atmosphere' ? 'var(--clout-gradient-atmosphere)' : 'var(--clout-gradient-action)';
  const clipPath = CLIP[shape];
  const borderRadius = RADIUS[shape] || 0;
  const rimW = Math.max(5, Math.round(size * 0.03));

  const shell = {
    position: 'relative', width: size, height: size, background: rimBg,
    clipPath, borderRadius, padding: rimW, boxSizing: 'border-box',
    filter: rim === 'atmosphere' ? 'drop-shadow(var(--glow-blue))' : 'drop-shadow(var(--glow-pink))',
  };
  const inner = {
    width: '100%', height: '100%', background: 'var(--clout-carbon)', clipPath, borderRadius,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1.5px var(--border-hairline)', boxSizing: 'border-box', textAlign: 'center', padding: 8,
  };
  return (
    <div style={{ ...shell, ...style }} {...rest}>
      <div style={inner}>
        <span style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
          fontSize: size * 0.17, lineHeight: 0.95, textTransform: 'uppercase', color: 'var(--clout-white)',
        }}>{title}</span>
        {subtitle && <span style={{
          marginTop: 6, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: size * 0.065,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--clout-slate)',
        }}>{subtitle}</span>}
      </div>
      {shape === 'ribbon' && (
        <>
          <span style={{ position: 'absolute', bottom: -size * 0.12, left: '32%', width: size * 0.12, height: size * 0.28, background: rimBg, transform: 'skewX(12deg)', zIndex: -1 }} />
          <span style={{ position: 'absolute', bottom: -size * 0.12, right: '32%', width: size * 0.12, height: size * 0.28, background: rimBg, transform: 'skewX(-12deg)', zIndex: -1 }} />
        </>
      )}
    </div>
  );
}
