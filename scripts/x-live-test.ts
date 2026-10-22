/**
 * One-shot live verification of the x-clout publish backend.
 * Posts ONE test tweet (with video when available), prints id+URL, then DELETES it.
 * Requires PUBLISH_LIVE=1. Run: PUBLISH_LIVE=1 npx tsx scripts/x-live-test.ts [videoPath]
 */
import { createTweet, deleteTweet, uploadVideoForTweet } from "../shared/clients/publish";

const video = process.argv[2] ?? "data/fallback-assets/poc/final_clip_9x16.mp4";
const TEXT = "Spursx2 AI — pipeline test 🧪 (will be deleted)";

async function main() {
  if (process.env.PUBLISH_LIVE !== "1") throw new Error("set PUBLISH_LIVE=1");
  let mediaId: string | undefined;
  try {
    const t0 = performance.now();
    mediaId = await uploadVideoForTweet(video);
    console.log(`media upload OK: ${mediaId} (${Math.round(performance.now() - t0)}ms)`);
  } catch (e) {
    console.error(`VIDEO UPLOAD FAILED — falling back to text-only: ${e}`);
  }
  const { id, url } = await createTweet(TEXT, mediaId);
  console.log(`tweet created: id=${id} url=${url} video=${mediaId ? "yes" : "no"}`);
  await new Promise((r) => setTimeout(r, 3000));
  const deleted = await deleteTweet(id);
  console.log(`tweet deleted: ${deleted}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
