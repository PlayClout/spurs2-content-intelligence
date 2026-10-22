# Spursx2 AI: Workflow & Architecture Review

Spurs² Hackathon, Challenge 1 (Assisted Auto-Production Engine)
Prepared by Hermes for Stu + Nate, 2026-10-20. **Status: DRAFT for agreement. Nothing built yet.**

Evidence labels used throughout:

- **VERIFIED-DOC**: read directly in vendor docs or the vendor's published OpenAPI spec today. Not yet exercised with a key.
- **VERIFIED-RUN**: executed on the M5 today.
- **ASSUMPTION**: reasonable inference, must be confirmed.
- **GAP**: not offered by the vendor; we build it or simulate it.

---

## 0. What changed since the spike report

The review overturned four things in `api-spike-report.md`:

1. **ScorePlay is not a black box.** The full OpenAPI 3.0.3 spec (91 operations, 101 schemas) is publicly downloadable at `developer.scoreplay.io/downloads/scoreplay.yaml`, plus a Postman collection. We can build the real ScorePlay adapter before Thursday. Only the key is gated.
2. **ScorePlay already models "moments".** *Video logs* are timestamped actions on a video ("a goal, a save or a substitution, whether logged by hand or produced by a data feed"). We can read them, and we can write TwelveLabs detections back as video logs. ScorePlay then generates a thumbnail, a scrub sprite and an HLS preview of that clip. This is the natural integration point and the strongest "we built inside your workflow" story.
3. **ScorePlay exposes real rights fields on every media item**: `usage` (e.g. "editorial"), `custom_terms`, `accessible_from/until`, per-account DRM windows, `can_be_shared`, `validated`, `is_private`. The rights badge can read real data, not just our invented rules.
4. **TwelveLabs billing changed on 2026-10-15.** New signups start on the *new* billing. The "600 free minutes" in the spike report is the *legacy* Free limit. New Free = 3 GB storage plus a "Basic" monthly workload allowance that the pricing page does not quantify, and **no overage**. We do not know how much footage the free tier will process until we sign up and read Billing & Plans.

---

## A. Recommended product workflow

### Verdict on the proposed order

Signal → Opportunity → Strategy → Approval → Production → Distribution → Measurement is the right *story* but the wrong *engine order*. Three changes:

**Change 1 (REVISED 2026-10-20 late, Stu agreed): Moment-first, triggered from any of three inputs.** The first draft said "understand every asset as it lands". That was too much. The brief asks the engine to *decide which new content to make*. That decision is demand-driven: something happened, fans care, and we have footage of it. Analyzing the whole library first is supply-side and recreates the producer's noise problem. Reasons:

- Most of the "thousands of assets per game" are **photos**. ScorePlay already tags them (players, sponsors, match, timestamp). TwelveLabs is video AI; running it over every photo duplicates ScorePlay's work.
- **Targeted questions get better answers.** Asking about the 60 s around a goal (in/out points, who is in frame, crop position, music or crowd close-ups) beats a generic whole-match pass, and it is faster.
- Cost is real but secondary (a match of video is a few dollars to analyze at list price). The main arguments are relevance and latency.

What does still happen on arrival: **every video is indexed** (cheap background step). Search only works on indexed footage, and indexing takes ~30 to 40% of the clip's length, so waiting for a signal before indexing would make the moment cold.

The engine starts from a **moment**, created or strengthened by any of three triggers, mapping 1:1 onto the brief's three inputs:

| Trigger | Source | Cost |
|---|---|---|
| Live data | Game event feed, or ScorePlay video logs (their data-feed actions) | Free |
| Fan reaction | Social volume spike around a player or event | Cheap |
| What the AI sees | A short standing **watch list** of searches over new footage every few minutes (celebration, crowd eruption, bench reaction, emotional close-up) | Cheap |

The watch list keeps the AI's unique value (moments no data feed logs) using cheap searches, not deep analysis. Deep analysis runs **per moment, on that window only**, for the top-ranked few.

**Change 2: Rights is a gate, not a badge.** Check it twice:

- At *eligibility* (does this moment even get recommended, and for which channels?).
- At *publish* (windows expire; re-check at click time).

**Change 3: Approve drafts, not plans.** Generate cheap drafts before approval for the top few opportunities only. "The producer approves rather than searches" only works if they are looking at the actual thing.

### Recommended engine order

```
0 INDEX        every new video indexed on arrival (cheap plumbing; photos already tagged by ScorePlay)
1 TRIGGER      live data event | fan-reaction spike | AI watch-list hit  -> create/strengthen a Moment
2 MERGE        triggers pointing at the same play merge into one Moment (dedupe key below)
3 RANK         game importance x fan heat x footage quality x freshness; top few per period move on
4 GATHER       top few only: ScorePlay photos (player + time window) + matching video;
               TwelveLabs search for exact seconds; deep TwelveLabs analysis on THAT window
               (timestamps, crop position, rights flags, caption facts); optional image analysis
               (<=20 photos/call) to pick the best shot
5 RIGHTS GATE  eligible channels/territories per moment (hard filter)
6 STRATEGY     per audience: format, channel, timing, copy
7 DRAFT        render drafts automatically (ffmpeg, local, ~seconds): 9:16 clip + photo card
8 APPROVE      producer: approve / trim / edit copy / reject-with-reason
9 DELIVER      write back to ScorePlay + export package + publish (X live; other channels SIM)
10 LEARN       store every approve/reject/edit; performance data later
```

Order in one line: **what happened that fans care about → what do we have that shows it → what should we make, for whom.** The engine does the searching; the producer approves.

Story for judges (unchanged): **finds the moment → understands the opportunity → recommends the strategy → produces the content → producer decides.**

### Answers to the ten architecture challenges

| # | Question | Recommendation |
|---|---|---|
| 1 | Is the order right? | Not as an engine order. Use the moment-first order above. |
| 2 | Analyze footage with no external signal? | **Index yes, deep-analyze no.** Every video is indexed on arrival. The "no external signal" case is covered by the AI watch list (cheap standing searches), which can create a moment on its own. Deep analysis only runs per moment, for the top-ranked few. |
| 3 | Draft before approval? | **Hybrid.** Auto-draft the top 3 to 5 opportunities, because our render is local ffmpeg (VERIFIED-RUN: a 9.6 s vertical clip renders in 1.5 s) and costs nothing. Anything with real marginal cost (paid generation, voice, partner render) waits for approval. Rule: draft when the cost of drafting is below the cost of the producer's attention. |
| 4 | Separate gates for production and distribution? | **One screen, two steps.** *Approve* locks the creative. *Publish/Schedule* is a second, lighter confirm that re-runs the rights check. Commercially: an amber rights verdict needs a second approver (rights/comms). Green needs one. |
| 5 | How to correlate data, social, video? | One **match timeline in wall-clock time**. Sports events have wall time (or game clock plus a kickoff anchor). ScorePlay converts unix timestamps to video offsets using each media's start timecode (VERIFIED-DOC). TwelveLabs gives offsets within a media. Social spikes are bucketed per minute and attributed to the event in the prior 30 to 120 s window, boosted on player-name match. Output: one `Moment` with an `evidence[]` list, each item tagged real or simulated. |
| 6 | How to rank without noise? | Explicit score with a **budget**, not a threshold alone. Max K live cards per period (e.g. 5 per half or quarter); everything else goes to a backlog the producer can open but is never pushed. Hard filters first (rights red, footage quality too low). Freshness decay per format. Saturation penalty for near-duplicates already approved. |
| 7 | Event-driven vs async? | **Event-driven**: asset landed, sports event arrived, social spike, producer action. Each just re-scores. **Async workers**: TwelveLabs indexing/segmentation, rendering, write-back. The UI never blocks on an AI call. |
| 8 | Duplicates, staleness, cost? | Dedupe key = (match, event id or 15 s time bucket, primary player). A new trigger *merges* into an existing moment instead of creating a card. Audience variants are children of one moment, not separate cards. Index each `(media_id, version)` once; deep analysis only per ranked moment window, cached by `(media_id, start, end)`. Cards carry a TTL per format (live reel ~30 min, recap 24 h) and auto-expire. |
| 9 | Rights enforcement? | A pure function: `(ScorePlay rights fields + TwelveLabs detected content + club rules) → verdict per channel x territory` with rule IDs and plain-English reasons. Enforced at eligibility, at render (e.g. auto-mute when music is detected), and at publish (re-check; the button disables on red). |
| 10 | Simplest credible architecture? | Nova's existing stack: Next.js UI + Postgres (Supabase, already seeded) + one local Node worker polling the `jobs` table + ffmpeg + adapters with live/fixture (MOCK_MODE) modes. Section C. (Earlier SQLite suggestion withdrawn: the seeded Postgres and working UI beat it.) |

---

## B. Technical capability matrix

### ScorePlay (source: public OpenAPI spec + developer docs, fetched 2026-10-20)

| Capability | Status | Detail |
|---|---|---|
| Auth | VERIFIED-DOC | `X-ScorePlay-Api-Key` header. Base `https://media.scoreplay.io/v1` (dev: `media.dev.scoreplay.io/v1`). `GET /whoami` returns the key's rights and scope (team ids, sponsor restriction, only-validated). Key issued by a CSM. |
| Search media | VERIFIED-DOC | `POST /media/search`: photo/video, event ids, tags/players/sponsors with AND/OR/NOT, date ranges, `transcript_query`, `is_live`, `is_growing_media`, relevance ordering, cursor pagination. `GET /tag/search` resolves names to ids. |
| Events (matches) | VERIFIED-DOC | `POST /event/search`. Events have `external_id`, `league_api_id`, start/end datetimes. |
| Download originals | VERIFIED-DOC | `GET /media/{id}/formats/download`: presigned URLs valid 24 h, best file per type (original, video_large/medium/small...). Requires the `can_do_media_download` permission on the key. |
| Clip-able sources | VERIFIED-DOC | `GET /media/{id}/formats/clip` also lists HLS playlists. |
| Timestamped moments (video logs) | VERIFIED-DOC | `POST /video/logs` (offset or unix modes, comment, tags, players), `GET /media/{id}/logs`, `POST /video/logs/search`. ScorePlay generates `thumbnail_url`, `sprite_url`, `playback_url` (HLS clip preview) per log. Docs say logs can come "by hand or produced by a data feed". |
| Upload new assets | VERIFIED-DOC | `POST /upload/event/{id}` (multipart presigned) → `POST /upload/complete/{id}`. New versions: `POST /media/{id}/versions`. Our generated clip can live in ScorePlay next to its source. |
| Metadata write | VERIFIED-DOC | `PUT /media/{id}/details` (description, availability window, timecode), `POST/DELETE /media/{id}/tags`. |
| Rights / usage fields | VERIFIED-DOC (semantics ASSUMPTION) | `usage`, `custom_terms`, `accessible_from/until`, `external_accounts_drms[]` (window per external account), `can_be_shared`, `is_private`, `validated`, `permissions[]`, `available_user_type_ids`. **What Spurs actually populates is unknown.** |
| Transcripts | VERIFIED-DOC | `GET /media/{id}/transcripts`: timecoded segments with speaker labels, multiple languages. |
| Image transforms | VERIFIED-DOC | `POST /media/{id}/generate/dynamic_url` → CDN URL with `w`, `h`, `fit`, `f=face` (face-aware crop), `fmt` (webp/avif). Max 4096 px, 6 MB input. Ideal for photo assets in 9:16, 1:1, 4:5. |
| Webhooks | VERIFIED-DOC | Events: `media.create`, `media.proxy.create`, `media.update`, `media.delete`, `media.transcript.*`, `video_log.created/updated/deleted`, `manual.trigger`. Configured in the ScorePlay UI (needs Webhooks permission), not via API. Minimal payload (ids only). 10 s timeout, 3 attempts, no dead-letter queue, unsigned (use bearer auth), **localhost rejected** (needs a public tunnel). |
| Live recording | VERIFIED-DOC | Stream schedules, `is_live`, `is_growing_media`. Media can exist while still recording. |
| Delivery | VERIFIED-DOC | Bring-your-own storage (S3, Wasabi, GCS, SMB). |
| Rendered clip export | **GAP** | No public endpoint that renders a clip file. `clips[]` exists on media and Operations can *track* "clip generation", but creation is not exposed. **We render with ffmpeg.** |
| Social publishing | **GAP** | No social posting endpoints in the API. Do not claim ScorePlay publishes. |
| Rate limits | **GAP** (undocumented) | Not in the spec. Ask on site. |
| Hackathon org content | UNKNOWN | Whether the hackathon org has real Spurs/Tottenham assets, populated rights fields, or data-feed video logs. |

### TwelveLabs (source: docs.twelvelabs.io v1.3, fetched 2026-10-20)

| Capability | Status | Detail |
|---|---|---|
| Natural-language moment search | VERIFIED-DOC | Marengo 3.0 `POST /search`: text/image/composed queries, returns `start`/`end` seconds plus rank. **The index must use Marengo 3.0.** Marengo 3.5 is not supported by `/search`. |
| Sports understanding | VERIFIED-DOC (claim) | Marengo 3.0: "improved recognition of soccer and basketball actions". Logo and small-object detection down to ~10% of frame. Music/sound understanding. |
| Structured analysis | VERIFIED-DOC | Pegasus 1.6 `analyze` with `response_format: json_schema`. Sync ≤ 1 h video; async ≤ 2 h. Context window 261k tokens. |
| **Segmentation** (best fit) | VERIFIED-DOC | Pegasus 1.6 async, `analysis_mode: time_based_metadata`: up to 10 segment definitions, 20 typed fields each (`timestamp`, `time_array` for in-segment events, enums), min/max segment duration (min 2 s), **up to 4 reference images per definition** (player headshot, sponsor logo). Returns non-overlapping segments with `start_time`/`end_time` in seconds plus our fields. No free-text prompt in this mode. |
| Boundary precision | ASSUMPTION | Not quantified anywhere. Keep the ±1.5 to 2 s pad; producer trims. |
| Find specific players | VERIFIED-DOC | Entity search with reference-image collections per team. Legacy Free: 1 collection, 15 entities. |
| Emotion / social-worthy moments without data | ASSUMPTION (likely) | No dedicated "emotion" model. Achieved by describing it in segment definitions ("celebration", "crowd eruption", "bench reaction") or search queries. Quality must be tested on real footage. |
| Analyze without indexing | VERIFIED-DOC | Analyze accepts an asset id, an inline URL (direct raw link, ≤4 GB) or base64. ScorePlay presigned URLs *should* qualify (ASSUMPTION; test day one). |
| Embeddings | VERIFIED-DOC | Marengo 3.0/3.5. Useful later for dedupe and "find similar". Not MVP. |
| Agents / Jockey | VERIFIED-DOC | Knowledge stores plus structured responses; there is a "highlight reel" recipe returning clip refs with `relevance_reason`. Free: 15 responses/day. Nice-to-have, never critical path. |
| Live stream analysis | **GAP** | No native live endpoint (only a partner integration, VideoDB). "Live" means near-live: index each clip as ScorePlay finishes it, then search/analyze on trigger. |
| Indexing latency | VERIFIED-DOC (official FAQ) | "Typically 30 to 40% of the video's duration", slower on Free under load. A 90-min match ≈ 30 to 40 min. Pre-index overnight. |
| Webhooks | VERIFIED-DOC | Indexing and async-analysis completion, registered in the dashboard, signed. |
| Video editing / rendering | **GAP** | TwelveLabs returns timestamps and text "ready for your editing tool or pipeline". **We render.** |
| Free plan rate limits | VERIFIED-DOC | Index 600 min/h, 3,000 min/day; Analyze 1,000 req/day, 60/min, 30k output tokens/min; Search 600/min; Jockey 15/day. |
| Cost at scale (overage list prices) | VERIFIED-DOC (my read) | Pegasus 1.6 input $1.75/video-hour plus $7.50/1M output tokens; Marengo 3.0 index/search about $2.50/hour and $4/1,000 searches. Roughly **$5 to 10 per full match per analysis pass**. Plans: Free $0 (no overage), Plus $29, Pro $99. |

### Other services

| Need | Hackathon choice | Commercial option | Status |
|---|---|---|---|
| Rendering (cut, crop, captions, brand) | Local ffmpeg 8.1.1 + PNG overlays (no `drawtext` in this build) | Same, or Shotstack/Creatomate (~$0.20/render-min) for cloud scale | VERIFIED-RUN |
| Copy generation (captions, titles, per-audience tone) | Anthropic (key on the M5) | Same | Key present |
| Sports data | **Replayed event file** for the demo footage, labeled simulated unless organizers give a feed. ScorePlay video logs if their org has a data feed. | Club's own feed (Opta/Stats Perform for PL; NBA official feed), API-Football or BALLDONTLIE for prototyping | ASSUMPTION |
| Social signals | Simulated fan-reaction feed, labeled simulated (cut #1 anyway) | X API pay-per-use (~$0.005 per post read; spend needs approval), social listening vendor | Spend-gated |
| Brand templates | Club colors/marks in our own overlay templates | Club template library | Build |
| Publishing | **Export package + ScorePlay write-back**. "Publish" labeled simulated. | Ayrshare-type unified API, or hand off to the club's existing scheduler | GAP for MVP |
| Analytics | Capture producer decisions only | Platform insights APIs | Defer |

---

## C. Recommended architecture

### Shape

```
                ┌──────────────── ADAPTERS (each: live | fixture) ───────────────┐
 ScorePlay ───▶ │ ScorePlayAdapter   search, download URL, logs, rights, upload   │
 (webhook/poll) │ TwelveLabsAdapter  index, segment, search  (live | cached JSON) │
 Match feed ──▶ │ SportsFeed         replayed events on a match clock             │
 Fan feed ────▶ │ SocialFeed         simulated spikes (labeled)                   │
                └───────────────┬────────────────────────────────────────────────┘
                                ▼
                   in-process event bus  (asset.ready, moment.detected,
                                          signal.arrived, decision.made)
                                ▼
   ┌────────── ENGINE (one Node/TypeScript service) ──────────┐
   │ Correlator → Scorer → RightsGate → Strategist → Drafter   │──▶ ffmpeg worker
   │            (pure functions, unit-tested, explainable)     │    (clip + photo card)
   └─────────────────────────────┬─────────────────────────────┘
                                 ▼
                Postgres (Supabase, pooler, prepare:false): assets, moments, evidence, opportunities,
                        variants, rights_verdicts, decisions, audit
                                 ▼
                Producer UI (web, PlayClout design system)  ◀── SSE live updates
                                 ▼
        DELIVER: ScorePlay write-back (upload + video log) | export folder | "publish" (simulated)
```

### Core data model (sport-agnostic)

- **Asset**: source media (ScorePlay id or local file), rights fields, analysis status.
- **Moment**: `(match, t_start, t_end, asset, type, players[])` plus `evidence[]`. Each evidence item has a source (twelvelabs | scoreplay_log | sports_feed | social), its payload, a confidence and `real: true|false`.
- **Opportunity**: a moment × audience segment, with a score breakdown, rights verdict, recommended format/channel/timing and TTL.
- **Variant**: rendered asset(s) for an opportunity (file, aspect ratio, caption, copy).
- **Decision**: approve/edit/reject/publish, producer, reason, timestamp. This is the learning signal.

### Sport packs (how one platform serves Tottenham and the Spurs)

Everything sport-specific is config:

- Event taxonomy (goal/assist/save vs dunk/3PT/block/buzzer-beater).
- TwelveLabs segment definitions.
- Importance weights (late-and-close logic per sport).
- Audience segments.
- Brand template.
- Rules file.

The engine, UI and data model are shared. Adding a sport means adding a JSON pack, not building a new workflow. That is the commercial claim, and it holds even if the demo only fully exercises one pack.

### Deployment

- **Live demo runs on the M5**: local service + UI, zero network needed in replay mode with cached TwelveLabs results.
- **Live mode**: the same build with adapters switched to live via env vars.
- **cloudflared tunnel** to the M5 for ScorePlay webhooks (localhost is rejected) and for Nova's remote QA of the live path.
- **Vercel**: a read-only replay deploy from cached data, for Nova's browser QA and as a public fallback link. No ffmpeg on Vercel.
- Supabase Postgres (project quuvzqvgwuqenucaqpqg, transaction pooler) is the DB for both profiles.

### Making "live" legible on stage

A **match replay clock**. Press play on a real match; data events and fan spikes fire at their real times; the AI watch list fires on its own hits; cards appear as moments happen. The footage is pre-indexed and the per-moment TwelveLabs analysis is cached from a real run on the same footage, which is honest: on ScorePlay a clip is indexed as it lands and analyzed when a moment triggers. Label it on screen as "replaying [match], analysis by TwelveLabs (pre-computed for this footage)". Show at least one card with **no data event**, created only by the AI watch list, so judges see all three inputs. Then show one live TwelveLabs call on a fresh short clip to prove it is not canned.

---

## D. Producer experience

**Screen 1: Match Control Room** (the only screen that has to be perfect)

- **Top**: match header and replay clock, score, period.
- **Left rail**: a timeline with event markers (data), detected moments (video), and a fan-pulse sparkline (social, badged SIMULATED).
- **Center**: the **Opportunity queue**, ranked. Each card shows:
  - Headline, e.g. "88' equaliser, [player]", with a priority badge and an expiry countdown ("best within 12 min").
  - **Why this moment**: evidence chips, each showing source and REAL/SIM. Example: "Goal 88' (match feed, SIM)", "Celebration + crowd eruption 00:41:12 (TwelveLabs, REAL)", "+340% mentions (fan feed, SIM)".
  - **Rights badge**: GREEN/AMBER/RED with the top reason ("Owned social only, 48 h"; "Stadium music detected, audio muted").
  - Thumbnail strip of the two audience variants.
- **Right panel** (selected card):
  - **Two variants side by side**, one per audience. Example:
    - *Global casual fans*: 9:16 reel, 12 s, captioned, IG Reels + TikTok, post now.
    - *Core local supporters*: face-cropped photo card with stat line, X + IG Story, post now.
  - Per variant: playable draft, caption and copy (editable), channel, timing, **why this audience**, trim handles (from the padded cut), alternate thumbnail.
  - **Inputs panel**: every input with REAL/SIMULATED and the exact source id (ScorePlay media id, TwelveLabs task id).
  - **Pre-publish check**: per channel × territory, with rule ids.
  - Actions: **Approve** · **Edit** · **Reject (reason)** · **Snooze**.

**Step 2: Publish/Schedule confirm**

- Re-runs the rights check and shows the destination.
- In MVP, "Deliver" does three things:
  - writes the asset back into ScorePlay (REAL if we have a key);
  - drops the export package (files + copy + rights note);
  - records an event-internal simulated export only. Live X/@playclout posting was removed: club media is event-only and @playclout is a separate B2C surface.

**Screen 2: Audit log.** Who approved what, when, with which rights verdict. Executives and rights teams care about this more than engineers do.

---

## E. Hackathon MVP scope

### Must demonstrate (never cut)

1. Replay of one real match on a clock, with assets ingested (local fallback or ScorePlay).
2. TwelveLabs moment detection on that footage (REAL; segmentation cached, plus one live call).
3. A ranked opportunity queue with an explainability panel (why the moment, why the audience, real vs simulated).
4. Two audiences, two different real assets: a **9:16 video clip** and a **photo/graphic card**.
5. Producer approve/edit/reject, then deliver.
6. A rights pre-publish check with rule ids (club rules file plus real ScorePlay rights fields when available).

### Optional, in priority order

1. Live ScorePlay adapter: search, download, write-back of the approved clip as media plus a video log. **Highest-value optional**, because it is the judges' own platform.
2. ScorePlay webhook trigger (`media.proxy.create`) via tunnel.
3. Second sport pack (config swap), per the agreed cut order.
4. Sponsor overlay on assets (agreed cut #3).
5. Simulated social feed (agreed cut #1; cheap to keep as clearly labeled fixtures).

### Explicitly deferred

- Real social publishing.
- Performance measurement and learning.
- Entity search.
- Jockey.
- Embeddings dedupe.
- Multi-tenant and auth.
- Cloud rendering.
- Live X data (spend).

---

## F. Dependencies & blockers

| # | Dependency | Owner | Needed by | Blocks |
|---|---|---|---|---|
| 1 | **Real match footage** (PL and/or NBA) we are allowed to use | Organizers (ask now by email if possible) | Wed night for pre-indexing | Whether the demo shows a real moment. **Biggest risk.** Coverr/Pexels b-roll cannot show a goal. |
| 2 | TwelveLabs account + key; confirm the actual Free allowance on new billing | Stu (or delegate) | **Tue/Wed**, earlier is better | All AI. Index needs Marengo 3.0 + Pegasus 1.6. |
| 3 | Decision on TwelveLabs Plus ($29/mo) if the Free allowance is too small | Stu | Wed | Spend: needs Stu approval |
| 4 | ScorePlay key with `can_do_media_download`, upload into an event, and video-log write rights; sandbox or org with real assets | ScorePlay CSM on site | Thu AM | Real ScorePlay adapter (built against the spec before) |
| 5 | ScorePlay Webhooks permission on our account | ScorePlay | Thu | Webhook trigger (optional; polling works) |
| 6 | Event data matching the footage (timestamps) | Organizers, or we author a replay file from the public match record | Wed | Data evidence (else labeled simulated) |
| 7 | Club brand assets usage OK for generated content (colors, marks) | Organizers | Thu AM | Brand template (club colors fine without marks) |
| 8 | Demo format and time limit, judging criteria | Briefing | Thu AM | Scripted cut of the demo |
| 9 | cloudflared tunnel | Hermes | Thu | Webhooks, Nova live QA |
| 10 | Anthropic key | Have | n/a | None |
| 11 | ffmpeg | Have (VERIFIED-RUN) | n/a | Captions via PNG overlay since no `drawtext` |

---

## G. Open questions (prioritized; each changes a build decision)

1. **Footage**: do we have, or can we get before Thursday, real match footage we are cleared to use? If not, we build on b-roll and the demo moment becomes "training session" or "fan moment" rather than "game-winner".
2. **Lead club for the demo story**: Tottenham or San Antonio Spurs? We fully build one sport pack first. My default: whichever club's footage we get first.
3. **Asset mix**: is "one 9:16 reel plus one photo/graphic card" acceptable as the two assets, or must both be video? I recommend the mix; it proves audience-specific *formats*, not just two crops of one clip.
4. **Approval model**: agree on hybrid (auto-draft the top few, approve the real asset, separate publish confirm)?
5. **TwelveLabs spend**: if the new Free allowance is too small for a full match plus rehearsals, do you approve Plus at $29 for one month?
6. **Who is the producer persona on stage**: a club social producer (speed, format) or a content operations lead (volume, rights)? It changes which panel gets the hero spot.
7. **ScorePlay write-back on stage**: if we get a key, are you comfortable writing into their sandbox live during judging? This is our strongest "inside your workflow" proof, but it is a live dependency.

---

## H. Recommended next steps (sequenced)

**Tonight / Wednesday morning (validate)**

1. Sign up for TwelveLabs. Read the real Free allowance. Create the index (Marengo 3.0 visual+audio, Pegasus 1.6).
2. Ask organizers for footage plus a ScorePlay sandbox/key ahead of time (one email from Nate or Stu).
3. Hermes: run one real segmentation call on a short sports clip and measure boundary drift and latency. This settles the padding and whether "emotional moments" are detected well enough.

**Wednesday (build the spine on fixtures, everything behind adapters)**

4. Worker against Nova's schema (fixture mode) + ffmpeg drafter producing both asset types from a Moment.
5. Real ScorePlay adapter coded against the OpenAPI spec (search, formats/download, logs, upload, rights fields), with a recorded-fixture mode.
6. Rules engine and tests (adapting the rights-desk rules, pending Stu's GO).
7. Pre-index the footage overnight. Run the per-moment analysis for the demo moments and cache that TwelveLabs JSON into the repo's fixtures.

**Thursday**

8. Morning: briefing questions (above plus the API-preflight list). Run `whoami` with the ScorePlay key. Lock scope by 3 PM.
9. Afternoon: producer UI on the PlayClout design system, wired to the engine over SSE; replay clock; explainability panel.
10. Evening: live adapters on; ScorePlay write-back; Nova starts deploy QA and overnight smoke tests.

**Friday**: polish and rehearse; feature freeze 10 AM; Nova records the insurance tape.
