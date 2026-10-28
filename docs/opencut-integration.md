# Tailoring OpenCut for the Spursx2 AI Matchday Editor

**Implementation instructions · October 22, 2026 · source inspected, integration not run**

Read [the current product design](../design.md) first. This guide specifies the editor bridge; it does not authorize external publication, copy a rights clearance from the client, or imply OpenCut is installed.

## 1. Choose and pin the correct codebase

The supplied URL, [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut), currently describes a rewrite. Its future editor/plugin/headless APIs are not a dependency we can assume works today. The README points to [OpenCut Classic](https://github.com/OpenCut-app/opencut-classic) for current use; Classic is archived and needs an explicit evaluation rather than a claim of ongoing upstream support.

| Source | Inspected revision | Use |
|---|---|---|
| OpenCut rewrite | `e668010778568641babef2cc40be4703ae6916d6` | Track future architecture; do not build the hackathon around promised APIs. |
| OpenCut Classic | `cf5e79e919144200294fb9fed22a222592a0aeea` | Initial short-clip import/trim/save evaluation. Pin this commit and preserve MIT attribution. |

For a future implementer, create an isolated worktree/feature branch and a separate local checkout of the pinned Classic source. Do **not** run an upstream installer from its README merely because it appears there. Use the team's existing toolchain, inspect the pinned package and lockfile, and run only the setup actually required for the editor evaluation. This planning update has not cloned or installed OpenCut.

Keep the working Spursx2 AI app and its lockfiles intact. The local app uses Next 16.4.2 / React 19.3; inspected Classic uses Next 16.1.3 / React 19, Bun, `opencut-wasm`, MediaBunny, and other workspace dependencies. A common framework name does not guarantee a drop-in merge. Read each checkout's applicable `AGENTS.md` before editing.

## 2. What the inspected source actually offers

All upstream paths below are relative to **Classic**, not our repository, and are pinned in the links.

| Upstream file | Observed seam | Spursx2 AI adaptation |
|---|---|---|
| [`apps/web/src/core/index.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/core/index.ts) | `EditorCore.getInstance()` exposes project/media/timeline/command/renderer managers. | One editor bridge per active project. Do not operate on a second project through the same singleton concurrently. |
| [`apps/web/src/editor/use-editor.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/editor/use-editor.ts) | React subscription hook over the managers. | Subscribe in Spursx2 AI-specific panels; do not invent a separate competing timeline store. |
| [`core/managers/media-manager.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/core/managers/media-manager.ts) | `addMediaAsset({ projectId, asset })` saves a media asset, returns it or null. | Resolve a permitted short derivative into a browser `File` and reuse the returned media ID. Preserve source identity in a server-owned sidecar binding. Handle quota and null results. |
| [`core/managers/project-manager.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/core/managers/project-manager.ts) | `createNewProject`, `loadProject`, `saveCurrentProject`, `updateSettings`, and `export`. | Create/load explicitly, persist Spursx2 AI revision separately, and guard the export seam. Verify project/scene readiness before import. |
| [`core/managers/timeline-manager.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/core/managers/timeline-manager.ts) | Insert, trim, split, move, delete, and update operations issue commands. | Translate the application manifest into commands; persist edits back as canonical source ranges. |
| [`commands/timeline/element/insert-element.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/commands/timeline/element/insert-element.ts) | `InsertElementCommand({ element, placement })`, generated IDs, explicit/auto placement. | Capture returned element/track IDs; verify placement succeeded. First visual insertion can change project canvas and FPS. Apply target format deliberately after initialization. |
| [`commands/batch-command.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/commands/batch-command.ts) | Group commands into one undo/redo action. | Import a proposed montage as one user-undoable operation. This sequential command loop is **not a database transaction** or automatic rollback guarantee; validate first and verify the result. |
| [`timeline/types.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/timeline/types.ts) | `SceneTracks` has a main video track, overlays and audio. Elements contain native-time positions/trims. | Map video, verified text overlays, and approved audio; reject unsupported features instead of silently flattening them incorrectly. |
| [`wasm/media-time.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/wasm/media-time.ts) | `MediaTime` is a branded integer tick count, with `mediaTimeFromSeconds` / `mediaTimeToSeconds`. | **Never assign seconds directly to native timeline times** or guess the tick rate. Use the provided helpers and the source/project FPS rules. |
| [`components/editor/export-button.tsx`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/components/editor/export-button.tsx) | Native export controls exist. | Replace the final-delivery path with Spursx2 AI approval/recheck. Audit manager-level calls and other export actions as well as this button. |
| [`media/types.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/media/types.ts), [`services/storage/types.ts`](https://github.com/OpenCut-app/opencut-classic/blob/cf5e79e919144200294fb9fed22a222592a0aeea/apps/web/src/services/storage/types.ts) | Browser `File`, media metadata, serialized project/scene storage. | Custom provenance is not proven to survive an ad hoc extra property. Use an explicit persisted Spursx2 AI binding keyed by project/media/element IDs. |

## 3. Integration boundary

**Recommended starting point:** a separate local editor app from the pinned Classic checkout, with a dedicated Spursx2 AI bridge and branding. Keep our producer dashboard, decision engine, job system, and FFmpeg worker as the product backend. Expose the editor through a route/reverse proxy or an explicit local launch link after evaluating its route/base-path behavior.

Do not copy the upstream `apps/web` over our `web` directory. Do not replace our auth, database, publish adapter, global styles, or monorepo setup merely to make an editor page boot. Once a vertical slice works, selective vendoring into a route/package can be evaluated; keep the adapter API stable.

If embedding with an iframe becomes useful, it is a transport option, not a native upstream capability: validate origin and message schema, require an authenticated session-bound project ID, use an exact target origin, and reject unknown commands. Same-origin embedding is simpler if routing works. Never use wildcard-origin messages to pass arbitrary URLs or provider keys. Browser autosave can remain a local recovery cache; the canonical approved manifest belongs to Spursx2 AI's server.

## 4. Application-owned adapter contract

These interfaces are **proposed Spursx2 AI code**, not existing OpenCut exports. Put them outside upstream rendering internals, for example in `shared/editor-contracts.ts`, and implement a bridge inside the pinned editor app.

```typescript
type EditManifest = {
  projectId: string;
  revision: number;
  destinationContextId: string;
  width: number;
  height: number;
  entries: Array<{
    entryId: string;
    clipId: string;
    sourceAssetId: string;
    sourceVersion: string;
    sourceStartSec: number;
    sourceEndSec: number;
    timelineStartSec: number;
    derivativeId: string;
    derivativeSourceStartSec: number;
    derivativeDurationSec: number;
    rightsDecisionId: string;
    claimIds: string[];
    sourceAudioEnabled: boolean;
  }>;
};

interface Spursx2AIEditorAdapter {
  openProject(manifest: EditManifest): Promise<void>;
  importApprovedClip(entryId: string): Promise<void>;
  readCanonicalEdits(): Promise<EditManifest>;
  saveDraft(expectedRevision: number): Promise<{ revision: number }>;
  requestReview(): Promise<{ reviewId: string }>;
}
```

Also persist `EditorProjectBinding`: Spursx2 AI project/revision, editor project/scene IDs, upstream pin, schema version, and per-entry media/element/track IDs plus source-to-derivative mapping. Support text/audio/graphic dependency bindings before enabling those edits. Use JSON-compatible primitives for server transport; native tick values stay inside the bridge.

### Import sequence

1. Resolve the actor/org, project, destination, and each current rights decision server-side. Only expose permitted short **editing derivatives**, not a full restricted match download. Permission to render/analyze/preview must be explicit, separate from final distribution.
2. The media resolver supplies a bounded authenticated source or short-lived authorized reference. Fetch a derivative as a `Blob`/`File`, use the upstream metadata/thumbnail preparation path, and call the media manager. The original `asset_id` and ScorePlay media ID remain server-only provenance; editor media IDs are separate.
3. Initialize/load the project and active scene. Validate all entries before issuing commands; build a stable media-ID map. Deduplicate imports by derivative/version, not a volatile signed URL.
4. Convert source seconds to **derivative-local** in/out, then to OpenCut `MediaTime`. Build commands with valid params and placement. Use `BatchCommand` through `editor.command.execute({ command })` for a grouped import, then inspect resulting elements and their assigned IDs.
5. Establish the intended output canvas/FPS after first insertion, because upstream may adopt the first video's size and FPS. Validate that preview uses the selected format.
6. Save both native recovery state and the canonical Spursx2 AI manifest/binding. On import failure, clean up partial media/bindings and leave the previous project revision intact; the upstream batch loop does not supply this workflow transaction.

### Time conversion that must not be skipped

Suppose an editing derivative covers original source **4748–4778 seconds**, and the chosen shot is **4752–4757 seconds**:

```text
Derivative source origin = 4748
Local in                 = 4752 - 4748 = 4 seconds
Local out                = 4757 - 4748 = 9 seconds
Visible duration         = 9 - 4       = 5 seconds
Removed tail             = 30 - 9      = 21 seconds
```

Convert timeline start, local trim-in, removed tail, and duration using `mediaTimeFromSeconds({ seconds })`. `trimEnd` follows the upstream removed-tail semantics; verify with a known clip rather than passing an absolute out-point into it. Convert back using `mediaTimeToSeconds({ time })`, then add the derivative's source origin exactly once when persisting source bounds.

Use upstream creation/default helpers for full element params; do not create a video element with invented transform defaults. Verify round-trip bounds against the derivative and original source duration; round to the appropriate frame boundary. The application receives canonical source seconds even when the UI stores ticks.

## 5. Tailor the editor to matchday work

Preserve OpenCut's preview, timeline, trim/split/reorder, undo/redo, project recovery, and basic text/audio controls where the spike proves them. Add the following Spursx2 AI surfaces in the fork, rather than scattering sports policy through core managers:

- **Matchday tray:** ready clips scoped to current destination, player/play/zone/camera filters, source range, original/cleaned comparison. Held or blocked items have explanations and no unrestricted import action.
- **Why panel:** rank components and missing inputs; observed vs fixture evidence; source/post references; stat proof/coverage; policy rule, context, and validity interval. A synthetic fixture is labeled in the editor too.
- **Compilation recipes:** choose target duration/theme/audience, pin or replace clips, inspect selected/omitted reasons, and import the proposed timeline as one grouped change.
- **Claim overlays:** insert only the exact approved wording linked to an active `StatClaim`; changing text creates a new draft and requires review. A manual text layer cannot smuggle in an unsupported record claim.
- **Rights status:** show the current decision for the actual edited ranges and selected output context, not the original untrimmed clip's stale badge. Restore-audio, trim expansion, crop/mask removal, new footage/music, or destination change invalidates the earlier decision.
- **Review and render:** replace casual final export with save draft → canonical manifest → server validation → exact-revision approval → queued final render. A local editor preview stays labeled as a preview.

Suggested future files inside the fork (these are **new**, not upstream paths):

```text
apps/web/src/spursx2-ai/
  editor-bridge.ts
  manifest-adapter.ts
  source-bindings.ts
  time-adapter.ts
  api-client.ts
  components/{MatchdayTray,WhyPanel,CompilationRecipes,ReviewGate}.tsx
```

Inspect the pinned components under `components/editor/panels/`, the panel configuration, and the editor route before wiring them. Theme only the forked editor shell with our design tokens. Remove unrelated stock discovery/upload affordances from the matchday flow unless their media enters the same eligibility pipeline. Keep accessibility, keyboard shortcuts, and undo semantics.

## 6. Render and release enforcement

The browser is not a trusted policy engine. Upstream native export/download can produce a file from data already present locally; disabling a button is not DRM or proof that a user cannot copy it. Minimize exposure by importing only permitted short editing media, and make our **distributed final asset** require a server decision.

For P0, translate the supported cut into the existing `RenderBackend` / local FFmpeg worker: video ranges and order, selected output geometry, permitted source audio or mute, verified captions, and approved graphic/audio dependencies. The final job checks the manifest hash, revision, actor/org, every dependency and decision validity, then stores the exact output hash. Its delivery endpoint performs a current check before returning the file.

Audit **both** the upstream export button and `project.export`, menu/keyboard/action paths, Spursx2 AI direct download routes, and backend job entry points. Never add a browser “override compliance” switch. Record editor changes separately from an authorized rights exception.

Support only operations the server renderer can reproduce. If an OpenCut effect, mask, speed change, transition, subtitle, or audio edit cannot round-trip into the canonical render plan, disable it for the initial integration or explicitly reject the export with a reason. Do not return a final render that differs silently from the preview. Browser-native full rendering can be evaluated after these constraints work; a future upstream headless API is not the fallback.

### Fan publication is downstream of editor export

The new frontend is a **responsive fan web app** for phone and desktop browsers. An approved render is not automatically published: prepare its final derivative/search index entry, then have the editor commit a `PublicationVersion` for the `owned_fan_web` destination. Fans receive published clip cards and bounded playback, never OpenCut project files, original inspection sources, or direct export controls. Favorite players and natural-language Marengo retrieval are specified in [fan-app-and-search.md](fan-app-and-search.md). Keep the editor bridge's output manifest stable so this destination does not require rewriting timeline mechanics.

## 7. Evaluation order and exit criteria

**Timebox the first spike to 60–90 minutes.** This is a project allocation, not an upstream setup-time claim.

1. Boot the pinned Classic web app using its actual workspace dependencies; verify WASM/media loads in the intended browser. No team backend or publish functionality is replaced.
2. Import a tiny authorized MP4 derivative via the bridge; verify file metadata, playback, source/audio identity, and local storage behavior. Do not begin with a 2.6 GB full match.
3. Insert three source-bounded entries, trim/reorder, undo and redo. Verify native tick conversions and canonical offsets.
4. Save/reopen; restore provenance from the Spursx2 AI binding. Refresh expired resolver references. Handle unavailable media without losing the edit manifest.
5. Render the supported cut through our worker; compare order, duration, canvas, source audio/mute, and captions against preview. Unsupported edits must block export clearly.
6. Expire a rights decision/change destination after editing. Verify import/review/release gate behavior, including direct calls, stale revisions, and cross-org IDs.

If the spike fails, retain the producer queue and implement a bounded three-clip timeline using existing FFmpeg rendering. Keep the same canonical manifest and review contract. Record the failed integration seam and continue the end-to-end demo; do not spend the whole hackathon fixing an upstream rewrite.

## 8. Instructions for future implementation agents

- Treat this as an editor adaptation task; do not resurrect the stadium or ticketing scope.
- Read current code before planning replacements. In our repository, start at `web/components/review-pane.tsx`, `web/lib/actions.ts`, `shared/schemas.ts`, `shared/db-schema.ts`, `pipeline/worker.ts`, `pipeline/render-local.ts`, and `shared/moment-manifest.ts`.
- Keep raw TwelveLabs `asset_id`, indexed `_id`/search `video_id`, origin ScorePlay ID, team ScorePlay ID, OpenCut media ID, and timeline element ID distinct.
- Fix response-mode timestamps, context-aware rights, and exact-revision approval before calling an integrated editor safe to export.
- Keep policy/ranking/stat truth on the server. Client autosave, undo, captions, and export actions do not grant rights or verify records.
- Use the inspected upstream commit, preserve the upstream license/copyright, record local changes, and avoid a wholesale framework/auth/database migration.
- Provide a working short-clip vertical slice plus the checks above. “The editor opens” is not enough to claim the montage bridge works.

The relevant upstream files were inspected through the GitHub connector. No upstream code, installers, media processing, or external publication was executed by this documentation update.
