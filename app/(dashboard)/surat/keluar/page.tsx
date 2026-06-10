"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";

type SuratKeluar = {
  id: string;
  ID: string;
  tanggal: string;
  jam: string;
  nama_pengirim: string;
  nama_penerima: string;
  jenis_surat: string;
  keterangan: string;
  sekuriti: string;
  pos: string;
  business_unit: string;
};

const columns: ColumnDef<SuratKeluar>[] = [
  { key: "ID", label: "ID", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "jam", label: "Jam", render: (r) => formatTime(r.jam) },
  { key: "nama_pengirim", label: "Pengirim" },
  { key: "nama_penerima", label: "Penerima" },
  { key: "jenis_surat", label: "Jenis Surat" },
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
  { key: "nama_pengirim", label: "Pengirim" },
  { key: "nama_penerima", label: "Penerima" },
  { key: "jenis_surat", label: "Jenis Surat" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function SuratKeluarPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<SuratKeluar | null>(null);

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
  } = useTableData<SuratKeluar>({
    table: "surat_keluar",
    columns: "*",
    searchColumns: [
      "ID",
      "nama_pengirim",
      "nama_penerima",
      "jenis_surat",
      "sekuriti",
    ],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Surat Keluar</h1>
        <p className="text-muted-foreground text-sm">
          Catatan surat dan dokumen keluar
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
        exportFilename="surat-keluar"
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
        title="Detail Surat Keluar"
        row={selected}
        fields={detailFields}
      />
    </div>
  );
}
