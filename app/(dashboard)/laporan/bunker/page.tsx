"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";

type BunkerFreshwater = {
  id: string;
  ID: string;
  tanggal: string;
  nama_kapal: string;
  tempat_bunker: string;
  waktu_mulai: string;
  waktu_selesai: string;
  quantity: number;
  keterangan: string;
  sekuriti: string;
  business_unit: string;
};

const columns: ColumnDef<BunkerFreshwater>[] = [
  { key: "ID", label: "ID", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "nama_kapal", label: "Nama Kapal" },
  { key: "tempat_bunker", label: "Tempat Bunker" },
  {
    key: "waktu_mulai",
    label: "Waktu Mulai",
    render: (r) => formatTime(r.waktu_mulai),
  },
  {
    key: "waktu_selesai",
    label: "Waktu Selesai",
    render: (r) => formatTime(r.waktu_selesai),
  },
  {
    key: "quantity",
    label: "Qty (L)",
    render: (r) => r.quantity?.toLocaleString("id-ID"),
  },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (r) => <BusinessUnitBadge value={r.business_unit} />,
  },
];

const detailFields = [
  { key: "ID", label: "ID" },
  { key: "tanggal", label: "Tanggal", render: (v: any) => formatDate(v) },
  { key: "nama_kapal", label: "Nama Kapal" },
  { key: "tempat_bunker", label: "Tempat Bunker" },
  {
    key: "waktu_mulai",
    label: "Waktu Mulai",
    render: (v: any) => formatTime(v),
  },
  {
    key: "waktu_selesai",
    label: "Waktu Selesai",
    render: (v: any) => formatTime(v),
  },
  {
    key: "quantity",
    label: "Quantity (L)",
    render: (v: any) => v?.toLocaleString("id-ID"),
  },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function BunkerPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<BunkerFreshwater | null>(null);

  const {
    data,
    totalCount,
    loading,
    page,
    setPage,
    search,
    setSearch,
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
  } = useTableData<BunkerFreshwater>({
    table: "laporan_bunker_freshwater",
    columns: "*",
    searchColumns: ["ID", "nama_kapal", "tempat_bunker", "sekuriti"],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bunker Fresh Water</h1>
        <p className="text-muted-foreground text-sm">
          Laporan pengisian air tawar kapal
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        totalCount={totalCount}
        loading={loading || authLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        search={search}
        onSearchChange={setSearch}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={setSelected}
        exportFilename="bunker-freshwater"
        filterSlot={
          <TableFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            isMaster={isMaster}
            siteFilter={siteFilter}
            onSiteFilterChange={setSiteFilter}
          />
        }
      />
      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Detail Bunker Fresh Water"
        row={selected}
        fields={detailFields}
      />
    </div>
  );
}
