# VibesDoc Phase H — Auth Foundation & Workspaces

**Status:** ✅ Ready for install (14 new files + 3 replaces + 1 SQL migration)

This phase builds the **auth foundation** for the public docs platform:
every authenticated user gets a workspace with a unique username. The
workspace is the container for the user's publishable notebooks (Phase I)
and the namespace for their public docs URL (Phase J).

After Phase H, the user can:
- Sign up and automatically get a workspace with auto-generated username
- View their workspace at `/settings/workspace`
- Edit their username (with live availability check + 30-day cooldown)
- Edit their display name
- Copy their public URL (preview only — actual public page comes in Phase J)
- See the next-change date if they're within the cooldown window

---

## What's Included

### Types (1 file)
- `src/types/workspace.ts` — Workspace types, validation result, limits,
  reserved username set

### Lib (3 files)
- `src/lib/workspace/client.ts` — Supabase CRUD (get/update workspace)
- `src/lib/workspace/username-validator.ts` — Format check, availability
  RPC + fallback, cooldown helpers
- `src/lib/workspace/index.ts` — Barrel export

### Hooks (1 file)
- `src/hooks/use-workspace.ts` — Selector hook reading from auth-store,
  exposes mutations through workspace-store, derives `publicUrl` +
  `canChangeUsername` + `nextUsernameChangeDate`

### Stores (2 files — 1 new + 1 REPLACE)
- `src/stores/workspace-store.ts` — **NEW** — mutation layer that syncs
  back to auth-store cache
- `src/stores/auth-store.ts` — **REPLACE** — now fetches workspace in
  parallel with user profile (1 round-trip via `Promise.all`)

### Constants (2 files — both REPLACE)
- `src/constants/routes.ts` — **REPLACE** — added `WORKSPACE_SETTINGS`,
  `PUBLIC_WORKSPACE(username)`, `PUBLIC_NOTEBOOK(username, slug)`
- `src/constants/index.ts` — **REPLACE** — re-exports `USERNAME_LIMITS`,
  `DISPLAY_NAME_LIMITS`, `RESERVED_USERNAMES`

### Page (1 file)
- `src/app/(dashboard)/settings/workspace/page.tsx` — Settings page

### Components (3 files)
- `src/components/features/workspace/username-editor.tsx` — Inline
  editable with 500ms debounce + race-condition guard
- `src/components/features/workspace/workspace-info-card.tsx` — Public
  URL preview + display name editor
- `src/components/features/workspace/index.ts` — Barrel

### SQL (1 file)
- `supabase-migrations/001_workspaces.sql` — Table + RLS + trigger +
  `is_username_available()` RPC helper

---

## Prerequisites

### Phase A–G are NOT required for Phase H

Phase H is independent — it only touches the auth/workspace layer.
Notebook phases A–F continue to work unchanged. The `auth-store.ts`
replacement is backward-compatible (workspace fetch failure is non-fatal).

### Required env vars (already in your boilerplate)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Shadcn components needed

All used components should already be in your boilerplate:
- `alert`, `button`, `card`, `input`, `label`

No new shadcn components to install.

---

## Installation

### 1. Run the SQL migration

Open Supabase Dashboard → SQL Editor → New query → paste contents of
`supabase-migrations/001_workspaces.sql` → Run.

You should see:
- `workspaces` table created
- `on_auth_user_created_workspace` trigger created
- `is_username_available()` function created
- 3 RLS policies created

### 2. Backfill existing users (IMPORTANT)

The trigger only fires for **new** signups. Existing users won't have
a workspace row. Run this in the SQL editor to backfill:

```sql
-- Backfill workspaces for existing users
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id, email, raw_user_meta_data FROM auth.users
           WHERE id NOT IN (SELECT user_id FROM workspaces)
  LOOP
    BEGIN
      -- Reuse the same logic as the trigger by inserting a row
      -- (the function handles unique-suffix logic)
      INSERT INTO workspaces (user_id, username, display_name)
      VALUES (
        u.id,
        -- Generate a fallback username from email or id
        SUBSTRING(
          REGEXP_REPLACE(
            LOWER(COALESCE(
              u.raw_user_meta_data->>'full_name',
              SPLIT_PART(u.email, '@', 1)
            )),
            '[^a-z0-9]', '-', 'g'
          )
          FROM 1 FOR 25
        ) || '-' || SUBSTRING(u.id::TEXT FROM 1 FOR 4),
        u.raw_user_meta_data->>'full_name'
      );
    EXCEPTION WHEN unique_violation THEN
      -- If even with the suffix we collide, use a uuid-based fallback
      INSERT INTO workspaces (user_id, username, display_name)
      VALUES (
        u.id,
        'user-' || SUBSTRING(u.id::TEXT FROM 1 FOR 8),
        u.raw_user_meta_data->>'full_name'
      );
    END;
  END LOOP;
END $$;
```

### 3. Copy files into your project

Extract `notebook-phase-h.zip` and copy the `src/` directory into your
project root, merging with existing structure.

**Heads up on REPLACES:**
- `src/stores/auth-store.ts`
- `src/constants/routes.ts`
- `src/constants/index.ts`

If you've added custom logic to any of these, merge the Phase H changes
manually instead of overwriting.

### 4. Verify

Start dev server:

```bash
pnpm dev
```

1. **Existing user**: Visit `/settings/workspace`
   - ✅ See your username + public URL preview
   - ✅ Click "Edit" → inline editor appears
   - ✅ Type a new username → see "Checking availability…" → then ✓ or ✗
   - ✅ Type `admin` → see "This username is reserved"
   - ✅ Type `ab` → see "must be at least 3 characters"
   - ✅ Save successful username → toast + display mode

2. **New signup**: Register a new account
   - ✅ Check Supabase `workspaces` table → row exists for the new user
   - ✅ Visit `/settings/workspace` → see auto-generated username

3. **Cooldown**: Edit your username once
   - ✅ "Edit" button shows "🔒 Locked"
   - ✅ Helper text shows next change date

---

## Architecture Notes

### Why fetch workspace in auth-store (option A)?

The roadmap suggested fetching workspace alongside the user profile to
avoid two round-trips. We do this via `Promise.all` of two `.single()`
queries (one for `user_profiles` with `is_active` filter, one for
`workspaces`). A join wouldn't work cleanly because:

1. `user_profiles` has `is_active` filter that the workspace shouldn't
   inherit
2. Workspace may be null for legacy users (pre-Phase-H signups), which
   we handle non-fatally

The cost of two parallel queries is ~the same as one (single round-trip
network-wise), so the win is correctness + clarity.

### Why a separate `workspaceStore` if workspace lives in `authStore`?

Three reasons:
1. **Mutation isolation**: keeping update logic out of auth-store keeps
   that store focused on session/profile concerns
2. **Cache invalidation**: after a mutation, we write back to
   `useAuthStore.setState({ workspace: updated })` so all `useWorkspace()`
   consumers re-render automatically
3. **Loading state**: `isUpdating` is local to mutations — doesn't
   conflict with the auth-store `isLoading` (which means "initial fetch")

### Race condition handling in `UsernameEditor`

When the user types fast, we might fire 3 availability checks but the
network returns them out of order. We guard against stale responses with
a monotonic `requestIdRef`:

```ts
const reqId = ++requestIdRef.current;
const isAvailable = await checkUsernameAvailable(normalized, userId);
if (reqId !== requestIdRef.current) return; // Stale — discard
```

### `is_username_available()` RPC vs direct query

The migration adds a SQL function that combines format + reserved +
uniqueness checks in one server-side call. The client uses this RPC by
default with a fallback to a direct `.eq("username", ...)` query if the
RPC fails (e.g., during initial migration rollout).

### Reserved username sync

The reserved list is duplicated in three places:
1. `supabase-migrations/001_workspaces.sql` — `CHECK` constraint + trigger
2. `src/types/workspace.ts` — `RESERVED_USERNAMES` Set
3. `is_username_available()` RPC

**Keep them in sync.** If you add a new reserved word, update all three.

---

## Smoke Tests

### Database

```sql
-- 1. After signup, workspace exists
SELECT username, display_name, created_at FROM workspaces
WHERE user_id = '<your-user-id>';

-- 2. Username uniqueness enforced
INSERT INTO workspaces (user_id, username)
VALUES (gen_random_uuid(), 'andre');
-- Expected: ERROR — duplicate key violates unique constraint
-- (if 'andre' is taken) OR success (if free)

-- 3. Reserved username blocked
UPDATE workspaces SET username = 'admin'
WHERE id = '<your-workspace-id>';
-- Expected: ERROR — violates check constraint "username_not_reserved"

-- 4. Format constraint blocks invalid chars
UPDATE workspaces SET username = 'has spaces'
WHERE id = '<your-workspace-id>';
-- Expected: ERROR — violates check constraint "username_format"

-- 5. RPC function works
SELECT public.is_username_available('totally-free-name-xyz');
-- Expected: true

SELECT public.is_username_available('admin');
-- Expected: false
```

### UI

- [ ] `/settings/workspace` renders without errors
- [ ] Username displayed in `@username` format
- [ ] "Edit" button enters edit mode with autofocus
- [ ] Typing triggers "Checking…" → result within ~500ms
- [ ] Invalid chars rejected instantly (no debounce)
- [ ] Save button disabled until valid + available
- [ ] Successful save shows toast + exits edit mode
- [ ] Display name editor shows "Save" button only when dirty
- [ ] Copy button copies URL + shows green check for 2s
- [ ] External link opens public URL in new tab (404 until Phase J — expected)

---

## Known Limitations

### Workspace creation race condition

The DB trigger fires `AFTER INSERT ON auth.users`. If the trigger fails
for any reason (e.g., username generation hits an edge case), the user
will exist without a workspace. The settings page handles this with a
"Your workspace hasn't been created yet" alert. In production, monitor
trigger failures via Supabase logs.

### Public URL preview is just a string

The `publicUrl` in `useWorkspace()` is built client-side from
`window.location.origin + /@username`. It doesn't validate that the
route exists. Phase J adds the actual `/@[username]` route.

### Reactivation of soft-deleted users

If a user soft-deletes their account and reactivates by logging back in,
their workspace row persists (since we don't cascade-delete it). The
username stays reserved to them. This is intentional — protects against
username squatting after deletion.

---

## Next: Phase I — Publish Flow

Will add:
- "Publish" button in notebook editor
- Preview modal with slug picker + URL preview
- Snapshot upload to Supabase (`notebook_publishes` table)
- Free tier enforcement (1 published notebook for free users)
- Re-publish flow (overwrites snapshot)
- Unpublish flow (deletes snapshot)
- Status badge on notebook cards in dashboard

After Phase I, users will be able to publish their notebooks to their
workspace, ready for Phase J's public renderer.
