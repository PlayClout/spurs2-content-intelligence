# Clout — Design System

The reusable, code-first expression of the **Clout** brand: tokens, components, foundation
specimens, slide layouts and product UI kits that let any designer, engineer or AI agent produce
on-brand Clout material — and build Clout's frontend — without reinterpreting the brand each time.

The system has two layers. The **brand layer** (`tokens/colors.css`, `typography.css`,
`spacing.css`, `effects.css`, `assets/`) is a faithful translation of the approved brand package.
The **product layer** (`tokens/semantic.css`, `product.css`, `motion.css`, everything in
`components/` beyond marketing, and `guidelines/engineering-standards.md`) turns that brand into
implementation-ready rules for iOS, Android and web. Brand changes propagate through tokens —
never patch a component to chase a brand update.

> **Clout gamifies fan engagement** — turning watching, predicting and competing into rewarded
> participation across sports, esports, gaming and creator culture. The brand feels **dark,
> cinematic, premium, competitive, electric and high-energy** — closer to AAA gaming and premium
> sports advertising than to a generic sportsbook or esports skin.

> **⚠️ Clout is FREE TO PLAY — not a sportsbook, not daily fantasy, not gambling.**
> Fans never stake anything. They take **actions** (predictions, challenges, daily engagement),
> earn **XP** (progression) and **Coins** (redemption currency), and redeem real prizes.
> Coins are earned only — never purchased, never cashed out. The one paid element is an optional
> **pass upgrade**: a content purchase unlocking more actions and marketplace access, never an
> entry fee or a chance to win. Eligibility (18+, geo, KYC) is checked **at redemption only**,
> never at signup. Wagering vocabulary — bet, wager, stake, odds, payout, prize pool — is
> **prohibited system-wide**. See `guidelines/engineering-standards.md` §1.

- **Mission** — Reward participation and make fandom competitive, responsibly, for fans, creators, teams and brand partners.
- **Vision** — The default layer of gamified fan engagement across every sport and screen.
- **Positioning** — The premium, cinematic fan-engagement platform where competing to win is the point.
- **Working line (not the official tagline — pending leadership):** _Compete · Win · Be Clout._
- **Personality** — Competitive · cinematic · premium · electric · confident. Never cheap, cluttered or gimmicky.

## Source of truth
Built from the client's Google Drive brand handoff (v01, 2026-07-13, Internal / Confidential):
- **02 – Visual Identity** — logo masters (SVG), color system + gradients + multi-platform design tokens, typography guidance, graphic elements, lighting overlays, iconography, export presets, gold-standard library.
- **05 – Brand Guideline** — 9-module operating manual: Master Brand Guide, Marketing Creative Guide, Logo Usage, Color System, Typography, Lighting & Atmosphere, AI Production Guide, Gold Standard Library, QA & Approval.
- **06 – Marketing Asset Library** — CTA system, gradient/lighting/overlay/texture/background libraries, layout system, component library, icon library (27 icons), badge library.

Real assets copied into `assets/` (logo SVG masters, 27 icon SVGs, gradient SVGs, sample component SVGs). Original documents remain the authoritative source; this system references, never overwrites, them.

---

## CONTENT FUNDAMENTALS — how Clout writes
- **Voice:** short, punchy, confident — never hype-y. **Lead with the prize / value**, then minimal supporting copy.
- **Casing:** display copy is **UPPERCASE**, athletic and italic ("WIN A", "JOIN NOW"). Body/UI copy is sentence case (Inter).
- **Person:** speaks to the fan directly ("Join the Open Pass", "Win a $500 gift card") — imperative, second-person, action-first. Confident "we/Clout" for brand statements.
- **Message hierarchy (always this order):** kicker ("WIN A") → **prize value** (the hero) → offer → pass name → CTA → fine print.
- **Campaign / pass naming:** `[Event/Partner] Pass` — e.g. **Clout Pass** (the free default), **Open Pass**, **World Cup Pass**.
- **Product vocabulary is enforced.** Use *predict, pick, action, challenge, earn, XP, Coins, redeem, reward, correct/incorrect, streak*. Never *bet, wager, stake, odds, payout, prize pool, entry fee*. "Action" is the primitive; a pick'em is one action type, not the whole product.
- **Numbers & stats:** prize values and proof stats ($50K, 12,480 players) are used deliberately as *value proof* — not decoration. The largest number on any layout is the prize.
- **Emoji:** not used. Energy comes from type, color, lighting and the icon set — never emoji.
- **Example copy:** _"WIN A $500 PGA SUPERSTORE GIFT CARD · JOIN THE OPEN PASS · JOIN NOW"_. _"Reward participation. Make fandom competitive."_
- **Responsible-play & legal:** always present in fine print (Inter, muted). "Free to play. No purchase necessary. 18+ to redeem. Eligibility varies by jurisdiction."

## VISUAL FOUNDATIONS
- **Color vibe:** dark foundation dominates (~65% Clout Black / Carbon / Deep Navy). **Electric Blue #126BFF is the atmospheric signature** (~11%). Warm accents — Clout Pink #FF006B, Signal Orange #FF6A1A — are *held* for value, energy and conversion (~6%). Blue is a signature, not mandatory in every campaign; recognition comes from the whole system. Avoid all-red / no-atmosphere.
- **Type:** heavy **condensed italic uppercase** display (athletic) for hero/prize/offer/CTA; **Inter** for UI, body, rules, decks. Tight confident tracking on condensed caps; generous space around the prize value.
- **Backgrounds:** dark atmospheric washes + vignette; **split-light** method (cool blue one side, warm pink/coral the other, over a dark center — never symmetrical, one leads). Texture and speed-lines at the **edges only** — protect the clean **center read zone**. Imagery is real, premium, dimensional (cut-out products, rim-lit, floated, angled) — never illustration, never flat stock.
- **Depth:** three planes — atmosphere / lit product / type + CTA. Products are edge-lit and separated from the dark field.
- **Lighting:** cinematic. Rim-lit heroes, controlled bloom (**one glow only**, localized — never stacked, never full-frame), light haze for depth.
- **Gradients:** **Action** (#FF006B→#FF3157→#FF6A1A) for CTAs / prize values / emphasis; **Atmosphere** (#126BFF→#7047EB→#FF006B) for environments / esports-gaming; **Split-Light** as a lighting method, not a fill.
- **Corner radii:** chip 14 · tag 16 · card 22 · pill (full) for CTAs & pass tags.
- **Cards:** Carbon (#10131C) surface, low-opacity **blue/white hairline** border, generous internal padding, soft outer shadow. No colored-left-border cards.
- **Borders:** hairlines — `rgba(245,245,243,0.12)` (white) or `rgba(18,107,255,0.4)` (blue). 1.5–2px.
- **Shadows:** dark-UI elevation (panel / card / float) + colored **glow** for the single signature bloom.
- **Motion:** confident and quick — standard/out easing (`cubic-bezier(0.2,0.7,0.2,1)`), 120–360ms. Diagonal speed lines / streaks add energy at edges. No bounce, never over the center read zone.
- **Hover:** brighten (`brightness(1.06–1.2)`) + intensify the single glow. **Press:** slight scale-down (0.975). **Disabled:** 40% opacity, no glow.
- **Transparency / blur:** used sparingly for elevated panels and overlays; keep the center read zone legible.

## ICONOGRAPHY
- **System:** a bespoke **27-glyph line-icon set** on a strict **24px grid, 2px stroke, round caps/joins**, Clout White by default. Copied into `assets/icons/` and mirrored geometry-for-geometry in the `Icon` component (rendered with `currentColor` for easy recolor).
- **Groups:** navigation (arrow-left/right, chevron-right/down, external, close, menu) · media (play, pause, live, stream) · gaming/sports (controller, trophy, target, medal, fire) · rewards (gift, coin, star, xp, bolt) · UI/social (share, heart, bell, user, check, clock).
- **CTA arrow motif:** a leading/ trailing **circular arrow badge** — the signature actionable glyph (`assets/icons/cta-arrow.svg`, and built into `Button`).
- **Recolor:** via `stroke` / `color` — white default; Electric Blue #126BFF or the Action gradient for emphasis. Keep 2px stroke at 24px; min display 16px.
- **No emoji. No unicode-as-icon.** SVG only. Use the real assets; never hand-draw a substitute glyph.

---

## Components
Reusable primitives, grouped by concern. Namespace: `window.CloutDesignSystem_49ec9a`.
Every interactive component implements the state contract in `guidelines/engineering-standards.md`.

**core/** — `Button` · `Icon` (+ `ICON_NAMES`)

**forms/** — `FormField` · `Input` · `TextArea` · `Select` · `Checkbox` · `Radio` · `RadioGroup` · `Switch`

**feedback/** — `InlineAlert` · `Toast` · `Progress` · `Spinner` · `Skeleton` · `SkeletonText` · `EmptyState` · `StatusIcon` (+ `STATUS`)

**navigation/** — `NavBar` · `NavIconButton` · `TabBar` · `Tabs` · `SegmentedControl` · `Menu`

**layout/** — `Surface` · `ListRow` · `Modal` · `Chip` · `Avatar` · `AvatarGroup` · `StatBlock` · `DataTable` · `Tooltip`

**clout/** (domain patterns) — `PassCard` · `PickemCard` · `ChallengeCard` · `RewardCard` · `MarketplaceItem` · `ProfileHeader` · `LeaderboardRow` · `OnboardingStep` · `EligibilityGate`

**marketing/** — `PrizeCard` · `PriceTag` · `PassTag` · `StatChip` · `StatusBadge` · `Countdown` · `Divider`

**badges/** — `Badge` (circle, square, shield, ribbon, hexagon; action / atmosphere rim)

### Intentional additions
The brand package is marketing-only — it defines no product UI, no interaction states and no
semantic feedback system. Everything in **forms**, **feedback**, **navigation**, **layout** and
**clout** was added to make the brand buildable, along with the semantic/product/motion token
layers. Each addition and the decisions still owed by your team are itemised in
`guidelines/product-gap-analysis.md`. Notable:
- **Icon** wrapper — the source ships 27 SVG icons but no component; geometry copied verbatim.
- **Feedback palette** (success `#00D982`, warning `#FFB020`, danger `#FF2942`) — the brand defines
  none, and pink is reserved for value, so error needed a true red. **Pending your ratification.**

## Slide layouts
`slides/` — a 16:9 presentation kit (title, section divider, prize/offer, stat/KPI, comparison, big quote, roadmap/timeline, partnership/CTA close) built on the foundations. See `slides/index.html`.

## UI kits
- `ui_kits/clout-app/` — the mobile product (390×844): Home, Pick'em, Rewards/Shop, Profile, Onboarding, loading and empty states. Interactive.
- `ui_kits/clout-web/` — the responsive web dashboard at 1280px, plus the platform + responsive rules (`README.md`).
- `ui_kits/applications/` — marketing output formats (social square, story, in-app banner, email).

---

## File index (manifest)
```
styles.css                  → global entry (@import manifest only)
tokens/
  fonts.css                 → Oswald (display) + Inter (body) webfonts
  colors.css                → BRAND: core + neon palette, gradients
  typography.css            → BRAND: font families, weights, marketing type scale
  spacing.css               → BRAND: 4px scale, radii, canvas masters
  effects.css               → BRAND: borders, shadows, glow, washes
  semantic.css              → PRODUCT: surface/text/border roles, interactive states,
                              success·warning·danger·info, focus, chart ramp
  product.css               → PRODUCT: control heights, touch targets, icon sizes, product
                              radii, breakpoints, grid, z-index, layout, product type scale
  motion.css                → PRODUCT: durations, easings, transitions, reduced-motion
assets/
  logo/                     → wordmark + C symbol, black & white SVG masters
  icons/                    → 27 line icons + cta-arrow (SVG)
  gradients/                → action + atmosphere gradient SVGs
  components/               → sample component SVGs (prize card, price tag, pass, stat, badge)
components/
  core/ forms/ feedback/ navigation/ layout/ clout/ marketing/ badges/
                            → React primitives (.jsx + .d.ts + .prompt.md + card html)
guidelines/
  *.card.html               → foundation specimen cards (Colors, Type, Spacing, Brand)
  engineering-standards.md  → naming, state contract, a11y, motion, layout, platform mapping
  product-gap-analysis.md   → what was added, what YOUR TEAM must still decide, QA checklist
slides/                     → presentation layout kit
ui_kits/
  clout-app/                → mobile product screens (interactive)
  clout-web/                → responsive web dashboard + platform rules
  applications/             → marketing output formats
thumbnail.html              → homepage tile
SKILL.md                    → Agent-Skills entry point
```

## For engineers & AI coding agents
Start with **`guidelines/engineering-standards.md`** — naming conventions, the component state
contract, accessibility standards with measured contrast, interaction/animation specs, layout
rules, and how to translate the tokens to Tailwind / React Native / Flutter / native iOS+Android.
Then read **`guidelines/product-gap-analysis.md`** for the decisions still owed before the system
is complete. Link `styles.css`; never hard-code a color, radius, duration or z-index.

## Governance & notes
- **Font substitution (needs your input):** Clout's premium display face is deliberately *deferred* — campaign type is governed by documented characteristics (heavy, condensed, italic, uppercase), not a licensed font. This system uses **Oswald** (Google Fonts) as the display substitute — the exact fallback used in Clout's own CTA preview tooling — and **Inter** for body. **If/when a licensed condensed-italic face is approved, drop it into `tokens/fonts.css` and update `--font-display`.**
- **Dark-only:** the product layer defines no light theme, matching the brand's dark foundation. If a light surface is ever needed, the whole semantic layer needs a second scope — see the gap analysis.
- **CMYK / Pantone** remain deferred to a specialist proofing step (per the Color System doc).
- Do not overwrite approved source files; increment versions and archive superseded work. Generate logo exports from the SVG masters — never retrace or re-typeset the wordmark in a live font.

_Clout Design System · v02 (product layer) · Internal / Confidential._
