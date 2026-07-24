-- Öğretmen başvuruları tablosu
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
  status text not null default 'new' check (status in ('new','contacted','converted','archived')),
  notes text
);

create index if not exists teacher_applications_created_at_idx
  on public.teacher_applications (created_at desc);

create index if not exists teacher_applications_status_idx
  on public.teacher_applications (status);

-- Yönetici ayarları (şifre hash vb.)
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- RLS: Sadece service role anahtarı yazıp okuyabilsin. Anon erişimi yok.
alter table public.teacher_applications enable row level security;
alter table public.admin_settings enable row level security;
-- Politika eklenmediği için RLS'te anon/authenticated kullanıcılar bloklanır.
-- Service role anahtarı RLS'i bypass eder (API tarafı bu anahtarı kullanıyor).
