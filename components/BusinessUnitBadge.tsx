"use client";

import { Badge } from "@/components/ui/badge";
import { SITES, MASTER_BADGE_CLASS } from "@/lib/sites";

interface BusinessUnitBadgeProps {
  value: string | null | undefined;
}

const colorMap: Record<string, string> = {
  master: MASTER_BADGE_CLASS,
  ...Object.fromEntries(SITES.map((s) => [s.value, s.badgeClass])),
};

const labelMap: Record<string, string> = {
  master: "MASTER",
  ...Object.fromEntries(SITES.map((s) => [s.value, s.label])),
};

export function BusinessUnitBadge({ value }: BusinessUnitBadgeProps) {
  if (!value) return <span className="text-muted-foreground text-xs">-</span>;

  const key = value.toLowerCase();
  const colorClass =
    colorMap[key] ??
    "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  const label = labelMap[key] ?? value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {label}
    </span>
  );
}
