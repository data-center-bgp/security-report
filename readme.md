# Security Monitor Dashboard

Platform terpadu untuk pemantauan keamanan, kontrol akses, dan laporan operasional secara real-time.

Built for the HR division to monitor security personnel activity across multiple operational sites. This web app works alongside a React Native mobile app used by security guards to submit data — both share the same Supabase backend.

---

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Framework | Next.js 15 (App Router)      |
| Language  | TypeScript                   |
| Styling   | Tailwind CSS + shadcn/ui     |
| Backend   | Supabase (PostgreSQL + Auth) |
| Charts    | Recharts                     |
| Export    | XLSX (Excel) + CSV           |

---

## Features

- **Role-based access control** — Master users see all sites; site users see only their own data
- **Access control monitoring** — People entry/exit, incoming/outgoing goods, mail/documents
- **Incident reports** — View security incidents with photo attachments
- **Operational reports** — Bunker, fuel, travo-blower, and tambat reports
- **Dashboard analytics** — Trend charts by day/week/month with per-site breakdown
- **Data export** — Export any table to CSV or Excel
- **Date range filtering** — Filter all data by custom date ranges

---

## Pages & Routes

```
/                          → Redirects to /dashboard
/login                     → Email/password login

/dashboard                 → Stats overview + activity charts

# Kontrol Akses
/orang/masuk               → People entry records
/orang/keluar              → People exit records
/barang/masuk              → Incoming goods (DO Masuk)
/barang/keluar             → Outgoing goods (DO Keluar)
/surat/masuk               → Incoming mail/documents
/surat/keluar              → Outgoing mail/documents

# Laporan
/kejadian                  → Incident reports
/laporan/bunker            → Fresh water bunker reports
/laporan/fuel              → Mobile fuel tanker reports
/laporan/travo-blower      → Travo blower reports
/laporan/tambat            → Anchoring (tambat) reports
```

All dashboard routes are protected — unauthenticated users are redirected to `/login`.

---

## Business Units / Sites

Three operational sites with a master admin role:

| Value       | Label     | Access                    |
| ----------- | --------- | ------------------------- |
| `master`    | Master    | All data across all sites |
| `shipyard`  | Shipyard  | Shipyard data only        |
| `shorebase` | Shorebase | Shorebase data only       |
| `tst`       | TST       | TST data only             |

Each user has a `business_unit` in their profile. Master users can additionally filter by site in the UI.

---

## Project Structure

```
app/
  (auth)/login/            → Login page
  (dashboard)/             → Protected dashboard pages
    dashboard/             → Main overview
    orang/, barang/, surat/ → Access control pages
    kejadian/              → Incident reports
    laporan/               → Operational reports

components/
  AuthProvider.tsx         → Auth context (user, profile, isMaster)
  Sidebar.tsx              → Navigation with collapsible state
  DataTable.tsx            → Reusable table with pagination, search, export
  DetailModal.tsx          → Record detail dialog
  TableFilters.tsx         → Date range + site filter
  ActivityChart.tsx        → Recharts line/bar chart wrapper
  StatCard.tsx             → Dashboard metric cards
  BusinessUnitBadge.tsx    → Colored site badge
  ui/                      → shadcn/ui base components

hooks/
  useTableData.ts          → Fetch paginated/filtered data from Supabase
  useBusinessUnit.ts       → Resolve user role and filter
  useDataFilter.ts         → Filter state management

lib/
  supabase.ts              → Browser Supabase client
  supabase-server.ts       → Server Supabase client (SSR)
  auth.ts                  → Profile fetching + role helpers
  sites.ts                 → Site definitions and badge styles
  dataFilters.ts           → Apply business_unit filter to queries
  utils.ts                 → cn(), formatDate(), formatTime(), formatNumber()

middleware.ts              → Route protection (session check)
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/security-report.git
cd security-report
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> These credentials must match the same Supabase project used by the mobile app.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Schema (Supabase)

### User Profiles

```sql
profiles (
  id           uuid  -- FK to auth.users
  full_name    text
  business_unit text  -- "master" | "shipyard" | "shorebase" | "tst"
)
```

### Access Control Tables

All tables include a `business_unit` column for data isolation.

```
orang_masuk / orang_keluar     → Person entry/exit
barang_masuk / barang_keluar   → Goods with detail and photo child tables
surat_masuk / surat_keluar     → Mail/documents
```

### Operational Report Tables

```
form_kejadian        → Incident reports (with foto_kejadian photos)
laporan_bunker       → Fresh water bunker
laporan_fuel         → Mobile fuel tanker
laporan_travo_blower → Travo blower equipment
laporan_tambat       → Anchoring operations
```

---

## Deployment (VPS)

See the full deployment guide below for Nginx + PM2 + SSL setup.

### 1. Build and start

```bash
npm install
npm run build
pm2 start npm --name "security-report" -- start
pm2 save && pm2 startup
```

### 2. Nginx reverse proxy (`/etc/nginx/sites-available/security-report`)

```nginx
server {
    listen 80;
    server_name security.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL

```bash
sudo certbot --nginx -d security.yourdomain.com
```

### 4. Supabase Auth URL settings

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://security.yourdomain.com`
- **Redirect URLs**: `https://security.yourdomain.com/**`

---

## Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |
