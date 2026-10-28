# `design-system/` — provenance and precedence

_Verified 2026-08-31. This file records WHERE this system came from and, just as
importantly, where it did NOT come from. Written because the import commit named
its source by path rather than by id, which made the origin unverifiable._

## What this is

The **Clout Design System** — the *product* design system for Clout 3.0.
190 files: 8 token files, ~60 React components (incl. the `clout/` domain set),
`guidelines/engineering-standards.md`, `SKILL.md` (a Claude-invocable
`clout-design` skill), assets, and UI kits.

`33-DESIGN-UX-REQUIREMENTS.md` has referenced this system since it was written.
It existed **only in Drive** until 2026-08-31, meaning a build agent working in
this repo could not read the system it was told to build against. That is why it
was imported.

## Verified integrity

| Check | Result |
|---|---|
| Files in repo | **190** (excluding this file) |
| Aggregate content MD5 | `fd497041c31dd0fa565c6e5329231a4e` |
| `diff -rq` vs the Drive zip snapshot | **exit 0 — byte-for-byte identical** |

Reproduce the aggregate hash:

```
cd design-system && find . -type f ! -name PROVENANCE.md -exec md5 -q {} \; | sort | md5 -q
```

> ⚠️ **`! -name PROVENANCE.md` is load-bearing — do not drop it.** This integrity
> record lives *inside* the tree it measures, so without the exclusion it hashes
> itself and the aggregate changes on every edit to this file. The command as
> first written omitted it and returned `34d6652ac37301ec5a0cbbf9d6ccf95a` over
> 191 files — a mismatch that reads exactly like tampering in the design system,
> when the only thing that changed was the addition of this document. Caught
> 2026-08-31 by running the command instead of trusting it. **The 190-file hash
> above is correct and was independently reproduced; it was the instructions that
> were wrong.** A verification step nobody executes is decoration — and one that
> fails for a benign reason is worse, because it trains the next reader to ignore
> a real failure.

## Where it came from

**Drive is the authoring surface. This directory is a committed snapshot.**

Two Drive locations were resolved and BOTH correspond to this exact content:

1. **`Design System Prototype`** — `189-S-wlH6S1l3qnTLBaSp33aDfOZTjVJ`
   in `clout3.0` (`1W0V3FbAoOki35sJm808Ud8Hgn4D-yMyd`),
   shared drive `Clout Data Room` (`0AHUpvji9-_mMUk9PVA`).

   ⚠️ **This folder listed ZERO children on 2026-08-31** — its contents appear to
   have been moved or reorganized after the pull. The repo snapshot is
   unaffected. **Do not re-pull from this id without first confirming it is
   populated**; a re-pull against an empty folder would look like a successful
   sync that quietly deletes the system.

2. **`Clout Design System.zip`** — `1NryTJveSgpB5zwvIoP6f7oK0f1_gAN6u`
   (md5 `0f9c4613986469db8aa7310a37f6595d`, created 2026-08-31T12:52Z)
   in `Clout In-Platform Design System` (`1FnGVwQt2Ns-OPcZRSXbwQp_eFWLTUm7A`).

   Downloaded and diffed: **identical to this directory.** It is the same
   system, not a variant — there is no second source of truth.

## 🔴 Where it did NOT come from

**`clout-venue` (the repo).** Stu, 2026-08-31: *"Clout Venue is just a reference
in general, but we are not taking design system source anymore."*

Verified, not assumed: all 190 files were grepped for `venue`, `--v-*` (Venue's
per-venue CSS variable convention), `theme.ts`, and `check-tokens` — the exact
artifacts D50 proposed transferring. **Zero hits.** The `clout-venue` working
tree was also confirmed untouched (0 modified, 0 untracked, 0 stashes; last
activity 2026-08-24).

> **D50 and D51 are stale.** They still read `[PROPOSAL] ⚑Stu` in
> `50-DECISION-DASHBOARD.md §3` and propose Clout Venue as the canonical
> design-system source. **That path was not taken.** Reality moved past the
> proposal while the dashboard kept showing it — exactly the drift `61`'s Pass 2
> exists to catch.

**`NEW BRAND TOOLKIT 2026`** (`1hf40i7jI6Uo91M3AmZHuRBhthiF5l8RP`, in
`2026 Marketing`). That is the **marketing brand kit** — logos, ad templates,
asset libraries — mirrored separately in the workspace at
`docs/clout/brand/CLOUT_MARKETING_OS/` (1,017 files).

🔑 **These are different layers and must not be conflated.** Per `33`, the brand
kit is a marketing-facing *input*; this design system is the product-facing
component/token library. `33`'s own stated job is *"the conversion plan from the
brand kit into a production product design system."* Pointing a build at the
brand kit instead of this directory would surface weeks later as missing
components.

## How to consume it

- **One import:** `styles.css` — it `@import`s every token file.
- **Read before writing product code:** `guidelines/engineering-standards.md`
  (naming, component state contract, a11y, token translation).
- **Known gaps + QA checklist:** `guidelines/product-gap-analysis.md`.
- **`SKILL.md`** makes this a Claude-invocable `clout-design` skill.

## ⚠️ Open gap (not closed by this file)

CI's wagering-vocabulary sweep (`.github/workflows/ci.yml`) does **not** scan
`design-system/`, so these 190 files with fan-facing copy are unscanned.

**The naive fix is wrong.** Running the current sweep here returns **10 hits,
all false positives** — every one a compliance comment stating the negation
(*"There is no stake, entry fee or wager"*). Extending the path list without a
negation-aware matcher would fail CI on day one and pressure someone into
deleting the comments that document the regulatory moat.

Owed: a negation-aware matcher (scan string literals / JSX text, not comments),
then extend the path list. See `33 §0` and
`_audits/2026-08-31-charleston-reconciliation-and-tenancy-ruling.md`.
