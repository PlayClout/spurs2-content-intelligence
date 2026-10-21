# README-HERMES — UI pre-build handoff

Pre-built producer UI for **Clout Content Intelligence** (Spurs² hackathon). Branch: `nova/architecture`.
Read `docs/architecture.md` first — it is the product posture; this UI implements the three-pane producer surface from it.

## Run it

```bash
# repo root — seed the live Supabase DB (idempotent, truncates + reloads)
npm install
set -a; source .env; set +a   # DATABASE_URL (Supabase transaction pooler)
npm run seed                   # 2 orgs, 12 signals, 6 moments, 6 demo opportunities, 5 jobs + SVG posters

# web app
cd web
npm install
npm run dev                    # web/.env is a symlink to ../.env
```

- `/` — three-pane producer UI (queue · review · decision bar)
- `/published` — published_assets feed (SIMULATED badge vs live link)
- Build: `cd web && npm run build` (passes clean as of handoff)

Notes:
- **postgres-js must use `prepare: false`** (Supabase transaction pooler) — already set in `web/lib/db.ts` and `scripts/seed.ts`.
- `MOCK_MODE` applies to the pipeline clients (`shared/clients/*`), not the UI; the UI reads only the DB.
- Next 16 has `cacheComponents` on: pages call `await connection()` to render at request time, and `Date.now()` in server-component paths will error at prerender — use `performance.now()` for timing.
- lucide-react has **no brand icons** anymore; channel icons are evocative generics (`web/components/channel-icons.tsx`).

## Where the seams are (implement behind these, don't reshape them)

| Seam | File | Now | Later |
|---|---|---|---|
| **RenderBackend** | `pipeline/render-backend.ts` | `getRenderBackend()` throws — wire `render-local.ts` after the ffmpeg PoC | cloud-worker |
| **PublishBackend** | `shared/clients/publish.ts` | `simulated` (writes published_assets, externalRef null). `x-clout` is a stub with the full TODO (v1.1 chunked media upload → v2 tweet create); **deliberately not wired to creds** | real X posting |
| **DecisionProvider** | `shared/clients/decisions.ts` | Jev → Haiku → formula chain | — |
| **Clients + MOCK_MODE** | `shared/clients/*.ts`, `data/fallback-assets/` | fixtures | live APIs |
| **Compliance** | `shared/compliance.ts` | `evaluate()` is real; data mocked. Approve + publish **hard-gate** on `status === "blocked"` in `web/lib/actions.ts` | ScorePlay metadata |
| **Channel profiles** | `pipeline/channel-profiles.json` | config, not code; UI reads safe zones/copy limits from it via `web/lib/channels.ts` | — |

Shared code is imported directly via tsconfig aliases `@shared/*` → `../shared`, `@pipeline/*` → `../pipeline` (no copying — one source of truth; `web/tsconfig.json` includes `../shared/**/*.ts`).

## What is scaffold vs final

**Final-ish (keep):** PlayClout token theme in `web/app/globals.css` · server actions in `web/lib/actions.ts` (list/approve/reject/saveTrim/saveCopy/publish, typed, compliance-gated) · queue cards w/ score ring + SIMULATED honesty chips + "surfaced Ns after the play" timer · why-panel score-breakdown bars · compliance panel · per-channel copy editor w/ char counters from channel profiles · 9:16 safe-zone overlay · latency drawer reading jobs stage timestamps · /published feed · empty/loading/error states.

**Scaffold (replace during build):**
- `<video>` has **poster only, no src** — point it at real draft rough-cuts when RenderBackend lands (`draftPaths[channel]`). Vidstack skipped deliberately (plain video is fine for 10–30s clips).
- Live updates = **5s polling** (`web/components/auto-refresh.tsx`). Supabase Realtime is a drop-in upgrade; don't burn demo-day hours on its auth.
- Seed opportunities/posters (`scripts/seed.ts`, `web/public/posters/*.svg`) are demo fixtures — the real pipeline inserts opportunities and these cards just appear (polling picks them up).
- Approve inserts a `render_final` job row; **no worker consumes it yet** — that's the pipeline build.
- `hasSimulatedSignals` on non-selected cards is hardcoded true (all seed signals are simulated); make it a join when real signals exist.
- LIVE publish toggle is disabled by design (tooltip: "arms real @playclout post — enable in demo").

## Verification state at handoff

- `npm run build` in web/: ✅ clean (typecheck incl. shared/)
- `npm run seed`: ✅ clean against live Supabase
- `/` renders seeded queue, org switcher flips Spurs ↔ Tottenham, approve flips status + inserts render_final job (verified against DB), reject + trim + copy save work, /published shows simulated publishes
