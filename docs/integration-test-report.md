# Integration Test Report — X publish · Jev decisions · Vercel deploy

Branch: `nova/architecture` · Run date: 2026-10-20 (evening) · Author: Nova
Every claim below is marked **VERIFIED** (observed live in this run) or **UNVERIFIED**.

---

## 1. X (Twitter) publish backend — `shared/clients/publish.ts`

**Historical note:** this path was implemented and tested early, but has been removed from the product. Publishing is now simulated/event-internal only. Rationale: club footage is event-only, not Clout IP, and @playclout is a separate B2C surface that should not receive this content.

**Live verification (scripts/x-live-test.ts, run 2026-10-21 02:28 UTC):**
- Video upload (`data/fallback-assets/poc/final_clip_9x16.mp4`): media_id `2112732217277394944`, processed in ~4.7s — **VERIFIED**
- Tweet created with video: HTTP 201, id `2112732235686166670`, URL `https://x.com/playclout/status/2112732235686166670` — **VERIFIED**
- Tweet deleted via `DELETE /2/tweets/:id`: response `deleted: true` — **VERIFIED**
- No tier-limit fallback was needed; full video path worked on the first run.
- Current behavior: there is no live X gate or backend. The only supported publish mode is simulated/event-internal export.

## 2. Jev (TypeSafe System One) — `shared/clients/decisions.ts`

**Implementation:** `jevDecide()` wired via official `@typesafe-ai/sdk` (`systemOne`, model
`jev-latest`; API base/auth handled by the SDK — my earlier `api.typesafe.ai` guess was
unnecessary). Key read from `TYPESAFE_API_KEY` env or `TYPESAFE_KEY_PATH` credential file.
All three decision shapes wired:
- **fuseSignal** → one `choice` over candidate event ids + explicit `none` option, plus `choice` sentiment and a 5-level `score` for hype. `eventMatch` = the choice probability distribution.
- **scoreFit** → two 5-level `score`s (audienceFit, eventWeight) + one `noul` per channel (≥0.6 → suggested).
- **dedupeMoments** → `choice` same/different; `sameMoment` = P(same).
Haiku → formula fallback chain untouched; `MOCK_MODE=1` still bypasses Jev entirely.

**Calibration test (scripts/jev-calibration.ts — 15 hand-labeled fusion cases incl. adversarial: wrong player name, previous-game reference, generic hype, off-topic):** all numbers from a live run, backend=jev — **VERIFIED**
- **Agreement: 12/15 (80%)**
- **Latency:** min 80ms · median ~101–111ms · max 232ms · mean ~116–121ms (two runs)
- **Calibration sanity: PASS** — high-confidence half 100% accurate vs low-confidence half 63%.
- Misses (all in the adversarial set, all at LOW confidence 0.27–0.65): wrong-player-credit cases ×2 (fans naming the wrong player drags the match), and one previous-game reference ("Castle's 30-piece against the Lakers last week") matched the buzzer event at 0.65. Flawless on straightforward + paraphrase + generic-hype cases. Production note: a confidence floor (~0.7) before auto-fusing would catch all three misses.

## 3. Vercel replay-mode deploy

**Deployment URL:** `https://spurs2-content-intelligence-rfbs7ngs9-porter-labs-projects.vercel.app`
- Project `prj_WIeFwD8J5KM8cJyKJ5FJiUfq1ht6`, root directory `web/`, framework Next.js, preview deploy of `nova/architecture` working tree via `scripts/vercel-deploy.mjs` (token read from credential store at runtime; never in repo/argv). Env set via API: `DATABASE_URL` (Supabase transaction pooler) + `MOCK_MODE=1` (preview+production targets) — **VERIFIED** (API 200/201 responses).
- **Fetch check: HTTP 200** and HTML contains seeded opportunity headlines ("AT THE BUZZER. Spurs 112, Thunder 110…", "CAREER-HIGH 42 FOR WEMBANYAMA", "POSTER DUNK IN TRANSITION") — **VERIFIED**
- Vercel Deployment Protection was disabled (`ssoProtection: null`) so the preview is shareable without Vercel auth — deliberate for the hackathon backup URL.

**`../shared` import fix (two-part, least-invasive):**
1. Historical: `oauth-1.0a` was previously added for the removed X publish backend. Current code no longer needs it; `drizzle-orm` remains required because web server actions import shared/database code.
2. Project `installCommand` = `npm install && npm install --prefix ..` — files under `shared/` (outside the root dir) resolve node_modules upward from the **repo root**, which Vercel otherwise never populates. No code moved, no copy step; tsconfig aliases unchanged.

## Caveats / UNVERIFIED

- **UNVERIFIED:** end-to-end UI publish flow against the live X backend (verified at the client-function level via the test script, not through the web UI's SIM/LIVE toggle).
- **UNVERIFIED:** Jev scoreFit/dedupeMoments accuracy — wired and type-checked, exercised implicitly by the chain, but only the fusion shape was calibration-tested.
- **UNVERIFIED:** Vercel production (`--prod`) deploy; only the preview deployment was created and checked.
