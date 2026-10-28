"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawFromFanCatalog } from "@/lib/fan";

export function WithdrawButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold text-danger-fg hover:bg-danger/10 disabled:opacity-50"
      onClick={() => { if (confirm("Withdraw this clip from the fan app? Fans lose access immediately.")) start(async () => { await withdrawFromFanCatalog(opportunityId, "editor_withdrawal"); router.refresh(); }); }}>
      Withdraw
    </button>
  );
}
