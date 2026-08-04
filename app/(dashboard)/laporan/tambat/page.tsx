"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { ImageOff } from "lucide-react";

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
  evidence: string | null;
  business_unit: string;
};

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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
      key: "evidence",
      label: "Evidence",
      render: (r) =>
        r.evidence ? (
          <img
            src={r.evidence}
            alt="Evidence"
            className="h-9 w-9 object-cover rounded border cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(r.evidence);
            }}
          />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        ),
    },
    {
      key: "business_unit",
      label: "Site",
      render: (r) => <BusinessUnitBadge value={r.business_unit} />,
    },
  ];

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
        extraContent={
          <div>
            <h4 className="text-sm font-semibold mb-2">Evidence</h4>
            {selected?.evidence ? (
              <img
                src={selected.evidence}
                alt="Evidence"
                className="h-40 w-40 object-cover rounded border cursor-pointer"
                onClick={() => setLightboxUrl(selected.evidence)}
              />
            ) : (
              <div className="h-40 w-40 rounded border border-dashed flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/30">
                <ImageOff className="h-6 w-6" />
                <span className="text-xs">Belum ada foto</span>
              </div>
            )}
          </div>
        }
      />

      {/* Lightbox foto */}
      {lightboxUrl &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            <img
              src={lightboxUrl}
              alt="Evidence"
              className="max-h-[90vh] max-w-[90vw] rounded"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
