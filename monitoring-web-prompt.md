# Prompt: Security Monitoring Web Dashboard for HR Division

## Project Overview

Build a **web-based monitoring dashboard** for the HR division to monitor security personnel activity across multiple sites (shipyard and shorebase). The app shares the same **Supabase** backend as an existing React Native mobile app used by security guards.

The web app is **read-only** for HR — no data entry, only viewing and analyzing records submitted by security through the mobile app.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Supabase:** `@supabase/supabase-js` v2 (same project URL and anon key as the mobile app)
- **Charts:** Recharts (for dashboard summaries)
- **Auth:** Supabase Auth (email/password), same `profiles` table determines access level
- **Date handling:** date-fns

---

## Database Schema (Supabase)

All tables include a `business_unit` column used for site-level data isolation.

### Core Tables

#### `profiles`

| Column        | Type | Notes                                                                                  |
| ------------- | ---- | -------------------------------------------------------------------------------------- |
| id            | uuid | FK to auth.users                                                                       |
| full_name     | text |                                                                                        |
| business_unit | text | `"master"` = all data; other values = site-specific (e.g. `"shipyard"`, `"shorebase"`) |

#### `pic_security`

| Column        | Type |
| ------------- | ---- |
| nama          | text |
| business_unit | text |

#### `companies`

| Column          | Type |
| --------------- | ---- |
| nama_perusahaan | text |

#### `vessels`

| Column     | Type |
| ---------- | ---- |
| nama_kapal | text |

---

### Operational Tables

#### `barang_masuk` (Incoming Goods / DO Masuk)

| Column              | Type        |
| ------------------- | ----------- |
| id                  | uuid        |
| ID                  | text        |
| nomor_do            | text        |
| tanggal             | date        |
| jam                 | time        |
| nama_pembawa_barang | text        |
| nama_pemilik_barang | text        |
| keterangan          | text        |
| sekuriti            | text        |
| pos                 | text        |
| business_unit       | text        |
| created_at          | timestamptz |

Related:

- `detail_do_masuk` (barang_masuk_id, serial_number, nama_barang, jumlah, satuan)
- `foto_do_masuk` (barang_masuk_id, storage_url)

#### `barang_keluar` (Outgoing Goods / DO Keluar)

| Column              | Type        |
| ------------------- | ----------- |
| id                  | uuid        |
| ID                  | text        |
| nomor_do            | text        |
| tanggal             | date        |
| jam                 | time        |
| kurir               | text        |
| nama_pemilik_barang | text        |
| tujuan              | text        |
| keterangan          | text        |
| sekuriti            | text        |
| pos                 | text        |
| business_unit       | text        |
| created_at          | timestamptz |

Related:

- `detail_do_keluar` (barang_keluar_id, serial_number, nama_barang, jumlah, satuan)
- `foto_do_keluar` (barang_keluar_id, storage_url)

#### `orang_masuk` (People Entry)

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| ID            | text        |
| tanggal       | date        |
| jam           | time        |
| id_card       | text        |
| nomor_id_card | text        |
| keterangan    | text        |
| sekuriti      | text        |
| pos           | text        |
| business_unit | text        |
| created_at    | timestamptz |

#### `orang_keluar` (People Exit)

Same structure as `orang_masuk`.

#### `surat_masuk` (Incoming Mail/Documents)

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| ID            | text        |
| tanggal       | date        |
| jam           | time        |
| nama_pengirim | text        |
| nama_penerima | text        |
| jenis_surat   | text        |
| keterangan    | text        |
| sekuriti      | text        |
| pos           | text        |
| business_unit | text        |
| created_at    | timestamptz |

#### `surat_keluar` (Outgoing Mail/Documents)

Same structure as `surat_masuk`.

#### `form_kejadian` (Incident Report)

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| ID            | text        |
| tanggal       | date        |
| jam           | time        |
| kejadian      | text        |
| lokasi        | text        |
| sekuriti      | text        |
| business_unit | text        |
| created_at    | timestamptz |

Related: `foto_kejadian` (form_kejadian_id, storage_url)

#### `laporan_bunker_freshwater` (Fresh Water Bunker Report)

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| ID            | text        |
| tanggal       | date        |
| nama_kapal    | text        |
| tempat_bunker | text        |
| waktu_mulai   | time        |
| waktu_selesai | time        |
| quantity      | numeric     |
| keterangan    | text        |
| sekuriti      | text        |
| business_unit | text        |
| created_at    | timestamptz |

#### `laporan_mobil_tangki_fuel` (Fuel Tanker Truck Report)

| Column        | Type        |
| ------------- | ----------- |
| id            | uuid        |
| ID            | text        |
| tanggal       | date        |
| nama_driver   | text        |
| quantity      | numeric     |
| tujuan        | text        |
| approved_by   | text        |
| surat_jalan   | text        |
| keterangan    | text        |
| sekuriti      | text        |
| business_unit | text        |
| created_at    | timestamptz |

#### `laporan_travo_blower` (Transformer/Blower Report)

| Column              | Type        |
| ------------------- | ----------- |
| id                  | uuid        |
| ID                  | text        |
| tanggal             | date        |
| jam                 | time        |
| sekuriti            | text        |
| jenis               | text        |
| posisi_travo_blower | text        |
| jumlah              | integer     |
| status              | text        |
| keterangan          | text        |
| business_unit       | text        |
| created_at          | timestamptz |

#### `laporan_tambat` (Mooring Report)

| Column                  | Type        |
| ----------------------- | ----------- |
| id                      | uuid        |
| ID                      | text        |
| nama_kapal              | text        |
| nama_perusahaan         | text        |
| tanggal_mulai_tambat    | date        |
| waktu_mulai_tambat      | time        |
| tanggal_selesai_tambat  | date        |
| waktu_selesai_tambat    | time        |
| kegiatan                | text        |
| tanggal_mulai_connect   | date        |
| waktu_mulai_connect     | time        |
| tanggal_selesai_connect | date        |
| waktu_selesai_connect   | time        |
| lokasi                  | text        |
| sekuriti                | text        |
| business_unit           | text        |
| created_at              | timestamptz |

---

## Access Control Logic

Read the logged-in user's `business_unit` from the `profiles` table immediately after login.

```typescript
// After login, fetch:
const { data: profile } = await supabase
  .from("profiles")
  .select("business_unit, full_name")
  .eq("id", user.id)
  .single();

const isMaster = profile.business_unit.toLowerCase() === "master";
```

- If `business_unit === "master"`: user can see **all records from all sites**.
- Otherwise: **filter every query** with `.eq("business_unit", profile.business_unit)`.

Apply this filter consistently across **all** data-fetching functions using a shared helper:

```typescript
function applyBusinessUnitFilter<T>(
  query: PostgrestFilterBuilder<T>,
  businessUnit: string | null, // null means master
) {
  if (!businessUnit) return query;
  return query.eq("business_unit", businessUnit);
}
```

---

## App Structure

```
app/
  (auth)/
    login/page.tsx          # Login page
  (dashboard)/
    layout.tsx              # Sidebar + header shell, protects all routes
    dashboard/page.tsx      # Main unified dashboard
    barang/
      masuk/page.tsx        # DO Masuk list
      keluar/page.tsx       # DO Keluar list
    orang/
      masuk/page.tsx        # People entry list
      keluar/page.tsx       # People exit list
    surat/
      masuk/page.tsx        # Incoming docs list
      keluar/page.tsx       # Outgoing docs list
    kejadian/page.tsx       # Incident report list
    laporan/
      bunker/page.tsx
      fuel/page.tsx
      travo-blower/page.tsx
      tambat/page.tsx
components/
  ui/                       # shadcn/ui components
  DataTable.tsx             # Reusable table with pagination, search, date filter
  BusinessUnitBadge.tsx     # Shows site label
  StatCard.tsx              # Summary number card
  ActivityChart.tsx         # Line/bar chart for trends
lib/
  supabase.ts               # Supabase client (browser + server)
  auth.ts                   # Session helpers
  dataFilters.ts            # Business unit filter helper
hooks/
  useBusinessUnit.ts        # Reads current user's business_unit
  useDataFilter.ts          # Returns filter config (null if master)
```

---

## Dashboard Page (Unified — Recommended Design)

> **Recommendation: One single dashboard page** with grouped summary sections is better than 11 separate summary pages. The HR team needs a quick at-a-glance view; forcing them to navigate to individual summary pages for each category defeats the purpose of a monitoring tool.

The dashboard is divided into three visual sections:

### Section 1 — Overview (Top Summary Cards)

Six stat cards showing totals for the selected date range (default: current month):
| Card | Value |
|------|-------|
| Total Orang Masuk | count from `orang_masuk` |
| Total Orang Keluar | count from `orang_keluar` |
| Total DO Masuk | count from `barang_masuk` |
| Total DO Keluar | count from `barang_keluar` |
| Total Surat | count from `surat_masuk` + `surat_keluar` |
| Total Kejadian | count from `form_kejadian` |

- Master users see an additional breakdown table: totals per `business_unit` for each category.

### Section 2 — Activity Trends

- **Line chart**: daily entry/exit counts for orang_masuk and orang_keluar over the selected period
- **Bar chart**: daily goods movement (barang_masuk vs barang_keluar) over the selected period
- For master: multi-series charts distinguishing by `business_unit` using different colors

### Section 3 — Operations & Reports Summary

Four smaller stat cards:
| Card | Value |
|------|-------|
| Bunker Fresh Water — Total Qty | sum of `quantity` from `laporan_bunker_freshwater` |
| Fuel Tanker — Total Qty | sum of `quantity` from `laporan_mobil_tangki_fuel` |
| Tambat — Active Moorings | count where `tanggal_selesai_tambat` >= today |
| Travo Blower — Records | count from `laporan_travo_blower` |

Below the cards: a small **recent activity feed** — last 10 records across all tables (merged, sorted by `created_at` desc), showing: date, category icon, ID, site (for master), security name.

### Global Dashboard Controls

- **Date range picker**: presets (Today, This Week, This Month, Last Month, Custom)
- **Site selector** (master only): "All Sites", "Shipyard", "Shorebase" dropdown to filter the entire dashboard

---

## Data List Pages (All Tables)

Each list page shares the same pattern via the reusable `DataTable` component:

### Features per list page

1. **Search bar** — full-text search on relevant text columns (e.g. ID, nomor_do, nama)
2. **Date filter** — date range picker (start date / end date)
3. **Site filter** — shown only for master users; dropdown to filter by `business_unit`
4. **Pagination** — 20 rows per page, show total count
5. **Sortable columns** — click column header to sort asc/desc
6. **Row expand / detail modal** — click a row to view full detail including:
   - All fields
   - Related detail items (for barang_masuk/keluar: list of items in the DO)
   - Photos (displayed as thumbnails with lightbox) for tables that have photo relations
7. **Export to CSV** — export current filtered results

### Columns per page

**Barang Masuk (DO Masuk)**
ID | Nomor DO | Tanggal | Jam | Pembawa | Pemilik | Sekuriti | Pos | Site | Jumlah Item

**Barang Keluar (DO Keluar)**
ID | Nomor DO | Tanggal | Jam | Kurir | Pemilik | Tujuan | Sekuriti | Pos | Site

**Orang Masuk**
ID | Tanggal | Jam | Jenis ID Card | Nomor ID Card | Keterangan | Sekuriti | Pos | Site

**Orang Keluar**
ID | Tanggal | Jam | Jenis ID Card | Nomor ID Card | Keterangan | Sekuriti | Pos | Site

**Surat Masuk**
ID | Tanggal | Jam | Pengirim | Penerima | Jenis Surat | Sekuriti | Pos | Site

**Surat Keluar**
ID | Tanggal | Jam | Pengirim | Penerima | Jenis Surat | Sekuriti | Pos | Site

**Form Kejadian**
ID | Tanggal | Jam | Kejadian | Lokasi | Sekuriti | Site | (foto icon)

**Laporan Bunker Fresh Water**
ID | Tanggal | Nama Kapal | Tempat Bunker | Waktu Mulai | Waktu Selesai | Quantity (L) | Sekuriti | Site

**Laporan Mobil Tangki Fuel**
ID | Tanggal | Driver | Quantity (L) | Tujuan | Approved By | Surat Jalan | Sekuriti | Site

**Laporan Travo Blower**
ID | Tanggal | Jam | Jenis | Posisi | Jumlah | Status | Sekuriti | Site

**Laporan Tambat**
ID | Kapal | Perusahaan | Tgl Mulai Tambat | Tgl Selesai Tambat | Kegiatan | Lokasi | Sekuriti | Site

---

## Navigation Sidebar

```
[App Logo] Security Monitor

Navigation:
  📊 Dashboard

  Access Control
    👥 Orang Masuk
    🚶 Orang Keluar
    📦 DO Masuk (Barang)
    📤 DO Keluar (Barang)
    📬 Surat Masuk
    📨 Surat Keluar

  Laporan Kejadian
    ⚠️  Form Kejadian

  Laporan Operasional
    💧 Bunker Fresh Water
    ⛽ Mobil Tangki Fuel
    ⚡ Travo Blower
    ⚓ Tambat

[bottom]
  👤 [User name] — [Site badge]
  🔴 Sign Out
```

The sidebar shows the user's `full_name` and their `business_unit` as a colored badge. Master users see a purple "MASTER" badge; site users see their site name.

---

## Authentication Flow

1. `/login` — Email + password form using `supabase.auth.signInWithPassword()`
2. On successful login, fetch user's `profile` (business_unit, full_name)
3. Store business_unit in context / server session
4. Protect all `/dashboard` routes via Next.js middleware (`middleware.ts`) that checks for a valid Supabase session
5. On sign-out, call `supabase.auth.signOut()` and redirect to `/login`

```typescript
// middleware.ts — protect all routes under (dashboard)
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return res;
}
```

---

## Key Implementation Notes

### Business Unit Filter Helper

```typescript
// lib/dataFilters.ts
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export function applyBusinessUnitFilter(
  query: PostgrestFilterBuilder<any, any, any>,
  businessUnit: string | null, // null = master, sees everything
) {
  if (businessUnit === null) return query;
  return query.eq("business_unit", businessUnit);
}
```

### Dashboard Counts (example)

```typescript
async function getDashboardCounts(businessUnit: string | null) {
  const queries = [
    "orang_masuk",
    "orang_keluar",
    "barang_masuk",
    "barang_keluar",
    "surat_masuk",
    "surat_keluar",
    "form_kejadian",
  ].map(async (table) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    q = applyBusinessUnitFilter(q, businessUnit);
    // optionally add date range filter
    const { count } = await q;
    return { table, count: count ?? 0 };
  });
  return Promise.all(queries);
}
```

### Master User: Per-Site Breakdown

For master users, show a comparison table on the dashboard:

| Category    | Shipyard | Shorebase | Total |
| ----------- | -------- | --------- | ----- |
| Orang Masuk | 45       | 30        | 75    |
| DO Masuk    | 12       | 8         | 20    |
| ...         | ...      | ...       | ...   |

Fetch this by querying each table grouped by `business_unit` using:

```typescript
const { data } = await supabase
  .from("orang_masuk")
  .select("business_unit, count:id.count()")
  .group("business_unit");
```

(If `.group()` is not available in the JS client, fetch all distinct business_unit values first, then run filtered count queries in parallel.)

### Photo Display

For `barang_masuk`, `barang_keluar`, and `form_kejadian` that have photo relations, fetch photo URLs from the related table (e.g. `foto_do_masuk`) and display thumbnails in the row detail modal. Use Supabase Storage public URLs directly as `<img>` `src`.

### Date Filter

All list pages and the dashboard should support date range filtering. Supabase queries:

```typescript
query.gte("tanggal", startDate).lte("tanggal", endDate);
```

For `laporan_tambat`, filter on `tanggal_mulai_tambat`.

### Pagination

Use Supabase range-based pagination:

```typescript
const from = (page - 1) * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;
query.range(from, to);
```

Get total count with `{ count: "exact" }` in the select options.

---

## UI/UX Guidelines

- Language: **Indonesian** (match the mobile app's field labels and terminology)
- Color scheme: professional blue/slate (suitable for security/HR context)
- Responsive: works on desktop and tablet (HR office use)
- Loading skeletons while data fetches
- Empty state illustrations when no data matches filters
- Toast notifications for errors
- `business_unit` display: capitalize and show as a badge (`Shipyard`, `Shorebase`, `MASTER`)

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<same as mobile app EXPO_PUBLIC_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as mobile app EXPO_PUBLIC_SUPABASE_ANON_KEY>
```

---

## Out of Scope (Read-Only)

- No create/edit/delete operations on any security data
- No push notifications
- No real-time subscriptions (polling or manual refresh is acceptable)
- No export to PDF (CSV only)
