# Spursx2 AI: write-back taxonomy (DRAFT for ScorePlay sign-off)

Team: spurs2-hack-12 · Challenge 1, Assisted Auto-Production · 2026-10-22

> Your deck says "agree your taxonomy with us before writing." This is everything our app will write into
> ScorePlay. Nothing has been written yet. We **reuse your existing tag groups** wherever possible and add only
> two small new groups plus one sub-collection.

## 1. What we write, and where

| Write | Endpoint | When | Volume (est.) |
|---|---|---|---|
| **Log** on the source video (start, end, reasoning, tags, players) | `POST /video/logs` (`start_offset` / `end_offset` in seconds) | Producer **approves** a recommended moment | 5 to 20 per match |
| **Upload** of the finished clip or photo card | `POST /upload/event/{our sub-collection}` + complete | Automatically after each approved destination rendition finishes rendering | One file per selected eligible social/app rendition |
| **Tags + details** on the uploaded media | `POST /media/{id}/tags`, `PUT /media/{id}/details` | Right after the upload completes | per upload |
| **One sub-collection** for our outputs | `POST /event` (once) | Setup, once per match collection | 1 |

We never change source descriptions/details or `accessible_*` fields and never delete media.
After a person confirms a rights record, allow-listed `rights:` tags may be added to its source;
only tag IDs recorded as written by our own jobs may be replaced. Existing human/provider tags are preserved.
Source-log writes carry a stable `[clout:<id>]` marker so retries can reconcile them.

**Current build:** local-only renders; uploads, output collections and output details below are deferred proposals,
not enabled endpoints. The A1 write contract currently supports approved source logs. Confirmed rights payloads
and persistent queue/settings integration await A2's contracts; without a durable settings adapter all live sends
are held. `SCOREPLAY_WRITES=1`, `SCOREPLAY_WRITE_KILL_SWITCH=0` and a false DB kill switch are all required.
The admin must show DRY RUN/held payloads, never pretend a fixture write reached ScorePlay.

Write-back runs automatically in background jobs: approval queues the source log, and render completion queues each rendition upload plus tags/details and source/revision/channel references. No manual per-clip sync is required. Record pending/synced/held/failed state and stable provider IDs. Retries must reconcile existing writes and avoid duplicate logs/uploads. The workspace taxonomy sign-off gate holds live work until enabled; queued jobs then resume with current approval and rights checks.

## 2. The sub-collection

```
Premier League › Manchester United vs Tottenham Hotspur - Week 6 › Match
   └── Spursx2 AI Productions        (new, POST /event, parent_id = Match 1536077, external_id = "clout-ai-productions")

NBA › San Antonio Spurs vs Sacramento Kings - Preseason
   └── Spursx2 AI Productions        (same pattern, parent = the game collection)
```

Inherits the match's tags through your collection hierarchy (Premier League, 2026/27, Soccer, teams, Match Day).

## 3. Tags: reuse first

### Existing groups we reuse (no new options)

| Your group | Options we use | Applied to |
|---|---|---|
| **sport** | soccer · basketball | logs + uploads |
| **team** | tottenham hotspur fc · san antonio spurs (sas) · opponent | logs + uploads |
| **category** | highlights · social media | uploads |
| **format** | video · photo | uploads |
| **Soccer: in-game actions** | pass · corner · penalty · assist · head · dribble · yellow card · red card | logs (when Pegasus sees it) |
| **Basketball: in-game actions** | 3pt · 2pt · free throw · cross over · assist · dribble | logs (when Pegasus sees it) |
| **Competition** | premier league · nba | uploads (inherited) |
| **Players** (player tags, not options) | e.g. Solanke 736578 · Sávio 736557 · Wembanyama 736583 · Fox 736586 · Harper 736584 | logs `player_ids` + uploads |

### Proposed NEW groups (small, flat)

**A. `Spursx2 AI: moment`**: what kind of moment the log marks. Fills the gaps in your in-game action lists.

| Option | Meaning |
|---|---|
| goal | ball in the net (soccer) |
| big chance | clear scoring chance, not converted |
| dunk | basketball dunk |
| buzzer beater | basket at the end of a period |
| celebration | player or team celebration |
| crowd reaction | fans visibly or audibly reacting |
| key defensive play | tackle, block, steal, save |
| skill moment | standout individual skill (not a scoring play) |

**B. `Spursx2 AI: production`**: why the moment was produced and for whom. This is the "how do you show why" layer.

| Option | Meaning |
|---|---|
| ai recommended | the engine proposed it |
| producer approved | a human approved it |
| audience: casual fan | produced as a 9:16 reel |
| audience: superfan | produced as a 4:5 photo card |
| signal: game event | triggered by the game feed |
| signal: fan reaction | triggered by social / fan reaction |
| signal: ai watch-list | found by TwelveLabs search, no data feed logged it |
| rights: cleared | passed our rights check |
| rights: needs remediation | a permitted transformation is required |
| rights: needs review | evidence or contract terms are missing/conflicting |
| rights: blocked | not permitted for the evaluated context |
| rights: expired | permission window ended |
| rights: inferred | provenance: contains model-derived content facts |
| rights: partial coverage | analysed windows do not cover the full source |

The allow-list includes the five rights states plus two provenance tags; rights tags require a confirmed rights record and are never inferred from editorial approval alone. If you'd rather we put these in `raw_tags` on logs only (no new tag groups),
we can do that instead.

## 4. The log, field by field (`POST /video/logs`)

```json
{
  "company_id": <read off any media>,
  "video_logs": [{
    "media_id": 130849784,
    "log": {
      "start_offset": 4210.0,
      "end_offset": 4228.5,
      "comment": "Solanke equaliser, 88'. Why: game event (goal) + fan reaction spike merged on the same play; TwelveLabs: 'Solanke turns and finishes low; away end erupts'. Audience: casual fan (9:16 reel). Rights: cleared. Output: media 13xxxxxxx in Spursx2 AI Productions. [clout:9f2c1a]",
      "raw_tags": ["goal", "celebration", "ai recommended", "producer approved", "audience: casual fan", "signal: game event", "signal: fan reaction"],
      "player_ids": [736578]
    }
  }]
}
```

**Comment format** (one line, always in this order): *what happened* · *why* (signals that fired) · *what
TwelveLabs saw* · *audience and format* · *rights verdict* · *output media id* · `[clout:<id>]` marker.

## 5. On the uploaded output

- **Name:** `<moment>_<player>_<format>.mp4`, e.g. `goal_solanke_9x16.mp4`, `goal_solanke_4x5.jpg`
- **Description:** the same one-line reasoning as the log comment, plus `Source: media 130849784 @ 70:10–70:28`
- **Tags:** sport, team, category (highlights / social media), format, `Spursx2 AI: moment`, `Spursx2 AI: production` options, player tags

## 6. Questions for you

1. OK to create the two `Spursx2 AI:` tag groups, or should we use `raw_tags` on logs only?
2. OK to create the `Spursx2 AI Productions` sub-collection under `Match` (and the Spurs game collection)?
3. Live writes during judging: fine on this workspace?
4. The San Antonio Spurs videos are on ScorePlay but **not in the TwelveLabs index** (58 Premier League videos only). Are they indexed somewhere, or should we index them ourselves?
5. Logs on short edits (e.g. `solanke late goal.mp4`) or only on the full match? We plan to log on **the full match when the moment is in it**, and on the clip otherwise.

## 7. A1 implementation gates and handoff

`shared/clients/writeback.ts` exports the single tag/field allow-list and the queue/settings interface.
Unknown `raw_tags` are dropped and logged, including `clout-approved`; unexpected write fields are rejected.
Ordinary editorial source logs cannot emit `rights:` tags. The confirmed-rights sender must consume A2's payload,
use `[clout:rights:<mediaId>:<hash8>]`, preserve analysis bounds, and carry rule-set/engine versions, policy label,
run ID, evidence timecodes, provenance counts and confirmer/time. Only IDs our records created can be removed.
If `/whoami` lacks `can_do_media_edit`, the rights integration must fall back to logs only.

Dry run builds the payload without network calls. The DB kill switch is read at send time and again immediately
before mutation; errors/missing settings hold the write. Fixture/seeded requests cannot send live. A2's durable
store must uniquely constrain the write key, atomically claim work, preserve provider IDs across restarts, and
schedule retry/backoff. The A1 source-log primitive reads provider markers for reconciliation; it must not blindly
retry an ambiguous POST.
