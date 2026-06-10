"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";

type TravoBlower = {
  id: string;
  ID: string;
  tanggal: string;
  jam: string;
  jenis: string;
  posisi_travo_blower: string;
  jumlah: number;
  status: string;
  keterangan: string;
  sekuriti: string;
  business_unit: string;
};

const columns: ColumnDef<TravoBlower>[] = [
  { key: "ID", label: "ID", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "jam", label: "Jam", render: (r) => formatTime(r.jam) },
  { key: "jenis", label: "Jenis" },
  { key: "posisi_travo_blower", label: "Posisi" },
  { key: "jumlah", label: "Jumlah" },
  { key: "status", label: "Status" },
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
  { key: "jam", label: "Jam", render: (v: any) => formatTime(v) },
  { key: "jenis", label: "Jenis" },
  { key: "posisi_travo_blower", label: "Posisi Travo/Blower" },
  { key: "jumlah", label: "Jumlah" },
  { key: "status", label: "Status" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function TravoBlowerPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<TravoBlower | null>(null);

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
  } = useTableData<TravoBlower>({
    table: "laporan_travo_blower",
    columns: "*",
    searchColumns: ["ID", "jenis", "posisi_travo_blower", "status", "sekuriti"],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Travo Blower</h1>
        <p className="text-muted-foreground text-sm">
          Laporan kondisi trafo dan blower
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
        exportFilename="travo-blower"
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
        title="Detail Travo Blower"
        row={selected}
        fields={detailFields}
      />
    </div>
  );
}
