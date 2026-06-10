import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "-";
  return timeStr.slice(0, 5); // HH:MM
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString("id-ID");
}
