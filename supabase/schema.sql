-- =====================================================================
-- Merkür Eğitim Akademisi — Supabase Şema Yedeği
-- Tarih: 2026-05-19
-- Yeni bir Supabase projesinde sıfırdan kurmak için bu dosyayı
-- SQL Editor üzerinden çalıştırmanız yeterlidir.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Öğrenci / Veli başvuruları
-- ---------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  email text not null,
  level text not null,
  subject text not null,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','converted','archived')),
  notes text
);

create index if not exists idx_applications_created_at
  on public.applications (created_at desc);

create index if not exists idx_applications_status
  on public.applications (status);

alter table public.applications enable row level security;

-- ---------------------------------------------------------------------
-- 2) Öğretmen / Eğitmen başvuruları
-- ---------------------------------------------------------------------
create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  email text not null,
  branch text not null,
  education text not null,
  experience_years int not null default 0,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','converted','archived')),
  notes text
);

create index if not exists idx_teacher_applications_created_at
  on public.teacher_applications (created_at desc);

create index if not exists idx_teacher_applications_status
  on public.teacher_applications (status);

alter table public.teacher_applications enable row level security;

-- ---------------------------------------------------------------------
-- 3) Yönetici ayarları (şifre hash vb. anahtar-değer)
-- ---------------------------------------------------------------------
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

-- =====================================================================
-- RLS notu: Hiçbir tabloya anon/authenticated için politika eklenmiyor.
-- Service role anahtarı RLS'i bypass eder; tüm API tarafı bu anahtarı
-- kullanır. Anon istemciler tablolara erişemez.
-- =====================================================================
