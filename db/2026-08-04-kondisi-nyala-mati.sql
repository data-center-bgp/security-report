-- Migrasi: ubah nilai kondisi travo_blower_checks dari 'ok'/'tidak'
-- menjadi 'nyala'/'mati'. Jalankan di Supabase SQL Editor (service_role).
--
-- Urutan penting: lepas constraint lama -> normalisasi data -> pasang
-- constraint baru. (Constraint lama hanya mengizinkan 'ok'/'tidak',
-- sehingga data tak bisa diupdate sebelum constraint dilepas.)

begin;

-- 1. Lepas CHECK constraint lama
alter table public.travo_blower_checks
  drop constraint if exists travo_blower_checks_kondisi_check;

-- 2. Normalisasi semua nilai lama ke 'nyala'/'mati'
--    (mencakup 'ok'/'tidak' dan sisa data uji 'Baik'/'Rusak'/'Nyala'/'Mati')
update public.travo_blower_checks
  set kondisi = 'nyala'
  where lower(kondisi) in ('ok', 'baik', 'nyala');

update public.travo_blower_checks
  set kondisi = 'mati'
  where lower(kondisi) in ('tidak', 'rusak', 'mati');

-- 3. Pasang CHECK constraint baru
alter table public.travo_blower_checks
  add constraint travo_blower_checks_kondisi_check
  check (kondisi in ('nyala', 'mati'));

commit;

-- Verifikasi (opsional):
-- select kondisi, count(*) from public.travo_blower_checks group by kondisi;
