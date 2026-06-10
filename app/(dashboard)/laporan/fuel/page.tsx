"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTableData } from "@/hooks/useTableData";
import { DataTable, type ColumnDef } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { TableFilters } from "@/components/TableFilters";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { formatDate } from "@/lib/utils";

type MobilTangkiFuel = {
  id: string;
  ID: string;
  tanggal: string;
  nama_driver: string;
  quantity: number;
  tujuan: string;
  approved_by: string;
  surat_jalan: string;
  keterangan: string;
  sekuriti: string;
  business_unit: string;
};

const columns: ColumnDef<MobilTangkiFuel>[] = [
  { key: "ID", label: "ID", sortable: true },
  {
    key: "tanggal",
    label: "Tanggal",
    sortable: true,
    render: (r) => formatDate(r.tanggal),
  },
  { key: "nama_driver", label: "Driver" },
  {
    key: "quantity",
    label: "Qty (L)",
    render: (r) => r.quantity?.toLocaleString("id-ID"),
  },
  { key: "tujuan", label: "Tujuan" },
  { key: "approved_by", label: "Approved By" },
  { key: "surat_jalan", label: "Surat Jalan" },
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
  { key: "nama_driver", label: "Nama Driver" },
  {
    key: "quantity",
    label: "Quantity (L)",
    render: (v: any) => v?.toLocaleString("id-ID"),
  },
  { key: "tujuan", label: "Tujuan" },
  { key: "approved_by", label: "Approved By" },
  { key: "surat_jalan", label: "Surat Jalan" },
  { key: "keterangan", label: "Keterangan" },
  { key: "sekuriti", label: "Sekuriti" },
  {
    key: "business_unit",
    label: "Site",
    render: (v: any) => <BusinessUnitBadge value={v} />,
  },
];

export default function FuelPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState<MobilTangkiFuel | null>(null);

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
  } = useTableData<MobilTangkiFuel>({
    table: "laporan_mobil_tangki_fuel",
    columns: "*",
    searchColumns: [
      "ID",
      "nama_driver",
      "tujuan",
      "approved_by",
      "surat_jalan",
      "sekuriti",
    ],
    businessUnitFilter,
    isMaster,
    authLoading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mobil Tangki Fuel</h1>
        <p className="text-muted-foreground text-sm">
          Laporan pengiriman bahan bakar
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
        exportFilename="mobil-tangki-fuel"
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
        title="Detail Mobil Tangki Fuel"
        row={selected}
        fields={detailFields}
      />
    </div>
  );
}
