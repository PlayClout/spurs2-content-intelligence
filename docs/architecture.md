# Spursx2 AI — Architecture (v2, product posture, 2026-10-20)

**Guiding principle:** *The AI finds the moment, understands the opportunity, recommends the strategy, and produces the content. The producer makes the decision.*

## Posture: product-grade architecture, demo-grade deployment

We are building the sellable product; the hackathon runs its `demo-local` profile. Two profiles, one codebase:
- **`demo-local`** — worker + render on the M5, localhost UI, MOCK_MODE fixtures available, no auth. Venue-proof.
- **`cloud`** — Vercel app + Supabase + containerized worker pool (post-event sprint). Supabase auth when needed.

Product seams built NOW (cheap), implemented fully LATER:
1. **`org_id` on every table** — multi-tenant from day one. Spurs = org 1, Tottenham = org 2; the dual-club demo is the same engine serving two organizations natively — the sport-agnostic story made literal.
2. **`RenderBackend` interface** — `local-ffmpeg` (implemented now; M5 hardware encoders, sub-second rough cuts) and `cloud-worker` (containerized ffmpeg; post-event). Local rendering is the demo profile of the product answer, not the product answer.
3. **Compliance as a real module** — full restriction semantics (territory, platform, competition, sponsor, expiry) + an `evaluate()` returning explainable decisions; mock-populated for the demo. This is the Challenge B engine living inside the Challenge A product: judging differentiator + second commercial surface.
4. **Measurement schema'd, not deferred** — `published_assets` + `performance_snapshots` tables exist (empty) from day one; the learning loop's storage is real.
5. **Integration layer** — the typed clients (TwelveLabs/ScorePlay/Jev chain + MOCK_MODE) ARE the commercial integration layer: every external dependency behind an interface with graceful degradation.

Explicitly unchanged: Friday 10 AM freeze, scope-cut order, MOCK_MODE demo path, no microservices/K8s/auth screens this week. Scalable ≠ distributed: Next.js + Postgres + worker pool carries this category far past first revenue; scaling = add worker containers, which the job queue already supports.

## Workflow

**INGEST → UNDERSTAND → SIGNAL FUSION → OPPORTUNITY SCORING → DRAFT PRODUCTION → PRODUCER REVIEW → FINAL RENDER → EXPORT → (defer: MEASURE)**

Key decisions (vs. naive flow):
1. **Producers approve artifacts, not plans.** Cheap watchable drafts (ffmpeg stream-copy rough cut + Pegasus caption) are generated BEFORE approval; expensive finish (frame-accurate re-encode, brand, per-channel variants) happens AFTER. Hybrid gate: cost-bounded by the opportunity scorer.
2. **Footage-first.** Marengo sweeps the indexed archive autonomously; external signals (game data, social) BOOST confidence — they are enrichment, not the trigger. Live-event triggering is an input class, not the architecture.
3. **Export, not publish.** Distribution = platform-ready bundles (+ optional ScorePlay write-back as timecoded actions). No direct social OAuth integrations at the hackathon.

## Stack (optimized for 20-hour build)

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js App Router + Server Actions, TypeScript** | One repo, one deploy, typed end-to-end, no separate API service |
| UI | **shadcn + Tailwind**, PlayClout design-system tokens mapped into Tailwind config day zero | On-brand components for free; three-pane inbox layout from shadcn blocks |
| DB | **Supabase Postgres + Drizzle ORM** | Schema in TS, `drizzle-kit push`, no codegen; Supabase Realtime drives live queue updates |
| Types | **Zod schemas = single source of truth** (`shared/schemas.ts`) | Same shapes for DB rows, Pegasus `json_schema` calls, mock feeds, React props |
| Worker | **Plain Node process on the M5** polling a `jobs` table | ffmpeg can't run on Vercel; debuggable at 3 AM; no Redis/BullMQ complexity |
| Video | ffmpeg via `execa`; plain `<video>` on local MP4s + poster thumbnails | No HLS/streaming infra for 10–30s clips |
| AI | TwelveLabs (Marengo `/search` + Pegasus `/analyze` w/ json_schema) + Anthropic for copy | Verified capabilities — see docs/api-spike-report.md |
| Hosting | **Demo runs localhost on the M5.** Vercel = shareable backup. | Venue-Wi-Fi-proof |
| Pkg | pnpm; no auth; no CI gates; one pipeline smoke test | Nova's QA lane covers verification |

## MOCK_MODE (highest-value resilience decision)

Every external call (TwelveLabs, ScorePlay, game feed, social feed) goes through `shared/clients/*` which honor `MOCK_MODE=1` and serve **recorded fixtures** from `data/fallback-assets/`. The demo runs offline end-to-end; live APIs are an upgrade, not a dependency. Fixtures recorded from real API responses during Wednesday testing = replayed truth, not fakery. Labeled honestly in the demo.

## Data model (5 tables — shared/db-schema.ts)

`assets` (source media + index status) → `moments` (TwelveLabs detections w/ timestamps + confidence) → `signals` (game events, social reactions; FK moment nullable) → `opportunities` (scored, deduped: unique hash(video_id, window±5s, content_type); TTL 48h; compliance JSON; status draft→approved/rejected→rendered→exported) → `jobs` (type, payload, status — the queue).

## Scoring

`score = moment_confidence × event_weight × social_velocity × recency_decay × audience_fit` — floor threshold + **top-N cap per game** (8 great > 80 mediocre; the cap is the product insight). All factors surface in the UI "why" panel.

## Correlation (honest MVP)

Semantic: game event text ("Castle dunk Q4 2:14") → Marengo query → hit timestamps = the correlation. Wall-clock windowing when metadata exists. No broadcast-timecode sync claimed.

## Rights & compliance

`compliance` JSON stamped on every opportunity at creation (source, territory, platform rights, expiry — real ScorePlay metadata when available, mocked schema otherwise). **Hard gate in the approve endpoint** + badge in UI. Schema deliberately extensible toward Challenge B (one roadmap slide).

## Channel profiles (pipeline/channel-profiles.json)

Formats are **configuration, not code**. Each profile: aspect/resolution, duration limits, safe zones (TikTok/Reels UI chrome), caption placement + burn-in (sound-off platforms), copy conventions, encode settings. Smart crop: Pegasus subject position → crop x-offset (video); ScorePlay face-aware CDN crop (photos/graphics). Demo beat: approve once → correctly formatted variants fan out side-by-side.

## Producer UX (three-pane inbox)

1. **Queue**: ranked cards — thumbnail, score, signal chips, compliance badge, audience tag. Live via Supabase Realtime.
2. **Review**: playable drafts per format, editable generated copy, "why" panel, trim control (feeds frame-accurate final render; neutralizes timestamp-precision risk).
3. **Decision bar**: Approve (→ final render + export bundle) / Edit / Reject (reason logged).

Approve-to-export < 30 seconds.

## MVP scope (locked baseline for Thursday 3 PM)

**Must:** indexed real footage · Marengo sweep · fused signals (real video intelligence + labeled mock feeds) · scored explainable opportunities (2 audiences × 2 formats) · drafts pre-approval · approve → final 9:16 asset + caption · compliance gate · both-sports example if footage allows.
**Optional:** live ScorePlay (if keyed) · score graphics (HTML template → headless Chrome) · trim control · live-updating social velocity.
**Deferred:** direct publishing · real social APIs · measurement loop · multi-tenant · auth.

**Scope-cut order if behind:** live social sim → second sport → sponsor overlay. Never cut: end-to-end workflow, approval UI.

## Decision layer: Jev (System One) with graceful fallback

Hot-path decisions (signal→event fusion, audience_fit/event_weight scoring inputs, moment dedupe, caption guardrails) run through `shared/clients/decisions.ts` — a `DecisionProvider` chain: **Jev → Haiku structured output → deterministic formula**. Jev (TypeSafe AI, typesafe.ai) returns typed, calibrated probabilities in 70–500ms at ~$0.042/MTok — frontier-level semantic matching at stream speed, cannot hallucinate or emit malformed output. It replaces both brittle keyword rules AND slow LLM calls in the hot path. **LLMs (Haiku) remain only where language is the product**: captions, copy, the "why" narrative.

Status: early access requested (Stu). Jev is an **upgrade, never a dependency** — the pipeline works end-to-end on the formula fallback; same philosophy as MOCK_MODE. Wednesday test (if keyed): real latency from our network, fusion question shape, calibration sanity on ~20 hand-labeled examples.

## Latency budget (timestamp every stage transition in `jobs` from hour one)

| Transition | Target | How |
|---|---|---|
| footage → indexed | pre-paid (Wed night / overnight) | upload-on-arrival, parallel, never serial |
| signal → fused | <200ms | velocity counters in code; Jev for semantic match; LLM never reads raw streams — cheap filters touch everything, decisions touch clusters |
| fused → scored | <1s | arithmetic over precomputed inputs; top-N cap |
| scored → draft ready | <10s | speculative: fire drafts on scoring, before producer looks; stream-copy cut (sub-second) + Haiku caption in parallel |
| approve → final variants | <30s | one frame-accurate master re-encode → all channel variants fan out concurrently (Promise.all over ffmpeg) |
| **moment → reviewable card** | **<60s** | put a visible "surfaced Ns after the play" timer on the card — the speed IS the pitch |
| end-to-end (signal → exported asset) | <2 min | pipeline-latency debug view doubles as demo stat |

## Known risks / dependencies

See docs/api-spike-report.md §5–6. Top 3: licensed footage availability/timing · ScorePlay key issuance (CSM-gated, Thursday) · TwelveLabs indexing latency (pre-index Wednesday night; empirical test ASAP).
