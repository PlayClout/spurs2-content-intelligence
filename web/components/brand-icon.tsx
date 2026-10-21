/**
 * Clout brand line icons (PlayClout design system). Geometry copied verbatim from
 * design-system/components/core/Icon.jsx (24px grid, 2px stroke, round caps/joins, currentColor).
 * Only the glyphs this app uses. Where the 27-glyph brand set has no equivalent (shield, save,
 * alert, spinner, inbox, social-platform marks) the app keeps lucide; see README-HERMES.md.
 */
const ICONS = {
  check: '<path d="M5 13l4 4L19 7"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  "arrow-left": '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4"/><path d="M8.2 13.2l7.6 4.4"/>',
  bolt: '<path d="M13 3L5 13h5l-1 8 8-10h-5z"/>',
} as const;

export type BrandIconName = keyof typeof ICONS;

export function BrandIcon({ name, size = 16, className, label }: { name: BrandIconName; size?: number; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", flex: "none" }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
