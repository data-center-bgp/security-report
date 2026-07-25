import type { ColumnDef } from "@/components/DataTable";

export function downloadCsv<T extends Record<string, any>>(
  columns: ColumnDef<T>[],
  data: T[],
  filename: string,
) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key] ?? "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadXlsx<T extends Record<string, any>>(
  columns: ColumnDef<T>[],
  data: T[],
  filename: string,
) {
  const XLSX = await import("xlsx");
  const wsData = [
    columns.map((c) => c.label),
    ...data.map((row) => columns.map((c) => row[c.key] ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
