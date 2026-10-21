import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

const config: Record<string, { icon: typeof ShieldCheck; cls: string; label: string }> = {
  cleared: { icon: ShieldCheck, cls: "text-success-fg bg-[rgba(0,217,130,0.14)] border-[rgba(0,217,130,0.45)]", label: "Cleared" },
  restricted: { icon: ShieldAlert, cls: "text-warning-fg bg-[rgba(255,176,32,0.14)] border-[rgba(255,176,32,0.45)]", label: "Restricted" },
  blocked: { icon: ShieldX, cls: "text-danger-fg bg-[rgba(255,41,66,0.14)] border-[rgba(255,41,66,0.45)]", label: "Blocked" },
  unknown: { icon: ShieldQuestion, cls: "text-muted-foreground bg-secondary border-border", label: "Unknown" },
};

export function ComplianceBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const c = config[status] ?? config.unknown;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", c.cls)}>
      <Icon size={12} />
      {!compact && c.label}
    </span>
  );
}
