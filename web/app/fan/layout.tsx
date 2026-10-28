import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { FanNav } from "@/components/fan/fan-nav";
import { ServiceWorkerRegister } from "@/components/fan/sw-register";

export const metadata: Metadata = {
  title: "Spursx2 AI Fan",
  manifest: "/fan.webmanifest",
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: { capable: true, title: "Spursx2 AI", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/fan-apple-180.png" },
};

export const viewport: Viewport = { themeColor: "#050811", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function FanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
      <ServiceWorkerRegister />
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[var(--clout-black)]/90 px-4 py-3 backdrop-blur">
        <span className="display text-xl">
          Spursx2 <span className="text-[var(--clout-electric-blue)]">AI</span>
          <span className="ml-2 align-middle text-[11px] font-semibold not-italic tracking-[0.16em] text-muted-foreground">FAN</span>
        </span>
        <Suspense>
          <FanNav />
        </Suspense>
      </header>
      <main>{children}</main>
      <p className="mt-10 text-center text-[11px] text-muted-foreground">
        Event-only demo. Every clip here was approved and published by the club&apos;s editor.
      </p>
    </div>
  );
}
