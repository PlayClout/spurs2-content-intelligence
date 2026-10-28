/** Library page: each club's real ScorePlay collections, live TwelveLabs search, Make clip queues the normal pipeline.
 * Reads ScorePlay + TwelveLabs live; the queued job is checked in the DB (the walk does not wait for the worker). */
import { BASE, sql, openBrowser, reporter } from "./harness";

export async function libraryWalk() {
  const r = reporter("libraryWalk");
  const { browser, page, errors } = await openBrowser();
  try {
    const orgs = Object.fromEntries((await sql`select id, name from orgs`).map((o) => [o.name as string, o.id as string]));
    await page.goto(`${BASE}/library?org=${orgs["Tottenham Hotspur"]}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("search", { name: /Search Tottenham/ }).or(page.locator('form[role="search"]').filter({ hasText: "Search" })).first().waitFor({ timeout: 30000 });
    r.check(await page.getByRole("link", { name: /^Library$/ }).isVisible(), "sidebar has a Library entry");
    r.check(await page.locator('form[role="search"]').count() === 1, "one search box on the Library page (the inbox filter is hidden there)");
    const rail = await page.getByLabel("ScorePlay collections").innerText();
    r.check(/Press Conference/.test(rail) && /Match photos/.test(rail) && /Dressing room photos/.test(rail) && /Creative Video/.test(rail),
      "Tottenham's rail lists its real ScorePlay collections (press conference, match + dressing room photos, creative)");
    r.check(await page.locator('ul[aria-label="Assets"] li').count() > 0, "the grid shows the club's ScorePlay assets");

    await page.getByRole("link", { name: /Match photos/ }).click();
    await page.waitForURL(/col=/);
    await page.locator('ul[aria-label="Assets"] li').first().waitFor({ timeout: 30000 });
    r.check(/of Tottenham Hotspur|Tottenham Hotspur/.test(await page.locator('ul[aria-label="Assets"]').innerText()), "photo collection shows the photographer's captions");

    await page.getByRole("button", { name: "Solanke goal" }).click();
    await page.getByText(/moments from TwelveLabs/).waitFor({ timeout: 45000 });
    const hit = await page.locator('ul[aria-label="Assets"] li').first().innerText();
    r.check(/\d:\d\d–\d:\d\d/.test(hit) && /hit #1/.test(hit), "a suggested search runs live on TwelveLabs; each result carries its own time window");

    await page.locator('ul[aria-label="Assets"] li article').first().click();
    await page.getByLabel("Asset details").waitFor();
    const [{ before }] = await sql`select count(*)::int before from jobs where payload->>'slug' like 'pick-%'`;
    await page.getByLabel("Asset details").getByRole("button", { name: /Make clip/ }).click();
    await page.getByRole("status").filter({ hasText: /Queued|Couldn't|not/ }).first().waitFor({ timeout: 20000 });
    const [job] = await sql`select payload from jobs where payload->>'slug' like 'pick-%' order by queued_at desc limit 1`;
    const [{ after }] = await sql`select count(*)::int after from jobs where payload->>'slug' like 'pick-%'`;
    const input = job?.payload?.input as { startSec: number; endSec: number; twelvelabsAssetId?: string } | undefined;
    r.check(after === before + 1 && !!input?.twelvelabsAssetId && input.endSec > input.startSec,
      `Make clip on a search hit queues the normal pipeline with that window (${input?.startSec}-${input?.endSec}s)`);

    await page.goto(`${BASE}/library?org=${orgs["San Antonio Spurs"]}`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("ScorePlay collections").waitFor({ timeout: 30000 });
    const saRail = await page.getByLabel("ScorePlay collections").innerText();
    r.check(/Raw Footage/.test(saRail) && /Social Edits/.test(saRail) && !/Press Conference/.test(saRail), "San Antonio sees only its own collections");
    const first = await page.locator('ul[aria-label="Assets"] li').first().innerText();
    r.check(/Searchable/.test(first) && /Make clip|In the inbox/.test(first), "clippable assets come first (searchable, with Make clip)");
    r.check(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ")})`);
  } catch (e) {
    r.check(false, `walk threw: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
  }
  return r.summary();
}
