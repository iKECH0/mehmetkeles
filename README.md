# Merkür Eğitim Akademisi — Mehmet Keleş

Astro + Tailwind + React + Supabase ile geliştirilmiş, WhatsApp yönlendirmeli, başvuru formu ve yönetim panelli modern eğitim/danışmanlık tanıtım sitesi.

## Özellikler
- Modern, hızlı ve tamamen Türkçe arayüz
- Sağ alt yüzen WhatsApp butonu (`wa.me`)
- Supabase'e kaydedilen başvuru formu (Ad Soyad, Telefon, E-posta, Seviye, Ders, Mesaj, KVKK)
- Tek şifre korumalı `/admin` paneli
  - Filtreleme, arama, durum güncelleme, not ekleme, CSV dışa aktarma
- SEO meta etiketleri ve `EducationalOrganization` JSON-LD
- Honeypot + temel rate-limit ile spam koruması

## Kurulum

### 1. Bağımlılıkları kur
```bash
npm install
```

### 2. Supabase kurulumu
Supabase'de yeni bir proje oluşturun ve aşağıdaki SQL'i `SQL Editor`'de çalıştırın:

```sql
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  phone text not null,
  email text not null,
  level text not null,
  subject text not null,
  message text,
  status text default 'new',
  notes text
);

create index if not exists idx_applications_created_at
  on public.applications (created_at desc);

alter table public.applications enable row level security;
-- Politika eklenmiyor: yalnızca service_role (sunucu) erişebilir.
```

### 3. Ortam değişkenleri
`.env.example` dosyasını `.env` olarak kopyalayın ve doldurun:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
SUPABASE_ANON_KEY=eyJ...anon...
ADMIN_PASSWORD=güçlü-bir-parola
PUBLIC_WHATSAPP_NUMBER=905411055543
PUBLIC_SITE_URL=http://localhost:4321
```

> **Önemli:** `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafında kullanılır, asla istemciye gönderilmez.

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```
Site: `http://localhost:4321`
Yönetim: `http://localhost:4321/admin/login`

### 5. Üretim derlemesi
```bash
npm run build
npm run preview
```

## Proje Yapısı
```
src/
├─ components/         # Astro + React bileşenleri
├─ layouts/            # BaseLayout
├─ lib/                # supabase, session, rateLimit, sabitler
├─ pages/
│  ├─ index.astro      # Ana sayfa
│  ├─ admin/           # Login + panel
│  └─ api/             # Form ve admin API uçları
├─ middleware.ts       # /admin korumalı yollar
└─ styles/global.css
```

## Güvenlik Notları
- Yönetici girişi tek şifre + HMAC imzalı httpOnly cookie ile korunur (7 gün geçerli).
- Form gönderiminde IP başına 1 dakikada 3 istek limiti uygulanır.
- Honeypot alanı bot gönderimlerini sessizce filtreler.
- Production'da güçlü ve uzun bir `ADMIN_PASSWORD` kullanın (oturum imza anahtarı buradan türetilir).

## Deploy
Astro Node adapter ile çalışır. Aşağıdaki platformlarda deploy edilebilir:
- **Netlify** / **Vercel** (Node runtime)
- **Render** / **Railway** / **Fly.io**
- Kendi VPS'iniz: `node ./dist/server/entry.mjs`

Tüm `.env` değişkenlerini deploy ortamında tanımlamayı unutmayın.

## İletişim
- {Mehmet Keleş} — Matematik Öğretmeni & Eğitim Danışmanı
- Tel: 0541 105 55 43
- Konya / Türkiye
