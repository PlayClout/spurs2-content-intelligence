# Spursx2 AI - Features and Build Plan

Source of truth: `design.md`
Goal: build the **Assisted Auto-Production Engine** described there: an editor validates AI-surfaced moments, publishes approved versions to an event-only fan catalog, and fans get personalized feeds plus natural-language clip search over that approved catalog.

This is a task breakdown, not a fresh product spec. Reuse the current repo aggressively.

## Required approval-to-delivery workflow

1. Editor approves an exact clip revision. Approval automatically queues ScorePlay source-log write-back; no separate sync button is required.
2. Publisher/editor opens that approved clip in a channel packaging workspace, selects all relevant social destinations plus the fan app, and adjusts cuts, crop, duration, captions and copy per destination.
3. The worker produces a distinct validated rendition for each eligible destination. Each variant retains its approved source lineage; material edits require approval of the changed variant revision.
4. Finished renditions automatically upload to the approved ScorePlay output collection with source/revision/channel links and metadata. Sync runs asynchronously with idempotent retries and visible pending/synced/held/failed states.
5. The editor explicitly publishes the prepared app rendition to the fan catalog. Social renditions are ready for export; external posting remains a separate action subject to event permissions.

Automatic write-back is the normal workflow once the workspace taxonomy and write access are configured. The current event sign-off gate can hold queued writes; it does not introduce a manual write-back step for each clip.

---

## Technical stack additions

Keep stack changes minimal. We already have most of what we need.

### Keep using

- **One responsive browser app:** existing Next app in `web/`.
  - Admin/editor dashboard stays at `/`.
  - Fan app routes go under `/fan`.
  - No native app, no install flow.
- **Database:** current Supabase Postgres through Drizzle schema in `shared/db-schema.ts`.
- **Backend worker:** current `pipeline/worker.ts` running on AWS Fargate, with M5 as fallback.
- **Media processing:** current FFmpeg renderer in `pipeline/render-local.ts` and `render-backend.ts`.
- **Storage:** current private S3 render storage in `shared/storage.ts` and `/renders` route.
- **Partner integrations:** current ScorePlay and TwelveLabs clients in `shared/clients/`.
- **UI/design:** current PlayClout / Spursx2 AI dark token style in `web/app/globals.css`, current shadcn-style UI components, design-system guidance in `design-system/`.

### Add only what the design requires

1. **Publication catalog schema**
   - Add tables for `publications`, `publication_versions`, fan preferences and player identity.
   - Do not replace existing `opportunities`, `published_assets`, `jobs` or render tables yet.

2. **Fan app routes in the same Next app**
   - Add `/fan`, `/fan/search`, `/fan/players/[id]`, `/fan/clips/[id]`.
   - Use demo personas first. Real auth is post-hackathon.

3. **Fan ranking and fan search shared modules**
   - Add `shared/fan-ranking.ts` and `shared/fan-search.ts`.
   - These consume the published catalog, not raw ScorePlay media or draft opportunities.

4. **Publication lifecycle module**
   - Add `shared/publication.ts` for publish, withdraw, version checks and eligibility.

5. **OpenCut spike only, not core dependency**
   - Evaluate OpenCut Classic behind an adapter only after the editor/fan loop works.
   - Keep existing FFmpeg renderer as the reliable fallback.

### Do not add yet

- No native app stack.
- No new database technology.
- No new auth provider for P0.
- No full OpenCut merge.
- No public posting of club content.
- No live ScorePlay writes until taxonomy is approved.
- No AI-generated fan-requested cuts. Search returns approved published derivatives only.

---

## Workstream order

The order below lets multiple people work in parallel without stepping on each other.

### Phase 0 - Shared contracts first

| ID | Owner lane | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|---|
| 0.1 | Backend | Add publication data model draft to `shared/db-schema.ts` and matching types in `shared/schemas.ts` | none | existing Drizzle schema | Types compile; no existing tables broken |
| 0.2 | Backend | Add `Player`, `FanProfile`, `FanPreference`, `Publication`, `PublicationVersion` concepts | 0.1 | `data/footage-map.json`, ScorePlay player IDs | Seed/demo data can represent two fan profiles and published clips |
| 0.3 | Backend | Define `DestinationContext` for owned fan web and editor outputs | 0.1 | `shared/compliance.ts` | Rights checks can distinguish owned social vs owned fan web |
| 0.4 | Backend | Add current-state guards: published, withdrawn, expired, scheduled | 0.1 | existing status patterns | Server can answer whether a clip is discoverable now |
| 0.5 | Admin frontend | Confirm route and component boundaries | 0.1 | current `web/` app | `/` remains editor/admin; `/fan` is user app |
| 0.6 | User app frontend | Define minimal fan demo personas | 0.1 | seeded orgs and real Tottenham clips | Two profiles have different favorite players/interests |

Parallel rule: once 0.1 to 0.4 are stubbed and typed, backend, admin frontend and fan frontend can proceed independently.

---

# 1. Admin frontend work

Admin frontend means the editor / producer dashboard and operator controls. This is the primary work surface for the hackathon judges.

## Phase A0 - Premium admin UX and fast-response desk (P0)

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A0.1 | Define and implement a clean admin visual hierarchy | 0.5 | existing tokens, three-pane desk | Dominant preview, restrained color, clear primary action, consistent spacing/type; deeper diagnostics move into drawers |
| A0.2 | Add Act now / Rising / Watch rail | B13.4, A1.1 | opportunity cards, signal evidence | Each alert has why-now, player/play, momentum, age, coverage, readiness and one-click review |
| A0.3 | Stabilize live updates and editing state | A1.1 | auto refresh, review state | New signals never steal focus, reset playback/edits or reorder the active card; editor applies new ranking from an indicator |
| A0.4 | Add keyboard navigation and command palette | A1.1 | accessible UI components | Core review/package workflow works by keyboard; shortcuts respect text entry and explicit publication |
| A0.5 | Add autosave, recovery and reversible action feedback | A1.5 | server actions, draft revisions | Saved/error states are clear; failed optimistic actions roll back; release success reflects server confirmation |
| A0.6 | Add claim/snooze/dismiss and notification preferences | B13.5 | queue status, editorial events | Editors see ownership; alerts deduplicate; snoozes expire; version conflicts preserve work; sound is opt-in |
| A0.7 | Polish channel tabs and processing transitions | A3b.2 | destination previews, jobs | Safe-zone previews, inline errors and per-channel progress feel consistent without repeated modal dialogs |
| A0.8 | Run visual and interaction QA | A0.1–A0.7 | browser walkthrough | Desktop/laptop, skeleton/empty/error/held states, keyboard access, reduced motion, draft recovery and refresh stability verified |

Local interaction feedback target is 100ms; supported matched external signals should surface within 10s of ingestion. Measure provider lag and media-load latency separately. These are acceptance targets, not claims about current code.

## Phase A1 - Stabilize current editor desk

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A1.1 | Keep current three-pane layout as the base editor desk | 0.5 | `web/app/page.tsx`, `OpportunityCard`, `ReviewPane` | Existing queue/review/decision bar still builds |
| A1.2 | Rename and label surface as editor/admin where useful | A1.1 | `TopChrome` | UI language matches design: editor validates, not fan viewer |
| A1.3 | Keep org switcher and queue filters | A1.1 | `QueueFilters`, `listOpportunities` | Producer can filter by status, audience, sport |
| A1.4 | Keep native video/image preview | A1.1 | `ReviewPane`, `/renders` route | Drafts/finals play from S3 signed URLs |
| A1.5 | Keep trim and copy editing | A1.1 | `saveTrim`, `saveCopy` | Editor can adjust seconds and channel copy |
| A1.6 | Keep approve/reject flow | A1.1 | `approveOpportunity`, `rejectOpportunity` | Approve queues final render; reject stores reason |

## Phase A2 - Align review pane to `design.md`

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A2.1 | Add four explanation sections: editorial rank, factual/stat support, rights eligibility, processing provenance | A1.1, B2.1 | `ReviewPane`, `delivery.inputs`, `ranking`, `compliance` | Card answers why now, why clip, why allowed, what evidence |
| A2.2 | Add visible mode chips: LIVE, REPLAY, FIXTURE | A2.1 | `delivery.inputs`, `signals.simulated` | Replay is never presented as live |
| A2.3 | Improve considered/rejected panel | B3.4 | `pickNew`, `mergeIntoExisting`, future candidate log | Shows duplicates, blocked, outside-scope and skipped candidates |
| A2.4 | Add held lanes: Ready, Cleaning, Needs review, Blocked, Rejected | B2.2 | current status filters | Producer can inspect held clips and reasons |
| A2.5 | Add context fields to the review header | B2.1 | `DestinationContext` | Shows platform, territory, use, language, release time, policy version |
| A2.6 | Add current exact revision hash and approval state | B4.2 | publication/approval module | UI shows whether approval is current or invalidated |

## Phase A3 - Compilation / montage editor without overbuilding

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A3.1 | Add simple compilation tray below the review pane | B5.1 | current UI components | Editor can add 2-3 approved clips to a sequence |
| A3.2 | Add reorder/remove controls | A3.1 | local component state then server action | Order persists in a `CompilationManifest` |
| A3.3 | Add duration budget display | A3.1 | `channel-profiles.json` | UI shows target duration and over/under budget |
| A3.4 | Add why-selected per compilation entry | B5.2 | recommendation evidence | Each entry explains why selected and why placed there |
| A3.5 | Queue compilation render through worker | B5.3 | `pipeline/render-local.ts`, `jobs` | Three-clip montage renders locally/Fargate |
| A3.6 | Keep FFmpeg fallback even if OpenCut spike fails | none | existing renderer | Demo does not depend on OpenCut |

## Phase A3b - Approved clip to every relevant destination

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A3b.1 | Add publisher/editor channel packaging workspace for an approved clip | A1.6, B12.1 | `ReviewPane`, channel profiles | Editor can choose Instagram Reels/Stories/Feed, TikTok, YouTube Shorts/Highlights, X video/photo and fan app; unavailable destinations show reasons |
| A3b.2 | Generate suggested cuts and framing per destination | A3b.1, B12.2 | trim controls, FFmpeg crop and captions | Editor previews duration, aspect, crop/safe zones, captions, poster and copy for each relevant output |
| A3b.3 | Edit and approve variant revisions | A3b.2, B2.5 | revision approval | A changed cut/crop/audio/text is reviewed for that exact variant; unchanged approved variants stay valid |
| A3b.4 | Add batch render and per-destination progress | A3b.3, B12.3 | jobs/latency UI | One action prepares all selected approved variants; one failed channel can retry independently |
| A3b.5 | Show automatic ScorePlay sync and separate app publication | B10.4, B12.4 | publication actions, delivery status | Source log and output links sync automatically; app Publish is explicit; social outputs can be previewed/exported without posting |

## Phase A4 - Admin/operator controls

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A4.1 | Keep demo Reset/Replay controls | current work | `DemoControls`, `resetDemo`, `replayDemo` | Hosted URL can reset and replay real timeline |
| A4.2 | Add worker/job status panel | B6.1 | `LatencyDrawer`, `listJobs` | Operator can see queued/running/failed jobs |
| A4.3 | Add integration status panel | B1, B2 | `scoreplay-preflight`, `footage-map` output | Shows ScorePlay live, TwelveLabs live, S3, writes held |
| A4.4 | Add taxonomy readiness panel | B1.4 | `docs/TAXONOMY.md`, held write payload | Shows writes held until sign-off |
| A4.5 | Add safe requeue failed job action | B6.2 | `jobs` table | Failed demo jobs can be retried without DB shell |

## Phase A5 - OpenCut spike as bounded admin feature

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| A5.1 | Create local OpenCut Classic spike branch or separate checkout | A3 stable | `docs/opencut-integration.md` | Pinned revision boots locally |
| A5.2 | Import one short approved derivative | A5.1, B5.1 | existing render output | Clip imports, plays and has source binding |
| A5.3 | Verify trim/reorder/save round trip | A5.2 | proposed `EditManifest` | Source seconds round-trip correctly |
| A5.4 | Block unsupported export path | A5.3 | server render gate | OpenCut cannot bypass final server check |
| A5.5 | Decide keep or cut | A5.4 | FFmpeg fallback | If not proven in 90 minutes, defer OpenCut |

---

# 2. User app frontend work

User app means the fan-facing web routes under `/fan`. This is not a native app. It consumes only editor-published content.

## Phase U1 - Fan app shell and demo personas

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| U1.1 | Add `/fan` route group | 0.5 | current Next app | `/fan` renders without affecting editor route |
| U1.2 | Add demo profile selector | 0.6 | existing UI components | Fan A and Fan B can be selected |
| U1.3 | Add onboarding/preferences panel | 0.6 | design-system forms/buttons | User can choose club, favorite players and interests |
| U1.4 | Add empty/no-preferences state | U1.3 | current empty-state patterns | Skipping preferences produces balanced feed, not broken UI |
| U1.5 | Add fan top nav | U1.1 | `TopChrome` patterns | Navigation: For You, Search, Players, Saved if implemented |

## Phase U2 - Published catalog feed

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| U2.1 | Build feed server action/helper over published versions | B4.1 | `publishedAssets` concept, new publication tables | Feed reads only currently published eligible versions |
| U2.2 | Build fan clip card component | U2.1 | `OpportunityCard` style, image/video helpers | Card shows title, player tags, interests, why chip |
| U2.3 | Apply transparent fan ranking | B7.1 | `shared/fan-ranking.ts` | Two demo profiles produce visibly different order |
| U2.4 | Add why chips | U2.3 | preference data | Examples: Because you follow Solanke, Crowd energy, Editor pick |
| U2.5 | Add unavailable/expired/withdrawn states | B4.3 | publication lifecycle | Withdrawn clip disappears from feed and detail |

## Phase U3 - Favorite players and player pages

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| U3.1 | Add canonical player seed for demo | B8.1 | ScorePlay player IDs, footage map | Solanke, Sávio, Kudus etc. have stable IDs |
| U3.2 | Add player picker | U1.3, U3.1 | form components | Fan can favorite/unfavorite player |
| U3.3 | Add `/fan/players/[id]` route | U3.1, U2.1 | fan clip cards | Page lists published clips tagged to that player |
| U3.4 | Add ambiguous/no player states | U3.2 | empty-state patterns | Unknown player does not guess silently |

## Phase U4 - Natural-language search over approved derivatives

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| U4.1 | Add `/fan/search` page with input and filters | U1.1 | current UI components | Search UI renders on mobile and desktop |
| U4.2 | Build server-side fan search helper | B9.1 | `shared/clients/twelvelabs.ts:searchMoments` | Query runs against allowed published indexed IDs only |
| U4.3 | Add post-validation of search hits | B4.3, B9.1 | publication lifecycle | Drafts, withdrawn, expired, wrong club and raw full-match hits are dropped |
| U4.4 | Return bounded playable offsets in published derivative | B9.2 | `PublicationVersion` mapping | Search result plays inside approved derivative only |
| U4.5 | Add no-results and provider-fallback UI | U4.2 | empty/error components | Metadata fallback is clearly labeled, not called AI search |
| U4.6 | Add tests for empty allowed set | U4.3 | `fan-search` tests | Empty set returns empty, never searches all videos |

## Phase U5 - Fan clip detail and playback

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| U5.1 | Add `/fan/clips/[id]` route | U2.1 | `/renders` route, video player | Published clip detail plays approved derivative |
| U5.2 | Add playback grant helper | B4.3 | storage signed URL helpers | Playback checks current publication state before returning media |
| U5.3 | Add source context without exposing raw media | U5.1 | publication source lineage | Shows match, player, approved caption, why chip |
| U5.4 | Add withdraw check | U5.2 | publication lifecycle | Withdrawn clip no longer grants playback |

## Phase U6 - Published compilation support

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| U6.1 | Show compilation card in fan feed | A3.5, B5.4 | fan clip card patterns | Three-clip montage appears as one published item |
| U6.2 | Detail view shows compilation chapters | U6.1 | `CompilationManifest` | Fan sees hook/build-up/payoff entries |
| U6.3 | Search returns compilation hits correctly | U4.4, U6.1 | fan search post-validation | Hit plays inside the published montage timeline |

---

# 3. Backend work

Backend means data model, integrations, analysis, rights, rendering, jobs, publication lifecycle and fan authorization. This is where most current code can be reused.

## Phase B1 - Source identity and partner mapping

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B1.1 | Keep current ScorePlay client and preflight | none | `shared/clients/scoreplay.ts`, `scripts/scoreplay-preflight.ts` | Read/download path stays live |
| B1.2 | Keep current TwelveLabs official key/index path | none | `shared/clients/twelvelabs.ts` | Premier League index still searches/analyzes |
| B1.3 | Preserve filename-based footage map | none | `scripts/build-footage-map.ts`, `data/footage-map.json` | 58/58 TwelveLabs videos match ScorePlay media |
| B1.4 | Add warning for TwelveLabs custom ID mismatch | B1.3 | evidence already found | System knows organizer custom IDs do not resolve in our ScorePlay team instance |
| B1.5 | Track missing Spurs/NBA index | B1.3 | `data/footage-map.json` | Admin sees Spurs videos are ScorePlay-only until index is supplied |

## Phase B2 - Rights and destination context

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B2.1 | Add `DestinationContext` type | 0.3 | `shared/compliance.ts` | Context includes platform, territories, use, language, release time, policy version |
| B2.2 | Split recommendation eligibility from internal review visibility | B2.1 | opportunity status | Ready lane only contains destination-cleared candidates |
| B2.3 | Treat unknown as not cleared for fan distribution | B2.1 | compliance module | Unknown cannot publish to fan catalog |
| B2.4 | Recheck at approval, render start and publish | B2.1 | `approveOpportunity`, `handleRenderFinal`, publication module | Changing context invalidates stale approval |
| B2.5 | Bind approval to exact revision hash | B4.2 | `trimOverride`, render manifest | Editing trim/copy/dependencies invalidates approval |

## Phase B3 - Discovery, candidate storage and rejected reasons

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B3.1 | Keep replay-as-live source | none | `data/replays/thfc-mnu-week6.json`, `pipeline/replay.ts` | Replay jobs use visible-at scheduling |
| B3.2 | Keep scoped Marengo watch-list | none | `pipeline/watchlist.ts` video ID filter | Search is scoped to watched match footage |
| B3.3 | Add candidate ledger table or JSON field | 0.1 | opportunities delivery JSON initially | Store considered, selected, skipped and rejected reasons |
| B3.4 | Record duplicate merge and watch-list skip reasons | B3.3 | `mergeIntoExisting`, `pickNew` | UI can show what was left out with reasons |
| B3.5 | Add candidate evidence coverage | B3.3 | delivery inputs | Missing X/stats are shown as missing, not invented |

## Phase B4 - Publication lifecycle

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B4.1 | Add publication tables | 0.1 | `publishedAssets` as reference only | Can represent prepared, scheduled, published, withdrawn, expired |
| B4.2 | Add exact version and artifact hash fields | B4.1 | render output hash patterns | Publication points to exact approved derivative |
| B4.3 | Add `canViewPublication(viewerContext, publicationVersion)` | B4.1, B2.1 | compliance module | Feed/search/detail/playback all use same eligibility check |
| B4.4 | Add publish action separate from approve | B4.1 | existing simulated publish action | Editor approval does not automatically publish to fan app |
| B4.5 | Add withdraw action | B4.1 | status update patterns | Withdrawn content leaves feed/search/detail/new playback |
| B4.6 | Add atomic replace behavior | B4.2 | version numbers | Old version stays current until replacement ready |

## Phase B5 - Compilation and render plan

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B5.1 | Add `CompilationManifest` type | 0.1 | design.md example, render pipeline | Manifest supports ordered entries, source ranges, context and decisions |
| B5.2 | Add simple greedy recommendation recipe | B3.3 | rank/reasons | Produces hook, setup, payoff/reaction where available |
| B5.3 | Add compilation render job | B5.1 | `pipeline/render-local.ts`, `jobs` | Three clips render into one 20-45s montage |
| B5.4 | Make compilation publishable | B4.1, B5.3 | publication lifecycle | Montage appears in fan catalog as one item |
| B5.5 | Add invalidation if any source decision expires | B2.4, B5.1 | publication lifecycle | Dependent compilation is blocked/withdrawn |

## Phase B6 - Worker and job reliability

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B6.1 | Keep scheduled job claim `queuedAt <= now()` | current | `pipeline/worker.ts` | Replay jobs fire in timeline order |
| B6.2 | Add safe requeue server action | A4.5 | `jobs` table | Admin can retry failed job |
| B6.3 | Add job stage telemetry | B6.1 | `jobs.startedAt/finishedAt`, latency drawer | UI shows ingest, analysis, rights, render timings |
| B6.4 | Add current worker mode to health | B6.1 | worker logs/env summary | Admin sees ScorePlay live, TL live, writes held |

## Clip metadata contract

Every clip gets automatic ScorePlay metadata retrieval plus TwelveLabs enrichment scoped to its exact source range. Canonical player/team IDs and interest tags connect published clips to user preferences. Store evidence and verification status; editor review resolves uncertain identity before player-based personalization. Unknown/no-player is explicit and never silently mapped to a favorite. Carry reviewed metadata through the actual social/app rendition, revalidate after cuts/crops, and map compilation tags to chapters. See `design.md` and `docs/fan-app-and-search.md` for the full contract.

## Phase B7 - Fan ranking

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B7.1 | Create `shared/fan-ranking.ts` | 0.2, B4.3, B8.7 | current rank style | Implements design.md weights: favorite .45, interest .25, editor .15, recency .10, exploration .05 |
| B7.2 | Add repeat penalties and diversity | B7.1 | publication source ranges | Feed avoids same play/player repetition |
| B7.3 | Return explainable reason chips | B7.1 | preference data | UI can say why each clip is shown |
| B7.4 | Add tests with two fan profiles | B7.1 | seeded demo personas | Same catalog orders differently for Fan A and Fan B |

## Phase B8 - Clip metadata and player identity

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B8.1 | Add canonical player records | 0.2 | ScorePlay player IDs from tag search | Solanke, Sávio, Kudus etc. can be resolved |
| B8.2 | Add alias mapping | B8.1 | player search utilities | Query names resolve deterministically or ask for choice |
| B8.3 | Add clip-level `featuredPlayerIds` | B4.1, B8.1 | Pegasus evidence + editor review | Fan app does not rely on whole-match player tags |
| B8.4 | Add tests for ambiguous/missing player | B8.2 | fan-search tests | No silent guessing |
| B8.5 | Automatically enrich every clip with source and time-scoped metadata | B8.1, B1.3, B4.2 | ScorePlay metadata/player tags, TwelveLabs manifest | Each clip has canonical club/match/competition/sport, featured players/roles, event type, interests, language, duration, source ranges and variant context; unavailable facts are explicit |
| B8.6 | Store per-field evidence, verification state and metadata version | B8.5 | delivery inputs, source lineage | Inherited source facts and inferred clip facts are distinguished; whole-match rosters cannot become verified excerpt tags |
| B8.7 | Add editor metadata review/correction before publication | B8.6, A2.1 | review pane, player picker | Editor resolves uncertain/conflicting identity, accepts unknown/no-player where appropriate, and approves metadata with the exact clip revision |
| B8.8 | Revalidate metadata after cuts/crops and across renditions/compilations | B8.6, B12.1, B5.1 | variant manifests, source-to-output mappings | A player removed by trim/crop cannot remain featured; verified compilation tags map to the relevant chapters |
| B8.9 | Connect reviewed metadata to preference IDs and catalog updates | B8.7, B7.1 | canonical players/interests, publication lifecycle | Feed, player pages, search and why chips use the same current reviewed metadata; corrections invalidate stale caches/index metadata and require renewed approval for changed identity/facts |
| B8.10 | Test metadata-to-personalization end to end | B8.8, B8.9 | two demo profiles, publication/search tests | Favorites/interests change feed order; wrong-player, outside-cut, ambiguous and corrected identities never yield stale player matches |

## Phase B9 - Fan search

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B9.1 | Create `shared/fan-search.ts` | B4.3, B8.3 | `searchMoments` | Searches only allowed published indexed IDs |
| B9.2 | Add final-derivative index mapping | B4.2 | TwelveLabs asset/index concepts | Search hit maps to `PublicationVersion` |
| B9.3 | Add post-validation after provider call | B9.1 | `canViewPublication` | Withdrawn/expired/wrong-club hits are dropped |
| B9.4 | Add empty allowed set guard | B9.1 | tests | Empty eligibility does not search all videos |
| B9.5 | Add metadata fallback | B9.1 | publication tags | If Marengo unavailable, fallback is labeled clearly |

## Phase B10 - ScorePlay writeback

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B10.1 | Keep writes held by default | current | `SCOREPLAY_WRITES` guard | No live metadata write without sign-off |
| B10.2 | Run one safe write/delete test after taxonomy approval | ScorePlay sign-off | `writeMomentAsVideoLog` | Create, read back, delete succeeds |
| B10.3 | Create `Spursx2 AI Productions` collection after approval | ScorePlay sign-off | `uploadToEvent`, event API | Final outputs can be uploaded to ScorePlay |
| B10.4 | Queue automatic write-back on approval and persist pending/synced/held/failed state | B4.2 | worker jobs, delivery JSON or new table | Approval creates a durable source-log job without a separate sync action; held/failed work stays visible |
| B10.5 | Automatically upload completed channel/app renditions and sync output refs | B4.2, B10.3, B12.3 | ScorePlay upload/media/details API | Every completed eligible rendition is linked to its exact source, approval revision, channel and artifact |
| B10.6 | Add idempotent retries and reconciliation | B10.4, B10.5 | DB-recorded write-back IDs, jobs | Retry/restart cannot duplicate source logs or uploads; transient failures back off; held writes resume automatically after workspace enablement |
| B10.7 | Verify automatic approval-to-ScorePlay flow | B10.6 | integration tests | One approval creates the source log, completed variants upload automatically, and repeated jobs do not duplicate records |

## Phase B11 - OpenCut adapter backend

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B11.1 | Add `shared/editor-contracts.ts` | B5.1 | `EditManifest` from docs | OpenCut bridge has stable contract |
| B11.2 | Add source binding table or JSON | B11.1 | `EditorProjectBinding` concept | Editor IDs map back to Spursx2 AI source ranges |
| B11.3 | Add server-side review gate | B11.1, B2.5 | render_final gate | OpenCut export cannot bypass approval |
| B11.4 | Add unsupported edit rejection | B11.1 | render plan validator | Effects we cannot render are blocked clearly |

## Phase B12 - Destination variants for social and fan app

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B12.1 | Define variant manifest and explicit fan-app channel profile | B4.2, B2.1 | `channel-profiles.json`, render schema | Each destination has its own source trim, aspect/resolution, duration, crop, safe zones, audio/captions/copy and revision hash |
| B12.2 | Build per-destination cut/size planner | B12.1 | TwelveLabs moment/framing evidence, existing profiles | Approved source yields appropriate social and app recipes; profile limits and uncertain crops are surfaced for review |
| B12.3 | Fan out independent render jobs and validate outputs | B12.2, B2.4 | worker, FFmpeg, storage | All selected cleared destinations get separate files; dimensions/duration/audio/caption constraints are checked and failed variants retry independently |
| B12.4 | Bind app publication/indexing to the app rendition | B12.3, B4.2, B9.2 | publication lifecycle | Fan playback/search uses the exact approved app artifact and its own index mapping; social variants retain separate lineage |
| B12.5 | Verify multi-destination output end to end | B12.4, B10.6 | render/integration tests | One source produces social plus app variants, preserves lineage, respects destination limits and automatically syncs to ScorePlay |

## Phase B13 - External signals and hot-clip urgency

| ID | Task | Depends on | Reuse | Done when |
|---|---|---|---|---|
| B13.1 | Define normalized signal contract and provider adapters | B3.3, B8.1 | `signals`, existing replay | Support authorized X reads, licensed/organizer event feeds, permitted news/RSS and first-party app activity; persist IDs, links, event/observation times, coverage, entities and mode |
| B13.2 | Connect one authorized outside source and replay fixtures | B13.1 | provider client patterns | Live feed and simulated/replay modes are distinct; missing access and rate limits are visible with bounded retry/backoff |
| B13.3 | Correlate external signals to exact plays/clips | B13.2, B8.6 | footage map, candidate ledger, dedupe | Match/player/time evidence resolves the correct footage; ambiguous signals stay unmatched and missing footage triggers scoped discovery |
| B13.4 | Add explainable urgency scoring and lifecycle | B13.3 | ranking, source evidence | Act now/Rising/Watch use sampled acceleration, baseline counts, freshness and confidence; thresholds/hysteresis/expiry suppress noise; rights remain separate |
| B13.5 | Emit durable deduplicated admin alerts and ownership state | B13.4 | editorial events, queue updates | Canonical play cooldowns, meaningful-change escalation, claim/snooze/dismiss and stale-feed states work across editors |
| B13.6 | Verify signal-to-action flow and timing | B13.5, A0.6 | replay/integration tests | Fresh signal highlights the correct clip; duplicates/stale/wrong-match signals do not alert repeatedly; ingestion-to-alert target and upstream lag are measured separately |

---

# Parallel ownership recommendation

## Person 1: Backend foundation
Start with phases 0, B2, B4, B7, B9.

First concrete tasks:
1. Add publication/fan schema types.
2. Add `DestinationContext`.
3. Add `shared/publication.ts` with current-state checks.
4. Add `shared/fan-ranking.ts` with tests.
5. Add `shared/fan-search.ts` with empty-allowed-set tests.

## Person 2: Admin/editor frontend
Start with A1, A2, A4.

First concrete tasks:
1. Keep current desk working after schema changes.
2. Add destination/context display.
3. Improve explanation panels.
4. Add Ready / Cleaning / Needs review / Blocked / Rejected lanes.
5. Add admin health and taxonomy panels.

## Person 3: Fan/user app frontend
Start with U1, then U2 and U3 once publication helpers exist.

First concrete tasks:
1. Add `/fan` route shell.
2. Add demo profile selector.
3. Add preference picker.
4. Add fan clip card and feed layout using stubbed data.
5. Wire to backend publication feed when ready.

## Person 4: Media/editor backend and OpenCut spike
Start with B5 and A5 after core catalog works.

First concrete tasks:
1. Define `CompilationManifest`.
2. Render a simple three-clip montage through FFmpeg.
3. Timebox OpenCut Classic spike.
4. Keep FFmpeg path as fallback.

---

# Logical order of operations

## Step 1: Do not break the current demo
- Keep current editor dashboard compiling.
- Keep worker live.
- Keep ScorePlay writes held.
- Keep live posting disabled.
- Keep real Tottenham replay working.

## Step 2: Add publication lifecycle
This is the bridge between editor and fan app. Without it, the fan app risks reading drafts or raw match footage.

Deliver:
- publication tables,
- publication current-state helper,
- publish/withdraw server actions,
- tests for draft/withdrawn/expired exclusion.

## Step 3: Add fan app with stubbed catalog
Build the UI while backend solidifies.

Deliver:
- `/fan`,
- demo personas,
- preferences,
- feed cards,
- empty states,
- no search yet.

## Step 4: Wire fan feed to publication catalog
Deliver:
- actual feed query,
- fan ranking,
- reason chips,
- two profiles with different ordering.

## Step 5: Add fan search over published derivatives only
Deliver:
- Marengo scoped search,
- post-validation,
- no-results handling,
- playback from approved derivative only.

## Step 6: Package approved clips for social and the fan app
Deliver:
- channel selection and per-destination editing/previews,
- channel-specific cuts, sizes, safe zones, captions and copy,
- independent approved variant renders,
- automatic ScorePlay source logs and output uploads with retry/status,
- explicit publication of the app rendition; social export without automatic external posting.

## Step 7: Add compilation support
Deliver:
- simple three-clip montage plan,
- render through current FFmpeg pipeline,
- publish as a fan catalog item.

## Step 8: Consider OpenCut
Only after the above works.

Deliver:
- short-clip import proof,
- trim/reorder/save proof,
- server render parity proof,
- or explicit deferral.

---

# Flagship demo story

**Outside signal → hot clip → editor packaging → ScorePlay enrichment → personalized fan experience.** Show one canonical moment through the complete loop, carrying the same source, clip, approval and rendition IDs throughout.

1. **Opportunity appears:** an authorized outside signal spikes around a player/play. The Act now card identifies the matching footage, explains why it matters and shows source, age and LIVE/REPLAY/FIXTURE mode.
2. **Editor acts:** one click opens a playable draft. The editor checks player metadata and evidence, adjusts the cut and approves the exact revision.
3. **One clip, relevant destinations:** the publisher/editor previews and prepares the appropriate social and app cuts/sizes with per-output progress.
4. **ScorePlay gets richer:** show the automatic source timeline log and completed output assets with reviewed tags and source/revision links. Display actual provider IDs for completed writes; held/simulated work is visibly labeled and is not presented as a successful live sync.
5. **Fans see the result:** explicitly publish the app rendition. Fan A sees it promoted for a favorite player; Fan B sees a different order driven by interests over the same eligible catalog. Both views explain the match to preferences.
6. **Find it again:** a natural-language fan query finds the approved derivative and plays the relevant point. End with the source-to-output lineage connecting the fan clip back to the enriched ScorePlay library.

Target a three-minute primary walkthrough. Use a pre-rendered, accurately labeled continuation if processing takes longer; never imply background work finished before confirmation. Keep rights-block, withdrawal, failure recovery and compilation demonstrations as follow-up proofs so the main story remains clear. This is the demo contract; implementation readiness must be verified end to end.

# Acceptance checks

1. Editor can reset and replay the real Tottenham timeline.
2. Editor can inspect a candidate, see why it was selected, see why alternatives were rejected, trim/copy, approve and render.
3. ScorePlay writes are visibly held unless enabled after sign-off.
4. A prepared approved clip can be published to the fan catalog.
5. Fan A and Fan B see different feed ordering from the same catalog.
6. Fan search returns only approved published derivatives, never raw full-match footage.
7. Withdrawn clip disappears from feed, search, detail and new playback.
8. A blocked or unknown-rights clip cannot publish to the fan app.
9. A three-clip compilation can be approved, rendered and published.
10. Hosted demo remains event-only, simulated/live labels stay visible, and no external club-content posting happens by default.
11. Approval automatically queues the ScorePlay source log; eligible finished renditions upload automatically. No per-clip manual sync step exists. Held/failed writes are visible and retries do not duplicate records.
12. Publisher/editor can turn one approved clip into all relevant social and fan-app variants, edit their cuts/framing/copy, approve changed revisions and render them together.
13. Each variant passes its own destination limits and rights checks. App publication/search/playback references the approved app rendition; retrying one failed social rendition does not rerender successful outputs.
14. Every published clip has reviewed, versioned metadata from ScorePlay plus time-scoped TwelveLabs evidence. Verified featured-player and interest IDs drive preferences; whole-match rosters and uncertain identities cannot create false favorite-player matches.
15. Trim/crop changes, compilation chapters and metadata corrections preserve accurate clip-level attribution across renditions. Correcting identity refreshes feed/search metadata without leaving stale personalized results.
16. Admin UX passes desktop/laptop visual QA, keyboard workflows, autosave/recovery and state-preserving live refresh; hot alert → playable review takes one click when the draft is ready.
17. Authorized external signals highlight the correct hot clip with source, age, momentum baseline and why-now evidence. Duplicates and stale signals are suppressed, unavailable feeds are explicit, and rights-blocked clips stay blocked regardless of urgency.

---

# Current codebase reuse checklist

Before adding anything new, check these files first:

- `web/app/page.tsx`
- `web/components/review-pane.tsx`
- `web/components/opportunity-card.tsx`
- `web/components/demo-controls.tsx`
- `web/lib/actions.ts`
- `shared/db-schema.ts`
- `shared/clients/scoreplay.ts`
- `shared/clients/twelvelabs.ts`
- `shared/compliance.ts`
- `shared/content-rules.ts`
- `shared/storage.ts`
- `pipeline/worker.ts`
- `pipeline/moment.ts`
- `pipeline/watchlist.ts`
- `pipeline/render-local.ts`
- `pipeline/channel-profiles.json`
- `data/replays/thfc-mnu-week6.json`
- `data/footage-map.json`
- `docs/TAXONOMY.md`
- `docs/fan-app-and-search.md`
- `docs/opencut-integration.md`

If a task can be done by extending one of these seams, do that before adding a new service or framework.
