# Spurs² Hackathon — Nova/OpenClaw Capability Audit & Competitive Case vs. Hermes

**Date:** 2026-10-20 · **Author:** Nova (main session, Opus-class) · **Status:** DRAFT for Stu's review
**Purpose:** Evidence-based assessment of whether Nova + OpenClaw gives a higher win probability than Hermes for the Spurs² hackathon (Thu PM → Fri AM build, Fri PM presentation).

---

## 0. Executive Verdict (honest version)

**Nova + OpenClaw is the stronger platform for THIS hackathon — but not for the reason a sales pitch would give.** The edge is not raw coding speed (Hermes is measurably faster and lighter per-turn on the same model — our own intel notes this). The edge is **verified operational infrastructure around the coding loop**: delegation, parallelism, scheduled watchdogs, browser automation, a disciplined build law forged from real failures, and a proven record of shipping multi-stage systems end-to-end with tests. In a 20-hour build window, the team that loses is the one that burns 3 hours on a silent failure, an untested integration, or a demo that lies. OpenClaw's entire operating doctrine exists to prevent exactly that.

**Challenge recommendation: Challenge B (Rights & Compliance Engine)** — see §4.

---

## 1. Audited Capabilities (verified this session, not theoretical)

### A. Agent Architecture
| Capability | Status | Evidence |
|---|---|---|
| Subagent spawning (`sessions_spawn`) | ✅ Verified | Visible/hidden children, isolated or forked context, git worktree checkout per child |
| Parallel fan-out (`collect=true` swarm + `agents_wait`) | ✅ Available | Structured `outputSchema` results per child — ideal for parallel module builds |
| Configured agent roster | ⚠️ **One agent (`main`)** | `agents_list` returns only `main` (Opus 5). All delegation is subagents of one agent, not a multi-persona team |
| Autonomous planning/completion | ✅ Proven | Artifex cockpit protocol: finish-blocks, gate resolver, tier gates (`memory/artifex-build-protocols.md`) |
| Checkpointing/resumption | ✅ Proven | Durable sessions, `sessions_history`, memory files, automations resume work after restarts |
| Error recovery discipline | ✅ Codified | Skills: `build-status-truth`, `deploy-verification-sequence`, `silent-success-audit`, `guard-negative-control` — all written from real incidents |
| Scheduled watchdogs | ✅ Proven | Automations system runs ~daily guards (e.g., cloutos-guard, doc-staleness crons) in production today |

### B. Engineering Toolchain
| Item | Status |
|---|---|
| Model routing | Opus 5 main/cockpit floor, Sonnet 5 subagent legwork, Haiku plumbing, Fable per-block escalation — codified in AGENTS.md |
| Claude Code | ✅ Installed (`/opt/homebrew/bin/claude`) — the proven cockpit for heavy builds (1M context) |
| GitHub | ✅ `gh` authed (PorterLabs, keyring), fine-grained PAT discipline, pre-push hooks, worktree spawning |
| Runtime | node v26, npm, python3, docker, brew — all present |
| ffmpeg | ❌ **Not installed** — required for any video-asset demo (Challenge A); 2-min brew fix but flag it now |
| Browser automation | ✅ `browser` tool + Playwright-style snapshots/refs + dedicated skill — live research + demo-site verification |
| Local serving/demo | ✅ Mission Control server live on :8080 today; `portal` tool exposes dev servers with hot reload |
| Testing infra | ✅ Proven pattern: Reaper money-path **19/19 tests** as a release gate; test-before-report is build law |
| Observability | ✅ Progress cards, session history, cron run history, ctx.sh token hygiene (measured 62k→88 tok wins) |

### C. Operational Reliability — honest weaknesses
1. **OpenClaw per-turn overhead is real.** Our own Alex Finn intel transcript: "Hermes moves much faster than OpenClaw even on the same model." Heavy system prompt + tool schema = slower raw turns.
2. **Context truncation history.** AGENTS.md was truncated in 88 bootstrap records before we split it. Mitigated (files split, summaries, ctx.sh), but long sessions need deliberate hygiene.
3. **Single-agent config.** Parallelism is subagents-of-main, not independent specialist agents. Works, but orchestration cost lands on the main session.
4. **Past incidents:** destructive heredoc file wipe (2026-08-18), silent cron failures, stale-doc misreports. **All are now codified guards** — but they happened.
5. **No verified TwelveLabs or ScorePlay integration.** Neither platform has touched these APIs. This is a wash vs. Hermes, not an edge.

---

## 2. Competitive Case vs. Hermes (point by point)

1. **Spec → working software:** Hermes wins raw single-thread speed. **OpenClaw wins wall-clock delivery** on multi-module builds via parallel subagents + worktrees — 3 modules build simultaneously while main holds architecture.
2. **Quality of autonomous coding:** Equal models available to both. OpenClaw's differentiator is the **enforced verification doctrine** ("code-complete ≠ tested ≠ shipped ≠ validated") — the Reaper build doctrine Hermes itself exported to us. We institutionalized it; execution under time pressure is where it pays.
3. **Complex multi-stage development:** OpenClaw has the **only proven multi-stage record here**: Reaper (money-path, 19/19 tests, live capital), Mission Control (multi-tab production app), morning-brief pipeline (3 surfaces), Artifex cockpit builds with phase tags and staleness watchdogs. Hermes's record (clout-venue) is real but single-repo, single-lane.
4. **Delegation:** OpenClaw: structured swarm fan-out with schemas, visible sessions Stu can steer mid-build, yield/announce completion flow. Hermes: effectively one lane + Claude Code.
5. **Model routing:** OpenClaw has codified tiering (Opus floor for authoring, Sonnet legwork, Fable scalpel escalation with a two-strikes protocol). Hermes defaults to one strong model for everything — simpler, costlier, no documented escalation law.
6. **Long-session stability:** Honest split. Hermes is lighter per-turn; OpenClaw has **durable recovery** — sessions, memory files, automations that survive restarts, and watchdog crons that catch drift while humans sleep. Over a 20-hour window with an overnight gap, recovery beats raw speed.
7. **Integration & debugging:** OpenClaw: browser automation for API-doc research and live demo verification, node/python debug skills, `gh` workflows, portal-exposed dev servers, log/process control (`exec`/`process`). This is the deepest verified gap in Nova's favor.
8. **Independent testing:** OpenClaw can **prove the demo works without a human**: spawn a subagent to drive the deployed UI via browser automation and screenshot the result. That is the difference between "it should work" and "here is evidence" at Friday's presentation.

**Net:** Hermes = faster scalpel. OpenClaw = full operating room. Hackathons are won in the operating room: parallel build, continuous verification, overnight watchdogs, and a demo that has already been machine-tested before judges see it.

---

## 3. Critical risks to pre-empt (either platform)
- Install ffmpeg + verify TwelveLabs/ScorePlay API keys and rate limits **before Thursday**.
- Pre-build a repo skeleton + deploy target (Vercel/local portal) Wednesday so hour 1 is features, not plumbing.
- Budget: cap Fable to two-strikes escalations; Sonnet swarm for module legwork.
- Context hygiene: one cockpit session per module, ctx.sh for all API inspection.

## 4. Challenge recommendation: **B — Rights & Compliance Engine**
- Deterministic rules + explainable decisions = **demoable without flaky live video pipelines**. Challenge A's demo quality depends on TwelveLabs video processing latency/quotas we cannot verify in advance — highest-variance element in the room.
- B maps directly to what this stack already does superbly: rules engines, audit trails, approval queues (we run review-queue + EPQ approval flows in production today), explainability docs, and a polished MC-style dashboard UI.
- Commercial story is stronger: rights compliance is a bleeding cost center for clubs across PL/NBA; "explainable decision attached to the asset + one-click approval" is exactly the APPROVE-shortcut pattern we've already shipped.
- Differentiator to pitch: **agentic compliance** — a watcher that re-evaluates assets when rights windows expire (our automations system, live today), not just a static checker.

---

*Prepared under build-status-truth discipline: every ✅ above was verified by live command or cited memory this session; weaknesses are stated against our own interest.*
