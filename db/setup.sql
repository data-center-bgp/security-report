-- =====================================================================
-- SETUP DATABASE — Fitur Master Data & Monitoring Travo/Blower
-- Project Supabase aplikasi ini (ref: hhdpbovftaijozzzattt)
-- Jalankan seluruh file ini di Supabase SQL Editor. Aman dijalankan ulang.
--
-- Isi:
--   0. Fungsi bantu set_updated_at()
--   1. master_travo_blower   — master data travo/blower (per site)
--   2. travo_blower_checks   — checklist harian (diisi security via mobile)
--   3. pic_security          — izin TULIS untuk halaman "Nama Security"
--   4. laporan_tambat        — tambah kolom evidence (foto)
--
-- Catatan: master data NAMA SECURITY memakai tabel `pic_security` yang SUDAH
-- ADA (berisi data). Tabelnya TIDAK dibuat ulang di sini; bagian 3 hanya
-- menambah kebijakan tulis agar bisa dikelola dari web (kolom yang dipakai:
-- nama, business_unit, lokasi).
--
-- Model akses (dipakai semua tabel di file ini):
--   * MASTER                     -> lihat & edit SEMUA data
--   * TST / SHIPYARD / SHOREBASE -> lihat & edit HANYA data site sendiri
--   * business_unit lain         -> tidak punya akses
-- =====================================================================


-- =====================================================================
-- 0. Fungsi bantu: auto-update kolom updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =====================================================================
-- 1. master_travo_blower
--    Cakupan per business unit. nomor_unit diisi manual (1 pemilik bisa
--    punya banyak unit).
-- =====================================================================
create table if not exists public.master_travo_blower (
  id             uuid primary key default gen_random_uuid(),
  business_unit  text not null check (lower(business_unit) in ('tst', 'shipyard', 'shorebase')),
  jenis          text not null check (jenis in ('travo', 'blower')),
  pemilik        text not null,
  nomor_unit     text not null,
  aktif          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_unit, pemilik, jenis, nomor_unit)
);

drop trigger if exists trg_master_travo_blower_updated_at on public.master_travo_blower;
create trigger trg_master_travo_blower_updated_at
  before update on public.master_travo_blower
  for each row execute function public.set_updated_at();

alter table public.master_travo_blower enable row level security;

drop policy if exists master_travo_blower_access on public.master_travo_blower;
create policy master_travo_blower_access
  on public.master_travo_blower
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(master_travo_blower.business_unit)
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(master_travo_blower.business_unit)
        )
    )
  );


-- =====================================================================
-- 2. travo_blower_checks
--    Checklist harian. Diisi SECURITY lewat aplikasi MOBILE (web hanya
--    menampilkan monitoring). 1 cek per unit per hari; cek ulang di hari
--    sama = UPSERT. Akses mengikuti unit induk di master_travo_blower.
--    (Dibuat setelah master_travo_blower karena ada foreign key.)
-- =====================================================================
create table if not exists public.travo_blower_checks (
  id                     uuid primary key default gen_random_uuid(),
  master_travo_blower_id uuid not null
    references public.master_travo_blower (id) on delete cascade,
  tanggal                date not null default current_date,
  jam                    time,                       -- diisi otomatis oleh mobile
  kondisi                text not null check (kondisi in ('nyala', 'mati')),
  sekuriti               text not null,              -- petugas (dropdown dari pic_security)
  keterangan             text,                       -- opsional
  foto                   text,                       -- opsional (URL foto kondisi)
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (master_travo_blower_id, tanggal)           -- 1 cek per unit per hari
);

create index if not exists idx_travo_blower_checks_tanggal
  on public.travo_blower_checks (tanggal);

drop trigger if exists trg_travo_blower_checks_updated_at on public.travo_blower_checks;
create trigger trg_travo_blower_checks_updated_at
  before update on public.travo_blower_checks
  for each row execute function public.set_updated_at();

alter table public.travo_blower_checks enable row level security;

drop policy if exists travo_blower_checks_access on public.travo_blower_checks;
create policy travo_blower_checks_access
  on public.travo_blower_checks
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.master_travo_blower m
      join public.profiles p on p.id = auth.uid()
      where m.id = travo_blower_checks.master_travo_blower_id
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(m.business_unit)
        )
    )
  )
  with check (
    exists (
      select 1
      from public.master_travo_blower m
      join public.profiles p on p.id = auth.uid()
      where m.id = travo_blower_checks.master_travo_blower_id
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(m.business_unit)
        )
    )
  );


-- =====================================================================
-- 3. pic_security — IZIN TULIS untuk halaman "Nama Security"
--    Tabel pic_security SUDAH ADA & sudah punya kebijakan BACA (select).
--    Blok ini HANYA menambah izin insert/update/delete untuk user login,
--    tidak mengubah kebijakan baca dan tidak enable/disable RLS.
--      * MASTER                     -> tambah/edit/hapus SEMUA
--      * TST / SHIPYARD / SHOREBASE -> hanya security site sendiri
--    Jalankan blok ini bila ingin mengelola nama security dari web.
-- =====================================================================
drop policy if exists pic_security_insert on public.pic_security;
create policy pic_security_insert
  on public.pic_security
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(pic_security.business_unit)
        )
    )
  );

drop policy if exists pic_security_update on public.pic_security;
create policy pic_security_update
  on public.pic_security
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(pic_security.business_unit)
        )
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(pic_security.business_unit)
        )
    )
  );

drop policy if exists pic_security_delete on public.pic_security;
create policy pic_security_delete
  on public.pic_security
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.business_unit) in ('master', 'tst', 'shipyard', 'shorebase')
        and (
          lower(p.business_unit) = 'master'
          or lower(p.business_unit) = lower(pic_security.business_unit)
        )
    )
  );


-- =====================================================================
-- 4. laporan_tambat — kolom evidence (foto)
--    Menyimpan URL foto bukti kegiatan tambat. Diisi oleh security via
--    aplikasi mobile; halaman web hanya menampilkan. Kolom nullable agar
--    data lama yang belum berfoto tetap valid.
-- =====================================================================
alter table public.laporan_tambat
  add column if not exists evidence text;


-- =====================================================================
-- Referensi untuk aplikasi mobile (tidak wajib dijalankan):
--   Submit cek harian = UPSERT agar cek ulang di hari sama menimpa:
--
--   insert into public.travo_blower_checks
--     (master_travo_blower_id, tanggal, jam, kondisi, sekuriti, keterangan, foto)
--   values
--     ('<uuid-unit>', current_date, '08:30', 'nyala', 'Budi', null, null)
--   on conflict (master_travo_blower_id, tanggal)
--   do update set
--     jam        = excluded.jam,
--     kondisi    = excluded.kondisi,
--     sekuriti   = excluded.sekuriti,
--     keterangan = excluded.keterangan,
--     foto       = excluded.foto;
-- =====================================================================
