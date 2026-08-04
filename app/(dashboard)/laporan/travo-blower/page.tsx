"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleDashed,
  ListChecks,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createBrowserClient } from "@/lib/supabase";
import { applyBusinessUnitFilter } from "@/lib/dataFilters";
import { StatCard } from "@/components/StatCard";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SITES } from "@/lib/sites";
import { formatDate, formatTime } from "@/lib/utils";

type Unit = {
  id: string;
  business_unit: string;
  jenis: "travo" | "blower";
  pemilik: string;
  nomor_unit: string;
  aktif: boolean;
};

type Check = {
  id: string;
  master_travo_blower_id: string;
  tanggal: string;
  jam: string | null;
  kondisi: "nyala" | "mati";
  sekuriti: string | null;
  keterangan: string | null;
  foto: string | null;
};

/** Tanggal hari ini (waktu lokal) dalam format YYYY-MM-DD */
function todayStr(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function TravoBlowerMonitoringPage() {
  const {
    isMaster,
    businessUnitFilter,
    loading: authLoading,
  } = useAuth();
  const supabase = createBrowserClient();

  const [date, setDate] = useState<string>(todayStr());
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [units, setUnits] = useState<Unit[]>([]);
  const [checksByUnit, setChecksByUnit] = useState<Record<string, Check>>({});
  const [loading, setLoading] = useState(true);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const effectiveFilter = isMaster
    ? siteFilter === "all"
      ? null
      : siteFilter
    : businessUnitFilter;

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
    if (authLoading) return;
    // Refresh latar berjalan diam-diam supaya tabel tidak berkedip.
    if (!opts?.silent) setLoading(true);

    // 1. daftar unit aktif (sesuai cakupan akses)
    let uq = supabase
      .from("master_travo_blower")
      .select("*")
      .eq("aktif", true)
      .order("pemilik", { ascending: true })
      .order("jenis", { ascending: true })
      .order("nomor_unit", { ascending: true });
    uq = applyBusinessUnitFilter(uq as any, effectiveFilter);

    // 2. cek pada tanggal terpilih (RLS membatasi ke unit yang boleh diakses)
    const checksQ = supabase
      .from("travo_blower_checks")
      .select("*")
      .eq("tanggal", date);

    const [{ data: unitRows, error: uErr }, { data: checkRows, error: cErr }] =
      await Promise.all([uq, checksQ]);

    // Tangani terpisah: checks yang gagal tidak boleh menyembunyikan daftar unit.
    if (uErr) {
      console.error("[travo-blower monitoring] gagal memuat unit:", uErr);
      toast.error(`Gagal memuat daftar unit: ${uErr.message}`);
      setUnits([]);
    } else {
      setUnits((unitRows as Unit[]) ?? []);
    }

    if (cErr) {
      console.error("[travo-blower monitoring] gagal memuat cek:", cErr);
      toast.error(`Gagal memuat status cek: ${cErr.message}`);
      setChecksByUnit({});
    } else {
      const map: Record<string, Check> = {};
      ((checkRows as Check[]) ?? []).forEach((c) => {
        map[c.master_travo_blower_id] = c;
      });
      setChecksByUnit(map);
    }
    setLoading(false);
  }, [authLoading, effectiveFilter, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // auto-refresh tiap 30 detik (checklist berubah sepanjang hari via mobile),
  // diam-diam tanpa skeleton supaya tidak berkedip
  useEffect(() => {
    if (authLoading) return;
    const t = setInterval(() => fetchData({ silent: true }), 30_000);
    return () => clearInterval(t);
  }, [authLoading, fetchData]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units
      .map((u) => ({ unit: u, check: checksByUnit[u.id] ?? null }))
      .filter(({ unit, check }) => {
        if (!q) return true;
        return [
          unit.business_unit,
          unit.jenis,
          unit.pemilik,
          unit.nomor_unit,
          check?.sekuriti ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [units, checksByUnit, search]);

  const stats = useMemo(() => {
    const total = units.length;
    const checked = units.filter((u) => checksByUnit[u.id]).length;
    const bermasalah = units.filter(
      (u) => checksByUnit[u.id]?.kondisi === "mati",
    ).length;
    return { total, checked, belum: total - checked, bermasalah };
  }, [units, checksByUnit]);

  const colCount = isMaster ? 9 : 8;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring Travo / Blower</h1>
        <p className="text-muted-foreground text-sm">
          Checklist harian kondisi travo &amp; blower — diisi security via
          aplikasi mobile
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Unit"
          value={stats.total}
          icon={ListChecks}
          loading={loading}
        />
        <StatCard
          title="Sudah Dicek"
          value={stats.checked}
          icon={CheckCircle2}
          loading={loading}
          colorClass="text-green-600"
        />
        <StatCard
          title="Belum Dicek"
          value={stats.belum}
          icon={CircleDashed}
          loading={loading}
          colorClass="text-muted-foreground"
        />
        <StatCard
          title="Kondisi Bermasalah"
          value={stats.bermasalah}
          icon={AlertTriangle}
          loading={loading}
          colorClass="text-red-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <Input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        {isMaster && (
          <NativeSelect
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-36"
          >
            <option value="all">Semua Site</option>
            {SITES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        )}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pemilik / nomor / petugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {formatDate(date)}
        </span>
      </div>

      {/* Tabel checklist */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {isMaster && <TableHead>Site</TableHead>}
              <TableHead>Jenis</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Nomor Unit</TableHead>
              <TableHead>Status Cek</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Petugas</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colCount }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="text-center py-16 text-muted-foreground"
                >
                  Tidak ada unit travo/blower aktif
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ unit, check }) => (
                <TableRow key={unit.id}>
                  {isMaster && (
                    <TableCell>
                      <BusinessUnitBadge value={unit.business_unit} />
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant={unit.jenis === "travo" ? "default" : "secondary"}
                    >
                      {unit.jenis === "travo" ? "Travo" : "Blower"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{unit.pemilik}</TableCell>
                  <TableCell>{unit.nomor_unit}</TableCell>
                  <TableCell>
                    {check ? (
                      <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CircleDashed className="h-4 w-4" />
                        Belum
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!check ? (
                      <span className="text-muted-foreground">-</span>
                    ) : check.kondisi === "nyala" ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                        Nyala
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Mati</Badge>
                    )}
                  </TableCell>
                  <TableCell>{check?.sekuriti ?? "-"}</TableCell>
                  <TableCell>
                    {check?.jam ? formatTime(check.jam) : "-"}
                  </TableCell>
                  <TableCell className="max-w-[16rem]">
                    <div className="flex items-center gap-2">
                      {check?.foto && (
                        <img
                          src={check.foto}
                          alt="Foto kondisi"
                          className="h-9 w-9 object-cover rounded border cursor-pointer shrink-0"
                          onClick={() => setLightboxUrl(check.foto)}
                        />
                      )}
                      <span className="truncate text-sm text-muted-foreground">
                        {check?.keterangan ?? (check ? "" : "-")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              alt="Foto kondisi"
              className="max-h-[90vh] max-w-[90vw] rounded"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
