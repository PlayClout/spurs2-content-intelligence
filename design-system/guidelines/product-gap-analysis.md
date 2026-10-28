# Product Design System — Gap Analysis

What the Clout brand package **did** define, what this system **added**, and what **still must be
decided by your team** before the design system is complete. Items in §3 are real blockers: an AI
agent will otherwise invent an answer, and different agents will invent different answers.

Source audited: `02 – Visual Identity`, `05 – Brand Guideline` (9 modules),
`06 – Marketing Asset Library` (9 libraries), v01 · 2026-07-13.

---

## 1. What the brand package already defined (preserved unchanged)
- Logo system, masters, clear space, minimum sizes, background treatments.
- Core + extended color palette with HEX/RGB and multi-platform token exports.
- Action / Atmosphere gradients and the split-light lighting method.
- Typography *characteristics* (heavy condensed italic uppercase display + supporting sans) and
  the marketing message hierarchy.
- Lighting, texture, overlay, background and graphic-element libraries.
- Marketing canvas masters, grids and safe areas (1200², 1080×1920, 1920×1080, 682×240).
- A 27-glyph line-icon set (24px grid, 2px stroke) and 5 badge shapes.
- Marketing components: prize cards, pass tags, stat chips, badges, dividers, countdown.
- QA/approval workflow, file naming, versioning and governance.

## 2. What this system added to make it implementation-ready
Everything below was **absent** from the brand package and had to be defined. Each is a decision
your team should ratify.

| Added | Why it was needed | Where |
|---|---|---|
| Semantic color layer (`--bg-*`, `--fg-*`, `--border-*`, `--interactive-*`) | Brand gave paint, not roles | `tokens/semantic.css` |
| **Feedback palette — success `#00D982`, warning `#FFB020`, danger `#FF2942`** | Brand had **no** success/warning/error color. Pink is reserved for value, so error needed a true red | `tokens/semantic.css` |
| Interaction state tokens (hover/active/disabled/selected/focus) | No state model existed | `tokens/semantic.css` |
| Control heights, touch targets, icon sizes, product radii | Nothing product-scale was specified | `tokens/product.css` |
| Breakpoints, grid, z-index scale, content max-widths, safe areas | No responsive or layering system | `tokens/product.css` |
| Product type scale (11–36px) | Brand scale is marketing-size only (24px+) | `tokens/product.css` |
| Motion durations, easings, reduced-motion | No animation guidance existed | `tokens/motion.css` |
| Data-visualization ramp | No chart colors defined | `tokens/semantic.css` |
| 30 UI components with a full state contract | Brand shipped static marketing SVGs only | `components/` |
| 8 Clout domain patterns (Pass, Pick'em, Challenge, Reward, Marketplace, Profile, Leaderboard, Onboarding) | No product surfaces were designed | `components/clout/` |
| `EligibilityGate` + enforced product vocabulary | Free-to-play model had no UI expression; wagering language had to be purged | `components/clout/`, `guidelines/engineering-standards.md` §1 |
| Accessibility standards + measured contrast | Brand flagged this as "pending specialist" | `guidelines/engineering-standards.md` |
| Naming conventions + platform translation guidance | Not previously specified | `guidelines/engineering-standards.md` |
| Product screen composition rules | Marketing layout only | `ui_kits/clout-web/README.md` |

## 3. Still missing — YOUR TEAM MUST DECIDE

### Blockers (an agent cannot proceed correctly without these)
1. **Licensed display typeface.** The brand deliberately defers the premium display face. This
   system substitutes **Oswald** (the fallback already used in Clout's own CTA preview tooling).
   Until a licensed condensed-italic face is chosen, every product build will look subtly
   different from finished marketing art. → Decide the face, drop it in `tokens/fonts.css`.
2. **Feedback color ratification.** Success/warning/danger above are my proposals, not brand
   decisions. They are load-bearing across every form, toast and settle state. → Approve or replace.
3. **Light theme: needed or not?** This system is dark-only, matching the brand. If any surface
   needs light (receipts, tax documents, partner-facing exports, email), the entire semantic layer
   needs a second scope. → Confirm dark-only, or commission the light scope.
4. **Real product IA.** Screens here are informed reconstructions from the brand's own vocabulary
   (passes, pick'ems, challenges, rewards, marketplace, profile). No actual product spec, user
   flow, or Figma file was provided. → Share real specs and I will replace the reconstructions.
5. **Extended responsible-play & eligibility UI.** ✅ *Partially resolved — ratified 2026-07-28:*
   Clout is **free to play with no stake**, so sportsbook-style compliance (deposit limits,
   self-exclusion, bankroll controls) does **not** apply. What is required and now built:
   `EligibilityGate` — age (18+), geo/jurisdiction and KYC checks **at the point of redemption,
   never at signup or before play**. Still to specify with legal: the exact jurisdiction list,
   KYC provider and copy, restricted-region messaging, and official sweepstakes rules pages.
6. **Empty/error/offline copy.** Tone is defined for marketing, not for failure states. "Something
   went wrong" is off-brand for a confident voice. → Write the failure-state copy deck.

### Important (needed before scale)
7. **Iconography coverage.** 27 icons cover marketing. Product needs ~60–80: settings, filter,
   sort, search, calendar, wallet, card, bank, shield, help, camera, upload, copy, edit, trash,
   sport-specific glyphs (football, basketball, soccer, baseball, hockey, tennis, MMA), and
   platform back/forward variants. → Commission the extension in the same 24px/2px style.
8. **Real product imagery.** No photography or product-art direction module exists (the brand's
   own gap analysis flags this too). Prize/marketplace tiles currently fall back to icons.
9. **Sport-vertical treatment.** Prompt packs contain per-sport color tendencies marked "internal
   exploration only." Product will need a ratified rule for sport theming — or an explicit
   "no sport theming" decision.
10. **Charts & data-viz components.** A ramp is defined; no chart components are built. Needed for
    performance history, win-rate trends, prize-pool breakdowns.
11. **Notification & email templates.** Push, in-app inbox, and transactional email are undefined.
12. **Localization rules.** No guidance on RTL, string expansion (German ~35% longer), or currency
    and date formatting. Condensed italic uppercase is unforgiving of long strings.
13. **Motion prototypes for celebration moments.** "You won" is the emotional peak of the product;
    it deserves a specified animation, not a fade.

### Nice to have
14. Skeleton→content transition spec; haptics map (iOS/Android); sound design for wins;
    dark-mode-aware app icons; widget/live-activity specs; watch surfaces.

---

## 4. Recommended source-file organization
Keep the brand package as the upstream source of truth and this system as its product expression:

```
Clout_Brand/                     ← existing Drive structure, unchanged
  02_VISUAL IDENTITY/            ← masters; never edited by engineering
  05_BRAND GUIDELINES/           ← the 9 doc modules
  06_MARKETING_ASSET_LIBRARY/    ← campaign production
Clout_Design_System/             ← THIS project — the product layer
  styles.css                     ← single entry point consumers link
  tokens/                        ← brand layer + product layer
  components/                    ← core · forms · feedback · navigation · layout · badges · marketing · clout
  ui_kits/                       ← reference screen compositions
  guidelines/                    ← specimen cards + engineering standards + this file
  assets/                        ← logos, icons, gradients copied from the brand package
```

**Sync rule:** when the brand package increments (logo, color, type), update `tokens/colors.css`,
`tokens/typography.css` and `assets/` only — never patch a component directly. Components read
tokens, so a brand change propagates in one commit.

---

## 5. QA checklist for any new branded product surface
Extends the brand package's QA passes with product-specific gates.

**Brand**
- [ ] Dark foundation dominates; blue signature present; warm accents reserved for value/CTA
- [ ] Center read zone clean; texture/atmosphere at edges only
- [ ] Display type is condensed italic uppercase; prize is the largest number
- [ ] Correct logo variant, clear space, min size; in-app banners carry no logo
- [ ] Copy is short, punchy, prize-first; no emoji; `[Event] Pass` naming
- [ ] One Action-gradient element in view; one localized glow

**Product**
- [ ] Zero hard-coded colors, radii, durations, z-indexes — tokens only
- [ ] **No wagering vocabulary anywhere** — no bet, wager, stake, odds, multiplier, payout, entry fee, prize pool
- [ ] Predictions graded **correct / incorrect**; values expressed as **XP**, never odds
- [ ] Eligibility gate appears at **redemption only** — never at signup or before play
- [ ] "Free to play · no purchase necessary · 18+ to redeem" present wherever prizes appear
- [ ] Every interactive element implements default/hover/active/focus/disabled/loading
- [ ] Validation shows icon + text, never color alone; pink is not used for errors
- [ ] Touch targets ≥48px with ≥8px separation
- [ ] Focus rings visible everywhere; tab order logical; dialogs trap focus and restore it
- [ ] Contrast verified: body text ≥4.5:1, large text ≥3:1, UI boundaries ≥3:1
- [ ] Loading uses Skeleton for content regions, Spinner only for <2s waits
- [ ] Empty, error and offline states designed — not just the happy path
- [ ] Renders correctly at 320 / 390 / 768 / 1280px and at 200% zoom
- [ ] `prefers-reduced-motion` honoured
- [ ] Mobile uses Sheet presentation; tables become row stacks
- [ ] Responsible-play messaging present where required

_v02 · product layer · Internal / Confidential._
