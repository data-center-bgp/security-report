"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";

type LaporanTambat = {
  id: string;
  ID: string;
  nama_kapal: string;
  nama_perusahaan: string;
  tanggal_mulai_tambat: string;
  waktu_mulai_tambat: string;
  tanggal_selesai_tambat: string;
  waktu_selesai_tambat: string;
  kegiatan: string;
  tanggal_mulai_connect: string;
  waktu_mulai_connect: string;
  tanggal_selesai_connect: string;
  waktu_selesai_connect: string;
  lokasi: string;
  sekuriti: string;
  business_unit: string;
};

const columns: ColumnDef<LaporanTambat>[] = [
  { key: "ID", label: "ID", sortable: true },
  { key: "nama_kapal", label: "Kapal", sortable: true },
  { key: "nama_perusahaan", label: "Perusahaan" },
  {
    key: "tanggal_mulai_tambat",
    label: "Tgl Mulai Tambat",
    render: (r) => formatDate(r.tanggal_mulai_tambat),
  },
  {
    key: "tanggal_selesai_tambat",
    label: "Tgl Selesai Tambat",
    render: (r) => formatDate(r.tanggal_selesai_tambat),
  },
  { key: "kegiatan", label: "Kegiatan" },
  { key: "lokasi", label: "Lokasi" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (r) => <BusinessUnitBadge value={r.business_unit} />,
  },
];

const detailFields = [
  { key: "ID", label: "ID" },
  { key: "nama_kapal", label: "Nama Kapal" },
  { key: "nama_perusahaan", label: "Nama Perusahaan" },
  {
    key: "tanggal_mulai_tambat",
    label: "Tgl Mulai Tambat",
    render: (v: any) => formatDate(v),
  },
  {
    key: "waktu_mulai_tambat",
    label: "Waktu Mulai Tambat",
    render: (v: any) => formatTime(v),
  },
  {
    key: "tanggal_selesai_tambat",
    label: "Tgl Selesai Tambat",
    render: (v: any) => formatDate(v),
  },
  {
    key: "waktu_selesai_tambat",
    label: "Waktu Selesai Tambat",
    render: (v: any) => formatTime(v),
  },
  { key: "kegiatan", label: "Kegiatan" },
  {
    key: "tanggal_mulai_connect",
    label: "Tgl Mulai Connect",
    render: (v: any) => formatDate(v),
  },
  {
    key: "waktu_mulai_connect",
    label: "Waktu Mulai Connect",
    render: (v: any) => formatTime(v),
  },
  {
    key: "tanggal_selesai_connect",
    label: "Tgl Selesai Connect",
    render: (v: any) => formatDate(v),
  },
  {
    key: "waktu_selesai_connect",
    label: "Waktu Selesai Connect",
    render: (v: any) => formatTime(v),
  },
  { key: "lokasi", label: "Lokasi" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function TambatPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<LaporanTambat | null>(null);

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
  } = useTableData<LaporanTambat>({
    table: "laporan_tambat",
    columns: "*",
    searchColumns: [
      "ID",
      "nama_kapal",
      "nama_perusahaan",
      "kegiatan",
      "lokasi",
      "sekuriti",
    ],
    dateColumn: "tanggal_mulai_tambat",
    businessUnitFilter,
    isMaster,
    authLoading,
    orderBy: "tanggal_mulai_tambat",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan Tambat</h1>
        <p className="text-muted-foreground text-sm">
          Catatan sandar dan tambat kapal
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
        exportFilename="laporan-tambat"
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
        title="Detail Tambat"
        row={selected}
        fields={detailFields}
      />
    </div>
  );
}
