/**
 * Records a self-narrating product walkthrough of the Spurs² Content Intelligence demo.
 * Caption overlay self-heals across Next.js client re-renders (addInitScript + interval).
 * Output: /tmp/s2video/<hash>.webm  -> post-processed to mp4 by ffmpeg afterwards.
 */
import { chromium } from "playwright-core";
import { mkdirSync, rmSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const B = "http://localhost:3000";
const OUT = "/tmp/s2video";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio", "--hide-scrollbars"],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 810 } },
});

// Self-healing caption overlay: runs on every navigation, re-adds bar every 300ms.
await ctx.addInitScript(() => {
  const w = window as unknown as { __caph?: string; __caps?: string };
  setInterval(() => {
    if (!document.body) return;
    let bar = document.getElementById("__cap");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "__cap";
      bar.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:18px 30px 20px;" +
        "background:linear-gradient(to top,rgba(5,8,16,.97),rgba(5,8,16,.75) 72%,transparent);" +
        "font-family:'Space Grotesk',Inter,system-ui,sans-serif;pointer-events:none;";
      document.body.appendChild(bar);
    }
    const h = w.__caph || "", s = w.__caps || "", key = h + "|" + s;
    if (bar.getAttribute("data-k") !== key) {
      bar.setAttribute("data-k", key);
      bar.innerHTML =
        `<div style="font-size:23px;font-weight:700;letter-spacing:-.01em;color:#F3F6FB">${h}</div>` +
        (s ? `<div style="font-size:15px;color:#BFC9D9;margin-top:4px;font-weight:500">${s}</div>` : "");
    }
  }, 300);
});

const page = await ctx.newPage();
const video = page.video();
const wait = (ms: number) => page.waitForTimeout(ms);
async function caption(h: string, s = "") {
  await page.evaluate(([a, b]) => { const w = window as any; w.__caph = a; w.__caps = b; }, [h, s]);
}
async function go(path: string) {
  await page.goto(B + path, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
  await wait(1200);
}
async function step(name: string, fn: () => Promise<void>) {
  const t = Date.now();
  try { await fn(); console.log(`ok   ${name}  (${Date.now() - t}ms)`); }
  catch (e) { console.log(`SKIP ${name}: ${(e as Error).message.split("\n")[0]}  (${Date.now() - t}ms)`); }
}
const T0 = Date.now();
const mark = (s: string) => console.log(`  @${Math.round((Date.now() - T0) / 1000)}s  ${s}`);

// ───── SCENE 1 — Inbox ─────
await go("/");
await caption("The producer inbox", "Every scoring moment auto-cut, scored and queued the instant it happens");
mark("inbox"); await wait(4000);
await step("scroll queue", async () => {
  const q = page.locator('[aria-label="Queue"] .overflow-y-auto').first();
  await q.evaluate((el) => el.scrollBy({ top: 260, behavior: "smooth" })).catch(() => {});
  await wait(2000);
  await q.evaluate((el) => el.scrollTo({ top: 0, behavior: "smooth" })).catch(() => {});
  await wait(1200);
});

// ───── SCENE 2 — Review + video ─────
await caption("Review a clip", "Media plays straight from the club's own library");
await step("play video", async () => {
  await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    if (v) { v.muted = true; try { v.currentTime = 0; } catch {} v.play().catch(() => {}); }
  }).catch(() => {});
  await wait(4500);
});
await step("why this clip", async () => {
  await page.getByText("Why this clip", { exact: false }).first().click({ timeout: 6000 });
  await caption("Why this clip", "The model explains itself — the play it saw, the signals, the audience fit");
  await wait(5000);
});
await step("channels", async () => {
  await page.getByText(/^Channels/, { exact: false }).first().click({ timeout: 6000 });
  await caption("One moment → nine channels", "Each cut to the right aspect ratio and safe zones automatically");
  await wait(5000);
});

// ───── SCENE 3 — Approve ─────
await step("approve", async () => {
  await page.getByRole("button", { name: /^Approve/ }).first().click({ timeout: 6000 });
  await caption("Approve", "One click clears it for owned channels — rights re-checked at publish");
  await wait(3500);
});
mark("done review");

// ───── SCENE 4 — Live match desk ─────
await go("/live");
await caption("The live match desk", "Joins the live feed and cuts the moment within seconds of the whistle");
mark("live"); await wait(4500);

// ───── SCENE 5 — Library: LIVE TwelveLabs search ─────
await go("/library");
await caption("Search the footage by meaning", "A LIVE TwelveLabs query against the real match index");
mark("library"); await wait(2500);
await step("search chip 1", async () => {
  await page.getByRole("button", { name: /Wembanyama dunk/i }).first().click({ timeout: 6000 });
  await caption("“Wembanyama dunk”", "Semantic video search — real results returning live, not pre-canned");
  await wait(6000);
});
await step("search chip 2", async () => {
  await page.getByRole("button", { name: /alley-oop/i }).first().click({ timeout: 6000 });
  await caption("“alley-oop”", "Any play, found by what happens on screen");
  await wait(5500);
});

// ───── SCENE 6 — Fan app ─────
await go("/fan");
await caption("The fan app", "A personalized feed built from the moments producers just approved");
mark("fan"); await wait(4000);
await step("persona A", async () => {
  await page.getByRole("button", { name: /Solanke goals/i }).first().click({ timeout: 6000 });
  await caption("Fan A — follows Solanke & goals", "The feed re-ranks around what this fan cares about");
  await wait(4500);
});
await step("persona B", async () => {
  await page.getByRole("button", { name: /crowd energy/i }).first().click({ timeout: 6000 });
  await caption("Fan B — crowd & atmosphere", "Same match, a completely different feed");
  await wait(4500);
});

await caption("Spurs² Content Intelligence", "Live footage → publish-ready, personalized content in seconds");
await wait(3200);
mark("end");

await ctx.close();
console.log("saved:", video ? await video.path().catch((e) => `ERR ${e.message}`) : "no-handle");
await browser.close();
console.log("DONE");
