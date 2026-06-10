"use client";

import { DateRangePicker, type DateRange } from "@/components/DateRangePicker";
import { NativeSelect } from "@/components/ui/select";
import { SITES } from "@/lib/sites";

interface TableFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  isMaster?: boolean;
  siteFilter?: string;
  onSiteFilterChange?: (v: string) => void;
}

export function TableFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  isMaster,
  siteFilter,
  onSiteFilterChange,
}: TableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker
        value={{ from: dateFrom, to: dateTo }}
        onChange={(r) => {
          onDateFromChange(r.from);
          onDateToChange(r.to);
        }}
      />
      {isMaster && onSiteFilterChange && (
        <NativeSelect
          value={siteFilter ?? "all"}
          onChange={(e) => onSiteFilterChange(e.target.value)}
          className="w-36"
        >
          <option value="all">Semua Site</option>
          {SITES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
      )}
    </div>
  );
}
