"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";

/** Club switcher. A native select: no portal, so it always matches the producer theme. */
export function OrgSwitcher({ orgs, orgId }: { orgs: { id: string; name: string; league: string }[]; orgId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const org = orgs.find((o) => o.id === orgId);
  const initials = (org?.name ?? "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 4).toUpperCase();
  return (
    <label className="relative flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-border p-2 hover:bg-secondary">
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-foreground text-[11px] font-bold text-white">{initials}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold leading-tight">{org?.name ?? "Select club"}</span>
        <span className="block truncate text-[11px] text-ink-4">{org?.league}</span>
      </span>
      <ChevronsUpDown size={15} className="ml-auto shrink-0 text-ink-4" />
      <select aria-label="Club" value={orgId} onChange={(e) => router.push(`${pathname}?org=${e.target.value}`)} className="absolute inset-0 cursor-pointer opacity-0">
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.league}</option>)}
      </select>
    </label>
  );
}
