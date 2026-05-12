# E-Raport PKBM — Boilerplate

> Boilerplate production-ready untuk sistem E-Raport PKBM berbasis Next.js 15 + Supabase.
> Battle-tested. Auth, RLS, middleware, seed — semua sudah dikerjakan.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Auth & Database | Supabase (Auth + PostgreSQL + RLS) |
| State Management | Zustand |
| Form | React Hook Form + Zod |
| Package Manager | pnpm |

---

## Struktur Direktori

```
src/
├── app/
│   ├── (auth)/           # Login page
│   ├── (dashboard)/      # Halaman utama (layout + dashboard, overview, profile, settings, admin)
│   ├── api/auth/         # Supabase auth callback
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Redirect ke /dashboard
├── components/
│   ├── features/auth/    # LoginForm, LogoutButton
│   ├── layout/           # AppSidebar, MobileBottomNav, UserMenu, Header, NavConfig
│   ├── providers/        # AuthProvider
│   ├── shared/           # LoadingSpinner, FullPageLoader, ConfirmDialog, OfflineDetector
│   └── ui/               # shadcn/ui components
├── constants/            # ROUTES
├── hooks/                # useAuth
├── lib/
│   ├── supabase/         # client.ts, server.ts, proxy.ts
│   ├── utils.ts
│   └── validators.ts
├── proxy.ts              # Middleware auth guard
├── stores/               # Zustand auth store
└── types/                # Database types, UserProfile
```

---

## Fitur Boilerplate

- Auth guard middleware — redirect otomatis ke `/login` jika belum login
- Zustand auth store dengan race condition fix dan single fetch promise
- RLS PostgreSQL — user hanya bisa akses data sendiri, admin akses semua
- Role-based access — `super_admin` dan `user`
- Auto-create profile saat user signup via trigger
- Mobile-first layout — sidebar desktop + bottom nav mobile
- Offline detector
- PWA-ready (manifest, icons, apple web app)
- Dark mode ready (CSS variables)

---

## Setup — Dari Nol Sampai Jalan

### 1. Clone & Install

```bash
git clone <repo-url>
cd e-raport
pnpm install
```

### 2. Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

Cara dapat key:
- Buka [supabase.com](https://supabase.com) → pilih project
- **Project Settings → API**
- Copy `URL`, `anon public`, dan `service_role` (jaga kerahasiaan `service_role`!)

### 3. Setup Database — Jalankan SQL

Buka **Supabase Dashboard → SQL Editor**, paste isi file `supabase/setup.sql`, lalu klik **Run**.

Yang dilakukan script ini:
- Nuclear drop semua table & function lama (aman untuk fresh setup)
- Buat table `user_profiles`
- Setup RLS policies anti-rekursi dengan helper function `get_my_role()`
- Buat trigger `updated_at` otomatis
- Buat trigger auto-create profile saat user signup

> ⚠️ Jangan jalankan ulang di production yang sudah ada data — script ini DROP semua!

### 4. Seed Users — Jalankan Node

Edit daftar user di `scripts/seed.js` sesuai kebutuhan:

```js
const userList = [
  {
    full_name: 'Administrator',
    email: 'admin@pkbm.com',
    password: 'Admin@2026',
    role: 'super_admin',
  },
  {
    full_name: 'Nama User',
    email: 'user@pkbm.com',
    password: 'User@2026',
    role: 'user',
  },
];
```

Lalu jalankan:

```bash
node scripts/seed.js
```

Script ini idempotent — kalau user sudah ada, dia skip. Aman dijalankan berkali-kali.

### 5. Jalankan Dev Server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan redirect ke `/login`.

---

## Role System

| Role | Akses |
|---|---|
| `user` | Dashboard, Overview, Profile, Settings |
| `super_admin` | Semua halaman user + Admin Panel |

Role di-set di database (`user_profiles.role`). Untuk ubah role user:

```sql
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE id = '<user-uuid>';
```

---

## Menambah User Baru

Tambahkan entry di `scripts/seed.js` → jalankan `node scripts/seed.js`.

Script otomatis:
- Cek apakah user sudah ada di auth
- Kalau sudah ada → skip atau update role
- Kalau belum → buat auth user + profile

---

## Catatan Penting

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di `scripts/seed.js` (server-side). Jangan pernah expose ke client/browser.
- RLS aktif di semua table — query dari client selalu melewati policy.
- `get_my_role()` adalah SECURITY DEFINER function — sengaja bypass RLS untuk mencegah infinite recursion di policy.
- Middleware auth guard ada di `src/proxy.ts` — semua route kecuali `/login` dan `/api/auth/callback` dilindungi.

---

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
node scripts/seed.js   # Seed users ke Supabase
```

---

## Battle Tested

- RLS infinite recursion → solved via `SECURITY DEFINER` helper function
- Auth race condition → solved via single fetch promise di Zustand store
- Middleware module not found → `lib/supabase/proxy.ts` tersedia
- Trigger insert conflict → `ON CONFLICT DO NOTHING` di `handle_new_user`
- ESM vs CJS seed script → gunakan `node scripts/seed.js` langsung (auto-detect ESM)

---

Dibuat untuk **PKBM Yayasan Al Barakah**.
Silakan fork dan sesuaikan untuk kebutuhan institusi lain.