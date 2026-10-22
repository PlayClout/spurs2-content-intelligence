# Personalized fan web app and Marengo search

**Product and implementation handoff · October 22, 2026 · proposed, not implemented**

Read [design.md](../design.md) for the complete production workflow. The fan app is the destination for editor-published clips; it replaces the former stadium frontend. The producer remains the primary operator for the hackathon challenge, and the fan experience demonstrates how one workflow serves different audiences.

**Application form:** a responsive browser-based web app for phones and desktops. The editor dashboard and `/fan` routes are parts of the same product; no native iOS/Android app, app-store release, or install flow is planned. The OpenCut evaluation uses its web editor.

## 1. Two connected surfaces

```text
Incoming footage → analysis → rights / cleaning → editor reviews the exact revision
                                                       ↓
                              render + index prepared final clip → Publish
                                                       ↓
                                         published clip catalog
                                               ↙             ↘
                                  personalized For You     Marengo search
                                               ↘             ↙
                                           permitted playback
```

**Editor Studio:** inspect candidates, correct player/action tags, verify claims, trim, clean, approve, and publish. Approval is a review event. Publishing makes one prepared revision discoverable to its allowed audience. It is a separate state transition.

**Fan app:** follow favorite players, pick interests, receive a personalized feed, browse players and compilations, save clips, and ask for footage in natural language. Fans see published clips and approved captions, not the inspection queue, policy notes, raw footage, or unfinished renders.

Publishing to this frontend means release **inside the authorized hackathon demo environment**. It does not override the builder brief's restrictions on public distribution.

## 2. Fan experience and P0 scope

1. **Onboarding:** choose club and favorite players from the canonical roster; choose interests such as goals/dunks, skills/assists, defending, bench reactions, crowd energy, interviews, or archive stories. Allow skipping and later edits.
2. **For You:** playable approved clip cards and compilations, with player/theme tags, source match/date, source-venue context where relevant, verified captions, and a short “Why this is here” explanation.
3. **Favorites:** a player page exposes that player's published clips; starring/un-starring updates preferences without rewriting editorial tags.
4. **Ask for a clip:** a prominent search box accepts “Give me a clip of [player] scoring,” “Find the bench reaction after the equalizer,” or “Show crowd celebrations.” Return actual clip cards with relevant playback, not an unsourced generated answer.
5. **Refinement:** player, action, match, recency, duration, and compilation filters. Favorite-only search is an explicit option; an explicit query for another player is not silently overridden by favorites.
6. **Feedback:** save, show less, or adjust interests. Begin with explicit preferences; implicit watch/skip history is optional later.

**P0:** two seeded fan profiles with different favorite players/interests; visibly different For You ordering; editable favorites; one editor publish reflected in the app; real Marengo retrieval over a small approved clip catalog; empty/revoked/region-unavailable states; three-clip compilation as a first-class published item. Seeded profiles are labeled demo profiles, not real account analytics.

**P1:** persistent authenticated profiles, saved clips, lightweight engagement feedback, optional entity search, multilingual queries/captions, better diversity and cold-start tuning. Do not turn P0 into a trained recommender or a new social network.

## 3. Personalization belongs to Spursx2 AI

**Marengo retrieves footage matching a query. Spursx2 AI chooses which published clips belong in a fan's feed and in what order.** A successful semantic-search integration is not evidence of a personalized recommender.

Start with a transparent application score, calculated only after publication and viewer eligibility:

`fanScore = weighted mean(favorite-player match .45, interest match .25, editor priority .15, recency .10, exploration .05) − repeat penalties`

These are proposed starting weights, not a model prediction. Omit missing preference components and renormalize. Include a small exploration slot when suitable content exists. Group alternate angles and avoid repeating the same play. A fan who picks no preferences gets a balanced editor-curated feed rather than an empty screen.

Explain recommendations using recorded facts: “Because you follow [player],” “You picked crowd energy,” “From the match you follow,” or “Editor's pick.” Do not claim a fan's private behavior or a global trend without supporting data. P0 can store seeded preferences in the demo session; a later persisted profile must be scoped to its owner, with reset/delete behavior and minimal data collection.

The editor's hype score and the fan's relevance score are separate values. A lower-hype assist can lead the feed for a fan who follows the assister. Neither score overrides rights, publication state, a corrected claim, or an unavailable artifact.

## 4. Marengo integration: the correct role and boundary

The name is **Marengo**. The verified organizer index uses **Marengo 3.0** for semantic video search. The documented `/search` request accepts natural-language text and returns ranked time ranges. Pegasus is used for analysis and structured metadata; our app handles personalization. [Search API](https://docs.twelvelabs.io/v1.3/api-reference/any-to-video-search/make-search-request).

### Use an approved-derivative catalog

The existing 58-video index is useful for **editor discovery**. It includes full broadcasts and unpublished material; it is not the fan search catalog. A full match having one approved five-second range does not make the rest of that video publishable.

For P0, prepare a separate **fan-delivery index** of short, finalized editor-approved derivatives. Maintain a server-owned mapping:

```typescript
type PublishedClipVersion = {
  publicationId: string;
  version: number;
  orgId: string;
  state: "preparing" | "scheduled" | "published" | "withdrawn" | "expired";
  approvedRevisionHash: string;
  artifactId: string;
  artifactHash: string;
  twelveLabsAssetId: string;
  indexedAssetId: string; // returned as video_id in search hits
  durationSec: number;
  sourceRanges: Array<{ sourceAssetId: string; startSec: number; endSec: number }>;
  featuredPlayerIds: string[]; // reviewed at clip level
  interestTags: string[];
  claimIds: string[];
  rightsDecisionId: string;
  validFrom: string;
  validUntil: string | null;
};
```

Keep prepared-but-not-published versions out of fan results even if they are already indexed. Preparing the final derivative and its search index entry before the publish transaction avoids releasing broken playback/search. Creating this index and indexing derivatives are proposed implementation work; the current audit did not exercise them on the fan catalog.

### Search request path

1. Resolve authenticated/demo viewer, club, server-trusted territory/entitlements, and current time. UI country controls in the HTML brief are **simulation controls**, not production proof of location.
2. Load only current published versions that are available to that viewer and valid for **owned web** use. Social-channel clearance does not automatically cover the fan app.
3. Resolve explicit player/action/match filters from a canonical roster and publisher-reviewed tags; construct the allowed **indexed-asset ID** set. Empty set means empty results—never drop the filter and search everything.
4. Call the dedicated Marengo index server-side with multipart `POST /search`, `group_by=clip`, bounded `page_limit`, `query_text`, `search_options=visual` and optionally audio, and `filter=JSON.stringify({ id: allowedIndexedIds })`. Keep provider keys and pagination tokens out of the browser. [ID filtering](https://docs.twelvelabs.io/v1.3/docs/guides/search/filtering).
5. Reconcile each result `video_id` to its publication/version. Recheck current state and viewer eligibility **after** retrieval; the catalog may change while the provider call runs. Return only approved metadata, a bounded relevant offset, and an app-owned playback handle. Do not forward raw provider thumbnails/URLs, full-source transcript, or total counts that include unapproved material.
6. Bound hit times to the final derivative's duration. P0 highlights/plays the matching point inside the published clip; it does **not** generate a new fan-requested cut, caption, or unreviewed derivative. A montage hit stays inside its published timeline; per-entry source lineage remains internal.
7. Return a controlled continuation cursor bound to viewer context, query, filters, and catalog version. Cache candidates with publication/policy versions; current eligibility is checked on every result and playback request. A stale index/cache cannot authorize withdrawn content.

For large eligible sets, use a tested tenant/context index strategy or bounded ID batches with a defined merge/pagination policy; never silently omit the authorization filter. A private search index is an efficiency boundary, not a replacement for application authorization.

An empty result says “No matching published clips are available.” It must not reveal a restricted draft title or promise footage that has not been approved. If Marengo is unavailable, show a clearly labeled **metadata-search fallback** or a retry state; do not label keyword matching as AI semantic search. Unsupported query constraints should be visible to the fan rather than silently invented.

## 5. Favorite-player identity

Use canonical `Player.id` values, with mappings to ScorePlay player IDs and optional TwelveLabs entity IDs. Clip-level `featuredPlayerIds` are publisher-reviewed metadata. Whole-match player tags are useful discovery hints but do not prove who appears in a specific approved excerpt.

P0 fan filtering uses those reviewed clip tags before semantic retrieval. For ambiguous names, offer a roster choice rather than guessing. A query explicitly naming a player uses that identity even if the fan favors someone else.

Marengo **entity search is beta** and can use reference images grouped by team plus entity references in a query. It is an optional refinement after validating the entity/roster mapping and actual retrieval quality; the fan app must not depend on its availability. Entity hits are evidence for editorial tagging, not automatic verification of every clip's identity. [Entity-search guide](https://docs.twelvelabs.io/v1.3/docs/guides/search/entity-search).

## 6. Approval, publishing, withdrawal, and playback

```text
draft → reviewed/approved → rendered + indexed/prepared → scheduled/published
                                                          ↓
                                        current viewer rights → feed/search/play
                                                          ↓
                                        withdrawn / expired / invalidated
```

- **Approval:** exact edited revision, verified claims, all footage/audio/graphic dependencies, and selected fan-app destination policy.
- **Publish:** commit the prepared publication version, featured players, interest tags, permitted audience, visibility window, final artifact identity, and audit event. Return a stable publication ID for the frontend.
- **Update:** a new edit makes a new prepared version. Keep the last approved published version until the replacement is ready, then atomically switch the current version. Do not overwrite its source or index mapping in place.
- **Withdrawal/revocation:** remove the version from feed/search eligibility and deny new playback grants immediately; purge or invalidate caches and remove stale index entries asynchronously. Invalidate source-dependent compilations as well. Existing short-lived grants and in-progress playback are a defined residual window, not a promise of recall.
- **Playback:** issue a short-lived, context-bound permitted reference to the approved derivative. App routes, HLS segments/renditions, captions, posters, and detail pages must use the same entitlement rules. Do not let an otherwise permitted title expose unauthorized media bytes.

No fan query can publish a new clip, expand the approved source range, undo a cleanup, or bypass the editor. If “request a new clip” is added later, it creates an editorial request and a pending state, not immediate distribution.

## 7. Suggested local implementation seams

These paths are new proposals; inspect current code and applicable Next.js instructions before adding routes.

```text
web/app/fan/page.tsx                    personalized feed + preference entry
web/app/fan/search/page.tsx             explicit natural-language search
web/app/fan/players/[id]/page.tsx       favorites + published player clips
web/app/fan/clips/[id]/page.tsx         current permitted publication + playback
web/components/fan/                    onboarding, cards, player picker, why chips
shared/publication.ts                  publication lifecycle and exact versions
shared/fan-ranking.ts                  transparent personalized ordering
shared/fan-search.ts                   allowed catalog → Marengo → post-validation
shared/player-identity.ts              canonical roster / alias / provider mappings
```

Extend `shared/schemas.ts` / `shared/db-schema.ts` with `Player`, `FanProfile`, `Publication`, `PublicationVersion`, `FanPreference`, and `FanInteraction` as needed. Reuse provider clients and workers. Keep the editor's inspection queue inaccessible to fan routes; the existing published-asset tracking table alone is not a complete entitlement-aware fan catalog.

Proposed application APIs:

```text
POST /api/publications                      editor publishes a prepared approved version
POST /api/publications/:id/withdraw          editor withdraws; fan caches invalidated
PUT  /api/fan/me/preferences                 own canonical players/interests
GET  /api/fan/feed                           eligible versions → personalized order
POST /api/fan/search                         query + filters → authorized Marengo results
GET  /api/fan/clips/:id                      published detail, approved fields only
POST /api/fan/clips/:id/playback             current context → permitted playback handle
```

Keep route naming separate from an authorization claim: all server actions need actor/org/current-state checks. P0 can use explicit demo personas behind event-only access; do not claim real authentication or durable preference storage until implemented and tested.

## 8. End-to-end checks and judge demo

1. Seed two fans with different favorite players/interests; the same eligible catalog yields different ordering and honest reason chips.
2. Publish one prepared editor-approved clip; it appears in the eligible feed, player page, and semantic search. A draft/blocked/scheduled-future clip appears in none.
3. Search “Give me a clip of [player] scoring” and play the matching point inside the approved derivative. No raw full-match source is returned.
4. Change favorites; feed changes. Query another named player; the explicit query still works without forcing the favorite.
5. A source or publication is withdrawn while search is in flight; post-validation drops it and playback grants fail. Repeat with expired rights, old version IDs, another club, and direct detail/thumbnail requests.
6. A clip allowed on one social destination but not owned web cannot publish to the fan catalog. Two viewer territories can have different eligible catalogs.
7. Metadata-only fallback is visibly different from actual Marengo search. No matches stays empty rather than triggering fan-side footage generation.
8. Empty favorites, no eligible clips, unavailable player tags, pending indexing, unavailable playback, and provider errors all have usable states.

**Demo climax:** editor approves and publishes a cleaned clip → fan A sees it because of a favorite player → fan B sees a different order for crowd energy → a fan asks for a specific action/player and gets a published playable result → editor withdraws the clip and it disappears from feed/search/playback. Keep the event-only release boundary visible.

**Measure honestly:** publish-to-discoverable delay, authorized search success/latency, feed reason coverage, preference response, and withdrawal-to-new-playback-denial. The current live API audit proves raw retrieval mechanics, not this end-to-end personalized fan application.
