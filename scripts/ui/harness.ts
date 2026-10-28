/**
 * Shared harness for the producer browser walks (scripts/ui/*.walk.ts).
 *
 * Safety: walks reset and rewrite data, so they ONLY ever run against a local throwaway Postgres
 * (UI_TEST_DATABASE_URL, default the docker `flow` database). Any non-local URL is refused, so a walk can never touch
 * live Supabase. ScorePlay writes stay held (SCOREPLAY_WRITES is forced off).
 */
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { chromium, type Browser, type Page } from "playwright-core";

export const REPO = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
export const PORT = Number(process.env.UI_TEST_PORT ?? 3212);
export const BASE = `http://localhost:${PORT}`;
export const DB_URL = process.env.UI_TEST_DATABASE_URL ?? "postgres://postgres:verify@127.0.0.1:55432/flow";
export const RENDER_DIR = "out/flow-renders";

export function assertLocalDb(url = DB_URL) {
  const u = new URL(url);
  if (!["127.0.0.1", "localhost", "::1"].includes(u.hostname)) throw new Error(`UI walks only run against a local database (got host ${u.hostname}). Refusing.`);
  // the demo database holds the producer's real inbox; walks reset data, so they may never touch it
  if (u.pathname.replace(/^\//, "") === "demo") throw new Error("UI walks never run against the demo database (they reset data). Refusing.");
}
assertLocalDb();

export const sql = postgres(DB_URL, { max: 2, prepare: false, onnotice: () => {} });

/** Env for child processes (worker, replay, web server): local DB, local renders, writes held. */
export function childEnv(extra: Record<string, string> = {}) {
  const env: Record<string, string> = { ...(process.env as Record<string, string>), DATABASE_URL: DB_URL, RENDER_OUT_DIR: RENDER_DIR, RENDER_STORAGE: "local", ...extra };
  delete env.SCOREPLAY_WRITES;
  return env;
}
const tsx = `${REPO}/node_modules/.bin/tsx`;

export function runWorkerOnce() {
  return execFileSync(tsx, ["--env-file=.env", "pipeline/worker.ts", "--once"], { cwd: REPO, env: childEnv(), stdio: "pipe" }).toString();
}

/** Fresh live replay of the real Man Utd v Tottenham timeline into the local DB (real ScorePlay + TwelveLabs reads). */
export async function freshReplay() {
  await sql.unsafe(`delete from app_settings where key like 'live_%'; delete from publication_versions; delete from publications; delete from rights_findings; delete from rights_decisions;
    delete from write_back_jobs; delete from approval_audits; delete from published_assets; delete from opportunities;
    delete from signals; delete from moments; delete from assets; delete from jobs;`);
  execFileSync(tsx, ["--env-file=.env", "scripts/replay.ts", "--speed=50"], { cwd: REPO, env: childEnv(), stdio: "pipe" });
  // one retry for a transient render/encoder failure (seen once; the retry succeeded)
  const [{ n }] = await sql`select count(*)::int n from jobs where status = 'failed' and type = 'process_moment'`;
  if (n > 0) {
    await sql`update jobs set status='queued', error=null, queued_at=now(), started_at=null, finished_at=null where status='failed' and type='process_moment'`;
    runWorkerOnce();
  }
  const [{ clips }] = await sql`select count(*)::int clips from opportunities`;
  if (clips < 8) throw new Error(`replay produced ${clips} clips (expected 8): check /tmp logs, keys and network`);
  return clips;
}

/** Put clip state back to "just drafted" without re-running the (slow, paid) analysis. */
export async function resetClipState() {
  await sql`update opportunities set status='draft_ready', trim_override=null, final_paths='{}', reject_reason=null,
    delivery = delivery - 'packaging' - 'alert' - 'scoreplayWriteBack' - 'final' - 'trimMode'`;
  await sql.unsafe(`delete from publication_versions; delete from publications; delete from published_assets;
    delete from write_back_jobs; delete from approval_audits; delete from jobs where status <> 'done';`);
}

/** The live engine (a worker in the live lane): cuts moments off the full match as the live session airs them. */
let liveWorker: ChildProcess | null = null;
export async function startLiveEngine() {
  await sql.unsafe(`delete from app_settings where key like 'live_%'`);
  liveWorker = spawn(tsx, ["--env-file=.env", "pipeline/worker.ts"], { cwd: REPO, env: childEnv({ WORKER_LANE: "live", WORKER_POLL_MS: "500" }), stdio: "ignore" });
}
export function stopLiveEngine() { liveWorker?.kill(); liveWorker = null; }

let server: ChildProcess | null = null;
export async function startServer({ build = false } = {}) {
  if (build || !existsSync(`${REPO}/web/.next/BUILD_ID`)) execFileSync("npm", ["run", "build"], { cwd: `${REPO}/web`, env: childEnv(), stdio: "pipe" });
  try { execFileSync("bash", ["-c", `lsof -ti tcp:${PORT} | xargs kill 2>/dev/null; true`]); } catch { /* nothing listening */ }
  server = spawn(`${REPO}/web/node_modules/.bin/next`, ["start", "-p", String(PORT)], { cwd: `${REPO}/web`, env: childEnv({ RENDER_OUT_DIR: `${REPO}/${RENDER_DIR}` }), stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/robots.txt`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`web server did not start on :${PORT}`);
}
export function stopServer() { server?.kill(); server = null; }

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export async function openBrowser(): Promise<{ browser: Browser; page: Page; errors: string[] }> {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  return { browser, page, errors };
}

/** PASS/FAIL reporter, same output format as the other repo tests. */
export function reporter(name: string) {
  let fail = 0, pass = 0;
  return {
    check(ok: boolean, msg: string) { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); ok ? pass++ : fail++; },
    get failed() { return fail; },
    summary() { console.log(`\n${name}: ${fail ? `${fail} FAILED` : "ALL PASS"} (${pass} passed)`); return fail; },
  };
}

export async function orgAndSolanke() {
  const [org] = await sql`select id from orgs where name = 'Tottenham Hotspur'`;
  const [sol] = await sql`select id from opportunities where org_id = ${org.id} and content_type = 'reel' and headline ilike 'SOLANKE%'`;
  if (!org || !sol) throw new Error("expected the Tottenham org and the Solanke reel from the replay");
  return { orgId: org.id as string, solId: sol.id as string };
}
