---
name: clout-design
description: Use this skill to generate well-branded interfaces and assets for Clout, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## What's here
- `readme.md` — the brand + design guide (voice, visual foundations, iconography, component index, governance).
- `guidelines/engineering-standards.md` — **read this before writing product code**: naming conventions, component state contract, accessibility standards, interaction/animation specs, layout rules, and token translation for Tailwind / React Native / Flutter / native.
- `guidelines/product-gap-analysis.md` — what the brand defined, what this system added, and what your team must still decide. Includes the QA checklist.
- `styles.css` — global entry point; `@import`s all tokens. Link this one file.
- `tokens/` — brand layer (colors, typography, spacing, effects, fonts) + product layer (semantic, product, motion).
- `assets/` — logo masters (wordmark + C symbol), 27 line icons, gradient SVGs, sample component SVGs.
- `components/` — React primitives: `core/` (Button, Icon), `forms/`, `feedback/`, `navigation/`, `layout/`, `clout/` (domain patterns), `marketing/`, `badges/`. Each has `.jsx` + `.d.ts` + `.prompt.md`.
- `guidelines/*.card.html` — foundation specimen cards.
- `slides/` — 16:9 presentation layout kit.
- `ui_kits/clout-app/` — mobile product screens · `ui_kits/clout-web/` — responsive web · `ui_kits/applications/` — marketing formats.

## The essentials (memorize before designing)
- **Clout is FREE TO PLAY** — not a sportsbook, not fantasy, not gambling. No stakes, ever.
  Fans take **actions** → earn **XP** + **Coins** → redeem real prizes. Coins are earned only,
  never purchased, never cashed out. Optional **pass upgrades** are content purchases.
- **Banned vocabulary:** bet, wager, stake, odds, multiplier, payout, bankroll, parlay,
  entry fee, buy-in, prize pool. **Use:** predict, pick, action, challenge, earn, XP, Coins,
  redeem, reward, correct/incorrect, streak.
- **Eligibility (18+, geo, KYC) gates REDEMPTION, never signup or play.** Use `EligibilityGate`.
- **Feel:** dark, cinematic, premium, competitive, electric. Prize-first hierarchy. One glow.
- **Color:** Clout Black `#050811` foundation (~65%), Electric Blue `#126BFF` signature atmosphere (~11%), warm accents (Pink `#FF006B`, Orange `#FF6A1A`) held for value/CTA (~6%).
- **Gradients:** Action `#FF006B→#FF3157→#FF6A1A` (CTA/value); Atmosphere `#126BFF→#7047EB→#FF006B` (environments).
- **Type:** heavy condensed **italic uppercase** display (Oswald substitute for the deferred premium face) + Inter for body/UI.
- **Copy:** short, punchy, uppercase display; lead with the prize; no emoji; `[Event] Pass` naming.
- **Layout:** protect the clean center read zone; texture at edges only; in-app banners (682×240) carry no logo.

## Product rules (building UI, not marketing)
- **Dark-only.** No light theme. `--bg-canvas` `#050811` is the app background.
- **Pink is value, never error.** Errors use `--danger-default` `#FF2942`; success `#00D982`; warning `#FFB020`.
- **Tokens only** — no hard-coded colors, radii, durations or z-indexes.
- **48px touch targets**, 8px apart. Focus rings always visible. Status = icon + text + color.
- **Mobile-first**: author 390px, then scale up. Sheet on mobile, Modal at ≥768px. Tables become row stacks below 768px.
- **One Action-gradient element in view** — the single primary CTA.
