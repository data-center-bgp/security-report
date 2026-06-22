"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase";
import { applyBusinessUnitFilter } from "@/lib/dataFilters";

const PAGE_SIZE = 20;

interface UseTableDataOptions {
  table: string;
  columns: string;
  searchColumns?: string[];
  dateColumn?: string;
  businessUnitFilter: string | null;
  isMaster: boolean;
  authLoading: boolean;
  orderBy?: string;
  orderAsc?: boolean;
}

export function useTableData<T extends Record<string, any>>({
  table,
  columns,
  searchColumns = [],
  dateColumn = "tanggal",
  businessUnitFilter,
  isMaster,
  authLoading,
  orderBy = "tanggal",
  orderAsc = false,
}: UseTableDataOptions) {
  const supabase = createBrowserClient();

  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(orderBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    orderAsc ? "asc" : "desc",
  );
  // Empty by default => show ALL data; date filter only applies when the user picks dates.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");

  const effectiveFilter = isMaster
    ? siteFilter === "all"
      ? null
      : siteFilter
    : businessUnitFilter;

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = supabase
      .from(table)
      .select(columns, { count: "exact" })
      .order(sortKey, { ascending: sortDir === "asc" })
      .range(from, to);

    q = applyBusinessUnitFilter(q as any, effectiveFilter);

    if (dateColumn && dateFrom) {
      q = (q as any).gte(dateColumn, dateFrom);
    }
    if (dateColumn && dateTo) {
      q = (q as any).lte(dateColumn, dateTo);
    }

    if (search.trim() && searchColumns.length > 0) {
      const searchFilter = searchColumns
        .map((col) => `${col}.ilike.%${search.trim()}%`)
        .join(",");
      q = (q as any).or(searchFilter);
    }

    const { data: rows, count, error } = await q;
    if (error) {
      console.error(`[useTableData] gagal memuat "${table}":`, error);
      toast.error(`Gagal memuat data ${table}: ${error.message}`);
      setData([]);
      setTotalCount(0);
    } else {
      setData((rows as unknown as T[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [
    authLoading,
    page,
    search,
    sortKey,
    sortDir,
    dateFrom,
    dateTo,
    effectiveFilter,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (authLoading) return;
    const interval = setInterval(() => {
      fetchData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [authLoading, fetchData]);

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return {
    data,
    totalCount,
    loading,
    page,
    setPage,
    search,
    setSearch: handleSearch,
    sortKey,
    sortDir,
    handleSort,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    siteFilter,
    setSiteFilter,
    PAGE_SIZE,
    refetch: fetchData,
  };
}
