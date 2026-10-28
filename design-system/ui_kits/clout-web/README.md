# Clout Product UI Kit

High-fidelity recreations of Clout's product surfaces, composed **only** from design-system
components. These are the reference implementations an agent should copy structure from.

## Files
- `../clout-app/index.html` — mobile app (390×844): Home, Pick'em, Rewards/Shop, Profile,
  Onboarding, plus canonical loading and empty states. The first frame is interactive.
- `../clout-app/screens.jsx` — the screen source. Read this to see how screens are assembled.
- `index.html` (this directory) — the responsive web dashboard at 1280px.

## Screen composition rules
1. **Chrome is fixed, content scrolls.** `NavBar` sticks to the top, `TabBar` to the bottom;
   only the middle region scrolls.
2. **One screen padding token.** `--screen-pad-mobile` (20px) → `--screen-pad-tablet` (32px) →
   `--screen-pad-desktop` (48px). Never hand-pick a page inset.
3. **Vertical rhythm is 16px** between sections inside a screen, 12px inside a card group.
4. **One primary action per screen.** It is the only Action-gradient element in view; everything
   else is `dark`, `outline` or a chip.
5. **Section headers** use the athletic italic display face at `--text-xl`, with an optional
   right-aligned accent link.
6. **The prize is the biggest number on the screen.** If a stat competes with it, demote the stat.

## Platform differences (the ONLY ones)
| Concern | iOS | Android | Web |
|---|---|---|---|
| Touch minimum | 44px | 48px | 40px (pointer) — still ship 48px |
| Safe areas | `--safe-top` / `--safe-bottom` | `--safe-bottom` (gesture bar) | n/a |
| Primary nav | `TabBar` | `TabBar` (bottom nav) | sidebar ≥1024px |
| Dialogs | `Sheet` | `Sheet` | `Modal` ≥768px |
| Back affordance | `NavBar onBack` | system back + `onBack` | breadcrumb / `onBack` |
| Selects | native picker | native picker | native `<select>` |

Everything else — color, type, spacing, states, motion — is identical across platforms.

## Responsive collapse
At `<768px`: sidebar → `TabBar`; multi-column grids → single column; `DataTable` →
`LeaderboardRow`/`ListRow` stack (never side-scroll a table); `Modal` → `Sheet`.
At `≥1024px`: persistent sidebar, 2–3 column content, `Modal` presentation.
