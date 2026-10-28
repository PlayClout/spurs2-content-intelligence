/**
 * Producer UI browser walks in real Chrome:  npm run test:ui
 *
 *   1. one fresh LIVE replay of the real Man Utd v Tottenham timeline into the local test database
 *      (real ScorePlay reads + real TwelveLabs analysis/search; ScorePlay writes stay held)
 *   2. production build + `next start` on :3212
 *   3. three walks, clip state reset between them (no re-analysis): producer, packaging, review
 *
 * Needs: the local docker Postgres (UI_TEST_DATABASE_URL, default postgres://postgres:verify@127.0.0.1:55432/flow, schema
 * from `npm run db:push`), Google Chrome, and the ScorePlay + TwelveLabs keys in .env. Refuses any non-local database.
 *   --skip-replay   reuse the clips already in the test DB (fast re-run while iterating)
 *   --only=<name>   run one walk: producer | packaging | review | library | live | live-replay
 *   live walk: joins the real full match at 89', the live engine (started here in the live lane) cuts the equaliser
 *   live-replay walk: the hosted demo's /live (replay of the recorded live session; read-only)
 */
import { freshReplay, resetClipState, startServer, stopServer, startLiveEngine, stopLiveEngine, sql } from "./ui/harness";
import { producerWalk } from "./ui/producer.walk";
import { packagingWalk } from "./ui/packaging.walk";
import { reviewWalk } from "./ui/review.walk";
import { liveWalk } from "./ui/live.walk";
import { libraryWalk } from "./ui/library.walk";
import { liveReplayWalk } from "./ui/live-replay.walk";

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const walks: [string, () => Promise<number>][] = [["producer", producerWalk], ["packaging", packagingWalk], ["review", reviewWalk], ["library", libraryWalk], ["live", liveWalk], ["live-replay", liveReplayWalk]];

let failed = 0;
try {
  if (!process.argv.includes("--skip-replay")) {
    const t0 = Date.now();
    console.log(`live replay -> local test DB: ${await freshReplay()} clips in ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  await startServer({ build: !process.argv.includes("--no-build") });
  for (const [name, walk] of walks.filter(([n]) => !only || n === only)) {
    await resetClipState();
    if (name === "live") await startLiveEngine();
    console.log(`\n── ${name} walk ──`);
    failed += await walk();
  }
} catch (e) {
  console.log(`FAIL  harness: ${(e as Error).message}`);
  failed++;
} finally {
  stopServer();
  stopLiveEngine();
  await sql.end();
}
console.log(`\nUI walks: ${failed ? `${failed} FAILED` : "ALL PASS"}`);
process.exit(failed ? 1 : 0);
