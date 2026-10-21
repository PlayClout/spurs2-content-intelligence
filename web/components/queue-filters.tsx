"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS = [
  { v: "active", l: "Active" },
  { v: "all", l: "All" },
  { v: "approved", l: "Approved" },
  { v: "rejected", l: "Rejected" },
  { v: "exported", l: "Exported" },
];
const AUDIENCE = ["all", "casual", "superfan", "regional", "international", "player_community", "sponsor"];
const SPORT = ["all", "basketball", "soccer"];

function FilterSelect({
  name,
  value,
  options,
}: {
  name: string;
  value: string;
  options: { v: string; l: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const p = new URLSearchParams(params.toString());
        p.set(name, v);
        router.push(`${pathname}?${p.toString()}`, { scroll: false });
      }}
    >
      <SelectTrigger className="h-7 w-auto gap-1 border-border bg-secondary px-2 text-[11px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v} className="text-xs capitalize">
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function QueueFilters({ status, audience, sport }: { status: string; audience: string; sport: string }) {
  const cap = (x: string) => (x === "all" ? "All" : x.replace(/_/g, " "));
  return (
    <div className="flex items-center gap-1.5">
      <FilterSelect name="status" value={status} options={STATUS} />
      <FilterSelect name="audience" value={audience} options={AUDIENCE.map((a) => ({ v: a, l: cap(a) }))} />
      <FilterSelect name="sport" value={sport} options={SPORT.map((x) => ({ v: x, l: cap(x) }))} />
    </div>
  );
}
