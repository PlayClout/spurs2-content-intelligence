# Clout — Engineering Standards

Rules an AI coding agent follows without making subjective decisions. When this document and a
visual reference disagree, **this document wins** — it is the machine-readable contract.

---

## 1. Naming conventions

### Tokens (CSS custom properties)
```
--<category>-<role>-<variant?>-<state?>
```
| Category | Prefix | Examples |
|---|---|---|
| Brand primitives | `--clout-` | `--clout-black`, `--clout-electric-blue` |
| Surfaces | `--bg-` | `--bg-canvas`, `--bg-surface-raised` |
| Text | `--fg-` | `--fg-default`, `--fg-secondary`, `--fg-on-action` |
| Borders | `--border-` | `--border-default`, `--border-input-focus` |
| Interactive | `--interactive-` | `--interactive-bg-hover` |
| Semantic status | `--success-` `--warning-` `--danger-` `--info-` | `--danger-subtle` |
| Sizing | `--control-h-` `--icon-` `--touch-` | `--control-h-md`, `--icon-lg` |
| Spacing | `--space-` | `--space-4` |
| Radius | `--radius-` | `--radius-md`, `--radius-pill` |
| Elevation | `--shadow-` `--glow-` | `--shadow-card`, `--glow-action` |
| Motion | `--motion-` `--ease-` `--transition-` | `--motion-base`, `--ease-standard` |
| Layout | `--bp-` `--z-` `--screen-pad-` `--content-max-` | `--bp-md`, `--z-modal` |

**Never** invent a raw value where a token exists. No `#FF006B` in component code — use
`var(--value-default)`. No `z-index: 9999` — use `var(--z-modal)`.

### Components
- Files: `PascalCase.jsx` + `PascalCase.d.ts` + one `*.prompt.md` + one `*.card.html` per directory.
- Exports: named, PascalCase, matching the filename — `export function Button(…)`.
- Props: `camelCase`. Booleans read as assertions (`disabled`, `loading`, `selected`), never `isDisabled`.
- Variant props use the domain word, not a number: `family="primary"`, `tone="danger"`, `size="md"`.
- Handlers: `onX` (`onClick`, `onChange`, `onSelect`, `onRedeem`, `onDismiss`).
- Escape hatches: `style` on the root, plus `inputStyle`-style named slots where a second node exists.

### State vocabulary — fixed, do not invent synonyms
| Domain | Allowed values |
|---|---|
| Control status | `success` · `warning` · `error` · `info` |
| Interaction | `default` · `hover` · `active` · `focus` · `disabled` · `loading` |
| Pass tier | `free` · `upgrade` · `locked` |
| Pick'em | `open` · `locked` · `correct` · `incorrect` |
| Challenge | `available` · `in-progress` · `complete` · `claimed` · `expired` |
| Reward | `locked` · `unlocked` · `redeemed` · `shipped` |
| Marketplace | `available` · `low-stock` · `sold-out` · `owned` |
| Eligibility step | `pending` · `active` · `complete` · `blocked` |

### Product vocabulary — ENFORCED
**Clout is a free-to-play fandom rewards platform. It is not a sportsbook, not daily fantasy,
and not a gambling product.** Fans never stake anything to participate. This is a regulatory
boundary, not a style preference — language that implies wagering is a defect.

| Use | Never use |
|---|---|
| predict, pick, **action**, challenge | bet, wager, stake, gamble |
| XP value, point weight | odds, multiplier, line price, payout, `-110` |
| earn, redeem, reward, prize | win money, cash out, withdraw, bankroll, parlay |
| correct / incorrect | won / lost (in the wagering sense) |
| free to play, optional upgrade | entry fee, buy-in, ante, stake |
| in prizes, prize value | prize pool (implies pooled stakes) |

**Model:** free participation → earn **XP** (progression) and **Coins** (redemption currency) →
redeem real prizes. Coins are earned only — never purchased, never cashed out. The single paid
element is an **optional pass upgrade**: a content purchase unlocking more actions, challenges
and marketplace access. It is never a chance to win and never an entry fee.

**"Action" is the primitive.** A pick'em/prediction is the flagship *type* of action, not the
whole product — challenges, daily engagement and other actions sit alongside it. Do not let
copy or component naming collapse everything into "predictions".

### Eligibility & compliance placement
Age (18+), geo/jurisdiction and any KYC checks belong in the **redemption flow only**, via
`EligibilityGate` inside a non-dismissible `Modal`. **Never gate signup, onboarding or play** —
participation is free and open; eligibility is a prize-fulfilment requirement. Every surface
that shows a redeemable prize should carry the standing note: _"Clout is free to play. No
purchase necessary. 18+ to redeem. Eligibility varies by jurisdiction."_

---

## 2. Component state contract

Every interactive component implements these; if a state is meaningless, it is still safe to pass.

| State | Visual rule | Token |
|---|---|---|
| default | Base treatment | — |
| hover | Brighten 6–20%, or `--interactive-bg-hover` | `--action-hover-filter` |
| active/press | Scale to `0.975` (buttons) / `0.99` (cards) | `--press-scale` |
| focus-visible | 3px ring, 2px offset, **always visible** | `--focus-ring` |
| selected | Accent border + `--interactive-bg-selected` | `--accent-default` |
| disabled | 40–50% opacity, no glow, `cursor: not-allowed`, `aria-disabled` | `--action-disabled-opacity` |
| loading | Spinner replaces trailing content; control stays sized; `aria-busy` | `--motion-*` |
| success / warning / error | Border + icon + message. **Never color alone.** | `--success-*` etc. |

**Rule: brand pink `#FF006B` means value/action. It is never an error color.** Errors use
`--danger-default` `#FF2942`.

---

## 3. Accessibility standards (non-negotiable)

**Contrast — verified against the dark canvas `#050811`:**
| Pair | Ratio | Use |
|---|---|---|
| `--fg-default` on `--bg-canvas` | ~17.9:1 | Body, headings — passes AAA |
| `--fg-secondary` on `--bg-canvas` | ~7.0:1 | Secondary text — passes AA |
| `--fg-muted` on `--bg-canvas` | ~3.9:1 | **Large text (≥18.66px bold / 24px) and non-text only** |
| `--accent-bright` on `--bg-canvas` | ~7.4:1 | Links, accents — passes AA |
| `--success-fg` / `--warning-fg` / `--danger-fg` on `--bg-canvas` | ≥7:1 | Status text |
| `--fg-on-action` on Action gradient | ≥4.6:1 across all stops | CTA labels |

Do not use `--fg-muted` for body copy. Do not put `--clout-pink` text on `--clout-black` at
body size — it is ~4.0:1; use it at ≥24px or as a fill behind `--fg-on-action`.

**Requirements**
1. Touch targets ≥44px (iOS) / 48px (Android). Ship 48px. Minimum 8px between adjacent targets.
2. Every icon-only control has an `aria-label`.
3. Focus is never removed; `:focus-visible` shows `--focus-ring` at 3:1 against its background.
4. Status is conveyed by **icon + text + color**, never color alone (WCAG 1.4.1).
5. Form controls have a programmatic label (`FormField htmlFor`); errors set `aria-invalid` and
   are announced via `role="alert"`.
6. Dialogs: `role="dialog"`, `aria-modal="true"`, focus trapped, Esc closes (unless
   `dismissible={false}`), focus returns to the trigger.
7. Live regions: toasts `role="status" aria-live="polite"`; blocking errors `role="alert"`.
8. `prefers-reduced-motion` zeroes all durations and press scales — already handled in `motion.css`.
9. Body text minimum 15px mobile / 16px web. Never below `--text-xs` (12px) for any readable copy.
10. Hit the 200% zoom / 320px reflow requirement: no horizontal scroll, no clipped content.
11. Color is never the only differentiator in charts — pair the categorical ramp with labels or patterns.

---

## 4. Interaction & animation

| Interaction | Duration | Easing |
|---|---|---|
| Hover / press / checkbox | `--motion-fast` 120ms | `--ease-standard` |
| Color, tab change, chip toggle | `--motion-base` 200ms | `--ease-standard` |
| Sheet, modal, page transition | `--motion-slow` 360ms | `--ease-out` (in) / `--ease-in` (out) |
| Progress fill, XP gain | `--motion-slow` 360ms | `--ease-out` |
| Celebratory reveal (prize won) | `--motion-slower` 560ms | `--ease-out` |

**Rules**
- Never bounce, never overshoot. Clout is confident, not playful.
- Animate `transform` and `opacity` only. Never animate `width`/`height`/`top`/`left` on a hot path.
- One motion focus at a time. Never animate the background behind a moving foreground element.
- Sheets slide up 24px + fade. Modals scale from `0.97` + fade. Toasts fade + 8px rise.
- Skeletons shimmer at `--skeleton-duration` (1400ms) linear.
- Loading waits <400ms show nothing (no flash); 400ms–2s show a `Spinner`; >2s or content regions
  show `Skeleton`.
- Optimistic UI on picks and claims: apply immediately, roll back with an error `Toast` on failure.

---

## 5. Layout & screen composition

**Grid**
| Breakpoint | Columns | Gutter | Screen padding |
|---|---|---|---|
| `<768px` mobile | 4 | 16px | 20px |
| `768–1023px` tablet | 8 | 20px | 32px |
| `≥1024px` desktop | 12 | 24px | 48px |

**Content max-widths:** `--content-max-narrow` 480 (forms, onboarding, auth) ·
`--content-max-default` 720 (reading, settings) · `--content-max-wide` 1200 (feeds, dashboards) ·
`--content-max-full` 1440.

**Screen anatomy (mobile):**
```
NavBar (sticky, safe-top)
└─ scroll region  ← the only scrolling element, padded --screen-pad-mobile, 16px section gap
   └─ [alert] → [primary section] → [secondary sections]
└─ action bar (optional, sticky) ← one primary CTA, full width
TabBar (fixed, safe-bottom)
```

**Rules**
1. Mobile-first: author the 390px layout, then add breakpoints upward.
2. Protect the center read zone — atmosphere and texture stay at the edges.
3. One Action-gradient element in view at a time.
4. The prize/value is the largest number on the screen.
5. Cards never nest more than two deep.
6. Below `--bp-md`, multi-column grids collapse to one column and tables become row stacks.
7. Sticky action bars sit above the `TabBar` and respect `--safe-bottom`.

---

## 6. Translating this system

**CSS variables** — ship `styles.css` as-is; it is the source of truth and imports everything.

**Tailwind** — map tokens in `theme.extend`, never re-declare values:
```js
colors: { canvas:'var(--bg-canvas)', surface:'var(--bg-surface)', value:'var(--value-default)',
  danger:'var(--danger-default)', success:'var(--success-default)' },
borderRadius: { md:'var(--radius-md)', xl:'var(--radius-xl)', pill:'var(--radius-pill)' },
spacing: { 4:'var(--space-4)', 6:'var(--space-6)' },
```

**React Native / Flutter** — CSS variables don't exist; generate a typed constants file from
`tokens/*.css` at build time. Do not hand-copy values — they drift. Named equivalents:
`--motion-base` → `Duration(milliseconds: 200)`, `--ease-standard` → `Cubic(0.2, 0.7, 0.2, 1)`.

**iOS / Android native** — the brand package already ships `CloutColors_v01.swift` and an
Android color XML in `02_VISUAL IDENTITY/02_COLOR/04_DESIGN_TOKENS`. Extend those files with the
semantic layer from `tokens/semantic.css`; keep names identical across platforms.

**Definition of done for any new component**
1. Uses only tokens — zero hard-coded colors, radii, durations or z-indexes.
2. Implements the full state contract (§2).
3. Meets the accessibility requirements (§3).
4. Has `.jsx` + `.d.ts` + an entry in the directory `*.prompt.md` + a state in the `*.card.html`.
5. Works at 320px, 390px, 768px and 1280px.
6. Respects `prefers-reduced-motion`.
