"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";

type OrangKeluar = {
  id: string;
  ID: string;
  tanggal: string;
  jam: string;
  id_card: string;
  nomor_id_card: string;
  keterangan: string;
  sekuriti: string;
  pos: string;
  business_unit: string;
  created_at: string;
};

const columns: ColumnDef<OrangKeluar>[] = [
  { key: "ID", label: "ID", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "jam", label: "Jam", render: (r) => formatTime(r.jam) },
  { key: "id_card", label: "Jenis ID Card" },
  { key: "nomor_id_card", label: "Nomor ID Card" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
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
  { key: "id_card", label: "Jenis ID Card" },
  { key: "nomor_id_card", label: "Nomor ID Card" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function OrangKeluarPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<OrangKeluar | null>(null);

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
    fetchAllRows,
  } = useTableData<OrangKeluar>({
    table: "orang_keluar",
    columns: "*",
    searchColumns: ["ID", "id_card", "nomor_id_card", "sekuriti", "pos"],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orang Keluar</h1>
        <p className="text-muted-foreground text-sm">
          Catatan akses keluar personel
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
        exportFilename="orang-keluar"
        fetchAllRows={fetchAllRows}
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
        title="Detail Orang Keluar"
        row={selected}
        fields={detailFields}
      />
    </div>
  );
}
