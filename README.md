# Clout Content Intelligence — Spurs² Hackathon

**Challenge 1: Assisted Auto-Production Engine** · Clout Labs · Austin, Oct 22–23 2026
Partners: Tottenham Hotspur · San Antonio Spurs · ScorePlay · TwelveLabs

AI-assisted sports content engine: TwelveLabs video intelligence + ScorePlay media + game/fan signals → audience-specific, production-ready assets → producer approval UI. **The producer approves instead of searches.**

## Current product plan

- [Editor + personalized fan web app design](design.md): rights-screened production, explainable rankings, sourced hooks, compilations, and editor-published clips delivered through favorite-player feeds and natural-language search.
- [Visual HTML brief](design-brief.html): open locally for an offline walkthrough and implementation handoffs. Its interactive cards are illustrative simulations.
- [Fan web app and Marengo search](docs/fan-app-and-search.md): preference ranking, publication lifecycle, published-only retrieval, and permitted playback.
- [OpenCut integration instructions](docs/opencut-integration.md): pinned source evaluation, adapter boundaries, timeline clocks, and final-export gates.
- [Verified TwelveLabs evidence](docs/research/twelvelabs-live-evidence-2026-10-22.md) and [organizer builder brief](docs/research/builder-brief-2026-10-22.md).

These documents describe the implementation target; they do not claim the planned integrations are complete. The former stadium-first proposal is preserved under `docs/archive/`.

## Layout
- `api/` — orchestration/intelligence layer (recommendations, explainability)
- `pipeline/` — video: TwelveLabs indexing/search → clip extraction → ffmpeg assembly
- `web/` — producer approval UI (uses `design-system/`)
- `design-system/` — PlayClout design system (committed; import `styles.css` + components)
- `data/fallback-assets/` — demo footage + mock game/fan data (demo must run with zero live APIs)
- `docs/` — gameplan, spike report, architecture

## Working agreement
- **Hermes owns `main`** (primary developer, on-site M5)
- **Nova works on `nova/*` branches, PRs only** (QA, recon, overnight watchdog)
- Feature freeze Friday 10 AM. Demo truth rule: label simulated vs. real integrations.

## Env (never commit)
`TWELVELABS_API_KEY` · `SCOREPLAY_API_KEY` (event-issued) · `ANTHROPIC_API_KEY` · `SUPABASE_URL`/`SUPABASE_ANON_KEY` (standby) · Vercel project (standby)
