"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Users,
  UserMinus,
  Anchor,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  Fuel,
  Zap,
  Mail,
  MailOpen,
  Send,
  PackageCheck,
  PackageX,
  RefreshCw,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { applyBusinessUnitFilter } from "@/lib/dataFilters";
import { useAuth } from "@/components/AuthProvider";
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
import { cn, formatDate, formatTime } from "@/lib/utils";
import { SITES } from "@/lib/sites";
import type { LucideIcon } from "lucide-react";

type Granularity = "day" | "week" | "month";

const C1 = "var(--chart-1)"; // biru — seri utama / masuk
const C2 = "var(--chart-2)"; // oranye — seri sekunder / keluar

function getDefaultRange(): DateRange {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const to = today.toISOString().slice(0, 10);
  return { from, to };
}

// ---- date helpers ----
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayCount(from: string, to: string): number {
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}
function previousRange(from: string, to: string): DateRange {
  const len = dayCount(from, to);
  return { from: addDays(from, -len), to: addDays(from, -1) };
}
function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null; // null => "baru" (tak ada pembanding)
  return ((cur - prev) / prev) * 100;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function getBucketKey(dateStr: string, g: Granularity): string {
  if (!dateStr) return "";
  if (g === "month") return dateStr.slice(0, 7);
  if (g === "week") {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  return dateStr;
}
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

const ACTIVITY_CATEGORY_MAP: Record<
  string,
  { label: string; icon: LucideIcon }
> = {
  orang_masuk: { label: "Orang Masuk", icon: Users },
  orang_keluar: { label: "Orang Keluar", icon: UserMinus },
  barang_masuk: { label: "DO Masuk", icon: PackageCheck },
  barang_keluar: { label: "DO Keluar", icon: PackageX },
  surat_masuk: { label: "Surat Masuk", icon: MailOpen },
  surat_keluar: { label: "Surat Keluar", icon: Send },
  form_kejadian: { label: "Kejadian", icon: AlertTriangle },
  laporan_bunker_freshwater: { label: "Bunker Air Tawar", icon: Droplets },
  laporan_mobil_tangki_fuel: { label: "Mobil Tangki Fuel", icon: Fuel },
  laporan_travo_blower: { label: "Travo Blower", icon: Zap },
  laporan_tambat: { label: "Tambat", icon: Anchor },
};
const DATE_COLUMN: Record<string, string> = {
  laporan_tambat: "tanggal_mulai_tambat",
};
const ALL_TABLES = Object.keys(ACTIVITY_CATEGORY_MAP);

// =====================================================================
// Small presentational pieces
// =====================================================================
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

type Polarity = "neutral" | "up-bad";

function KpiTile({
  label,
  value,
  icon: Icon,
  delta,
  polarity = "neutral",
  hint,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  delta?: number | null;
  polarity?: Polarity;
  hint?: string;
  loading?: boolean;
}) {
  const showDelta = delta !== undefined;
  const up = (delta ?? 0) >= 0;
  const deltaColor =
    delta == null || delta === 0
      ? "text-muted-foreground"
      : polarity === "up-bad"
        ? up
          ? "text-red-600 dark:text-red-400"
          : "text-green-600 dark:text-green-400"
        : up
          ? "text-green-600 dark:text-green-400"
          : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground/70" />
        </div>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="flex items-end justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight tabular-nums">
              {value.toLocaleString("id-ID")}
            </span>
            {showDelta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold pb-1",
                  deltaColor,
                )}
              >
                {delta == null ? (
                  <span className="text-muted-foreground">baru</span>
                ) : (
                  <>
                    {up ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(delta).toFixed(0)}%
                  </>
                )}
              </span>
            )}
          </div>
        )}
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-16 mt-0.5" />
        ) : (
          <p className="text-base font-semibold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isMaster, businessUnitFilter, loading: authLoading } = useAuth();
  const supabase = createBrowserClient();

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [siteFilter, setSiteFilter] = useState<string>("all");

  const [kpi, setKpi] = useState({
    total: 0, totalPrev: 0,
    kejadian: 0, kejadianPrev: 0,
    orangMasuk: 0, orangMasukPrev: 0,
    tambatAktif: 0,
  });
  const [ops, setOps] = useState({ bunkerQty: 0, fuelQty: 0, travo: 0, surat: 0 });
  const [totalTrend, setTotalTrend] = useState<any[]>([]);
  const [composition, setComposition] = useState<any[]>([]);
  const [perSite, setPerSite] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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
      const prev = previousRange(from, to);

      const countFor = async (
        table: string,
        f: string,
        t: string,
      ): Promise<number> => {
        const dateCol = DATE_COLUMN[table] ?? "tanggal";
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        q = applyBusinessUnitFilter(q as any, effectiveFilter);
        q = (q as any).gte(dateCol, f).lte(dateCol, t);
        const { count } = await q;
        return count ?? 0;
      };

      // ---- counts: current + previous period (untuk delta) ----
      const [curArr, prevArr] = await Promise.all([
        Promise.all(ALL_TABLES.map((tb) => countFor(tb, from, to))),
        Promise.all(ALL_TABLES.map((tb) => countFor(tb, prev.from, prev.to))),
      ]);
      const cur: Record<string, number> = {};
      const pre: Record<string, number> = {};
      ALL_TABLES.forEach((tb, i) => {
        cur[tb] = curArr[i];
        pre[tb] = prevArr[i];
      });
      const sum = (o: Record<string, number>) =>
        Object.values(o).reduce((a, b) => a + b, 0);

      // ---- operational quantities + active moorings ----
      const today = new Date().toISOString().slice(0, 10);
      const [bunkerRes, fuelRes, tambatRes] = await Promise.all([
        applyBusinessUnitFilter(
          (supabase.from("laporan_bunker_freshwater").select("quantity") as any)
            .gte("tanggal", from)
            .lte("tanggal", to),
          effectiveFilter,
        ),
        applyBusinessUnitFilter(
          (supabase.from("laporan_mobil_tangki_fuel").select("quantity") as any)
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
      const qtySum = (rows: any[]) =>
        (rows ?? []).reduce((s, r) => s + (Number(r.quantity) || 0), 0);

      setKpi({
        total: sum(cur),
        totalPrev: sum(pre),
        kejadian: cur.form_kejadian,
        kejadianPrev: pre.form_kejadian,
        orangMasuk: cur.orang_masuk,
        orangMasukPrev: pre.orang_masuk,
        tambatAktif: tambatRes.count ?? 0,
      });
      setOps({
        bunkerQty: qtySum(bunkerRes.data),
        fuelQty: qtySum(fuelRes.data),
        travo: cur.laporan_travo_blower,
        surat: cur.surat_masuk + cur.surat_keluar,
      });

      // ---- tren total aktivitas (semua kategori) + komposisi kategori ----
      const dateArrays = await Promise.all(
        ALL_TABLES.map(async (table) => {
          const dateCol = DATE_COLUMN[table] ?? "tanggal";
          let q = supabase.from(table).select(dateCol);
          q = applyBusinessUnitFilter(q as any, effectiveFilter);
          q = (q as any).gte(dateCol, from).lte(dateCol, to);
          const { data } = await q;
          return ((data ?? []) as any[]).map((r) => ({ tanggal: r[dateCol] }));
        }),
      );
      setTotalTrend(
        buildCountTrend(
          [{ rows: dateArrays.flat(), key: "total" }],
          granularity,
        ),
      );
      setComposition(
        ALL_TABLES.map((tb) => ({
          kategori: ACTIVITY_CATEGORY_MAP[tb].label,
          total: cur[tb],
        }))
          .filter((c) => c.total > 0)
          .sort((a, b) => b.total - a.total),
      );

      // ---- per-site total (master only) ----
      if (isMaster) {
        const perTable = await Promise.all(
          ALL_TABLES.map(async (table) => {
            const dateCol = DATE_COLUMN[table] ?? "tanggal";
            const { data } = await (
              supabase.from(table).select("business_unit") as any
            )
              .gte(dateCol, from)
              .lte(dateCol, to);
            return (data ?? []) as any[];
          }),
        );
        const totals: Record<string, number> = {};
        perTable.flat().forEach((r) => {
          const s = (r.business_unit ?? "").toLowerCase();
          if (!s) return;
          totals[s] = (totals[s] ?? 0) + 1;
        });
        setPerSite(
          SITES.map((s) => ({ site: s.label, total: totals[s.value] ?? 0 })).sort(
            (a, b) => b.total - a.total,
          ),
        );
      }

      // ---- recent activity feed ----
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
      setRecentActivity(
        recentItems
          .flat()
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 8),
      );
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
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Ringkasan monitoring keamanan &amp; operasional
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
                className={cn(
                  "px-3 py-1.5 text-sm rounded transition-colors",
                  granularity === g
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
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
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPI utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Total Aktivitas"
          value={kpi.total}
          icon={Activity}
          delta={pctDelta(kpi.total, kpi.totalPrev)}
          polarity="neutral"
          hint="vs periode sebelumnya"
          loading={loading}
        />
        <KpiTile
          label="Kejadian"
          value={kpi.kejadian}
          icon={AlertTriangle}
          delta={pctDelta(kpi.kejadian, kpi.kejadianPrev)}
          polarity="up-bad"
          hint="insiden keamanan"
          loading={loading}
        />
        <KpiTile
          label="Orang Masuk"
          value={kpi.orangMasuk}
          icon={Users}
          delta={pctDelta(kpi.orangMasuk, kpi.orangMasukPrev)}
          polarity="neutral"
          hint="vs periode sebelumnya"
          loading={loading}
        />
        <KpiTile
          label="Tambat Aktif"
          value={kpi.tambatAktif}
          icon={Anchor}
          hint="kapal sedang tambat"
          loading={loading}
        />
      </div>

      {/* Tren total aktivitas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Tren Total Aktivitas</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Seluruh kategori digabung
            </p>
          </div>
          <LegendDot color={C1} label="Aktivitas" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ActivityChart
              data={totalTrend}
              type="area"
              xAxisKey="bucket"
              dataKeys={[{ key: "total", color: C1, label: "Aktivitas" }]}
            />
          )}
        </CardContent>
      </Card>

      {/* Komposisi kategori + aktivitas per site */}
      <div
        className={cn(
          "grid gap-6",
          isMaster ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Komposisi Aktivitas</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Jumlah per kategori
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ActivityChart
                data={composition}
                type="bar"
                horizontal
                height={Math.max(220, composition.length * 34)}
                xAxisKey="kategori"
                dataKeys={[{ key: "total", color: C1, label: "Aktivitas" }]}
              />
            )}
          </CardContent>
        </Card>

        {isMaster && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktivitas per Site</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Jumlah per business unit
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <ActivityChart
                  data={perSite}
                  type="bar"
                  horizontal
                  height={220}
                  xAxisKey="site"
                  dataKeys={[{ key: "total", color: C1, label: "Aktivitas" }]}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ringkasan operasional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Operasional</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 grid-cols-2 md:grid-cols-4">
            <MiniStat
              label="Bunker Air Tawar"
              value={`${ops.bunkerQty.toLocaleString("id-ID")} L`}
              icon={Droplets}
              loading={loading}
            />
            <MiniStat
              label="Mobil Tangki Fuel"
              value={`${ops.fuelQty.toLocaleString("id-ID")} L`}
              icon={Fuel}
              loading={loading}
            />
            <MiniStat
              label="Travo Blower"
              value={ops.travo.toLocaleString("id-ID")}
              icon={Zap}
              loading={loading}
            />
            <MiniStat
              label="Surat (Masuk + Keluar)"
              value={ops.surat.toLocaleString("id-ID")}
              icon={Mail}
              loading={loading}
            />
          </CardContent>
        </Card>

      {/* Aktivitas terbaru */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="divide-y pt-0">
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
              const Icon = cat?.icon ?? Activity;
              return (
                <div key={i} className="py-3 flex items-center gap-3 text-sm">
                  <span className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
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
                  {isMaster && <BusinessUnitBadge value={item.business_unit} />}
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
    </div>
  );
}
