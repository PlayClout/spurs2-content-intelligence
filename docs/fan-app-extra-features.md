# Spurs² AI — Fan App Extra Features Design

**Status:** Proposed addendum · **Date:** October 22, 2026

**Scope:** Fan-facing experience and its supporting services only

**Source of truth:** [design.md](../design.md), existing fan/publication architecture, and [fan-app-and-search.md](fan-app-and-search.md)

**Non-goal:** Changing the editor dashboard, auto-clipper, rights-review UI, production montage maker, channel packaging, or ScorePlay write-back workflow

## 1. Product objective

Extend the existing personalized fan app from a feed-and-search destination into an interactive club-content experience. Fans should be able to discover a player's repeated signature actions, understand patterns in a player's or team's play, and turn approved moments into club-safe stickers and memes inspired by current conversation.

The editor product does not change. It continues to discover, review, approve, render, package, and publish clips. These extra fan capabilities consume its published, versioned, rights-eligible derivatives and their reviewed metadata, not draft opportunities or unrestricted match footage.

One-sentence product story: The editor engine produces trusted club media; the fan app makes that media searchable, explainable, personal, and culturally shareable.

## 2. Boundaries and design principles

1. Fan-only UI. New routes and components live under /fan. No extra editor panes, queues, or approvals are added to /.
2. Published catalog is the boundary. All fan search, preview, statistics, still-frame capture, montage playback, and exports must pass the existing canViewPublication(viewerContext, publicationVersion) gate. A fan's request cannot expose raw ScorePlay footage, unapproved source segments, expired renditions, or a draft.
3. Semantic match is not verified fact. TwelveLabs can retrieve visually similar actions, but a result is a candidate until its action/player/event identity has adequate metadata or validation. Jockey-generated categories and summaries carry evidence and confidence, not an assumption of correctness.
4. Avoid misleading statistics. Counts must state the analyzed sample, coverage period, inclusion criteria, and whether labels were AI-inferred, reviewed, or verified against official statistics. Do not extrapolate an archive sample to an entire player's season.
5. Fan art must remain authorized. Sticker and meme output must be derived from publication versions and templates cleared for that use and destination. New outputs that materially change the approved content follow existing version/approval requirements; fan inputs cannot bypass them.
6. Honor hackathon constraints. Keep club media on local worker machines, no public posting by default, and maintain the locked event-only demo. X inputs may be live only with authorized access; otherwise visibly show replay/seeded signals.

## 3. New fan features

### F1 — Signature Moment Finder

**Fan problem:** A fan remembers a head-tap celebration, unusual dunk finish, iconic block, or recurring player pose, but cannot find all the similar moments across matches.

**Experience:** On a published clip, tap Find similar moments or search a description such as “Wembanyama chase-down blocks,” “head-tap celebrations,” or “Solanke's recurring celebration.” The app returns approved moments, grouped by player, action, and event, with preview thumbnails and the relevant playback offsets. Optionally use a selected, already approved frame as an image-search reference.

**Search strategy:**

- Marengo: Use natural-language, reference-image, or combined text+image retrieval to locate similar visual actions across eligible indexed publications.

- Pegasus: Describe candidate windows or extract action tags where needed; use the description to help explain matches.

- Jockey (optional orchestrator): Cluster, label, and summarize a collection of retrieved moments, e.g. “three different games featuring the same celebration.” Never treat its narrative alone as proof that two clips depict the same event.

- Our backend: Validate publication permissions, player association, matching source ranges, duplicate grouping, and playback mappings before display.

**Output:** Signature collection cards (e.g., Blocks, Dunks, Head taps, Goal celebrations) backed by eligible published clips.

**MVP:** Text search + one seeded signature collection + a Find similar button. If approved derivatives are not yet indexed, use a clearly labeled catalog-metadata fallback rather than querying or exposing unapproved source video to fans. Reference-frame matching and automated clustering may be added if the available index supports them.

### F2 — Duplicate-aware recurring moment collections

**Fan problem:** Multiple camera angles and alternate exports of one event can make a collection repetitive; similar signature celebrations from different matches should instead feel like a discovery.

Two distinct cases:

| Case | Detection evidence | Fan behavior |
| --- | --- | --- |
| Duplicate event / alternate angle | Same source event ID or overlapping source-time range; corroborating visuals if needed | Show once by default; offer See other angles |
| Recurring signature across different events | Different match/event identifiers, but a high-similarity action/pose and verified identity | Group into a signature collection; keep every distinct moment |

**Design decision:** Marengo retrieves lookalikes; deterministic source identity/time overlap is the first duplicate signal; Jockey can explain or categorize repeated patterns. Do not dedupe solely because embeddings are similar—two genuinely different dunks may look alike.

**MVP:** Group source-linked alternate exports of the same play and preserve distinct plays. Advanced cross-game clustering is P1.

### F3 — Player Play DNA

**Fan problem:** Highlights show exciting plays, but do not make a player's recurring styles easy to explore visually.

**Experience:** A player page gains a Play DNA section with categories such as dunks, layups, pull-up jumpers, blocks, assists, celebrations, and signature poses, depending on the sport. Selecting a category reveals supporting approved clips. The prominent stat is phrased as “Most-seen action in the analyzed clips” unless complete, verified event data supports a stronger claim.

**Pipeline:**

1. Retrieve a permission-filtered set of approved clips for a player and date range.
2. Reuse reviewed clip-level player identity and event metadata; use TwelveLabs candidate labels only when clearly distinguished.
3. Deduplicate source events so alternate camera angles do not inflate counts.
4. Aggregate category counts with denominators and coverage notes, e.g. “8 of 26 categorized scoring clips in this indexed sample.”
5. Make every number explorable through the eligible source clips.

**Statistics contract:** count, denominator, dateRange, catalogCoverage, sourceType (reviewed_catalog / official_feed), confidence, and linked publicationVersionIds.

**MVP:** A single player profile and 3–5 visually distinct categories, derived from a clearly labeled sample. Do not imply these are complete NBA or Premier League season statistics.

### F4 — Team Play DNA / How They Win

**Fan problem:** Fans want to know how their team tends to score or create decisive moments, not just the result.

**Experience:** A team page has an In Wins explorer. Examples: counterattacks, set pieces, through-ball combinations for football; transition scores, pick-and-roll finishes, second-chance points for basketball. Each category includes a short explanation and verified example clips.

**Guardrail:** The phrase “number one way to win” is too causal for a small highlight archive. Display “Most frequent observed scoring pattern in analyzed wins” and show the match sample and any missing footage. A genuine win/loss comparison requires verified match results, complete or sufficiently representative event data, and an explicit methodology; it cannot be inferred from a few edited highlights.

**MVP:** One sport-specific, explicitly sampled visualization and a drill-down to clips. Verified comparative win/loss analytics are a later stage.

### F5 — Auto Frame Picker for Stickers and Memes

**Fan problem:** The funniest expression or most recognizable pose may last only a fraction of a second. Fans should not need editing software to extract it.

**Experience:** From an approved clip or signature collection, choose Make sticker or Make meme. The system suggests several frames around a verified target action: dunk apex, block extension, head tap, post-goal celebration, or crowd reaction. Fans choose a suggested pose, select an approved style/template, and preview an image or looping reaction where rights permit.

**Pipeline:**

1. Take approved publicationVersionId plus a bounded event/window inside that derivative.
2. Use TwelveLabs to locate semantically relevant time windows; do not claim it delivers pixel-accurate body joints or perfect single-frame extraction.
3. Use local frame sampling with FFmpeg around candidate timestamps, then rank stills by sharpness, subject visibility, motion/pose fit, and safe framing.
4. Crop or optionally segment the subject locally. Apply club-approved sticker borders, captions, and background templates.
5. Recheck derivative/template/destination eligibility. Make downloadable/shareable only those finalized outputs approved for that form of use.

**MVP:** Generate a few candidate stills for one approved moment and apply pre-cleared sticker/meme templates. High-quality automatic segmentation or animated GIFs are stretch goals.

### F6 — Trend-inspired Fan Studio (X)

**Fan problem:** Fan culture reacts to current jokes, trends, and player expressions faster than static official content pages update.

**Experience:** A Trending Inspirations area proposes club-relevant prompt cards based on authorized X signals or clearly labeled demo fixtures. Example: “Fans are talking about a head-tap celebration — explore matching approved celebrations.” The fan opens an existing signature collection and chooses a pre-approved sticker or meme style.

**Pipeline:** Authorized X trends/signals → normalize terms and club/player entities → detect relevant signatures → fetch eligible approved moments → choose pre-cleared template/caption → fan preview/export if permitted.

**Rules:**

- Don't copy X images, tweets, or third-party memes into outputs without separate permission. Trend terms are inspiration/discovery signals, not media licenses.

- Don't present an unverified rumor, false player claim, or unsupported statistic as fact.

- The hackathon demo may use seeded trend fixtures; explicitly label them REPLAY or SIMULATED.

- Don't accept arbitrary fan prompts that generate new, publishable club media outside the existing approval/versioning process. For P0, use editorially pre-cleared assets and caption packs.

**MVP:** Two seeded trend cards connected to two existing signature searches, plus one pre-cleared fan art template.

## 4. How the components fit together

```text
EXISTING EDITOR PIPELINE — UNCHANGED
ScorePlay source → TwelveLabs discovery → editor review/rights
→ approved app derivative → published catalog → ScorePlay lineage/write-back
                                                 |
                                                 v
NEW FAN FEATURES (all server-side queries are permission-filtered)
  ├─ Signature Finder: Marengo text/image similarity + optional Jockey themes
  ├─ Duplicate vs. recurrence: source identity + time overlap + semantic evidence
  ├─ Play DNA: reviewed clip metadata → deduplicated aggregate → linked examples
  └─ Fan Studio: approved clip → action window → local frame picker
                  + permitted trend prompt → pre-cleared sticker/meme template
                                                 |
                                                 v
                     Personal fan pages, search, previews, and exports
```

**Technology responsibilities:**

| Component | Responsibility |
| --- | --- |
| ScorePlay | Canonical source identity and media metadata; approved output provenance and existing write-back. No new editor workflow. |
| TwelveLabs Marengo | Retrieve similar actions and poses using visual, text, or combined queries; candidate retrieval, not definitive event identity. |
| TwelveLabs Pegasus | Time-scoped action description, suggested labels, and interpretable context for candidate segments. |
| TwelveLabs Jockey | Optional corpus reasoning and themed grouping of repeated actions; not the authoritative duplicate-ID source. |
| Supabase / Drizzle | Fan preferences, permission-scoped metadata, pattern groups, aggregates, and fan artifact records (no video/image bytes). |
| Local FFmpeg worker | Sample stills and render approved derivative-based fan art without uploading club media to new cloud storage. |
| Authorized X signal source | Inspiration and trend metadata; never a substitute for verified club footage or rights. |

### Critical integration constraint

The existing TwelveLabs/ScorePlay mapping covers Tottenham footage; the project plan notes that Spurs/NBA material is not yet present in the provided TwelveLabs index. Build the end-to-end real-video demo around indexed Tottenham media, with NBA examples explicitly labeled mock/demo until available. Marengo search operates within an index per request; do not imply one query searches every club's independent index.

## 5. Suggested fan routes and modules

New or extended routes (all nested in the existing locked Next.js app):

- /fan/signatures — action/pose search and discovery collections.

- /fan/signatures/[id] — similar approved moments, alternate angles, and related players.

- /fan/players/[id] — extend existing player page with a Play DNA tab.

- /fan/teams/[id] — sampled team play patterns and in-wins explorer.

- /fan/studio — frame picker, sticker/meme templates, and trend inspirations.

**Suggested shared modules:** shared/fan-signatures.ts, shared/fan-patterns.ts, shared/fan-stats.ts, shared/fan-art.ts, shared/fan-trends.ts. Reuse shared/fan-search.ts, shared/publication.ts, the existing ScorePlay/TwelveLabs clients, shared/db-schema.ts, and the local render worker. Jockey should sit behind an optional adapter with a deterministic/manual grouping fallback.

## 6. Minimal data additions

Add these only after the existing publication/version schema works:

| Entity | Essential fields |
| --- | --- |
| fan_signature | id, clubId, sport, label, actionType, referencePublicationVersionId, referenceFrameOffsetSec, status |
| fan_signature_match | signatureId, publicationVersionId, startSec, endSec, playerId?, eventKey?, semanticScore?, evidence, verificationState |
| fan_pattern_group | id, clubId, kind (same_event/recurring_signature), memberIds, explanation, coverage |
| fan_stat_snapshot | subjectType, subjectId, categoryCounts, denominator, coverage, dateRange, sourceType, updatedAt |
| fan_art_template | id, clubId, format, approvedCopy, approvedStyles, allowedDestinations, rightsPolicyVersion |
| fan_artifact | id, sourcePublicationVersionId, frameOffsetSec, templateId, renditionPath, status, eligibility |
| fan_trend_signal | id, provider, term, matchedEntities, observedAt, mode, evidenceRef, expiresAt |

No raw footage or frame blobs in Postgres. Store only metadata and local render paths. Cache semantic candidate matches with publication-version IDs; invalidate them on withdrawal, expiry, metadata correction, or replacement.

## 7. Build plan and priorities

### P0 — Credible hackathon demo

1. Signature Finder: text-based signature search over indexed published Tottenham derivatives if ready; otherwise a clearly labeled reviewed-metadata fallback. Distinguish same event vs different event.
2. Player Play DNA: one labeled, small-sample chart with an explicit denominator and clickable evidence clips.
3. Frame-to-sticker: one approved clip → suggested frame → pre-cleared template → local preview.
4. Trend inspiration: one visibly simulated X trend mapped to an approved signature collection.
5. Safety checks: withdrawn, expired, wrong-club, and non-published versions never appear in fan search or artifact export.

### P1 — Showcase extension

- Reference-frame/image + text search; richer recurring-signature clustering.

- Jockey thematic grouping and explanations; fan-facing alternate-angle grouping.

- More player categories and one explicitly sampled team Play DNA view.

- Multiple caption styles, cropped stills, optional local segmentation.

### P2 — Commercial/product exploration

- Authorized live trend provider; stronger verification and moderation.

- Licensed official stats/event feeds and robust match-level coverage for team analysis.

- Additional club-specific indexes, templates, and rights policies.

- Product analytics for which collections fans discover or save; no new production-dashboard UI assumed.

## 8. Fan demo script (60–90 seconds inside the 10-minute presentation)

Example A: Tottenham (real indexed media).

1. From the existing feed, open an approved celebration clip.
2. Tap Find similar: Marengo retrieves eligible, visually similar celebrations; the UI groups different moments separately from alternate versions of the same play.
3. Open the player's Play DNA: show one recurring action count, the denominator, and the clips behind it.
4. Open Make sticker: suggest frames at the pose, select an approved template, preview the result.
5. Show a SIMULATED X trend linking to that signature collection and a pre-cleared meme.

Example B: San Antonio (concept only unless NBA indexing is operational). A basketball tab illustrates the same search and frame-picker interaction for a dunk or block, making the cross-sport product vision clear without claiming unimplemented live integration.

**Demo payoff:** The same trusted clip that the production team approved becomes searchable, statistically explorable, and usable in fan culture—without reopening raw footage or bypassing rights.

## 9. Acceptance tests

- [ ] Fan-only UI: no editor route/component or editorial workflow changes required.

- [ ] Signature search returns only valid, currently published, club-eligible versions.

- [ ] A removed/expired publication vanishes from collections, player stats drilldowns, and new frame exports.

- [ ] Alternate exports of one event do not increase the signature/stat count; separate recurring events remain distinct.

- [ ] Incorrect or ambiguous player identity is never silently assigned to a favorite player.

- [ ] Play DNA always identifies the sample period, denominator, and evidence/source type.

- [ ] Team in-wins insights never claim causal "ways to win" from small highlight samples.

- [ ] Generated still is sampled only from an authorized approved derivative, not a raw video.

- [ ] All downloadable sticker/meme combinations use approved sources, permitted templates, and eligibility checks; arbitrary unapproved derivative creation is blocked.

- [ ] X trend cards explicitly distinguish real authorized inputs from seeded/replayed signals.

- [ ] Local-only media, demo lock, and no-external-posting constraints hold.

- [ ] Works with no Jockey access and no live X feed via clearly labeled deterministic fixture fallback.

## 10. Exclusions and open questions

**Explicitly excluded:** New editor features, player/team statistics asserted as complete without official data, training a new pose-estimation model, instant public fan clip generation from raw footage, reposting X memes, social posting without permissions, and cloud storage of event footage.

**Decisions to validate after the P0 demo:** (a) whether the supplied TwelveLabs index permits image/composed search for the available videos; (b) whether Jockey is enabled for the relevant media/corpus; (c) which app destinations permit club stills/stickers, and whether any template variants require explicit editorial sign-off; (d) what official scoring/result feeds and rights exist for reliable team analytics; (e) whether X signal ingestion is live-authorized or replay-only.

## 11. Technical references

- Existing project specification: [design.md](../design.md); build plan and fan publication requirements in [fan-app-and-search.md](fan-app-and-search.md) and the Spurs² AI task breakdown.

- TwelveLabs Marengo search (text/image/composed): https://docs.twelvelabs.io/docs/guides/search/search-with-text-and-image-queries

- TwelveLabs Jockey concepts: https://docs.twelvelabs.io/v1.3/agents/concepts/jockey

- TwelveLabs Sports Jockey sample: https://docs.twelvelabs.io/docs/resources/sample-applications
