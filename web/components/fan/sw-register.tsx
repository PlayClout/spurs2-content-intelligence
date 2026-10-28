"use client";

import { useEffect } from "react";

/** Registers the fan-scoped service worker (U0.3). Scope is /fan (must match the manifest scope + start_url /fan,
 *  or the installed app's own start page is not controlled). The admin desk (/, /admin) is never controlled by it. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/fan-sw.js", { scope: "/fan" }).catch(() => {
      /* install is optional; the browser experience stays complete without it */
    });
  }, []);
  return null;
}
