# Agent 2 Tasks - Rights, Rules, Publication Contracts

Agent: **A2**
Scope: rights engine, rule store, metadata stage, all DB schema and shared contracts.
Source plan: `features.md` and `docs/MASTER-TASK-LIST.md` §10.

## Working rules

- Edit only A2-owned paths unless explicitly coordinated:
  - `shared/rights/**`
  - `shared/db-schema.ts`
  - `shared/db/**`
  - `drizzle/**`
  - `shared/schemas.ts`
  - `shared/compliance.ts`
  - `shared/content-rules.ts`
  - `shared/clients/scoreplay-rights.ts`
  - `shared/publication.ts`
  - `shared/fan-ranking.ts`
  - `shared/fan-search.ts`
  - `pipeline/rules/**`
  - `scripts/rules-test.ts`
  - `scripts/engine-test.ts`
  - `scripts/seed.ts`
- Least code necessary. Prefer typed stubs and pure functions before UI or worker integration.
- No live writes. No secrets. No DB migration push; human handles migration application.
- Keep `npm test` green where network permits. The M5 may not reach Supabase; DB-backed e2e can be verified by another agent/human from a reachable network.

## Status legend

- TODO: not started
- DOING: in progress
- DONE: implemented and verified locally
- BLOCKED: waiting on another agent or human
- DEFERRED: explicitly cut from current slice

## Current slice: A2 PR 1 - shared contracts and schema

| ID | Feature ID | Task | Status | Notes |
|---|---|---|---|---|
| A2-001 | 0.1 | Add publication data model draft to `shared/db-schema.ts` and matching types in `shared/schemas.ts` | DONE | Added players, fan profiles/preferences, publications, publication versions, rights decisions/findings |
| A2-002 | 0.2 | Add `Player`, `FanProfile`, `FanPreference`, `Publication`, `PublicationVersion` concepts | DONE | Added schema + Zod concepts |
| A2-003 | 0.3 | Define `DestinationContext` for owned fan web and editor outputs | DONE | Added `shared/rights/types.ts` and `shared/schemas.ts` schemas |
| A2-004 | 0.4 | Add current-state guards: published, withdrawn, expired, scheduled | DONE | Added pure helpers in `shared/publication.ts` |
| A2-005 | 0.6 | Define minimal fan demo personas | TODO | Seed-friendly types only in this slice; seed data later |
| A2-006 | B2.1 | Add `DestinationContext` type | DONE | Duplicate of 0.3; implemented in `shared/rights/types.ts` and `shared/schemas.ts` |
| A2-007 | B2.3 | Treat unknown as not cleared for fan distribution | DONE | Added `rightsStatusAllowsFanDistribution`; UI integration belongs A3 |

## Next slice: A2 PR 2 - rights engine and metadata stage

| ID | Feature ID | Task | Status | Notes |
|---|---|---|---|---|
| A2-101 | B2.6 | Add rights rule engine with illustrative policy v0 | DONE | Added `shared/rights/engine.ts`, `pipeline/rules/rights-rules.json` |
| A2-102 | B2.7 | Add golden rights tests | DONE | Extended `scripts/rules-test.ts` with pure rights engine cases |
| A2-103 | B2.10 | Add `rights_decisions` and `rights_findings` tables | DONE | Added schema tables |
| A2-104 | B2.13 | Store rights rules as JSON rows with immutable rule-set versions and audit trail | DONE | Added schema tables for rights rules, versions and audits |
| A2-105 | B2.14 | Safe JSON condition evaluator, fact registry and rule lint | DONE | Added JSON DSL and lint in `shared/rights/rule-schema.ts`; engine uses no `eval` |
| A2-106 | B2.15 | Load active rule-set version and pin on each decision | DONE | `evaluateRights` returns `ruleSetVersion` on every decision |
| A2-107 | B14b.1-B14b.4 | Rights metadata completeness, detection, inference, merge/conflict | DONE | Added pure metadata helpers and tests |

## Later A2 work

| ID | Feature ID | Task | Status | Notes |
|---|---|---|---|---|
| A2-201 | B4.1-B4.3 | Publication lifecycle and `canViewPublication` | DONE | Added pure helpers and schema concepts |
| A2-202 | B7.1/B7.3 | Fan ranking and reason chips | DONE | Added `shared/fan-ranking.ts` with tests |
| A2-203 | B8.1/U3.1 | Canonical player seed types | DONE | Added `shared/player-identity.ts` demo roster + aliases; DB player table exists |
| A2-204 | B9.1/B9.3/B9.4 | Fan search helper and allowed-set guard | DONE | Added `shared/fan-search.ts`; empty allowed set refuses provider search |

## Changelog

- Added manual incremental migration `drizzle/0000_agent2_contracts.sql`; human must apply it after merge.
- Completed all currently assigned A2 pure-code slices: shared contracts/schema, publication visibility, rights rule engine, rule store schema, rights metadata, fan ranking, fan search guard and demo player identity.
- Removed generated full-baseline Drizzle migration from the branch; replaced it with the manual incremental migration above.
- Created task tracker for A2 lane.
