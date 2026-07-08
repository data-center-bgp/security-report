"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  UserMinus,
  PackageCheck,
  PackageX,
  MailOpen,
  Send,
  AlertTriangle,
  Droplets,
  Fuel,
  Anchor,
  Zap,
  RefreshCw,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { applyBusinessUnitFilter } from "@/lib/dataFilters";
import { useAuth } from "@/components/AuthProvider";
import { StatCard } from "@/components/StatCard";
import { ActivityChart } from "@/components/ActivityChart";
import {
  DateRangePresetPicker,
  type DateRange,
} from "@/components/DateRangePicker";
import { BusinessUnitBadge } from "@/components/BusinessUnitBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/utils";
import { SITES } from "@/lib/sites";

type Granularity = "day" | "week" | "month";

function getDefaultRange(): DateRange {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const to = today.toISOString().slice(0, 10);
  return { from, to };
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Returns the bucket key for a date string given the selected granularity. */
function getBucketKey(dateStr: string, g: Granularity): string {
  if (!dateStr) return "";
  if (g === "month") return dateStr.slice(0, 7); // YYYY-MM
  if (g === "week") {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  return dateStr; // day
}

/** Human-friendly label for an axis tick. */
function getBucketLabel(key: string, g: Granularity): string {
  if (!key) return "";
  if (g === "month") {
    const [y, m] = key.split("-");
    return `${MONTH_LABELS[parseInt(m, 10) - 1]} '${y.slice(2)}`;
  }
  const parts = key.split("-");
  const label = `${parts[2]}/${parts[1]}`;
  return g === "week" ? `Mgg ${label}` : label;
}

interface SeriesInput {
  rows: any[];
  key: string;
}

/** Builds a bucketed count trend across multiple series. */
function buildCountTrend(series: SeriesInput[], g: Granularity): any[] {
  const map: Record<string, Record<string, number>> = {};
  series.forEach(({ rows, key }) => {
    rows.forEach((r) => {
      const bk = getBucketKey(r.tanggal, g);
      if (!bk) return;
      if (!map[bk]) map[bk] = {};
      map[bk][key] = (map[bk][key] ?? 0) + 1;
    });
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bk, vals]) => {
      const row: Record<string, any> = { bucket: getBucketLabel(bk, g) };
      series.forEach((s) => (row[s.key] = vals[s.key] ?? 0));
      return row;
    });
}

/** Builds a bucketed quantity-sum trend across multiple series. */
function buildQtyTrend(series: SeriesInput[], g: Granularity): any[] {
  const map: Record<string, Record<string, number>> = {};
  series.forEach(({ rows, key }) => {
    rows.forEach((r) => {
      const bk = getBucketKey(r.tanggal, g);
      if (!bk) return;
      if (!map[bk]) map[bk] = {};
      map[bk][key] = (map[bk][key] ?? 0) + (Number(r.quantity) || 0);
    });
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bk, vals]) => {
      const row: Record<string, any> = { bucket: getBucketLabel(bk, g) };
      series.forEach((s) => (row[s.key] = vals[s.key] ?? 0));
      return row;
    });
}

const ACTIVITY_CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  orang_masuk: { label: "Orang Masuk", icon: "👥" },
  orang_keluar: { label: "Orang Keluar", icon: "🚶" },
  barang_masuk: { label: "DO Masuk", icon: "📦" },
  barang_keluar: { label: "DO Keluar", icon: "📤" },
  surat_masuk: { label: "Surat Masuk", icon: "📬" },
  surat_keluar: { label: "Surat Keluar", icon: "📨" },
  form_kejadian: { label: "Kejadian", icon: "⚠️" },
  laporan_bunker_freshwater: { label: "Bunker Air Tawar", icon: "💧" },
  laporan_mobil_tangki_fuel: { label: "Mobil Tangki Fuel", icon: "⛽" },
  laporan_travo_blower: { label: "Travo Blower", icon: "⚡" },
  laporan_tambat: { label: "Tambat", icon: "⚓" },
};

// Per-table date column (defaults to "tanggal").
const DATE_COLUMN: Record<string, string> = {
  laporan_tambat: "tanggal_mulai_tambat",
};

const ALL_TABLES = Object.keys(ACTIVITY_CATEGORY_MAP);

export default function DashboardPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const supabase = createBrowserClient();

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [opSummary, setOpSummary] = useState<{
    bunkerQty: number;
    fuelQty: number;
    activeTambat: number;
  }>({ bunkerQty: 0, fuelQty: 0, activeTambat: 0 });
  const [peopleTrend, setPeopleTrend] = useState<any[]>([]);
  const [goodsTrend, setGoodsTrend] = useState<any[]>([]);
  const [mailTrend, setMailTrend] = useState<any[]>([]);
  const [qtyTrend, setQtyTrend] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [perSiteBreakdown, setPerSiteBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveFilter = isMaster
    ? siteFilter === "all"
      ? null
      : siteFilter
    : businessUnitFilter;

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);

    try {
      const { from, to } = dateRange;

      // ---- Counts for every category ----
      const countResults = await Promise.all(
        ALL_TABLES.map(async (table) => {
          const dateCol = DATE_COLUMN[table] ?? "tanggal";
          let q = supabase
            .from(table)
            .select("id", { count: "exact", head: true });
          q = applyBusinessUnitFilter(q as any, effectiveFilter);
          q = (q as any).gte(dateCol, from).lte(dateCol, to);
          const { count, error } = await q;
          if (error) {
            console.error(`[dashboard] gagal menghitung "${table}":`, error);
          }
          return { table, count: count ?? 0 };
        }),
      );
      const newCounts: Record<string, number> = {};
      countResults.forEach(({ table, count }) => (newCounts[table] = count));
      setCounts(newCounts);

      // ---- Operational quantities + active moorings ----
      const today = new Date().toISOString().slice(0, 10);
      const [bunkerRes, fuelRes, tambatRes] = await Promise.all([
        applyBusinessUnitFilter(
          (
            supabase
              .from("laporan_bunker_freshwater")
              .select("tanggal, quantity") as any
          )
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (
            supabase
              .from("laporan_mobil_tangki_fuel")
              .select("tanggal, quantity") as any
          )
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (
            supabase
              .from("laporan_tambat")
              .select("id", { count: "exact", head: true }) as any
          ).gte("tanggal_selesai_tambat", today),
          effectiveFilter,
        ),
      ]);

      const bunkerRows = bunkerRes.data ?? [];
      const fuelRows = fuelRes.data ?? [];
      const bunkerQty = bunkerRows.reduce(
        (s: number, r: any) => s + (Number(r.quantity) || 0),
        0,
      );
      const fuelQty = fuelRows.reduce(
        (s: number, r: any) => s + (Number(r.quantity) || 0),
        0,
      );
      setOpSummary({
        bunkerQty,
        fuelQty,
        activeTambat: tambatRes.count ?? 0,
      });

      // ---- Trend source rows (orang, barang, surat) ----
      const [om, ok, bm, bk, sm, sk] = await Promise.all([
        applyBusinessUnitFilter(
          (supabase.from("orang_masuk").select("tanggal") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (supabase.from("orang_keluar").select("tanggal") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (supabase.from("barang_masuk").select("tanggal") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (supabase.from("barang_keluar").select("tanggal") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (supabase.from("surat_masuk").select("tanggal") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (supabase.from("surat_keluar").select("tanggal") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
      ]);

      setPeopleTrend(
        buildCountTrend(
          [
            { rows: om.data ?? [], key: "orang_masuk" },
            { rows: ok.data ?? [], key: "orang_keluar" },
          ],
          granularity,
        ),
      );
      setGoodsTrend(
        buildCountTrend(
          [
            { rows: bm.data ?? [], key: "barang_masuk" },
            { rows: bk.data ?? [], key: "barang_keluar" },
          ],
          granularity,
        ),
      );
      setMailTrend(
        buildCountTrend(
          [
            { rows: sm.data ?? [], key: "surat_masuk" },
            { rows: sk.data ?? [], key: "surat_keluar" },
          ],
          granularity,
        ),
      );
      setQtyTrend(
        buildQtyTrend(
          [
            { rows: bunkerRows, key: "bunker" },
            { rows: fuelRows, key: "fuel" },
          ],
          granularity,
        ),
      );

      // ---- Recent activity feed ----
      const recentItems = await Promise.all(
        ALL_TABLES.map(async (table) => {
          const sel =
            table === "laporan_tambat"
              ? "id, ID, tanggal_mulai_tambat, sekuriti, business_unit, created_at"
              : "id, ID, tanggal, jam, sekuriti, business_unit, created_at";
          let q = supabase
            .from(table)
            .select(sel)
            .order("created_at", { ascending: false })
            .limit(3);
          q = applyBusinessUnitFilter(q as any, effectiveFilter);
          const { data } = await q;
          return (data ?? []).map((row: any) => ({
            ...row,
            tanggal: row.tanggal ?? row.tanggal_mulai_tambat,
            _table: table,
          }));
        }),
      );
      const merged = recentItems
        .flat()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 12);
      setRecentActivity(merged);

      // ---- Per-site breakdown (master only) ----
      if (isMaster) {
        const siteBreakdown = await Promise.all(
          ALL_TABLES.map(async (table) => {
            const dateCol = DATE_COLUMN[table] ?? "tanggal";
            const q = await (
              supabase.from(table).select("business_unit") as any
            )
              .gte(dateCol, from)
              .lte(dateCol, to);
            const rows: any[] = q.data ?? [];
            const bySite: Record<string, number> = {};
            rows.forEach((r) => {
              const s = (r.business_unit ?? "unknown").toLowerCase();
              bySite[s] = (bySite[s] ?? 0) + 1;
            });
            return { table, bySite };
          }),
        );
        setPerSiteBreakdown(siteBreakdown);
      }
    } catch (err: any) {
      console.error("[dashboard] gagal memuat data:", err);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, [authLoading, dateRange, granularity, effectiveFilter, isMaster]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      {/* Header + controls */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Ringkasan seluruh aktivitas keamanan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <DateRangePresetPicker value={dateRange} onChange={setDateRange} />
          {/* Granularity toggle */}
          <div className="inline-flex rounded-md border bg-background p-0.5">
            {(
              [
                ["day", "Harian"],
                ["week", "Mingguan"],
                ["month", "Bulanan"],
              ] as [Granularity, string][]
            ).map(([g, label]) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  granularity === g
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Section 1 — Access control overview */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Kontrol Akses</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Orang Masuk"
            value={counts.orang_masuk}
            icon={Users}
            loading={loading}
            colorClass="text-blue-600"
          />
          <StatCard
            title="Orang Keluar"
            value={counts.orang_keluar}
            icon={UserMinus}
            loading={loading}
            colorClass="text-muted-foreground"
          />
          <StatCard
            title="DO Masuk"
            value={counts.barang_masuk}
            icon={PackageCheck}
            loading={loading}
            colorClass="text-green-600"
          />
          <StatCard
            title="DO Keluar"
            value={counts.barang_keluar}
            icon={PackageX}
            loading={loading}
            colorClass="text-orange-600"
          />
          <StatCard
            title="Surat Masuk"
            value={counts.surat_masuk}
            icon={MailOpen}
            loading={loading}
            colorClass="text-purple-600"
          />
          <StatCard
            title="Surat Keluar"
            value={counts.surat_keluar}
            icon={Send}
            loading={loading}
            colorClass="text-fuchsia-600"
          />
        </div>
      </section>

      {/* Section 2 — Activity trends (granularity-aware) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tren Aktivitas</h2>
          <span className="text-xs text-muted-foreground">
            Tampilan:{" "}
            {granularity === "day"
              ? "Harian"
              : granularity === "week"
                ? "Mingguan"
                : "Bulanan"}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orang Masuk / Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ActivityChart
                  data={peopleTrend}
                  type="line"
                  xAxisKey="bucket"
                  dataKeys={[
                    { key: "orang_masuk", color: "#3b82f6", label: "Masuk" },
                    { key: "orang_keluar", color: "#64748b", label: "Keluar" },
                  ]}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pergerakan Barang (DO)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ActivityChart
                  data={goodsTrend}
                  type="bar"
                  xAxisKey="bucket"
                  dataKeys={[
                    {
                      key: "barang_masuk",
                      color: "#22c55e",
                      label: "DO Masuk",
                    },
                    {
                      key: "barang_keluar",
                      color: "#f97316",
                      label: "DO Keluar",
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Surat Masuk / Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ActivityChart
                  data={mailTrend}
                  type="bar"
                  xAxisKey="bucket"
                  dataKeys={[
                    { key: "surat_masuk", color: "#a855f7", label: "Masuk" },
                    { key: "surat_keluar", color: "#d946ef", label: "Keluar" },
                  ]}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Volume Bunker &amp; Fuel (L)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ActivityChart
                  data={qtyTrend}
                  type="line"
                  xAxisKey="bucket"
                  dataKeys={[
                    { key: "bunker", color: "#06b6d4", label: "Air Tawar (L)" },
                    { key: "fuel", color: "#eab308", label: "Fuel (L)" },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3 — Incidents & operational reports */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Kejadian &amp; Laporan Operasional
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Kejadian"
            value={counts.form_kejadian}
            icon={AlertTriangle}
            loading={loading}
            colorClass="text-red-600"
          />
          <StatCard
            title="Bunker Air Tawar"
            value={counts.laporan_bunker_freshwater}
            icon={Droplets}
            loading={loading}
            colorClass="text-cyan-600"
            description={`${opSummary.bunkerQty.toLocaleString("id-ID")} L`}
          />
          <StatCard
            title="Mobil Tangki Fuel"
            value={counts.laporan_mobil_tangki_fuel}
            icon={Fuel}
            loading={loading}
            colorClass="text-yellow-600"
            description={`${opSummary.fuelQty.toLocaleString("id-ID")} L`}
          />
          <StatCard
            title="Travo Blower"
            value={counts.laporan_travo_blower}
            icon={Zap}
            loading={loading}
            colorClass="text-amber-600"
          />
          <StatCard
            title="Tambat"
            value={counts.laporan_tambat}
            icon={Anchor}
            loading={loading}
            colorClass="text-indigo-600"
          />
          <StatCard
            title="Tambat Aktif"
            value={opSummary.activeTambat}
            icon={Anchor}
            loading={loading}
            colorClass="text-teal-600"
            description="kapal sedang tambat"
          />
        </div>
      </section>

      {/* Per-site breakdown — master only */}
      {isMaster && perSiteBreakdown.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Breakdown per Site</h2>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Kategori
                    </th>
                    {SITES.map((s) => (
                      <th
                        key={s.value}
                        className="text-center py-2 px-4 font-medium"
                      >
                        {s.label}
                      </th>
                    ))}
                    <th className="text-center py-2 pl-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {perSiteBreakdown.map(({ table, bySite }) => {
                    const cat = ACTIVITY_CATEGORY_MAP[table];
                    const total = Object.values(
                      bySite as Record<string, number>,
                    ).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={table} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          {cat?.icon} {cat?.label}
                        </td>
                        {SITES.map((s) => (
                          <td key={s.value} className="text-center py-2 px-4">
                            {bySite[s.value] ?? 0}
                          </td>
                        ))}
                        <td className="text-center py-2 pl-4 font-semibold">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent activity feed */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h2>
        <Card>
          <CardContent className="pt-4 divide-y">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">
                Tidak ada aktivitas
              </p>
            ) : (
              recentActivity.map((item, i) => {
                const cat = ACTIVITY_CATEGORY_MAP[item._table];
                return (
                  <div key={i} className="py-3 flex items-center gap-3 text-sm">
                    <span className="text-lg shrink-0">{cat?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{cat?.label}</span>
                      {item.ID && (
                        <span className="text-muted-foreground ml-2">
                          #{item.ID}
                        </span>
                      )}
                      {item.sekuriti && (
                        <span className="text-muted-foreground ml-2">
                          · {item.sekuriti}
                        </span>
                      )}
                    </div>
                    {isMaster && (
                      <BusinessUnitBadge value={item.business_unit} />
                    )}
                    <span className="text-muted-foreground shrink-0">
                      {formatDate(item.tanggal)}{" "}
                      {item.jam ? formatTime(item.jam) : ""}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
