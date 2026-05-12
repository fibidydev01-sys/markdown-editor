# 🚀 Supabase Nuclear Setup Guide

## ⚠️ Yang Lo Share Sebelumnya = INCOMPLETE

File `BOILERPLATE_SAAS_V2.sql` lo cuma cover **5 tabel boilerplate**:
- ✅ user_profiles
- ✅ user_preferences
- ✅ user_trials
- ✅ subscriptions
- ✅ webhook_events

**MISSING (critical untuk VibesDoc):**
- ❌ `workspaces` table (untuk @username)
- ❌ `notebook_publishes` table (untuk publish feature)
- ❌ `published_notebooks_with_workspace` view (untuk public docs SSR)
- ❌ `is_username_available()` RPC function
- ❌ `generate_unique_username()` helper
- ❌ Workspace auto-create di trigger signup
- ❌ RLS policies untuk workspaces & notebook_publishes
- ❌ Public read grants

Kalo lo run yang lama, **publish/unpublish/public docs hancur total**.

---

## ✅ Pakai File Baru: `SUPABASE-NUCLEAR-COMPLETE.sql`

File ini cover **SEMUA** + plus hardening:

### Tables (7)
| # | Table | Purpose |
|---|-------|---------|
| 1 | user_profiles | Account, role, soft-delete |
| 2 | user_preferences | Onboarding flag |
| 3 | user_trials | 48h trial |
| 4 | subscriptions | Lemon Squeezy data |
| 5 | webhook_events | LS event log |
| 6 | **workspaces** ⭐ | @username container |
| 7 | **notebook_publishes** ⭐ | Published snapshots |

### Views (1)
- `published_notebooks_with_workspace` — joined view, dipake SSR public docs

### Functions (5)
- `get_my_role()` — admin check (existing)
- `handle_updated_at()` — auto updated_at (existing)
- `handle_new_user()` — **UPDATED**: now creates workspace too
- `is_username_available()` ⭐ — format + reserved + uniqueness check
- `generate_unique_username()` ⭐ — fallback untuk OAuth signup

### Hardening yang BARU (fix bugs)

| Hardening | Fixes |
|-----------|-------|
| `UNIQUE(workspace_id, notebook_slug)` | Race condition duplicate slug |
| `UNIQUE(workspace_id, notebook_local_id)` | Proper upsert behavior |
| `ON DELETE CASCADE` di FK | Delete workspace → publishes ikut hilang |
| Reserved username list extended | "undefined", "null", "test", dll |
| Backfill section di akhir | Existing users dapat workspace otomatis |

---

## 🎯 Steps to Run

### 1. Backup dulu (kalo lo masih sayang data lama)
Supabase Dashboard → Settings → Database → "Backups" → Download

### 2. Run nuclear SQL
1. Buka Supabase Dashboard
2. SQL Editor → New query
3. Paste **ALL** isi `SUPABASE-NUCLEAR-COMPLETE.sql`
4. Click "Run"
5. Tunggu ~5 detik
6. Cek "Success. No rows returned" di bawah

### 3. Verify
Run query test ini di SQL editor:

```sql
-- Test 1: Semua tabel terbuat
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: 7 rows
-- notebook_publishes, subscriptions, user_preferences,
-- user_profiles, user_trials, webhook_events, workspaces

-- Test 2: View terbuat
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';
-- Expected: published_notebooks_with_workspace

-- Test 3: Functions ada
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: generate_unique_username, get_my_role, handle_new_user,
--           handle_updated_at, is_username_available

-- Test 4: Function is_username_available works
SELECT public.is_username_available('test-user-xyz', NULL);
-- Expected: false (reserved 'test' prefix? actually not — should return TRUE
--           unless someone else took it)

-- Test 5: Trigger ada
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'auth'
   OR event_object_schema = 'public'
ORDER BY trigger_name;
-- Expected: trg_on_auth_user_created + 6 updated_at triggers
```

### 4. Test signup flow (END-TO-END)
1. Buka app lo
2. Register user baru: `test@example.com`
3. Cek di Supabase Table Editor:
   - `auth.users` → 1 row (user baru) ✅
   - `public.user_profiles` → 1 row (auto-created by trigger) ✅
   - `public.workspaces` → 1 row (auto-created by trigger) ✅
     - `username` = `test` (atau `test-1` kalo collision)
     - `display_name` = `test@example.com`
4. Buka `/settings/workspace` → username editor muncul, bisa diubah
5. Buka `/@test` → workspace landing page muncul (empty state)
6. Buat notebook, publish dengan slug `hello`
7. Buka `/@test/hello` → notebook content muncul ✅
8. Unpublish → `/@test/hello` → 404 ✅
9. Publish lagi dengan slug `hello` → SUCCESS (gak conflict lagi karena UNIQUE constraint memang block duplicate, tapi setelah unpublish row beneran hilang) ✅

---

## 🆕 Yang Beda dari Schema Lama Lo

### Schema Lama (broken)
```sql
CREATE TABLE public.notebook_publishes (
  notebook_slug VARCHAR(100) NOT NULL,
  -- ❌ NO UNIQUE(workspace_id, notebook_slug)
  -- ❌ NO UNIQUE(workspace_id, notebook_local_id)
);
```

### Schema Baru (hardened)
```sql
CREATE TABLE public.notebook_publishes (
  notebook_slug VARCHAR(100) NOT NULL CHECK(...),
  CONSTRAINT notebook_publishes_workspace_local_unique
    UNIQUE (workspace_id, notebook_local_id),
  CONSTRAINT notebook_publishes_workspace_slug_unique
    UNIQUE (workspace_id, notebook_slug)
);
```

**Impact:** 
- Race condition duplicate slug → DB reject (was: app-level check could miss)
- Upsert by `(workspace_id, notebook_local_id)` benar-benar atomic

---

## 🎁 Bonus Features

### Auto-username generator
Pas user signup, trigger otomatis bikin workspace dengan username dari email:

| Email | Generated Username |
|-------|-------------------|
| `john.doe@gmail.com` | `john-doe` |
| `mary@example.com` | `mary` |
| Collision (mary taken) | `mary-1`, `mary-2`, ... |
| Short email `a@b.co` | `user-<6-char-hash>` |

User bisa rename later di `/settings/workspace`.

### Backfill section (idempotent)
SQL di section 23-24 cek user lama yang belum punya workspace/profile, dan auto-create. Aman dijalankan berkali-kali (`ON CONFLICT DO NOTHING`).

### Reserved usernames expanded
Selain yang lo punya, tambahan: `logout`, `auth`, `public`, `private`, `static`, `assets`, `images`, `css`, `js`, `fonts`, `media`, `undefined`, `null`, `test`, `demo`, `example`.

---

## ⚠️ IMPORTANT Notes

### 1. Nuclear = data hilang
File ini punya `DROP TABLE ... CASCADE` di awal. Semua data **HILANG**. Pastikan udah backup atau memang mau fresh start.

### 2. Existing auth.users tetap ada
`auth.users` adalah tabel Supabase auth, **tidak** di-drop. User existing tetap bisa login. Trigger di akhir bakal auto-create workspace + profile mereka.

### 3. Indexes complete
Sudah include semua index yang lo perlu untuk performance:
- workspace lookup by username (public docs)
- notebook lookup by slug (public docs)
- subscriptions by status (admin queries)
- webhook events by date (audit)

### 4. RLS lebih ketat
Sekarang `workspaces` dan `notebook_publishes` punya RLS aktif:
- **Anon bisa READ** (untuk public docs)
- **Owner only WRITE** (RLS check via subquery)
- Service role bypass (untuk admin/webhook)

---

## 🐛 Troubleshooting

### "permission denied for table workspaces"
Lo lupa run section 22 (GRANTS). Re-run SQL file dari awal.

### "duplicate key value violates unique constraint"
Justru ini yang lo MAU sekarang. Berarti hardening jalan. Kalo dapat ini error pas publish, berarti slug-nya udah dipake oleh notebook lain di workspace yang sama.

### "function is_username_available does not exist"
Schema cache Supabase belum refresh. Tunggu 30 detik atau restart Supabase project.

### Trigger gak jalan saat signup
Cek di Supabase Dashboard → Database → Triggers:
- `trg_on_auth_user_created` harus muncul di `auth.users`
- Kalo gak ada, re-run section 14 dari SQL file

### "column workspace_user_id does not exist" di view
View `published_notebooks_with_workspace` butuh column `workspace_user_id` (used by `getViewerInfo`). File baru ini udah include. Kalo error, drop view + recreate dari section 9.

---

## ✅ Setelah Nuclear

Re-test full flow:

```bash
# 1. Clean cache
rm -rf .next

# 2. Verify build still OK
pnpm typecheck && pnpm build

# 3. Run dev
pnpm dev

# 4. Manual test:
#    - Register new user → workspace auto-created? ✅
#    - Settings/workspace → username editor works? ✅
#    - Create notebook → publish → /@user/slug accessible? ✅
#    - Unpublish → /@user/slug returns 404? ✅
#    - Delete notebook (cascade) → row gone from Supabase? ✅
#    - Re-publish dengan slug yang udah dihapus → SUCCESS? ✅
```

Kalo semua hijau → lo udah survive **trinity of fixes** + clean database. 🎉