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
