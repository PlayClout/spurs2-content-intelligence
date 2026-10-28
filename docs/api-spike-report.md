# Spurs² Hackathon — Challenge 1 API Spike Report
**Assisted Auto-Production Engine** · Austin, Oct 22–23 2026 · Compiled 2026-10-20

---

## Executive Summary

**TwelveLabs is build-ready today.** VERIFIED: clean REST API (`x-api-key` header), Python/Node SDKs, async upload+index flow. Critically, the **Analyze endpoint returns structured JSON with exact `start_time`/`end_time` timestamp fields** (seconds or `hh:mm:ss.fff`) — enough to drive ffmpeg cuts directly. Marengo 3.0 explicitly advertises improved **basketball and soccer action recognition**, a direct hit for Spurs (NBA) content. Free tier: 600 min (10 hrs) combined indexing/analysis/segmentation — plenty for a hackathon demo.

**ScorePlay's API is real and documented** (`developer.dev.scoreplay.io`) but **partner/customer-gated** — their own Getting Started page states a Customer Success Manager must enable access and issue the key. We cannot self-serve a key before Thursday; must be requested live from ScorePlay engineers at the briefing.

**Recommended pipeline:** TwelveLabs timestamps → source MP4 → `ffmpeg` keyframe-aligned cut + 9:16 crop + caption burn-in.

**Biggest risk:** we don't control whether/when ScorePlay issues our key. Plan: build the full pipeline against TwelveLabs + fallback footage; treat ScorePlay as a bolt-on if the key lands in time.

---

## 1. TwelveLabs Findings

### Auth & shape — VERIFIED
Stable version **v1.3** (`api.twelvelabs.io/v1.3`). Auth: **`x-api-key` header**, no OAuth. Official **Python and Node.js SDKs** (1.0.0 current). MCP server also available for agent integration.

### Upload/indexing flow — VERIFIED
Two paths: (1) legacy one-shot `POST /tasks` (multipart `index_id` + `video_file`/`video_url`) — simplest for a hackathon, though docs flag it for future removal; (2) current path: upload an asset, then `POST /indexes/{id}/indexed-assets` with `asset_id` — async, 202 response, poll until `ready`.

**Limits (Marengo 3.0):** duration 4 sec–4 hrs; file size ≤4 GB via URL (≤200 MB local "direct upload," ≤10 GB via multipart); resolution 360×360–5184×2160; aspect ratio 1:1–1:2.4 (covers 16:9 and 9:16); any FFmpeg-supported format. Public URLs must be **direct raw-file links** — no YouTube/Drive share links.

**Indexing latency — UNVERIFIED precise SLA**, two corroborating public claims: TwelveLabs marketing states "~60x real-time... index an hour of video in a minute"; a third-party integration guide cites a more conservative **1–3 min indexing per minute of footage**. No official SLA in API docs. **Plan for 2–5 min per 5-min reel; index Wednesday night, not right before demo.**

### Search / analyze — VERIFIED
Two models, two jobs:

- **Marengo 3.0** (`POST /search`): multimodal visual+audio+transcription search, natural-language queries up to 500 tokens, image/video query support. **Every result returns `start`/`end` in seconds** plus `video_id`, `rank`, hour-expiring `thumbnail_url`. Explicit **"Sports intelligence"**: improved soccer/basketball action recognition, plus baseball/hockey/football support. Filterable by video id, duration, resolution, metadata.
- **Pegasus 1.6** (`POST /analyze`): video/image → generated text or **structured JSON via `response_format: json_schema`**. **Key finding:** schema supports a reserved **`timestamp` type** with output formats `seconds`, `hh:mm:ss`, or `hh:mm:ss.fff` (millisecond precision) — define a schema like `{"events":[{"label":"dunk","start_time":{...},"end_time":{...}}]}` and get millisecond in/out points plus description text in one call. Sync mode: ≤1 hr video, optional NDJSON streaming. Async: ≤2–4 hrs. Also supports video segmentation and 1–20 image analysis per request.

**Recommended split:** Marengo search for broad "find highlight-worthy moments" recall across the full game index → Pegasus analyze with a JSON schema on top candidates for clean structured timestamps + auto-generated caption text in one pass.

### CRITICAL: timestamp accuracy for ffmpeg
Both paths return machine-usable timestamps (seconds or ms). **Capability is VERIFIED; empirical boundary precision is UNVERIFIED** — docs don't quantify whether "start of dunk" lands exactly at takeoff or drifts ~1s. **Action: pad every auto-cut ±1.5–2s, let producer-approval UI trim tighter** rather than trusting raw timestamps as frame-exact.

### Free tier / rate limits / pricing — VERIFIED
**Free plan**: $0/mo, 3 GB storage. Index/Upload: 3,000 RPD/60 RPM, 3,000 min/day & 600 min/hr duration. Search: 3,000 RPD/600 RPM (no duration cap). Analyze: 1,000 RPD/60 RPM, 500K output tokens/day. **Combined index+analyze+segment cap: 600 min (10 hrs)/plan period** — ample for a hackathon. Paid: Plus $29/mo (50 GB, higher limits), Pro $99/mo (200 GB, optional overage), Enterprise custom. 429s return `Retry-After` header + per-dimension `X-Ratelimit-*` headers.
Legacy per-unit pricing found (**UNVERIFIED current**): ~$0.042/min indexing + $0.021/min input — order-of-magnitude only; new billing is plan-allowance based.

**Action: sign up for Free tier now** to get a key and start indexing before Thursday.

---

## 2. ScorePlay Findings

### Public API exists, but gated — VERIFIED
Docs site `developer.dev.scoreplay.io` (Docusaurus: Getting Started, Authentication, Dynamic Image Processing, Webhooks, full API Reference w/ "Try it" console, downloadable OpenAPI YAML + Postman collection). **Getting Started states plainly: API access must be confirmed/enabled by a ScorePlay Customer Success Manager, who issues the key.** Not self-serve — we cannot get a working key without ScorePlay granting one.
Auth: **`X-ScorePlay-Api-Key` header**, scoped to organization.

### Capabilities — VERIFIED (from public marketing copy; full schemas sit behind the key-gated console)
- **Search**: `GET /tag/search` resolves labels (players, tags, sponsors) → IDs; `POST /media/search` queries assets by those IDs with AND/OR/exclude logic (player, club, stadium, competition, match).
- **Asset tiers**: every result carries 3 tiers (photographer/full-res, compressed, thumbnail) + dynamic resize/crop/face-aware-center CDN URLs.
- **Metadata enrichment**: write tags, details, and **"timecoded video actions"** — their equivalent of clip in/out points — then search on them instantly. Exact write schema **UNVERIFIED** without an authenticated key.
- **Delivery**: push assets to S3/GCS/SMB and downstream destinations.
- **Webhooks**: confirmed to exist in nav; event types/payloads **UNVERIFIED** (gated content).
- Postman collection + OpenAPI spec downloadable once a key exists — fastest path to full schema.

### Ask ScorePlay engineers Thursday
1. Can they issue a scoped key on the spot for the hackathon?
2. Schema for "timecoded video actions" — can we write TwelveLabs-detected timestamps back as ScorePlay actions (making it system-of-record for approved clips)?
3. Webhook event list — is there an "asset ingested"/"match video available" trigger?
4. Does `/media/search` cover raw video (not just photos), and do asset URLs qualify as TwelveLabs-compatible direct links (not share-link redirects)?
5. Any published rate limits?
6. Can S3/GCS export feed straight into our ffmpeg input bucket?

---

## 3. Export Path Recommendation

**Pipeline:** TwelveLabs timestamps → source footage (ScorePlay asset or local file) → ffmpeg cut + 9:16 crop + caption burn-in → producer approval → publish.

*(ffmpeg technique below is standard practice, UNVERIFIED against either vendor's docs, but low-risk/well-established.)*

1. **Rough cut (stream copy)** — near-instant, snaps to nearest keyframe (drift up to ~1 GOP, ~1–2s): `ffmpeg -ss <start-2s> -to <end+2s> -i source.mp4 -c copy rough_cut.mp4`
2. **Accurate final cut (re-encode)** — frame-accurate: `-ss` *after* `-i` is slow but exact; fast-seek to nearest keyframe before the padded window, then frame-trim the remainder for speed+precision.
3. **9:16 crop + caption burn-in** (single pass): `ffmpeg -i precise_cut.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920,drawtext=fontfile=...:text='<caption>':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-200" -c:v libx264 -preset fast -crf 20 -c:a aac final_clip.mp4`
4. **Why pad ±1.5–2s**: covers both TwelveLabs boundary uncertainty and ffmpeg keyframe snapping — trim precisely at the producer-approval re-encode step.

---

## 4. Fallback Footage Options (URLs only, not downloaded)

1. **Coverr sports/basketball/soccer** — `coverr.co/stock-video-footage/sport`, `/basketball`, `/soccer`. Per Coverr's own FAQ, clips are royalty-free/cleared for commercial use — generic action b-roll, not real game footage.
2. **Pexels soccer/sports** — `pexels.com/search/videos/soccer/`. Free commercial use, no attribution required. Same caveat: generic, not scored-game footage.
3. **TwelveLabs sample apps** — `twelvelabs.io/sample-apps` — check Thursday morning for an official sports-domain demo video. **UNVERIFIED** whether a sports sample exists.

**NOT viable:** real NBA/Premier League broadcast highlights from YouTube or league archives — confirmed copyright-strike risk, no open-footage program found for either league. If Spurs² organizers provide licensed game footage (likely, given Spurs branding), that's the primary source — Coverr/Pexels are pipeline-testing filler only.

---

## 5. Open Questions for Thursday Briefing

1. Does Spurs²/organizers provide a ScorePlay key on-site, or do we request one live?
2. Will organizers supply actual Spurs game footage, and via what delivery (ScorePlay asset / file drop / S3)?
3. Real TwelveLabs indexing latency for a full game — can we pre-index Wednesday night?
4. Do ScorePlay asset URLs meet TwelveLabs' "direct, publicly fetchable, no auth wall" requirement?
5. Is there a shared hackathon-provisioned TwelveLabs plan, or does each team use Free tier individually?
6. What moment categories does judging expect (goal/dunk/foul/celebration/crowd-reaction) — determines our Pegasus JSON schema design.

---

## 6. Risk List

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ScorePlay key not issued in time | Med-High | High | Build fully on TwelveLabs + fallback footage; ScorePlay additive only |
| Timestamp boundaries imprecise at action edges | Medium | Medium | Pad cuts ±1.5–2s; producer UI does final trim |
| Indexing latency eats live demo time | Medium | High | Pre-index all known footage the night before |
| Free-tier rate limits hit during rehearsal+demo | Low-Med | Medium | Watch `X-Ratelimit-*` headers; backoff; consider $29 Plus as insurance |
| No real/licensed game footage available | Low-Med | High | Confirm with organizers ASAP (open Q2); Coverr/Pexels last resort |
| Vertical crop misses off-center action | Medium | Medium | Use Pegasus analyze output to inform crop x-offset vs. hard center-crop |
| ScorePlay webhook/action schema unknown pre-Thursday | High (confirmed gap) | Low-Med | Scoped to briefing Q3; not a blocker since TwelveLabs path works standalone |

---
*Sources: docs.twelvelabs.io (v1.3 API reference + concepts, fetched live), developer.dev.scoreplay.io (live navigation + Getting Started), twelvelabs.io/pricing (live), web search corroboration for indexing-speed and footage-licensing claims. All VERIFIED claims were fetched directly in this session, 2026-10-20.*
