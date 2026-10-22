# Spurs² Pre-Event Prep — ACTIVE CHECKLIST
_Last updated: 2026-10-20 21:35 ET by Nova. Check items off as completed; Nova keeps this current._

## 🧑‍💻 STU — Tonight (M5 + accounts)

> ✅ Infra done by Nova 10/20 PM: Supabase `quuvzqvgwuqenucaqpqg` (Reaper Studios Pro org — migrate post-event), Vercel project linked, Drizzle schema pushed + seeded (2 orgs, 12 simulated signals). App DB connections: transaction pooler `aws-0-us-east-1.pooler.supabase.com:6543`, `prepare:false`.

### M5 machine setup
- [ ] `brew install ffmpeg pnpm gh jq poppler imagemagick`
- [ ] `pnpm add -g vercel supabase`
- [ ] Node 20+ LTS confirmed (`node --version`)
- [ ] Clone repo: `gh repo clone PlayClout/spurs2-content-intelligence`
- [ ] Verify design system renders: open `design-system/thumbnail.html` in a browser
- [ ] Smoke check: `ffmpeg -version` runs

### Accounts & keys (tonight — these gate Nova's Wednesday work)
- [ ] **TwelveLabs** — sign up free tier (10 hrs workload) at twelvelabs.io → create API key
- [x] **TypeSafe/Jev** — key landed; wired + calibration-tested 10/20 (see docs/integration-test-report.md on nova/architecture)
- [ ] **Anthropic key** — confirm one is available for the M5 (`ANTHROPIC_API_KEY`)
- [ ] Get keys to Nova for Wednesday testing (drop in a file on the mini / secure channel — never chat)
- [ ] **Hermes GitHub access** — ask Hermes if it has a PlayClout-capable credential; if not, mint fine-grained PAT (only this repo, Contents + Pull requests r/w) at github.com/settings/personal-access-tokens/new → onto the M5
- [ ] Give Hermes the context-update brief (drafted by Nova, in chat 2026-10-20) + point it at PR #1 for review

### Supabase / Vercel (standby infra — 10 min)
- [x] Create Supabase project `spurs2-content-intelligence` (or confirm Nova should use existing access token to create)
- [x] Create Vercel project linked to the repo (or confirm Nova does it via token)

## ⭐ NOVA — Tonight/Wednesday (remote lane, nova/* PRs)
- [ ] UI pre-build PR: shadcn init + PlayClout token theme + dark mode
- [ ] Three-pane producer shell (queue / review / decision bar) with seeded mock data
- [ ] OpportunityCard (thumbnail, score ring, signal chips, compliance badge, "surfaced Ns ago" timer)
- [ ] Vidstack review player + trim handles → `trimOverride`
- [ ] "Why" explainability panel · approve/reject optimistic flow · empty/loading/error states
- [x] Supabase: Drizzle schema push (orgs, assets, moments, signals, opportunities, jobs, published_assets, performance_snapshots) + `pnpm seed`
- [ ] **TwelveLabs empirical test** (needs key): index b-roll → Marengo search → Pegasus json_schema → real timestamps
- [ ] **ffmpeg PoC**: timestamps → rough cut → frame-accurate re-encode → 9:16/16:9/1:1 variants w/ captions; commit tested presets to `pipeline/`
- [ ] Record real API responses as MOCK_MODE fixtures (`data/fallback-assets/fixtures/`)
- [ ] Stage Coverr/Pexels b-roll into `data/fallback-assets/`
- [x] Jev wiring + calibration test — live on nova/architecture: 12/15 agreement, ~100ms median, calibration sane (high-conf 100% vs low 63%)
- [x] Vercel standby deploy of app shell — preview verified 200 w/ seeded queue: https://spurs2-content-intelligence-rfbs7ngs9-porter-labs-projects.vercel.app (MOCK_MODE=1)
- [x] Publish backend reduced to simulated/event-internal export only. Removed live @playclout/X posting path because club content is event-only and @playclout is a separate B2C surface.

## 🤖 HERMES — Before Thursday (on-site primary)
- [ ] Review PR #1 (architecture v2 + scaffold) — explicit agree/disagree on: Jev provider chain, org-scoped schema, RenderBackend seam, drafts-before-approval
- [ ] M5 env check: repo cloned, pnpm install clean, `MOCK_MODE=1` smoke run
- [ ] Plan worker handlers (index/sweep/fuse/score/render_draft/render_final/export) against `shared/schemas.ts`
- [ ] Confirm Anthropic key wired for caption generation (Haiku)

## 👥 STU + NATE — Thursday briefing asks
- [ ] ScorePlay API key (CSM-gated) → immediately download OpenAPI spec + Postman collection
- [ ] ScorePlay: timecoded-video-actions write schema (our headline write-back integration)
- [ ] Licensed game footage: what, when, delivery method; TwelveLabs-compatible direct URLs?
- [ ] Shared TwelveLabs plan or per-team free tier?
- [ ] Judging rubric weighting (working software vs vision vs commercial)
- [ ] Demo format: own hardware? screen? time limit? internet reliability?

## 🔒 Locked rules (reference)
Feature freeze Fri 10 AM · scope-cut order: live social → second sport → sponsor overlay (never cut end-to-end workflow or approval UI) · demo truth rule: simulated inputs visibly labeled · two-strikes escalation · >45-min blockers get flagged · venue demo runs localhost on M5.

## 📚 Documents
`docs/team-gameplan.pdf` (signed off) · `docs/architecture.md` (v2, product posture) · `docs/api-spike-report.md` (verified API findings) · PR #1 (scaffold + decision layer, awaiting Hermes review)
