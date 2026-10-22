<div class="cover">
  <img src="LOGO_DATA_URI" class="mark" alt="Clout Labs">
  <h1>Spurs² Challenge 1: Master Task List</h1>
  <p class="sub">Development roadmap, priorities, dependencies and demo milestones · single source of truth</p>
  <p class="meta">v1 · Thursday Oct 22, 2026, 9:15 AM CT · Pre-briefing; v2 follows the 9:45 AM briefing</p>
</div>

## 1. How to use this list

- **This is the only plan.** Every task, status and decision lives here. After the briefing we update this list into v2; we don't start a new one.
- **Status key:** DONE (verified by real execution) · NEXT (ready, no blockers) · BLOCKED (waiting on someone or something) · LATER (scheduled after a milestone) · CUT (descoped, kept for the record).
- **Owners:** **H** = Hermes (primary developer, owns the code), **Stu**, **Nate**, **Nova** (QA and backup recording, own branches), **Org** = hackathon organizers.
- **v3 update (after PRs #3 and #4):** the build plan is now **section 10**, split across three coding agents by file ownership. **A1**, **A2** and **A3** are those agents; **Human** marks tasks only a person can do. Task IDs in section 10 are `features.md` IDs: `features.md` holds each task's scope and "done when", and this list holds owners and status.
- **Superseded by the local-only decision in `design.md`:** the cloud and hosted-URL items (M1, M2, T3 to T7, H3, the cloud-proof check) and live X posting (T13). ScorePlay write-back (T8, T10) is now part of B10 and B14b in section 10.
- **Every milestone ends in something we can demo.** Nothing gets built for more than a few hours without being shown working end to end.

## 2. Where we are at 9:15 AM

**Working and verified today:**

| What | Proof |
|---|---|
| End-to-end engine on the M5: trigger, live TwelveLabs analysis, rights check, branded reel + photo card, ranking, Claude copy, producer approval, final render, ScorePlay write-back | 139 automated checks pass; full live demo run with zero failures |
| **Cloud worker on AWS Fargate (new)** | A real moment processed in the cloud in 34s with the laptop worker off: live TwelveLabs, both drafts rendered, files in S3 |
| **Cloud storage on AWS S3 (new)** | Private, encrypted bucket; signed links play video with seeking; unsigned access denied |
| AWS account set up properly | Dedicated account, separate from Fan Engagement OS; $50/month budget alert to Stu; least-privilege keys; secrets in AWS Secrets Manager |

**Not yet built:** the hosted demo URL (UI on Vercel pointed at the cloud). That's the next milestone.

**Still simulated** (labeled on screen): game and fan-reaction feeds; ScorePlay (no key yet); footage (stock b-roll).

## 3. Assumptions and unknowns (validate at the briefing)

| # | Assumption we're building on | If wrong, we change |
|---|---|---|
| A1 | Licensed match footage will be provided Thursday | Demo stays on b-roll, framed as "training session / fan moment"; real-footage tasks drop out |
| A2 | We get a ScorePlay API key Thursday | Write-back stays on sample data, labeled; M4 shrinks |
| A3 | Judges want working software plus a commercial story | Rebalance hours between polish, pitch and features |
| A4 | Demo is around 5 minutes, on our hardware, with venue internet | Re-cut the demo script; lean harder on the backup tape |
| A5 | A hosted URL is useful (remote presenting, judges evaluating later) | Hosted URL drops in priority; the M5 demo stays primary |
| A6 | We may post to @playclout during judging | The closing beat becomes a simulated publish |
| A7 | Our TwelveLabs quota is enough for the event | Rely more on recorded responses; ask the organizers for credits |

## 4. Milestones (each ends in a demo)

| Milestone | Demo at the end | Target |
|---|---|---|
| **M0** Engine works locally | Full flow on the M5 | **DONE** |
| **M1** Cloud backbone | A moment processed in the AWS cloud, files in S3 | **DONE** (9:10 AM) |
| **M2** Hosted demo URL | Open a URL on any laptop: queue, play, approve, final render, without Stu's laptop | Thu ~1 PM |
| **M3** Real footage | The demo replay runs on licensed match footage | Thu ~3 PM (scope lock) |
| **M4** Live integrations | Live ScorePlay write-back, plus the posting decision | Thu evening |
| **M5** Demo locked | Timed script, rehearsed twice, backup tape recorded | **Fri 10 AM (freeze)** |

## 5. Master task list

### P0: critical path (do first, in order)

| ID | Task | Owner | Depends on | Status | Done when |
|---|---|---|---|---|---|
| T1 | Attend briefing; capture answers to A1 to A7 and the section 6 questions | Stu, Nate | none | NEXT (9:45) | Answers written down and sent to H |
| T2 | Re-plan into v2 of this list after the briefing (what changed and why) | H | T1 | BLOCKED on T1 | v2 shared; PDF re-sent if the plan materially changes |
| T3 | Point the UI at cloud storage (S3 signed links) | H | M1 | NEXT | UI plays cloud-rendered video |
| T4 | Deploy the producer UI to Vercel, live mode, with the real database | H | T3 | NEXT | Public URL loads the real queue |
| T5 | Replay and Reset buttons in the hosted UI | H | T4 | NEXT | A judge can start the demo and reset it from the browser |
| T6 | Hosted guardrails: live X posting off, one replay at a time, rate limit | H | T5 | NEXT | Verified by attempting each |
| T7 | Full browser walk on the hosted URL (cloud worker alone, M5 alone, both together) | H | T6 | NEXT | All checks pass, no errors; **M2 demo** |
| T8 | ScorePlay key: run the preflight check | H | Org key | BLOCKED on key | Read checks pass; one test write created and deleted |
| T9 | Index licensed footage in TwelveLabs; swap the replay timeline onto it | H | Org footage | BLOCKED on footage | Replay runs on real footage; **M3 demo** |

### P1: makes the demo strong (after M2)

| ID | Task | Owner | Depends on | Status | Done when |
|---|---|---|---|---|---|
| T10 | Live ScorePlay write-back in the approve flow | H | T8 | BLOCKED on key | Approved clip appears in ScorePlay; **M4 demo** |
| T11 | Demo script, timed beat by beat, with the honest REAL / SIMULATED story | H draft, Stu edit | T7 | NEXT (draft now) | Runs to time in rehearsal |
| T12 | Pitch narrative: problem, outcome, why Clout, commercial path | Stu, Nate (H drafts) | T1 | LATER | Fits the rubric weighting |
| T13 | Live X post as the closing beat (if posting rights allow) | H, Stu | T1 answer | BLOCKED on A6 | One rehearsed live post, then deleted |
| T14 | Jev confidence check on real footage (low-confidence flags today) | Nova | T9 | LATER | Ranks look sensible on real plays |

### P2: polish and insurance

| ID | Task | Owner | Depends on | Status | Done when |
|---|---|---|---|---|---|
| T15 | Backup tape: full demo recorded after the freeze | Nova | M5 | LATER (Fri AM) | File saved on the M5 and in the cloud |
| T16 | Design pass on the producer UI (spacing, empty states) | H | T7 | LATER | Visual check on the hosted URL |
| T17 | Phone layout for the producer UI | H | T7 | CUT unless needed | Only if a phone demo is required |
| T18 | Club crests and marks on assets | H | Org answer | BLOCKED on answer | Only if permitted |

### Housekeeping (not on the demo path)

| ID | Task | Owner | Status |
|---|---|---|---|
| H1 | Clout Venue: Railway breach response (log review, rotate keys, move the 3 services) | H with Stu GO | Waiting on Stu GO; separate from the hackathon |
| H2 | After the event: move the Supabase project into a Clout Labs-owned org | H with Stu GO | LATER |
| H3 | After setup: swap my AWS admin key for a deploy-only role | H, Stu | LATER |

## 6. Questions for the 9:45 briefing (priority order)

1. **Footage:** what licensed match footage, when, and how delivered? Can we index it on our own TwelveLabs account? (A1)
2. **ScorePlay:** key now? Sandbox or production? Write format for timecoded video logs; may we write live during judging? (A2)
3. **Posting rights:** may we post club footage publicly during the demo? (A6)
4. **Judging:** rubric weighting, demo length, format, screen, internet; do judges get a URL or a submission form? (A3 to A5)
5. **TwelveLabs:** shared organizer plan or per-team quota? (A7)
6. **Club marks:** may we use crests?

## 7. Parallel work lanes (no collisions)

| Lane | Who | Works on | Never touches |
|---|---|---|---|
| Build | H | All code on the `main` branch, AWS, Vercel | Pitch content decisions |
| Product and pitch | Stu, Nate | Briefing answers, judging strategy, pitch, demo delivery | Code |
| QA and insurance | Nova | Test passes on the hosted URL, Jev checks, backup tape (own branches) | `main` branch |

**Handoffs:** briefing answers go to H within 15 minutes of the briefing ending. H posts each milestone demo link here. Stu or Nate approve any change to the demo script.

## 8. Validation checkpoints

| When | Check | Pass bar |
|---|---|---|
| After every code change | Full automated suite | All checks pass |
| After every cloud deploy | Cloud proof: one moment processed by the Fargate worker | Job done, files in S3, live TwelveLabs |
| M2 | Browser walk on the hosted URL, cloud-only and M5-only | Zero errors; video plays and seeks |
| M3 | Replay on real footage, three times in a row | No failures; plausible cards |
| Thu 9 PM | First timed rehearsal | Under time, every beat lands |
| Fri 10 AM | Freeze: suite, cloud proof, rehearsal, backup tape | All green; tape saved |

## 9. Time plan (remaining hackathon)

| When | What |
|---|---|
| Thu 9:45 to 10:45 | Briefing (T1). H continues T3 to T4 meanwhile |
| Thu 11:00 | v2 of this list (T2) |
| Thu by 1 PM | **M2: hosted demo URL live** |
| Thu by 3 PM | **M3: real footage + scope lock** |
| Thu evening | M4 live integrations, demo script, first rehearsal |
| Fri by 10 AM | **M5: freeze**, backup tape, final rehearsal |
| Fri | Demo |

**If time runs short, cut in this order:** live social, then the second sport, then the sponsor overlay, then the phone layout. We never cut the end-to-end workflow, the approval UI, or the honest REAL / SIMULATED labels.

## 10. v3 build plan: three coding agents

Each agent edits **only** its own paths. Every `features.md` task row names its agent in the **Agent** column (Phase 0: the Owner lane column). A change needed in another agent's file goes in the PR description as `REQUEST to A<n>`. Full kickoff prompts and contract signatures: `challenge1/team-split-3-agents.md`.

**Decisions this plan builds in:**
- Every confirmed rights write sends allow-listed `rights:` tags to the ScorePlay source media, plus one `/video/logs` audit entry.
- Writes happen only after human confirmation. Dry run is the default, and there is a kill switch.
- We never call `PUT /details`, never write `accessible_*` fields and never delete media.
- If the key lacks `can_do_media_edit`, we write video logs only.

### 10.1 Agents, owned paths and tasks

| Agent | Area | Owns (only these) | features.md task IDs |
|---|---|---|---|
| **A1** | Pipeline, single ScorePlay write path, local-only backend | `pipeline/**` (not `pipeline/rules/`), `shared/clients/scoreplay.ts`, `twelvelabs.ts`, `writeback.ts` (new), `shared/moment-manifest.ts`, `shared/storage.ts`, `infra/aws/**` (delete), `Dockerfile.worker`, `package.json`, `scripts/**` (not `rules-test`, `engine-test`, `seed`), `docs/TAXONOMY.md` | B14.2, B14.4 (test), B14.5, B14.6, B2.8, B2.9, B10.4, B10.6, B10.8, B10.9, B14b.6 (write side), B14b.7 (write-side tests), B10.2/B10.7 (script), B12.1, B12.3, B5.1, B5.3, B8.3, B13.2 (replay fixture only), B6.4; T19 to T23 |
| **A2** | Rights engine, rule store, metadata stage, all DB schema, publication and fan libraries | `shared/rights/**` (new), `shared/db-schema.ts`, `shared/db/**`, `drizzle/**`, `shared/schemas.ts`, `shared/compliance.ts`, `shared/content-rules.ts`, `shared/clients/scoreplay-rights.ts`, `shared/publication.ts`, `shared/fan-ranking.ts`, `shared/fan-search.ts`, `pipeline/rules/**`, `scripts/rules-test.ts`, `engine-test.ts`, `seed.ts` | 0.1 to 0.4, 0.6, B2.1, B2.3, B2.6, B2.7, B2.10, B2.11 (tables), B2.12 to B2.16, B14b.1 to B14b.4, B14b.6 (payload), B14b.7, B4.1 to B4.3, B7.1, B7.3, B8.1, U3.1, B9.1, B9.3, B9.4 |
| **A3** | Web app: editor desk, Rights Rules screen, operator controls, fan app and PWA, app lock | `web/**` (including `web/middleware.ts`, `web/public/**` and `web/app/renders/`) | 0.5, B14.1, B14.3, A0.1, A0.2, A0.8, A1.2, A2.1 to A2.5, A2.7, B2.2, B2.4, B2.5, B2.11 (actions), A3.1, A3.5, A3b.1, A3b.5, A4.3, A4.4, A4.7 to A4.11, B14b.5, B4.4, B4.5, B8.7, U0.1, U0.3, U0.6, U1.1 to U1.3, U1.5, U2.1 to U2.4, U4.1 to U4.3, U5.1, U5.2, U5.4 |

**Shared contracts.** Each owner merges these first, as types and stubs. Other agents import them and never redefine them.
- **A2 owns:**
  - `shared/rights/types.ts`: `RightsStatus` (5 states), `RightsDecision`, `RightsRecord`.
  - `shared/rights/rule-schema.ts`: `RuleDef` and the `Condition` JSON DSL (no `eval`).
  - `shared/rights/api.ts`: evaluate, build record, write payload, confirm, rules CRUD, lint, preview, activate.
  - `shared/publication.ts`.
  - DB tables, including write jobs and the kill-switch setting.
- **A1 owns** `shared/clients/writeback.ts`: `enqueueWrite`, `canWrite`, `dryRun`, `writeStatus`, `setKillSwitch`, `ALLOW_LIST`.
- **A3 owns** no shared contract. It builds against mocks of the contracts above until they merge.

**Can start immediately:**
- **A1:** B14.2, plus the `writeback.ts` stub.
- **A2:** the contract and schema PR, then the engine as pure code on fixtures.
- **A3:** B14.1 app lock, B14.3 and A1.2, then every screen on mocks.

### 10.2 Order and merge sequence

1. A1 PR 1: B14.2 (removes the S3 path and the `uploadRenderDir` calls), plus the `writeback.ts` stub.
2. A2 PR 1: contracts and schema. Migrations are generated; a human pushes them.
3. A3 PR 1: B14.1, B14.3, A1.2.
4. A2 PR 2: engine, rule store with version pin, metadata stage (B2.x, B14b.1 to B14b.4, B14b.6 payload, B14b.7).
5. A1 PR 2: pipeline wiring (B2.8, B2.9), write path (B10.4, B10.6, B10.8, B10.9, B14b.6 tags and log), T19 to T23, B14.5, B14.6.
6. A3 PR 2: editor lanes and gates, Rights Rules screen, rights confirmation, dry-run and kill-switch view, all on the real APIs.
7. A2 PR 3: publication lifecycle, ranking, search, seed.
8. A3 PR 3: fan app and PWA, publish and withdraw, packaging, compilation tray.
9. A1 PR 3: variants, compilation render, signal fixture.
10. Human: push migrations, run a dry run end to end, make one live write with rollback, rehearse.

**Merge rules:** rebase on `main` before each PR. A human merges. `npm test` stays green on `main`.

### 10.3 Log follow-ups and human-only tasks

| ID | Task | Owner | Depends on | Status | Done when |
|---|---|---|---|---|---|
| T19 | `raw_tags` on `/video/logs` auto-create tags, so they pass the one allow-list (B10.8) | A1 | B10.8 | DONE (source-log tests) | A tag not on the list is dropped and logged, never sent |
| T20 | `clout-approved` at `pipeline/worker.ts:266` is not in the taxonomy: replace it with a taxonomy option or drop it | A1 | none | DONE | No non-taxonomy tag is sent |
| T21 | Rights log entry. It carries: verdict, rule-set version, engine version, "illustrative policy v0", run id, each element with evidence timestamps, provenance counts, who confirmed it and when, and the marker `[clout:rights:<mediaId>:<hash8>]`. `start`/`end` is the analysed range, and `raw_tags` holds allow-listed `rights:` options only | A2 builds, A1 sends | B14b.6 | NEXT | The dry-run payload shows every field; a retry creates no duplicate |
| T22 | Update `docs/TAXONOMY.md:20` ("we never edit, re-tag or delete your original media") to: confirmed, allow-listed `rights:` tags only; only our own tags replaced; no details edits; no deletes. Update §3B `rights:` options to the 5 states | A1 text, Human tells ScorePlay | none | A1 DONE; human pending | Doc matches the write path; ScorePlay mentor told before the first live tag write |
| T23 | Real writes need `SCOREPLAY_WRITES=1` plus the kill switch off; unset means dry run | A1 (`.env.example`), A3 (A4.11 note) | B10.9 | A1 DONE; A3 pending | Documented, and shown on the write panel |
| T24 | ScorePlay `/whoami`: does `rights[]` include `can_do_media_edit`? If not, write video logs only | Human | key | NEXT (first) | Result posted; tag plan confirmed or set to logs only |
| T25 | Secrets in the demo laptop `.env`; run `db:push` for each migration | Human | A2 PRs | NEXT | Agents never receive or commit secrets |
| T26 | B1.6 real rights fields on 3 to 5 demo media; B10.2/B10.7 live write test on one media with delete rollback | Human | T24, A1 PR 2 | BLOCKED on T24 | Tag and log written, read back, deleted |
| T27 | B14.7 one-time AWS teardown (needs the `clout-ci` profile) | Human | B14.2 | NEXT | Teardown logged |
| T28 | A4.6 demo script, rehearsals, backup recording | Human | all | LATER | Runs clean; backup saved |

### 10.4 Cut list (cut from the top first)

1. B2.16 re-evaluation on rule activation.
2. A4.9 rule preview. A4.8 stays a JSON editor.
3. A0.2 Act now rail, replaced by one static fixture card.
4. U0.3/U0.6 service worker, so the PWA install is manifest-only.
5. B12.1/B12.3 variants, so only the existing reel profile renders.
6. A4.10/A4.11 folded into A4.4; B14b.5 folded into the needs-review approve.
7. Search, replaced by a labelled metadata filter over published clips.
8. B8.7, replaced by seeded `featuredPlayerIds`.
9. Compilation, replaced by a pre-rendered, labelled montage.

**Already out of scope** (each deferred row still has a fallback owner in the `features.md` Agent column; A5.5 and B1.5 are Human): OpenCut (A5, B11), compilation and variant extras, rendition upload (B10.3, B10.5), live signals (B13.1, B13.3 to B13.6), admin polish (A0.3 to A0.7), metadata, PWA, player-page and search extras.

**Never cut:** B14.1 to B14.3, B14.5, B14.6; B2.6, B2.10, B2.15; the rights and rules floor (A4.7, A4.8, B2.13, B2.14, B14b.1 to B14b.4, B14b.6 in dry run, B10.8, B10.9); publish, feed and withdraw with the fan-web gate; the REAL / SIMULATED labels.

### 10.5 A1 implementation progress (2026-10-22)

Draft PR: [#8](https://github.com/PlayClout/spurs2-content-intelligence/pull/8). Working branch: `codex/agent-1-pipeline`. Only A1 paths and this progress log are edited. DONE means executed verification; PARTIAL means helpers/contracts exist but the shared integration is not complete.

| Tasks | Status | Evidence / next step |
|---|---|---|
| B14.2 | A1 DONE; A3 cleanup pending | S3 uploader removed, cloud config throws at startup, worker upload calls and cloud infra/scripts/container removed; root AWS packages removed. `test:storage` passes. REQUEST to A3: remove AWS SDK from `web/package.json`/lockfile and the `/renders` redirect branch. A1 retains a null-only `signedRenderUrl` compatibility export and legacy return type until A3 removes that branch. |
| B14.4 | DONE | `test:publish` confirms simulated-only publishing, no external ref. |
| B14.5 | DONE | `test:hygiene`: forced processing/download/photo failures remove source copies/frame grabs; success removes frame grabs too. |
| B14.6 | DONE (implementation/tests) | Startup sweeps stale transient files; `purge:media --all` covers configured render root, proof/test outputs and app-owned TMPDIR subfolder only. Isolated purge test proves `files_left=0` and no symlink target traversal. Human event teardown not run. |
| B10.8, T19, T20 | DONE for current source-log path | Single allow-list drops/reports unknown raw tags; rejects unexpected fields; worker now sends `producer approved`. Editorial logs cannot emit rights-state tags. Rights tag sender awaits A2 payload. |
| T22, T23 | A1 DONE; human/A3 pending | Taxonomy documents five states, provenance and own-tag-only replacement. `.env.example` defaults writes off and kill switch on. Mentor sign-off and A3 admin panel remain separate. |
| B10.4, B10.6, B10.9, B10.2/B10.7 scripts | PARTIAL | `writeback.ts` contract, pure dry-run builder, queue/store port, source-log sender, duplicate key/provider-marker reconciliation and send-time gates tested with fake transport/store. Missing DB/settings adapter holds every live write. Ambiguous POST attempts reconcile instead of blindly resending. Preflight labels held writes honestly. A2 must implement `WriteStore` with atomic claims, unique keys, persisted provider IDs and retry scheduling; A3 must enqueue on approval with actor/revision. |
| B14b.6/B14b.7, T21 | WAITING ON A2 | Confirmed RightsRecord payload/API not on main. No inferred rights tag sender or source-tag edits implemented; no guessed/redefined A2 contracts. |
| B2.8 | PARTIAL | Brand location/time + on-screen-text schema/prompt, source-time normalization, finish-reason/coverage flags and tests added. Legacy/truncated/missing-coverage manifests are not checked; pipeline marks cards needs_review and blocks approval through the legacy compliance gate. Two live-window checks and A2 evaluator integration pending. |
| B2.9 | DONE helper; A2 integration pending | Scoped/TTL rights reads for media, season roster and external groups; failure/absent season becomes needs_review, never clearance. Cache hit and failed-refresh tests pass. Metadata facts flow into delivery for the A2 stage. |
| B8.3 | PARTIAL | `featuredPlayerIds` delivered as an explicit empty list pending editor-confirmed clip IDs; no whole-match roster copied into featured players. Requires A2 canonical identity + A3 metadata review integration. |
| B5.1, B12.1 | DONE contracts/helpers | A1 pipeline variant/compilation manifests, explicit fan_app profile, exact recipe hashes and destination/policy/source lineage. Composition approval binds ordered entries. A2 still needs fan_app in shared channel schemas; A3 needs to call these helpers with current server authorization. |
| B5.3, B12.3 | PARTIAL | Real FFmpeg helpers validate dimensions/duration, isolate failed variants and render ordered muted compositions with temp cleanup. `test:production` validates social/app outputs and montage. Durable job/UI wiring waits for A2/A3 approval contracts; 20–45s demo rehearsal is not claimed. |
| B13.2 | DONE (replay fixture only) | Synthetic sampled counts/baseline/window are explicitly fixture data, attached only when a social replay event fires. Live/historical outside-source collection remains deferred. Existing replay tests pass. |
| B6.1, B6.4 | IMPLEMENTED; DB verification pending | Claims now respect queued_at <= now(); health JSON includes storage, provider modes, held/gated writes and lane. Full worker/health verification needs DATABASE_URL. |

**Validation:** `test:unit` passes (rules, ScorePlay, engine/replay, storage, simulated publish, hygiene, write gates, metadata). Existing `test:render` passes including dimensions, caption placement and actual audio removal. `test:production` passes on synthetic footage. TypeScript passes for A1 code/tests with bundler resolution and Node types. Full `npm test` reaches `test:e2e` and stops because `.env` is absent; no DB/E2E success claimed. Node dependencies and FFmpeg were installed locally for validation.

**Integration handoffs:** A2's `agent2/contracts-publication-rights` branch is visible but unmerged; no A2-owned files copied or edited. REQUEST to A2: supply the durable WriteStore/settings adapter, confirmed-rights payload and current approval/evaluation APIs; add fan_app to shared channel schema. REQUEST to A3: remove web AWS dependency/redirect, surface needs_review/analysis coverage, supply teamSeasonId and reviewed featured-player IDs, enqueue confirmed writes on approval, and call variant/compilation helpers with current authorization. The referenced `challenge1/team-split-3-agents.md` is not present on main.

**Human-only work not performed:** no credentials received, migrations pushed, live ScorePlay mutations, AWS teardown or new club-media downloads. Changes must be reviewed/merged by a human; no direct main push.
