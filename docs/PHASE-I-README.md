# VibesDoc Phase I — Publish Flow

**Status:** ✅ Ready for install (15 new files + 2 replaces + 1 SQL migration)

This phase adds the **publish/unpublish flow**: users can take their
local notebooks (from IndexedDB) and push them to Supabase as public
snapshots. After Phase I, content is **stored** publicly but not yet
**renderable** — the actual `/@username/slug` route comes in Phase J.

After Phase I, the user can:
- Click "Publish" in the notebook editor → modal with slug picker
- See live slug availability check (500ms debounced, race-guarded)
- Confirm publish → snapshot uploaded to Supabase
- See "Published" badge in editor header + dashboard card
- Re-publish to push latest changes (overwrites snapshot in-place)
- Change slug on re-publish (with old-URL-breakage warning)
- Copy public URL / view public page (404 until Phase J)
- Unpublish to remove the snapshot (notebook itself untouched)
- Free tier: capped at 1 published notebook
- Paid/trial users: unlimited publishes

---

## What's Included

### Types (1 file)
- `src/types/publish.ts` — Publish types, error codes, limits

### Lib (5 files)
- `src/lib/notebook/publish/publisher.ts` — Build snapshot + POST API +
  `PublishError` class
- `src/lib/notebook/publish/unpublisher.ts` — Delete via API
- `src/lib/notebook/publish/publish-status.ts` — Single + batch status lookup
- `src/lib/notebook/publish/slug-utils.ts` — Format check + availability
  RPC + slug suggestion from name
- `src/lib/notebook/publish/index.ts` — Barrel export

### Hooks (2 files)
- `src/hooks/notebook/use-publish-status.ts` — Track publish state for
  one notebook (auto-refreshes on auth load)
- `src/hooks/notebook/use-publish-action.ts` — `publish` + `unpublish`
  mutations with loading state

### API Routes (2 files)
- `src/app/api/notebooks/publish/route.ts` — Auth check, free tier
  enforcement (subscriptions OR trial), slug uniqueness, upsert by
  `(workspace_id, notebook_local_id)`
- `src/app/api/notebooks/unpublish/route.ts` — Auth check + RLS-backed
  delete (idempotent)

### Components (5 files)
- `src/components/features/notebook/publish/publish-button.tsx` —
  Main CTA, becomes a split button when published
- `src/components/features/notebook/publish/publish-modal.tsx` —
  Slug picker + preview URL + paywall handling
- `src/components/features/notebook/publish/publish-status-badge.tsx` —
  Dot / full variants
- `src/components/features/notebook/publish/unpublish-confirm-modal.tsx` —
  Simple destructive confirm
- `src/components/features/notebook/publish/index.ts` — Barrel

### Modified files (2 REPLACES)
- `src/app/(dashboard)/notebooks/[id]/page.tsx` — **REPLACE** — header
  now visible on desktop too, with `<PublishButton />` mounted top-right
- `src/components/features/notebook/notebooks/notebook-card.tsx` —
  **REPLACE** — accepts `publishStatus` prop, shows badge when published
- `src/components/features/notebook/notebooks/notebook-grid.tsx` —
  **REPLACE** — batch-fetches publish status for all notebooks via
  `getPublishStatusMap` (avoids N+1)

### SQL (1 file)
- `supabase-migrations/002_notebook_publishes.sql` — Table + RLS (4
  policies: public read, owner insert/update/delete) + updated_at
  trigger (reuses Phase H helper) + `published_notebooks_with_workspace`
  view + `count_workspace_publishes(uuid)` RPC

---

## Prerequisites

### Phase H must be installed and working

Phase I depends on:
- `workspaces` table exists (Phase H migration ran)
- `useAuthStore` has `workspace` field populated (Phase H auth-store)
- The `update_updated_at_column()` SQL helper exists (Phase H migration)

### Phase A–D must also be installed

Phase I depends on:
- Phase A storage layer (`getNotebook`, `getSections`, `getPages`, `getTags`)
- Phase A types (`Notebook`, `NotebookSection`, `NotebookPage`, `NotebookTag`)
- Phase D editor surface (modified page integrates `<PublishButton />`)

### Required env vars (already in your boilerplate)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

`NEXT_PUBLIC_APP_URL` is used to build absolute public URLs server-side.

### Shadcn components needed

All should already be in your boilerplate from earlier phases:
- `alert`, `alert-dialog`, `button`, `card`, `dialog`, `dropdown-menu`,
  `input`, `label`

No new shadcn components to install.

---

## Installation

### 1. Run the SQL migration

Open Supabase Dashboard → SQL Editor → New query → paste contents of
`supabase-migrations/002_notebook_publishes.sql` → Run.

You should see:
- `notebook_publishes` table created with 3 indexes
- 4 RLS policies created
- `published_notebooks_with_workspace` view created
- `count_workspace_publishes()` function created

### 2. Copy files into your project

Extract `notebook-phase-i.zip` and copy the `src/` directory into your
project root, merging with existing structure.

**Heads up on REPLACES:**
- `src/app/(dashboard)/notebooks/[id]/page.tsx` — Phase D version, now
  has a desktop header bar + `<PublishButton />`. If you've customized
  this page, merge manually.
- `src/components/features/notebook/notebooks/notebook-card.tsx` — adds
  `publishStatus` prop + badge rendering.
- `src/components/features/notebook/notebooks/notebook-grid.tsx` — adds
  batch publish-status fetch.

### 3. Verify

Start dev server:

```bash
pnpm dev
```

1. **First publish (free tier)**: Open any notebook → see "Publish" button
   top-right
   - ✅ Click → modal opens with suggested slug from notebook name
   - ✅ Type invalid chars → instant error
   - ✅ Type valid slug → "Checking…" → ✓
   - ✅ Click "Publish" → success toast + modal closes
   - ✅ Header now shows split button "Update [▼]"
   - ✅ Dashboard card now shows green "Published" dot

2. **Free tier limit**: Try publishing a 2nd notebook (as a free user,
   no active subscription, expired trial)
   - ✅ Click Publish → modal shows form
   - ✅ Click Publish button → inline paywall appears with "View plans" CTA

3. **Re-publish**: Open an already-published notebook
   - ✅ Click "Update" → modal opens with current slug pre-filled
   - ✅ Validation says "Re-publish with the same URL"
   - ✅ Change slug → "⚠️ Changing the slug will break the old URL"
   - ✅ Save → toast says "re-published"

4. **Unpublish**: Click ▼ next to Update button → "Unpublish"
   - ✅ Confirm modal shows the URL that will 404
   - ✅ Confirm → notebook unpublished, button reverts to single "Publish"

5. **Copy / View**: Click ▼ when published
   - ✅ "Copy public URL" → toast + green check icon
   - ✅ "View public page" → opens in new tab (404 until Phase J — expected!)

---

## Architecture Notes

### Why upsert by `(workspace_id, notebook_local_id)`?

The `notebook_local_id` is the IndexedDB notebook id — it's stable across
re-publishes from the same browser. Using a composite unique constraint
on `(workspace_id, notebook_local_id)` lets us:

1. Treat "publish" and "re-publish" as the same operation (upsert)
2. Distinguish "this is my notebook being re-published" from "different
   notebook" when checking slug uniqueness

Two notebooks can't share a slug within one workspace (enforced by
`slug_unique_per_workspace`), AND a single notebook can only have one
published row (enforced by `local_id_unique_per_workspace`). Both
constraints together give us clean re-publish semantics.

### Free tier check — `subscriptions` OR `user_trials`

Per roadmap D9 "Trial user counts as paid". The check in
`/api/notebooks/publish/route.ts` runs OR-logic against two sources:

```ts
hasAccess =
  subscriptions.status IN ('active', 'trialing')
  OR
  (user_trials.trial_end_time > now AND !is_trial_used)
```

The check is **skipped entirely for re-publishes** (existing row update).
Once you've claimed your free slot, you can re-publish forever — only
NEW publishes count against the quota.

### Why RLS-backed API (not service role)?

The API routes use the user's authenticated Supabase client via
`createClient()` from `lib/supabase/server.ts`. RLS policies on
`notebook_publishes` already enforce:
- Owner can only INSERT/UPDATE/DELETE into their own workspace
- Anyone (anon) can SELECT (needed for Phase J public docs)

So the route logic stays clean — no manual "is this user the owner?"
guard needed. The DB enforces it.

### Race condition in slug availability check

Same pattern as Phase H's `UsernameEditor`: monotonic `requestIdRef`
discards stale responses. User typing "intro" → "introduction" → "intr"
fast won't cause the slow "intro" response to overwrite the latest one.

### Why batch publish status in `NotebookGrid`?

A 10-notebook dashboard with naive per-card fetching would fire 10
separate Supabase queries. `getPublishStatusMap()` fetches all statuses
in a single `.in("notebook_local_id", ids)` query. The grid re-runs the
fetch when the set of `(notebookId, updatedAt)` pairs changes, which
covers add/remove/re-publish detection.

### Page header refactor (mobile → universal)

In Phase D, the page header was mobile-only (hamburger + name). Phase I
makes it visible on **all** breakpoints because the PublishButton needs
a home. On desktop the hamburger + name hide (already visible in
sidebar), leaving just the publish button right-aligned.

### Snapshot is a denormalized JSONB

The published row stores `sections`, `pages`, `tags` as JSONB arrays.
This means:
- ✅ One query to render the full notebook (no joins for Phase J)
- ✅ Snapshot is immutable until next publish (versioning-friendly later)
- ❌ Updates require sending the full notebook payload (acceptable for
     MVP — typical notebook is well under 5MB)

If notebooks grow huge in the future, we could chunk pages into separate
rows. For MVP, JSONB is the right call.

---

## Smoke Tests

### Database

```sql
-- 1. After publishing, row exists
SELECT
  notebook_slug,
  notebook_name,
  published_at,
  jsonb_array_length(pages) AS page_count
FROM notebook_publishes
WHERE workspace_id = (
  SELECT id FROM workspaces WHERE user_id = auth.uid()
);

-- 2. Slug uniqueness enforced within workspace
INSERT INTO notebook_publishes (
  workspace_id, notebook_local_id, notebook_slug, notebook_name
) VALUES (
  (SELECT id FROM workspaces WHERE user_id = auth.uid()),
  gen_random_uuid()::text,
  'my-existing-slug',   -- already taken
  'Conflict'
);
-- Expected: ERROR — duplicate key (slug_unique_per_workspace)

-- 3. local_id uniqueness enforced (re-publish = upsert, not duplicate)
-- The upsert in the API will UPDATE not INSERT — verify same row id

-- 4. RLS: anonymous can read
-- (Run while logged out via Supabase REST API or anon-key client)
SELECT * FROM notebook_publishes LIMIT 1;
-- Expected: row returned (no auth required)

-- 5. RLS: anonymous CANNOT write
INSERT INTO notebook_publishes (...) VALUES (...);
-- Expected: ERROR — RLS policy violation

-- 6. View works
SELECT username, notebook_slug, notebook_name
FROM published_notebooks_with_workspace
WHERE username = 'your-username';

-- 7. RPC helper
SELECT public.count_workspace_publishes(
  (SELECT id FROM workspaces WHERE user_id = auth.uid())
);
-- Expected: integer count
```

### API endpoints (curl)

```bash
# Publish (requires session cookie — use browser network tab)
curl -X POST https://your-domain.com/api/notebooks/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: <copy-from-browser>" \
  -d '{
    "notebookLocalId": "uuid-here",
    "notebookSlug": "test-slug",
    "notebookName": "Test",
    "notebookIcon": "📓",
    "notebookDescription": null,
    "sections": [],
    "pages": [],
    "tags": []
  }'
# Expected: 200 { publishId, publicUrl, publishedAt, isUpdate: false }

# Free tier limit (2nd publish as free user)
# Expected: 402 { error: "Free tier...", code: "FREE_TIER_LIMIT", currentCount: 1, limit: 1 }

# Slug taken
# Expected: 409 { error: "...", code: "SLUG_TAKEN" }

# Unauthorized
curl -X POST https://your-domain.com/api/notebooks/publish \
  -H "Content-Type: application/json" \
  -d '{...}'
# Expected: 401 { error: "Unauthorized", code: "UNAUTHORIZED" }
```

### UI flow

- [ ] Notebook editor shows "Publish" button when not published
- [ ] Click Publish → modal opens, slug pre-filled from name
- [ ] Slug typing triggers debounced check (~500ms after stop)
- [ ] Invalid characters rejected instantly (no debounce)
- [ ] Submit → loading state → success toast → modal closes
- [ ] Header now shows split "Update [▼]" button
- [ ] ▼ menu: "View public page", "Copy URL", "Unpublish"
- [ ] Re-publish modal pre-fills current slug, shows "unchanged"
- [ ] Changing slug shows yellow warning about old URL
- [ ] Unpublish modal shows the URL that will 404
- [ ] Dashboard cards show green dot when published
- [ ] Free tier paywall shows inline in modal, NOT a separate page

---

## Known Limitations

### IndexedDB → Supabase one-way only

The publish flow is local→cloud only. If you edit the published version
somewhere else (impossible right now, but hypothetically), changes
WON'T sync back to your IndexedDB. The local copy is authoritative.

### Snapshot doesn't include images

Markdown can reference external images (`![alt](https://imgur.com/...)`)
or data URIs — both work. But images uploaded to IndexedDB (if you ever
add that) wouldn't be included in the snapshot. Per roadmap D10, images
are out of scope for MVP.

### No version history

Re-publishing overwrites the existing row. No "view previous version"
feature. Roadmap intentionally cuts versioning for MVP.

### Slug not normalized on input

Users CAN type `My-Slug-Here` into the slug field — we normalize to
lowercase on submit, but the input field doesn't auto-lowercase as they
type. Considered adding `input.value.toLowerCase()` but it interferes
with cursor position on edit. Acceptable UX gap for now.

### Workspace fetch race on first load

If a user lands on the editor page before auth-store finishes the
initial fetch, `usePublishStatus` returns `isLoading: true` and the
button shows a spinner. Once auth resolves, it auto-refreshes. No data
loss, just a brief loading state — confirmed acceptable.

### "View public page" returns 404 until Phase J

The "View public page" link in the published-state menu opens a URL
that doesn't exist yet (Phase J adds the route). The README notes this
explicitly so testers don't file false bug reports.

---

## Next: Phase J — Public Docs Renderer

Will add:
- `/@[username]` workspace landing page (lists published notebooks)
- `/@[username]/[slug]` notebook home (redirects to first page)
- `/@[username]/[slug]/[...page]` page renderer with 3-column layout
- Markdown rendering with full plugin stack (GFM, callouts, syntax highlighting)
- Left sidebar (section tree) + right TOC (scroll-spy)
- Client-side search (⌘K) via fuse.js
- Auth-aware header (Dashboard / Edit buttons for owner)
- SSR for SEO, Open Graph tags
- 404 pages for missing user/notebook/page

After Phase J, the full **read → publish → read public** loop is closed.
