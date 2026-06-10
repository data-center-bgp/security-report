"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase";

type BarangKeluar = {
  id: string;
  ID: string;
  nomor_do: string;
  tanggal: string;
  jam: string;
  kurir: string;
  nama_pemilik_barang: string;
  tujuan: string;
  keterangan: string;
  sekuriti: string;
  pos: string;
  business_unit: string;
  created_at: string;
};

const columns: ColumnDef<BarangKeluar>[] = [
  { key: "ID", label: "ID", sortable: true },
  { key: "nomor_do", label: "Nomor DO", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "jam", label: "Jam", render: (r) => formatTime(r.jam) },
  { key: "kurir", label: "Kurir" },
  { key: "nama_pemilik_barang", label: "Pemilik" },
  { key: "tujuan", label: "Tujuan" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
  {
    key: "business_unit",
    label: "Site",
    render: (r) => <BusinessUnitBadge value={r.business_unit} />,
  },
];

function BarangKeluarDetail({ row }: { row: BarangKeluar }) {
  const supabase = createBrowserClient();
  const [items, setItems] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!row?.id) return;
    supabase
      .from("detail_do_keluar")
      .select("*")
      .eq("barang_keluar_id", row.id)
      .then(({ data }) => setItems(data ?? []));
    supabase
      .from("foto_do_keluar")
      .select("*")
      .eq("barang_keluar_id", row.id)
      .then(({ data }) => setPhotos(data ?? []));
  }, [row?.id]);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Item Barang</h4>
          <table className="w-full text-xs border rounded">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Serial Number</th>
                <th className="p-2 text-left">Nama Barang</th>
                <th className="p-2 text-right">Jumlah</th>
                <th className="p-2 text-left">Satuan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{item.serial_number}</td>
                  <td className="p-2">{item.nama_barang}</td>
                  <td className="p-2 text-right">{item.jumlah}</td>
                  <td className="p-2">{item.satuan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Foto</h4>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <img
                key={i}
                src={p.storage_url}
                alt={`Foto ${i + 1}`}
                className="h-20 w-20 object-cover rounded cursor-pointer border"
                onClick={() => setLightboxUrl(p.storage_url)}
              />
            ))}
          </div>
        </div>
      )}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Foto besar"
            className="max-h-[90vh] max-w-[90vw] rounded"
          />
        </div>
      )}
    </div>
  );
}

const detailFields = [
  { key: "ID", label: "ID" },
  { key: "nomor_do", label: "Nomor DO" },
  { key: "tanggal", label: "Tanggal", render: (v: any) => formatDate(v) },
  { key: "jam", label: "Jam", render: (v: any) => formatTime(v) },
  { key: "kurir", label: "Kurir" },
  { key: "nama_pemilik_barang", label: "Nama Pemilik" },
  { key: "tujuan", label: "Tujuan" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function BarangKeluarPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<BarangKeluar | null>(null);

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
  } = useTableData<BarangKeluar>({
    table: "barang_keluar",
    columns: "*",
    searchColumns: [
      "ID",
      "nomor_do",
      "kurir",
      "nama_pemilik_barang",
      "tujuan",
      "sekuriti",
    ],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DO Keluar (Barang)</h1>
        <p className="text-muted-foreground text-sm">
          Catatan delivery order barang keluar
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
        exportFilename="do-keluar"
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
        title="Detail DO Keluar"
        row={selected}
        fields={detailFields}
        extraContent={
          selected ? <BarangKeluarDetail row={selected} /> : undefined
        }
      />
    </div>
  );
}
