# Spurs² Content Intelligence

**Assisted Auto-Production Engine. One game, a thousand outputs.**

The producer *approves* instead of *searches*. The system watches the match, decides what is worth
making, cuts it for every audience and channel, shows its reasoning (including what it rejected and
why), and puts the right five options in front of a producer in the time it used to take to find one.

Built by **Clout Labs**. Stack: **ScorePlay** (media system of record) · **Twelve Labs** (Marengo +
Pegasus video understanding) · **Anthropic Claude** (reasoning and copy) · **Postgres / Supabase** · **Next.js**.

---

## ▶ Live demo (nothing to install)

### **https://spurs2-content-intelligence.vercel.app**

A hosted, browse-only build of the real application. It is fully interactive: live Twelve Labs
semantic search against the real match indexes, the scored producer inbox, the "Why this clip"
reasoning, one-moment-to-nine-channels packaging, and the personalized fan app with real clip playback.

## 📹 73-second walkthrough video

**[`submission/Spurs2-Content-Intelligence-Demo.mp4`](submission/Spurs2-Content-Intelligence-Demo.mp4)**
is a narrated tour of the actual running system (not slides): producer inbox, reviewing a clip with
video playback, the "Why this clip" reasoning, one moment cut for nine channels, approval, a live
Twelve Labs search, the live-match desk, and the personalized fan app. The same file is attached to
the submission.

A longer written reviewer guide, a one-page architecture diagram, and a PDF summary live in
[`submission/`](submission/).

---

## The problem

Clubs capture enormous amounts of footage and can use only a fraction of it. What gets made is
limited by how many editors are free, while fans have already decided what matters, often before
anyone in the building has found the clip. The brief asked for the system that *decides what is worth
making and then makes it, with a producer approving rather than searching*, and, critically, *show
your work, including what you left out*. That last requirement shaped the whole product.

## What the system does

1. **Watches the match.** Every scoring or notable moment is detected and cut automatically.
2. **Scores each moment** across significance, audience fit, and corroboration (including signals
   from outside the video: crowd reaction, the bench, the room going quiet).
3. **Produces, not just finds.** One moment becomes many outputs (reels, photo cards, per-channel
   cuts), each framed to the right aspect ratio with safe zones, for up to **9 channels**.
4. **Explains itself.** For every proposal the producer sees the play it saw, the signals behind the
   score, and the audience it is for, plus **what it considered and rejected, with a reason**, so a
   human can catch the gem the model missed.
5. **Keeps a human in the loop.** The producer approves, edits, or rejects. Rights are checked
   against ScorePlay and re-checked at publish.
6. **Personalizes for fans.** Approved moments flow into a fan app whose feed re-ranks per supporter
   and supports natural-language search over the footage.

---

## How to explore the live demo (about 5 minutes)

Open **https://spurs2-content-intelligence.vercel.app** and follow along:

1. **Inbox (the landing page).** This is the scored review queue for the San Antonio Spurs. Each card
   is a moment the engine decided was worth making, already cut into outputs. Use the club switcher
   (top left) to flip between **San Antonio Spurs** and **Tottenham Hotspur**.
2. **Open any card.** Press play on the clip. Open **"Why this clip"** to see the reasoning and the
   signals behind the score. Open **Channels** to see the single moment packaged for nine different
   channels and aspect ratios. Open **Fan app** to see how it would appear to supporters.
3. **Library (live Twelve Labs search).** Click a suggestion chip such as **"Wembanyama dunk"** or
   **"blocked shot"**, or type your own ("goal celebration", "crowd cheering"). Results come back
   **live from Twelve Labs** against the real match index, each starting at the exact moment, not the
   start of the file.
4. **Fan app (`/fan`).** Toggle the fan personas and watch the feed re-rank. Open a clip to play it.
5. **Published / Approved / Montages.** The produced output in its finished states.

> **About the live-match desk:** in the running system this joins the venue broadcast feed and cuts
> moments in real time as the match plays. That feed was a time-boxed event feed that the partners
> cleared after the hackathon, so the hosted demo shows a short explanatory notice there instead of a
> dead player. **The live desk is shown working in the walkthrough video,** and everything it produces
> is what you are browsing in the Inbox, Library, and Fan app.

---

## Architecture

```
ScorePlay (MAM / system of record)        Twelve Labs (video understanding)
   player & sponsor tags, rights,            Marengo  -> plain-language moment search
   renditions, media assets                  Pegasus  -> descriptions, tags, rule checks
            \                                      /
          +------------------ Intelligence layer ------------------+
          |  moment detection · scoring (significance / audience    |
          |  fit / corroboration) · "why / why-not" reasoning       |
          |  (Anthropic Claude) · rights screening                  |
          +---------------------------+-----------------------------+
                                      |
        +-----------------------------+----------------------------+
        | Producer app (Next.js)            Rendering worker        |
        |  inbox · review · packaging        ffmpeg/canvas job      |
        |  · approve · publish               queue -> per-channel   |
        |                                    cuts                   |
        +-----------------------------+----------------------------+
                                      |
                        Fan app (personalized feed + NL search)

   State: Postgres / Supabase (22 tables).   Every Twelve Labs asset carries its
                                             ScorePlay asset ID for write-back.
```

## What is live vs. simulated (truth rule)

| Capability | Status |
|---|---|
| Twelve Labs Marengo semantic search | **Live** - real queries, real results against the real indexes |
| Twelve Labs Pegasus descriptions / tags | **Live** integration |
| Scoring, "why / why-not" reasoning, copy (Claude) | **Live** integration |
| Producer workflow, packaging, fan personalization, rights screening | **Fully built and working** |
| ScorePlay auth, tag / player resolution, rights flags | **Live** |
| ScorePlay media assets / streaming (incl. the live-match feed) | **Cleared post-event** - the hackathon platforms were wiped. Clip playback in the demo uses the clips rendered during the event (bundled with the hosted build). The ScorePlay read/write integration itself is intact. |

### Why the hosted build is browse-only

The app is production-shaped, not a static site. The **rendering worker** is a long-running
ffmpeg/canvas process that needs a container (for example AWS Fargate), not a serverless host, so the
hosted web deploy shows already-produced content and runs live search, but does not render brand-new
clips on demand. The full local experience does both. No Microsoft or Azure technology is required.

---

## Run locally (optional, for full fidelity)

Prerequisites: Node 20+, Docker, and the API keys in `.env` (Twelve Labs + ScorePlay + Anthropic).
Copy `.env.example` to `.env` and fill in keys.

```bash
# one command: starts a local Postgres, seeds the demo state, builds and serves the app + worker
NO_OPEN=1 bash scripts/demo.sh

open http://localhost:3000          # producer app
open http://localhost:3000/fan      # fan app
open http://localhost:3000/library  # live Twelve Labs search
```

Running locally adds the two things the hosted build cannot do: the real-time live-match desk and
on-demand rendering of new clips.

## Production path

- Move rendered media to object storage + CDN; run the worker on a container service.
- Wire ScorePlay webhooks so a new asset lands, goes to Twelve Labs, is scored, and is queued
  automatically.
- Write verdicts and decisions back to ScorePlay as timecoded actions, closing the MAM loop.
- Per-tenant isolation so each club runs its own instance on its own brand.
