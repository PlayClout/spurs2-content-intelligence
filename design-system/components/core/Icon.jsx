import React from 'react';

/* Clout line-icon registry — 24px grid, 2px stroke, round caps/joins (authoritative geometry
   copied from the production SVG masters). Rendered with `currentColor` so any icon recolors
   via the parent `color`. White by default; use Electric Blue or Action gradient for emphasis. */
const ICONS = {
  'arrow-left': '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  'arrow-right': '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  'chevron-right': '<path d="M9 5l7 7-7 7"/>',
  'chevron-down': '<path d="M5 9l7 7 7-7"/>',
  'external': '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  'close': '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  'menu': '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  'play': '<path d="M7 5l12 7-12 7z"/>',
  'pause': '<path d="M8 5v14"/><path d="M16 5v14"/>',
  'live': '<circle cx="12" cy="12" r="3"/><path d="M6.5 6.5a8 8 0 0 0 0 11"/><path d="M17.5 6.5a8 8 0 0 1 0 11"/>',
  'stream': '<path d="M4 8a10 10 0 0 1 16 0"/><path d="M7 12a6 6 0 0 1 10 0"/><circle cx="12" cy="16" r="1.5"/>',
  'controller': '<path d="M8 10h.01"/><path d="M6 10v4"/><path d="M4 10h4"/><path d="M15 11h.01"/><path d="M18 13h.01"/><rect x="2.5" y="7" width="19" height="10" rx="5"/>',
  'trophy': '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a2 2 0 0 0 0 4h1"/><path d="M16 6h3a2 2 0 0 1 0 4h-1"/><path d="M10 15h4"/><path d="M12 15v3"/><path d="M9 20h6"/>',
  'medal': '<circle cx="12" cy="14" r="6"/><path d="M9 3l3 5 3-5"/><path d="M12 11.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 13.8l2-.3z"/>',
  'target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  'fire': '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c1.5 0 1-4 2-5 0-1-1-3-2-4z"/>',
  'gift': '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 13h16"/><path d="M12 9v11"/><path d="M12 9S10 4 7.5 5.5 12 9 12 9z"/><path d="M12 9s2-5 4.5-3.5S12 9 12 9z"/>',
  'coin': '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9.5 10.5a2.5 2 0 0 1 5 0c0 2.5-5 1-5 3.5a2.5 2 0 0 0 5 0"/>',
  'star': '<path d="M12 3l2.6 5.6L20 9.3l-4 4 1 6-5-2.8L7 19.3l1-6-4-4 5.4-.7z"/>',
  'xp': '<circle cx="12" cy="12" r="9"/><path d="M9 9l3 6 3-6"/>',
  'bolt': '<path d="M13 3L5 13h5l-1 8 8-10h-5z"/>',
  'heart': '<path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5c0 5-7 9.5-7 9.5z"/>',
  'clock': '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  'user': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  'share': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4"/><path d="M8.2 13.2l7.6 4.4"/>',
  'check': '<path d="M5 13l4 4L19 7"/>',
  'bell': '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, size = 24, color = 'var(--clout-white)', strokeWidth = 2, style, ...rest }) {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ color, display: 'inline-block', flex: 'none', ...style }}
      dangerouslySetInnerHTML={{ __html: inner }} {...rest}
    />
  );
}
