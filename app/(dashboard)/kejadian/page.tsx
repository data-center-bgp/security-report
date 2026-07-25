"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Camera } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase";

type FormKejadian = {
  id: string;
  ID: string;
  tanggal: string;
  jam: string;
  kejadian: string;
  lokasi: string;
  sekuriti: string;
  business_unit: string;
};

const columns: ColumnDef<FormKejadian>[] = [
  { key: "ID", label: "ID", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "jam", label: "Jam", render: (r) => formatTime(r.jam) },
  { key: "kejadian", label: "Kejadian" },
  { key: "lokasi", label: "Lokasi" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (r) => <BusinessUnitBadge value={r.business_unit} />,
  },
  {
    key: "_foto",
    label: "Foto",
    render: (r) => <span className="text-muted-foreground text-xs">🔍</span>,
  },
];

function KejadianDetail({ row }: { row: FormKejadian }) {
  const supabase = createBrowserClient();
  const [photos, setPhotos] = useState<any[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!row?.id) return;
    supabase
      .from("foto_kejadian")
      .select("*")
      .eq("form_kejadian_id", row.id)
      .then(({ data }) => setPhotos(data ?? []));
  }, [row?.id]);

  if (photos.filter((p) => p.foto).length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">Foto Kejadian</h4>
      <div className="flex flex-wrap gap-2">
        {photos
          .filter((p) => p.foto)
          .map((p, i) => (
            <img
              key={i}
              src={p.foto}
              alt={`Foto ${i + 1}`}
              className="h-24 w-24 object-cover rounded cursor-pointer border"
              onClick={() => setLightboxUrl(p.foto)}
            />
          ))}
      </div>
      {lightboxUrl &&
        typeof document !== "undefined" &&
        createPortal(
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
          document.body,
        )}
    </div>
  );
}

const detailFields = [
  { key: "ID", label: "ID" },
  { key: "tanggal", label: "Tanggal", render: (v: any) => formatDate(v) },
  { key: "jam", label: "Jam", render: (v: any) => formatTime(v) },
  { key: "kejadian", label: "Kejadian" },
  { key: "lokasi", label: "Lokasi" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function FormKejadianPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<FormKejadian | null>(null);

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
  } = useTableData<FormKejadian>({
    table: "form_kejadian",
    columns: "*",
    searchColumns: ["ID", "kejadian", "lokasi", "sekuriti"],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form Kejadian</h1>
        <p className="text-muted-foreground text-sm">
          Laporan insiden keamanan
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
        exportFilename="form-kejadian"
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
        title="Detail Kejadian"
        row={selected}
        fields={detailFields}
        extraContent={selected ? <KejadianDetail row={selected} /> : undefined}
      />
    </div>
  );
}
