"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronDown as ChevronDownSmall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect } from "@/components/ui/select";
import { downloadCsv, downloadXlsx } from "@/lib/exportHandler";
import { toast } from "sonner";

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  totalCount: number;
  loading?: boolean;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  search: string;
  onSearchChange: (v: string) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  exportFilename?: string;
  filterSlot?: React.ReactNode;
  /** Fetches every row matching the current filters, ignoring pagination. Used as
   * the default source for both CSV and XLSX export so "Export" doesn't silently
   * only cover the visible page. */
  fetchAllRows?: () => Promise<T[]>;
  /** Full override for the XLSX export (e.g. a page that builds a multi-sheet
   * workbook with joined child data). Takes priority over fetchAllRows. */
  onExportXlsx?: () => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  totalCount,
  loading = false,
  page,
  onPageChange,
  pageSize,
  search,
  onSearchChange,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  exportFilename = "export",
  filterSlot,
  fetchAllRows,
  onExportXlsx,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const [exportOpen, setExportOpen] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  async function resolveExportRows(): Promise<T[]> {
    if (!fetchAllRows) return data;
    setExportingAll(true);
    const toastId = toast.loading("Menyiapkan data untuk diekspor...");
    try {
      return await fetchAllRows();
    } finally {
      toast.dismiss(toastId);
      setExportingAll(false);
    }
  }

  async function handleExportCsv() {
    const rows = await resolveExportRows();
    downloadCsv(columns, rows, exportFilename);
  }

  async function handleExportXlsxClick() {
    if (onExportXlsx) {
      onExportXlsx();
      return;
    }
    const rows = await resolveExportRows();
    await downloadXlsx(columns, rows, exportFilename);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Local search state with debounce so we don't fetch on every keystroke.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== search) onSearchChange(searchInput);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey)
      return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          {filterSlot}
        </div>
        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={data.length === 0 || exportingAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
            <ChevronDownSmall className="h-3 w-3 opacity-60" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-md border bg-popover shadow-md z-50 overflow-hidden">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  setExportOpen(false);
                  handleExportCsv();
                }}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Export CSV
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => {
                  setExportOpen(false);
                  handleExportXlsxClick();
                }}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Export Excel (.xlsx)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? "cursor-pointer select-none" : ""}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-16 text-muted-foreground"
                >
                  Tidak ada data ditemukan
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={row.id ?? i}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row) : (row[col.key] ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount === 0
            ? "0 data"
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} dari ${totalCount} data`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
