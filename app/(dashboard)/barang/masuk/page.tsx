"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { createPortal } from "react-dom";
import { createBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

type BarangMasuk = {
  id: string;
  ID: string;
  nomor_do: string;
  tanggal: string;
  jam: string;
  nama_pembawa_barang: string;
  nama_pemilik_barang: string;
  keterangan: string;
  sekuriti: string;
  pos: string;
  business_unit: string;
  created_at: string;
};

const columns: ColumnDef<BarangMasuk>[] = [
  { key: "ID", label: "ID", sortable: true },
  { key: "nomor_do", label: "Nomor DO", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "jam", label: "Jam", render: (r) => formatTime(r.jam) },
  { key: "nama_pembawa_barang", label: "Pembawa" },
  { key: "nama_pemilik_barang", label: "Pemilik" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
  {
    key: "business_unit",
    label: "Site",
    render: (r) => <BusinessUnitBadge value={r.business_unit} />,
  },
];

function BarangMasukDetail({ row }: { row: BarangMasuk }) {
  const supabase = createBrowserClient();
  const [items, setItems] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!row?.id) return;
    supabase
      .from("detail_do_masuk")
      .select("*")
      .eq("barang_masuk_id", row.id)
      .then(({ data }) => setItems(data ?? []));
    supabase
      .from("foto_do_masuk")
      .select("*")
      .eq("barang_masuk_id", row.id)
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
      {photos.filter((p) => p.foto).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Foto</h4>
          <div className="flex flex-wrap gap-2">
            {photos.filter((p) => p.foto).map((p, i) => (
              <img
                key={i}
                src={p.foto}
                alt={`Foto ${i + 1}`}
                className="h-20 w-20 object-cover rounded cursor-pointer border"
                onClick={() => setLightboxUrl(p.foto)}
              />
            ))}
          </div>
        </div>
      )}
      {lightboxUrl && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Foto besar"
            className="max-h-[90vh] max-w-[90vw] rounded"
          />
        </div>,
        document.body
      )}
    </div>
  );
}

const detailFields = [
  { key: "ID", label: "ID" },
  { key: "nomor_do", label: "Nomor DO" },
  { key: "tanggal", label: "Tanggal", render: (v: any) => formatDate(v) },
  { key: "jam", label: "Jam", render: (v: any) => formatTime(v) },
  { key: "nama_pembawa_barang", label: "Nama Pembawa" },
  { key: "nama_pemilik_barang", label: "Nama Pemilik" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  { key: "pos", label: "Pos" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function BarangMasukPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<BarangMasuk | null>(null);
  const [exporting, setExporting] = useState(false);

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
  } = useTableData<BarangMasuk>({
    table: "barang_masuk",
    columns: "*",
    searchColumns: [
      "ID",
      "nomor_do",
      "nama_pembawa_barang",
      "nama_pemilik_barang",
      "sekuriti",
    ],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  const effectiveFilter = isMaster
    ? siteFilter === "all" ? null : siteFilter
    : businessUnitFilter;

  async function handleExportXlsx() {
    setExporting(true);
    const toastId = toast.loading("Sedang mengekspor data...");
    try {
      const supabase = createBrowserClient();
      const batchSize = 1000;
      let allRows: BarangMasuk[] = [];
      let from = 0;
      while (true) {
        let q = supabase
          .from("barang_masuk")
          .select("*")
          .order("tanggal", { ascending: false })
          .range(from, from + batchSize - 1);
        if (effectiveFilter) q = (q as any).ilike("business_unit", effectiveFilter);
        if (dateFrom) q = (q as any).gte("tanggal", dateFrom);
        if (dateTo) q = (q as any).lte("tanggal", dateTo);
        if (search.trim()) {
          const f = ["ID", "nomor_do", "nama_pembawa_barang", "nama_pemilik_barang", "sekuriti"]
            .map((c) => `${c}.ilike.%${search.trim()}%`).join(",");
          q = (q as any).or(f);
        }
        const { data: rows, error } = await q;
        if (error || !rows || rows.length === 0) break;
        allRows = [...allRows, ...(rows as BarangMasuk[])];
        if (rows.length < batchSize) break;
        from += batchSize;
      }

      if (allRows.length === 0) {
        toast.dismiss(toastId);
        toast.info("Tidak ada data untuk diekspor");
        return;
      }

      const ids = allRows.map((r) => r.id);
      let allDetails: any[] = [];
      let allPhotos: any[] = [];
      for (let i = 0; i < ids.length; i += 200) {
        const batch = ids.slice(i, i + 200);
        const [detailRes, photoRes] = await Promise.all([
          supabase.from("detail_do_masuk").select("*").in("barang_masuk_id", batch),
          supabase.from("foto_do_masuk").select("*").in("barang_masuk_id", batch),
        ]);
        if (detailRes.data) allDetails = [...allDetails, ...detailRes.data];
        if (photoRes.data) allPhotos = [...allPhotos, ...photoRes.data];
      }

      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const doMap = Object.fromEntries(allRows.map((r) => [r.id, r]));

      const ws1 = XLSX.utils.aoa_to_sheet([
        ["ID", "Nomor DO", "Tanggal", "Jam", "Pembawa", "Pemilik", "Keterangan", "Sekuriti", "Pos", "Site"],
        ...allRows.map((r) => [r.ID, r.nomor_do, r.tanggal, r.jam, r.nama_pembawa_barang, r.nama_pemilik_barang, r.keterangan, r.sekuriti, r.pos, r.business_unit]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws1, "DO Masuk");

      if (allDetails.length > 0) {
        const ws2 = XLSX.utils.aoa_to_sheet([
          ["ID DO", "Nomor DO", "Serial Number", "Nama Barang", "Jumlah", "Satuan"],
          ...allDetails.map((d) => [
            doMap[d.barang_masuk_id]?.ID ?? "",
            doMap[d.barang_masuk_id]?.nomor_do ?? "",
            d.serial_number ?? "",
            d.nama_barang ?? "",
            d.jumlah ?? "",
            d.satuan ?? "",
          ]),
        ]);
        XLSX.utils.book_append_sheet(wb, ws2, "Detail Item");
      }

      const validPhotos = allPhotos.filter((p) => p.foto);
      if (validPhotos.length > 0) {
        const ws3 = XLSX.utils.aoa_to_sheet([
          ["ID DO", "Nomor DO", "URL Foto"],
          ...validPhotos.map((p) => [
            doMap[p.barang_masuk_id]?.ID ?? "",
            doMap[p.barang_masuk_id]?.nomor_do ?? "",
            p.foto,
          ]),
        ]);
        XLSX.utils.book_append_sheet(wb, ws3, "Foto");
      }

      XLSX.writeFile(wb, "do-masuk-lengkap.xlsx");
      toast.dismiss(toastId);
      toast.success(`Berhasil mengekspor ${allRows.length} data`);
    } catch {
      toast.dismiss(toastId);
      toast.error("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DO Masuk (Barang)</h1>
        <p className="text-muted-foreground text-sm">
          Catatan delivery order barang masuk
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
        exportFilename="do-masuk"
        onExportXlsx={handleExportXlsx}
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
        title="Detail DO Masuk"
        row={selected}
        fields={detailFields}
        extraContent={
          selected ? <BarangMasukDetail row={selected} /> : undefined
        }
      />
    </div>
  );
}
