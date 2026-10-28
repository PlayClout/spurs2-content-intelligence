# Pipeline proof: ScorePlay + TwelveLabs → the producer's list of potential clips

Run 10/22/2026, 9:49:27 PM against the connected accounts. Every number below came back from a live call made by this run.

## 1. Connected accounts

ScorePlay: company **spurs2-hack-12** (spurs2-hack-12), 175 rights, download right: yes · 181 ms
- PASS ScorePlay answers live with the configured key (GET /whoami)
- PASS ScorePlay key can download media (can_do_media_download)
- PASS ScorePlay writes are held: this proof writes nothing back
TwelveLabs: index **premiere-league** (6ad90f31960d8ea7bdd040ab), 58 videos, models marengo3.0 · 690 ms
- PASS TwelveLabs answers live with the configured key (GET /indexes/{id})

## 2. Footage map: the same clips in both accounts

Each ScorePlay video is matched to its copy in the TwelveLabs index by filename (scripts/build-footage-map.ts). Re-checked live here:
Stored map: 101 ScorePlay videos, 58 TwelveLabs videos, **58 matched**.
Live now: ScorePlay media search page 1 → 50 videos (305 ms); TwelveLabs index listing page 1 → 50 videos (109 ms).

| Timeline clip | ScorePlay media | ScorePlay name (live) | TwelveLabs video | TwelveLabs filename (live) |
|---|---|---|---|---|
| solanke-goal | 130849867 | solanke late goal.mp4 | 6ad90f5a65b4aff96dc7afe5 | solanke late goal.mp4 |
| savio-chance | 130849865 | savio chance.mp4 | 6ad90f58960d8ea7bdd041ab | savio chance.mp4 |
| fans-clap | 130849743 | Fans clap Man United A 9x16.mp4 | 6ad90f37960d8ea7bdd040d2 | Fans clap Man United A 9x16.mp4 |
| archie-tackle | 130849847 | Archie tackle.mp4 | 6ad90f4d960d8ea7bdd04163 | Archie tackle.mp4 |
| kudus-chance | 130849848 | kudus chance_1.mp4 | 6ad90f4e500e82756f2ea907 | kudus chance_1.mp4 |
- PASS all 5 clips the match timeline uses resolve live in BOTH accounts with matching filenames and asset ids (5)

## 3. Triggers: what makes a clip a candidate

A candidate starts from a trigger on a real clip. The match feed and fan reaction are a timed replay (labelled simulated in the app). The AI watch-list is a live TwelveLabs search that finds moments no feed logged.

| At | Clock | Kind | Clip (ScorePlay media) | Trigger | Window |
|---|---|---|---|---|---|
| 5s | 88' | match feed (replay) | solanke-goal (130849867) | Goal, Solanke equalises late | 2–11s |
| 18s | 89' | fan reaction (replay) | solanke-goal (130849867) | Mentions of Solanke up 11x in 2 minutes | 3–11s |
| 30s | 62' | match feed (replay) | savio-chance (130849865) | Big chance, Sávio breaks and cuts back, keeper saves | 4–13.5s |
| 42s | FT | fan reaction (replay) | fans-clap (130849743) | Away end trending: 'proud of this team' | 22.8–30s |
| 55s | 71' | AI watch-list (live) | kudus-chance (130849848), archie-tackle (130849847) | search “shot on goal” | found by search |

Live watch-list: TwelveLabs Marengo search “shot on goal” over 2 watched clips → 4 hits in 306 ms. Top new hit: video 6ad90f4e500e82756f2ea907 at 18.4–26.0s → ScorePlay media 130849848.
- PASS the watch-list search runs live and lands on a watched real clip (mapped back to its ScorePlay media)

## 4. One moment end to end: the Solanke goal

4a. ScorePlay media 130849867: “solanke late goal.mp4”, duration not set in ScorePlay, event 1536082 · 121 ms
    Rights fields read: can_be_shared=false, accessible_from=0, accessible_until=0, usage=""
4b. ScorePlay download formats (media version 130468237): original, video_large, video_medium → using **video_large** (1080p @8mb proxy, 31 MB) via a presigned link · 185 ms
- PASS ScorePlay returns a presigned download link for the proxy
4c. ScorePlay rights evidence: available, roster 67 players (team season 72209), 52 external groups · 253 ms
- PASS rights facts come live from ScorePlay (media + season roster + external groups)
4d. processMoment (the worker's own function): trigger window 2–11s → download proxy → TwelveLabs Pegasus analyse → rights → render drafts…
    TwelveLabs Pegasus (live) analysed 0–14s in this run (whole moment 44541 ms):
    Summary: “A football match sequence showing a goal scored by a Tottenham player (Dominic Solanke) against Manchester United, followed by celebration with teammates.”
    Beats: Build-up play 0–4.5s · Goal scored 4.5–8.5s · Celebration 8.5–14s
    Also seen: sponsors Cashback, sumup, DHL; people Dominic Solanke, Tottenham teammate (curly hair), Manchester United goalkeeper; audio broadcast_commentary
    Content check from what the AI saw (sponsors, people, audio): GREEN
- PASS TwelveLabs Pegasus analysed this exact window live and returned timed beats
4e. Smart trim from those beats (Instagram Reel): 1.5–14s (12.5s). Starts 3.0s before the goal scored so the build-up lands, ends after the celebration.
- PASS smart trim picks a cut inside the analysed footage from the live beats
4f. Drafts on disk: reel.instagram_reel.draft.mp4 (1080,1920), card.instagram_feed.jpg (1080,1350)
- PASS a 9:16 reel draft and a 4:5 photo card were rendered from the real ScorePlay footage
- PASS the downloaded club footage copy was deleted after rendering (only drafts remain)

## 5. The producer's list: the whole match through the real worker

Replayed 5 timeline events through the worker in 171s (local test database, real ScorePlay + TwelveLabs calls).

This is the list the producer sees in the inbox, highest score first, each clip traced to where it came from. Rights read “restricted” because ScorePlay marks this footage can_be_shared=false, so every clip waits for a person to approve it: the gate working, not a fault.

| Score | Clip | Format | ScorePlay media | TwelveLabs asset | Analysis | Beats | Triggered by | Rights |
|---|---|---|---|---|---|---|---|---|
| 80 | SOLANKE RESCUES A POINT | Reel | 130849867 (live) | 6ad90e129c038876f3589de8 | Pegasus live | Build-up play, Goal scored, Celebration | game event (replay) + social reaction (replay) | restricted |
| 79 | SOLANKE RESCUES A POINT | Photo card | 130849867 (live) | 6ad90e129c038876f3589de8 | Pegasus live | Build-up play, Goal scored, Celebration | game event (replay) + social reaction (replay) | restricted |
| 56 | SO CLOSE FROM SÁVIO | Photo card | 130849865 (live) | 6ad90e122cc348c0bd1fffb3 | Pegasus live | Initial tackle and advantage, Breakthrough run, Shot and save, Rebound scramble | game event (replay) | restricted |
| 55 | THE AWAY END, AT FULL TIME | Photo card | 130849743 (live) | 6ad90e1d5411fa6e602f3377 | Pegasus live | Player clapping, Player walking and clapping, Fans cheering | social reaction (replay) | restricted |
| 55 | SO CLOSE FROM SÁVIO | Reel | 130849865 (live) | 6ad90e122cc348c0bd1fffb3 | Pegasus live | Initial tackle and advantage, Breakthrough run, Shot and save, Rebound scramble | game event (replay) | restricted |
| 50 | THE AWAY END, AT FULL TIME | Reel | 130849743 (live) | 6ad90e1d5411fa6e602f3377 | Pegasus live | Player clapping, Player walking and clapping, Fans cheering | social reaction (replay) | restricted |
| 45 | THE CHANCE NOBODY LOGGED | Photo card | 130849848 (live) | 6ad90e1565b4aff96dc7a8b8 | Pegasus live | Coach reaction, Attacking buildup, Shot and miss | AI watch-list (live) | restricted |
| 40 | THE CHANCE NOBODY LOGGED | Reel | 130849848 (live) | 6ad90e1565b4aff96dc7a8b8 | Pegasus live | Coach reaction, Attacking buildup, Shot and miss | AI watch-list (live) | restricted |
- PASS the worker turned the timeline into 8 candidate clips (a reel + a photo card for each of 4 plays)
- PASS every candidate was built from live ScorePlay media and a live TwelveLabs analysis
- PASS every candidate traces back to a ScorePlay media id that maps to a TwelveLabs asset
- PASS one candidate exists only because the live AI watch-list found it (no feed logged it)
- PASS a second report of the same play merged into the existing clip (corroboration, no duplicate)

---

**Result: all checks passed.** ScorePlay writes were held throughout; stage 5 ran against the local test database only.
