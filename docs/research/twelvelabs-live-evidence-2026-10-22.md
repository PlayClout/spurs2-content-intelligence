# TwelveLabs — live evidence, October 22, 2026

Preserved from the original design research. This is a snapshot of one credential and dataset, not an SLA or evidence of a live broadcast integration. No API key or signed playback URLs are included.

### Live credential and dataset audit — October 22, 2026

| Check | Observed result | Consequence |
|---|---|---|
| Authentication and indexes | `GET /indexes` returned **200**, with one visible index: **`premiere-league`**, ID **`6ad90f31960d8ea7bdd040ab`**, configured for `marengo3.0` with `visual` and `audio`. | Reuse this index. The spelling is the actual index name. Account visibility is limited to what this key can access. |
| Complete indexed inventory | Two pages at `page_limit=50` yielded **58/58 ready indexed videos**, totaling **10,257.044 seconds**. | Always follow `page_info`; the first page misses eight videos. No basketball index was visible. |
| Uploaded asset inventory | `GET /assets` reported **476 total assets**; the first page included photos. All 476 asset types were not enumerated in this audit. | Asset count and indexed-video count are different; do not claim that 476 videos are searchable. |
| Source join | All **58** indexed videos contained `user_metadata.scoreplay_id`, `scoreplay_event_id`, `scoreplay_rendition`, and `scoreplay_type`. | The actual join is **`user_metadata.scoreplay_id`**, not an unspecified custom-ID field. Values are strings. Confirm their ScorePlay instance before writing back. |
| Shapes and framing | **32** videos are 608×1080; **19** are 1700×1080; **6** are 1920×1080; **1** is 1280×720. Many filenames indicate social edits or motion graphics. | Pixel dimensions and filenames can shortlist candidates, but neither proves a usable camera angle. Analyze shots inside an edit. |
| Full-match source | Ready asset: **6,334.997 seconds**, **1280×720**, **25 fps**, **2,597,948,725 bytes**, H.264/AAC. Technical metadata includes `start_timecode="17:26:14:13"`. | Use the existing 720p proxy for the demo; do not re-upload a 2.6 GB source. File timecode is distinct from the clip offsets returned by search. |
| Search by indexed ID | Multipart `POST /search`, filtered to the full-match indexed ID, returned **200** in **0.62 seconds**; top five hits all referenced that source. | The request shape and `filter.id` path worked. This is a latency observation, not an SLA or accuracy measurement. |
| Search by source metadata | Search with `filter={"scoreplay_id":"130849278"}` returned **200** in **0.40 seconds**, with two hits from the corresponding fan-reaction edit. | Metadata filtering and `include_user_metadata=true` worked without changing existing metadata. |
| Timed analysis | One Pegasus 1.6 task analyzed **4750.099609375–4774.099609375** of the full match. It completed `ready`, `finish_reason="stop"`, with four shots, **58 seconds** after creation. | Source offsets were preserved in this bounded test; cache results and show async progress. Do not add the requested start offset again. |
| Other account state | Before the test, the task list and knowledge-store list were empty. | Jockey is not provisioned here. The audit created one short analysis task; it did not create an index, store, upload, or ScorePlay writeback. |

**Verification limits:** This credential verifies TwelveLabs access and the preloaded metadata, not access to the referenced ScorePlay company. No ScorePlay key was supplied or tested. No club media was downloaded or published during this research. Model descriptions and boundaries have not been checked frame by frame, so they are **provider output**, not verified camera geometry or scorer identity. `result.usage` was empty; the test does not establish price, remaining credits, or account plan.

---

### Verified source identifiers — account snapshot, not universal constants

| Source | Origin ScorePlay media ID | TwelveLabs `asset_id` | Indexed `_id` = search `video_id` |
|---|---|---|---|
| Full match, 6,334.997s | `130849212` | `6ad90e1a030b76724d135bf2` | `6ad90f3c9c038876f358a41b` |
| 16:9 key highlights, 121.834s | `130849210` | `6ad90e1a65b4aff96dc7a8c2` | `6ad90f3d500e82756f2ea8a4` |
| Fan-reaction edit, 17.216s | `130849278` | `6ad90e150ca748ea3c0a93bb` | `6ad90f4f968fe117efe6fa7c` |

These are **live imported metadata IDs**, not the slide examples and not yet verified against the team's ScorePlay instance. The full match's origin collection is `1536073`; key highlights use `1536066`; the fan edit uses `1536069`. Configure them server-side and verify again if the event account changes. Section numbers **214/117 remain illustrative UI identifiers**, not verified venue geometry.

---

### Tested request and actual result

**Search — raw REST request shape, successful live test:**

```typescript
// Server-only; set the key through the process environment or a secret manager.
const form = new FormData();
form.set("index_id", "6ad90f31960d8ea7bdd040ab");
form.set("query_text", "A wide broadcast view of a football goal followed by players celebrating");
form.append("search_options", "visual");
form.set("group_by", "clip");
form.set("page_limit", "5");
form.set("filter", JSON.stringify({ id: ["6ad90f3c9c038876f358a41b"] }));
form.set("include_user_metadata", "true");
const response = await fetch("https://api.twelvelabs.io/v1.3/search", {
  method: "POST",
  headers: { "x-api-key": process.env.TWELVELABS_API_KEY! },
  body: form, // Let fetch supply Content-Type and the multipart boundary.
});
if (!response.ok) throw new Error(`TwelveLabs search returned ${response.status}`);
const hits = await response.json();
```

This is a minimal transport example; the adapter adds retries, response validation, pagination, and redacted errors. The same request using `filter={"scoreplay_id":"130849278"}` returned only the corresponding fan-reaction edit. The test used visual search; the index also supports audio, but this audit did not compare modality quality.

**Segmentation — tested JSON body for `POST /analyze/tasks`:**

```json
{
  "model_name": "pegasus1.6",
  "custom_id": "hypeseat-research-20261022-shots",
  "video": {
    "type": "asset_id",
    "asset_id": "6ad90e1a030b76724d135bf2"
  },
  "analysis_mode": "time_based_metadata",
  "start_time": 4750.099609375,
  "end_time": 4774.099609375,
  "temperature": 0,
  "max_tokens": 4096,
  "min_segment_duration": 2,
  "response_format": {
    "type": "segment_definitions",
    "segment_time_format": "seconds",
    "segment_definitions": [
      {
        "id": "camera_shots",
        "description": "Within the requested analysis window, identify each continuous camera shot. Split at camera cuts. Describe only visible evidence. Do not infer a stadium section, exact seat, camera position or identity. Return unknown when uncertain.",
        "fields": [
          {
            "name": "view_type",
            "type": "string",
            "description": "Camera framing: elevated_wide, sideline_wide, overhead, field_level, close_up, graphic, or unknown."
          },
          {
            "name": "scene",
            "type": "string",
            "description": "Brief description of the visible action and camera changes, without inferring player names."
          },
          {
            "name": "needs_review",
            "type": "boolean",
            "description": "True if the shot boundaries, angle or spatial interpretation are uncertain."
          }
        ]
      }
    ]
  }
}
```

Task **`6ada433f3eff3c9c9fc634aa`** returned these **model classifications**, not independently verified camera positions:

| Source seconds | Provider view type | HYPESEAT treatment |
|---|---|---|
| 4750.099609–4752.099609 | `field_level` | Excluded from wide-only placement; optional editorial context |
| 4752.099609–4757.099609 | `sideline_wide` | Wide-shot candidate; inspect before approval |
| 4757.099609–4770.099609 | `close_up` | Excluded from wide-only placement; optional editorial context |
| 4770.099609–4774.099609 | `close_up` | Excluded from wide-only placement; optional editorial context |

The task reported `finish_reason="stop"` and no warning; its server timestamps show **58 seconds** from creation to completion for a **24-second** window. One five-second shot is potentially eligible; nineteen seconds are field-level/close-up context. The model described red-shirted players celebrating in the wide shot, so **desired-club versus opponent attribution needs review** before any Tottenham-focused headline. All four model `needs_review` flags were false, which does not establish editorial suitability, boundary accuracy, venue geometry, or scorer identity. Store the raw classification and apply HYPESEAT's independent review rules.

## Important clock distinction

The tested async **time_based_metadata** result retained source offsets. Existing `shared/moment-manifest.ts` documents a separate earlier **general JSON-schema** test with window-relative custom moment fields. Normalize by the tested response mode and source clock; do not apply one blanket offset rule across both modes.
