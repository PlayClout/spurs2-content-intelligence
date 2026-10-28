"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/fan", label: "For You" },
  { href: "/fan/search", label: "Search" },
  { href: "/fan/players", label: "Players" },
];

export function FanNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const org = params.get("org");
  const q = org ? `?org=${org}` : "";
  return (
    <nav aria-label="Fan app" className="flex gap-1">
      {TABS.map((t) => {
        const active = t.href === "/fan" ? pathname === "/fan" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={`${t.href}${q}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-[var(--clout-electric-blue)] text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
