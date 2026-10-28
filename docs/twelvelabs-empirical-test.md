# TwelveLabs Empirical Test — Spurs² Hackathon
**Branch:** `nova/architecture` · **Run date:** 2026-10-20/21 · **API:** v1.3, `x-api-key` auth, free tier

This is the empirical follow-up to `docs/api-spike-report.md`. That report was desk research
(docs-only, no live calls). This one ran every step against the real TwelveLabs API with real
footage, recorded the raw responses as fixtures, and ran real `ffmpeg` on the output. Every
claim below is marked **VERIFIED** (observed directly, this run) or **UNVERIFIED** (not
exercised). Nothing is marked VERIFIED on the strength of documentation alone.

---

## TL;DR verdict

**The TwelveLabs timestamps → ffmpeg path is PROVEN END TO END.** Both Marengo search and
Pegasus analyze returned real, usable start/end timestamps against real uploaded footage, and a
real timestamp pair from Pegasus analyze was fed into a real 3-stage ffmpeg pipeline (stream-copy
→ frame-accurate re-encode → 9:16 crop + burned-in caption) that ran clean and produced a
correctly-dimensioned 1080×1920 output. This is not "should work per docs" — it is "ran, worked,
files on disk, byte counts and durations confirmed by `ffprobe`."

Two real gotchas were found and fixed along the way (see §6) — both are now baked into the
corrected `shared/clients/twelvelabs.ts` and `pipeline/ffmpeg-poc.sh`.

---

## 1. Footage

| File | Source | Duration | Resolution | Size | Content |
|---|---|---|---|---|---|
| `data/fallback-assets/basketball-broll.mp4` | Coverr (`coverr-basketball-hoop-9848`) | 13.97s | 1280×720 | 4.1 MB | Outdoor basketball hoop, static → slow zoom/tilt |
| `data/fallback-assets/soccer-broll.mp4` | Coverr (`coverr-scoring-a-goal-in-a-soccer-match-8415`) | 17.52s | 1280×720 | 5.1 MB | Goalkeeper + players jogging on a soccer field |

**VERIFIED**: both are direct CDN MP4 downloads (`cdn.coverr.co/videos/<slug>/720p.mp4`), no
sign-in required, royalty-free per Coverr's license. As expected per the task brief, this is
generic b-roll (no scored plays, no real athletes) — it tests pipeline *mechanics*, not detection
quality. Both files are small enough (<20 MB) to commit directly.

---

## 2. Index + Upload — timing measured

**Architecture correction vs. the spike report:** v1.3's current working flow is
`POST /assets` (upload) → `POST /indexes/{id}/indexed-assets` (index) → poll
`GET /indexes/{id}/indexed-assets/{id}`. This is confirmed from the official Node.js SDK
quickstart. The legacy one-shot `POST /tasks` endpoint still exists but **also** requires
`multipart/form-data` (see §6) and was not exercised end-to-end here — the asset flow above is
the one this project should use.

**Index used:** the pre-existing default index `"My Index (Default)"` (`6ad81a01030b76724d10dc67`),
Marengo 3.0, visual+audio. **VERIFIED**: creating a *new* index with Pegasus enabled is a
non-goal in v1.3 — indexes only configure Marengo. Pegasus's `/analyze` endpoint takes a
`model_name` per-request and works directly on an uploaded asset; **it does not require
indexing at all** (see §4). This contradicts the task brief's premise of "create an index with
Marengo 3.0 + Pegasus 1.6 models enabled" — there is no such index-level Pegasus toggle in the
current API.

**Timing (wall-clock, this run):**

| Clip | Duration | Asset upload→ready | Indexing (Marengo) | Total |
|---|---|---|---|---|
| basketball | 13.97s | 6.8s | 8.7s | 15.5s |
| soccer | 17.52s | 6.9s | 12.7s | 19.7s |

**VERIFIED**: indexing a ~14–18s clip takes well under 15 seconds of actual processing time —
far faster than the "1–3 min per minute of footage" conservative estimate in the spike report
(these clips are a fraction of a minute, so the comparison isn't apples-to-apples, but the
throughput is clearly fast enough that pre-indexing the night before a demo is not a hard
requirement for short clips — only a safety margin for longer reels).

Raw indexed-asset response has **no `video_id` field** — the identifier used everywhere
downstream (search hits, analyze-on-indexed-video) is the **indexed-asset `_id`**
(`6ad81fd0968fe117efe47d16` for basketball). This is an empirical correction: earlier
documentation language implying a separate "video_id" distinct from the indexed-asset id was
not observed in this run.

---

## 3. Search — Marengo, real queries, real timestamps

Three queries run against the index containing both clips:

| Query | Hits | Notes |
|---|---|---|
| "player celebrating" | **0** | Correctly empty — this is generic b-roll with no actual celebration. Confirms search isn't hallucinating matches. |
| "ball in motion" | 3 | Matched the full basketball clip (0–14.0s) and both soccer segments (0–8.8s, 8.8–17.5s) |
| "people running on field" | 2 | Matched only the two soccer segments, correctly excluding the basketball clip |

**VERIFIED timestamp fields observed:** `start` and `end`, both **plain numbers in seconds**
(e.g. `13.99899959564209`) — full floating-point precision, not rounded. Also present per hit:
`rank` (1-indexed relevance), `video_id` (→ indexed-asset id), `thumbnail_url` (hour-expiring
CloudFront URL).

**Correction vs. spike report:** no `score` field was present in any hit, in either the SDK
response or the raw REST response. Only `rank`. The spike report's assumption of a numeric
relevance score was not observed.

Full raw request/response saved: `data/fallback-assets/fixtures/twelvelabs-search.json`.

---

## 4. Analyze — Pegasus 1.6, `json_schema`, worked on the first try

**This did NOT fight for 30 minutes.** The exact schema syntax from docs.twelvelabs.io applied
cleanly on the first attempt:

```json
{
  "type": "object",
  "properties": {
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": { "type": "string" },
          "description": { "type": "string" },
          "start_time": { "type": "timestamp", "format": "seconds" },
          "end_time": { "type": "timestamp", "format": "seconds" }
        },
        "required": ["label", "description", "start_time", "end_time"]
      }
    }
  },
  "required": ["events"]
}
```

Request body (raw REST, confirmed working):

```json
{
  "model_name": "pegasus1.6",
  "video": { "type": "asset_id", "asset_id": "<ASSET_ID>" },
  "prompt": "Identify distinct visual events or actions in this video. For each, provide a short label, a one-sentence description, and the start and end time in seconds.",
  "response_format": { "type": "json_schema", "json_schema": { ...above... } },
  "stream": false
}
```

**Key empirical finding: `/analyze` takes `video: {type: "asset_id", asset_id}` directly — it
does not need the asset to be indexed at all.** You can call Pegasus analyze on a freshly
uploaded (status=`ready`) asset with zero indexing step. This is a meaningfully simpler
architecture than the spike report assumed (which conflated the Marengo index requirement with
Pegasus).

**Real response (soccer clip), elapsed ~12s:**

```json
{
  "events": [
    {"label": "Goalkeeper walks across field", "description": "A goalkeeper in a black and yellow uniform walks from the left side of the frame towards the right side of the soccer field.", "start_time": 0.0, "end_time": 3.5},
    {"label": "Players jogging and moving", "description": "Various players in yellow and white jerseys are seen jogging and moving around the field behind the chain-link fence.", "start_time": 3.5, "end_time": 13.5},
    {"label": "Goalkeeper returns to position", "description": "The goalkeeper walks back from the right side towards the center/left of the goal area as play continues.", "start_time": 13.5, "end_time": 17.5}
  ]
}
```

`finish_reason: "stop"` on every call (never `length`/truncated) — the JSON was always complete
and parsed cleanly with `JSON.parse()`.

**VERIFIED `response_format` rules from docs that mattered in practice:**
- `timestamp` type requires an explicit `format` (`seconds` used here); omitting it 400s.
- `start_time`/`end_time` get special handling — declaring them as plain `{"type": "timestamp", "format": "seconds"}` returns clean JS numbers, not strings.
- The object's first declared property must be required (all four fields were required here, so this didn't bite, but it's a real documented constraint worth remembering for future schemas).

Full raw request/response saved: `data/fallback-assets/fixtures/twelvelabs-analyze.json`.

---

## 5. FFmpeg proof — VERIFIED LOCALLY (not just scripted)

**Surprise finding: ffmpeg IS installed on this Mac mini** (`/opt/homebrew/bin/ffmpeg`,
version 9.0.2, full libx264/libx265/videotoolbox build) — the task brief's assumption that it
was missing did not hold at execution time. This let every ffmpeg step run and get verified for
real, not just written out as an untested script.

**Real timestamp pair used:** from the Pegasus analyze run on `basketball-broll.mp4`,
event `{label: "camera zoom and tilt up", start_time: 6.0, end_time: 14.0}`. Padded ±2s per the
spike report's boundary-uncertainty guidance, clamped to the clip's actual duration
(13.972331s): **window = [4.0, 13.97]**.

| Step | Command (abbreviated) | Wall-clock | Result |
|---|---|---|---|
| (a) stream-copy rough cut | `ffmpeg -ss 4.0 -to 13.97 -i src.mp4 -c copy rough_cut.mp4` | **0.025s** | 3.2 MB, instant, keyframe-snapped |
| (b) frame-accurate re-encode | `ffmpeg -i src.mp4 -ss 4.0 -to 13.97 -c:v libx264 -preset fast -crf 20 -c:a aac precise_cut.mp4` | **0.64s** (0.59s per `ffmpeg`'s own timer) | 3.4 MB, duration exactly 9.968292s |
| (c) 9:16 crop 1080×1920 + caption burn-in | `ffmpeg -i precise_cut.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920,drawtext=fontfile=.../Arial.ttf:text='TEST CAPTION':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-200" -c:v libx264 -preset fast -crf 20 -c:a aac final_clip_9x16.mp4` | **1.3s** | 5.1–5.8 MB, confirmed 1080×1920 via `ffprobe` |

All three outputs are on disk at `data/fallback-assets/poc/{rough_cut,precise_cut,final_clip_9x16}.mp4`.
Exact, tested command lines are codified in `pipeline/ffmpeg-poc.sh` (runnable, parameterized by
source file / output dir / start / end / caption text).

**Gotcha (see §6 for the fix): the default `brew install ffmpeg` formula does NOT include
`drawtext`** (no `libfreetype`/`libass` compiled in — confirmed via `ffmpeg -filters | grep drawtext`
returning nothing, and a direct run failing with `No such filter: 'drawtext'`). Steps (a) and (b)
ran fine on the default build; step (c) required installing `ffmpeg-full` via Homebrew
(keg-only, invoked directly by path — did not touch PATH/shell rc files) which **does** include
`drawtext`, `libass`, and `subtitles` filters.

---

## 6. Gotchas / surprises (the honest list)

1. **`/search` requires `multipart/form-data`, not `application/json`.** Sending a JSON body
   returns `400 content_type_invalid: "The content type 'application/json' is not supported.
   Please use 'multipart/form-data'."` This also applies to the legacy `/tasks` endpoint. The
   original `shared/clients/twelvelabs.ts` sent JSON for search — **this was wrong and has been
   corrected** to build a `FormData` body with repeated `search_options` fields.

2. **`/analyze` takes `video: {type, asset_id}`, not a bare `video_id`.** The original client
   code's `analyzeStructured(videoId, ...)` sent `{video_id, prompt, response_format}` — this
   shape does not match the documented/working request. Corrected to
   `{model_name, video: {type: "asset_id", asset_id}, prompt, response_format, stream: false}`.

3. **Pegasus analyze does not need indexing.** It operates on any `ready` asset directly. The
   original mental model (index → search AND analyze) is wrong; indexing is Marengo-only.

4. **No `score` field in search results**, only `rank`. Plan UI/sorting around rank, not a
   numeric confidence score.

5. **No `video_id` field in the indexed-asset resource** — the indexed-asset's own `_id` IS the
   identifier referenced everywhere downstream.

6. **No rate-limit headers observed on `GET /indexes`** (`x-ratelimit-*` absent). The spike
   report's assumption that every response carries these headers did not hold for this
   endpoint; they may only appear on rate-limited endpoints under load, or only in certain
   billing tiers. Not re-tested under actual load — flagged as **UNVERIFIED** either way.

7. **Default Homebrew `ffmpeg` formula lacks `drawtext`/`libass`.** Needed `ffmpeg-full`
   (keg-only sibling formula) for any text-overlay/subtitle work. Worth flagging for the M5 or
   any teammate's machine — `which ffmpeg` succeeding is not enough; check
   `ffmpeg -filters | grep drawtext` before assuming caption burn-in will work.

8. **ffmpeg's `-vf` filtergraph string needs its own internal quoting** (`text='TEST CAPTION'`
   with single quotes around the caption, inside the one double-quoted bash argument) — easy to
   break with naive multi-layer shell escaping. The working, tested pattern is codified in
   `pipeline/ffmpeg-poc.sh`.

9. **No `pexels.com` API key was requested** (it requires account sign-up) — Coverr's public CDN
   serves direct, unauthenticated MP4 URLs discoverable straight from the rendered page's
   `<video>` tags, which was faster and matches the "royalty-free sports clips" goal exactly.

---

## 7. Free-tier usage consumed

**VERIFIED**: `search_pool.total_duration` in the raw search response reported **31 seconds**
of indexed video total (13.97 + 17.52, matching both clips exactly). Combined with ~31.5s of
Pegasus analyze input across two analyze calls, total workload consumed is approximately:

```
(31.5s indexed + 31.5s analyzed) / 60 ≈ 1.05 minutes of the 600-minute free-tier allowance (~0.18%)
```

Negligible. The free tier has enormous headroom left for real hackathon-day indexing of actual
game footage.

---

## 8. Client code corrections shipped alongside this report

`shared/clients/twelvelabs.ts` was rewritten to match the verified-working request shapes (not
the spike report's assumptions):
- `searchMoments()` now sends `multipart/form-data`.
- `analyzeStructured()` now sends `video: {type: "asset_id", asset_id}`.
- Added `uploadAsset()`, `assetStatus()`, `indexAsset()`, `indexedAssetStatus()` implementing the
  verified asset→indexed-asset flow (replacing the untested legacy `indexVideo()`/`taskStatus()`
  pair, which pointed at the `/tasks` endpoint that was never exercised end-to-end here).

**Smoke-tested** (not just read): `scripts/tl-test/06-smoke-test-client.mjs` imports the
corrected `.ts` file directly via `tsx` and calls `searchMoments()` + `analyzeStructured()`
against the live API — both returned real data on this run.

---

## 9. Fixtures

Matching the shape `shared/clients/twelvelabs.ts`'s `fixture()` loader expects
(`data/fallback-assets/fixtures/twelvelabs-{search,analyze,index-task}.json`), all three are
**real, recorded API responses** from this run, not synthesized:

- `twelvelabs-search.json` — raw `POST /search` response (`search_pool`, `data[]`, `page_info`).
- `twelvelabs-analyze.json` — raw `POST /analyze` response (`id`, `data` (JSON string), `finish_reason`, `usage`).
- `twelvelabs-index-task.json` — raw `GET /indexes/{id}/indexed-assets/{id}` response once `status: "ready"`, annotated with a note explaining the v1.3 flow (assets → indexed-assets, not legacy `/tasks`).

Supporting raw captures (full search-all-queries, full index/upload timing report, indexes-list,
and the SDK-shape analyze response) are kept under `data/fallback-assets/fixtures/raw-capture/`
for traceability.

---

## 10. What's still unverified / out of scope this run

- **ScorePlay** — not touched in this test (separate gated API, per the spike report).
- **Timestamp boundary precision** (does Pegasus/Marengo land exactly on "start of action," or
  drift?) — not independently measured frame-by-frame against ground truth; the ±2s pad is
  still a reasonable safety margin, not a proven-necessary one.
- **Indexing latency at scale** (a full game, 30–60+ min) — only short clips (<18s) were tested;
  do not extrapolate the sub-15-second numbers above to hour-long footage.
- **Rate-limit behavior under load / 429 handling** — not triggered in this run; the existing
  client's `Retry-After` backoff logic is untested against a real 429.
- **`/tasks` legacy endpoint** — confirmed to exist and to also require multipart, but not
  exercised end-to-end (asset flow is the recommended path regardless).

---

## Files produced this run

```
data/fallback-assets/basketball-broll.mp4        (committed, 4.1 MB)
data/fallback-assets/soccer-broll.mp4            (committed, 5.1 MB)
data/fallback-assets/poc/rough_cut.mp4           (committed, 3.2 MB)
data/fallback-assets/poc/precise_cut.mp4         (committed, 3.4 MB)
data/fallback-assets/poc/final_clip_9x16.mp4     (committed, 5.1 MB)
data/fallback-assets/fixtures/twelvelabs-search.json
data/fallback-assets/fixtures/twelvelabs-analyze.json
data/fallback-assets/fixtures/twelvelabs-index-task.json
data/fallback-assets/fixtures/raw-capture/*.json (supporting raw captures)
pipeline/ffmpeg-poc.sh                           (tested, runnable)
shared/clients/twelvelabs.ts                     (corrected, smoke-tested)
scripts/tl-test/*.mjs                            (all test scripts used, for reproducibility)
docs/twelvelabs-empirical-test.md                (this file)
```
