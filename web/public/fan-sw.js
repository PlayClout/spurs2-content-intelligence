/*
 * Spursx2 AI fan service worker (U0.3). Scope: /fan only.
 * Caches ONLY the static offline shell and icons. Feeds, search, clip detail, media (incl. Range requests),
 * rights data and every admin route bypass this worker entirely: protected content is never stored offline.
 */
const VERSION = "fan-shell-v1";
const SHELL = ["/fan-offline.html", "/icons/fan-192.png", "/icons/fan-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only top-level page navigations get an offline fallback. Everything else goes straight to the network.
  if (req.mode !== "navigate") return;
  event.respondWith(fetch(req).catch(() => caches.match("/fan-offline.html")));
});
