"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      <Input
        type="date"
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className="w-36"
      />
      <span className="text-muted-foreground text-sm">–</span>
      <Input
        type="date"
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className="w-36"
      />
    </div>
  );
}

interface DateRangePresetPickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function getPresetRange(preset: string): DateRange {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (preset) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { from: fmt(start), to: fmt(today) };
    }
    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(start), to: fmt(today) };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(start), to: fmt(end) };
    }
    default:
      return {
        from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: fmt(today),
      };
  }
}

export function DateRangePresetPicker({
  value,
  onChange,
}: DateRangePresetPickerProps) {
  const [preset, setPreset] = useState("month");

  function handlePreset(p: string) {
    setPreset(p);
    if (p !== "custom") {
      onChange(getPresetRange(p));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        value={preset}
        onChange={(e) => handlePreset(e.target.value)}
        className="w-36"
      >
        <option value="today">Hari Ini</option>
        <option value="week">Minggu Ini</option>
        <option value="month">Bulan Ini</option>
        <option value="last_month">Bulan Lalu</option>
        <option value="custom">Kustom</option>
      </NativeSelect>
      {preset === "custom" && (
        <DateRangePicker value={value} onChange={onChange} />
      )}
    </div>
  );
}
