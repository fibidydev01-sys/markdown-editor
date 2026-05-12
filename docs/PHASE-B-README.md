# VibesDoc Phase B — Notebooks Dashboard + Create

**Status:** ✅ Complete (7 new files + 1 update)

This phase builds the **first user-facing surface** of the notebook feature:
the dashboard grid where users see all their notebooks, plus the create flow.

After Phase B, the user can:
- Navigate to `/notebooks` from the sidebar
- See all their notebooks in a card grid
- Create new notebooks via modal or dedicated `/notebooks/new` page
- Search by name
- Delete notebooks (with confirmation)
- Click into a notebook (will 404 until Phase C — that's expected)

---

## What's Included

### Pages (2 files)
- `src/app/(dashboard)/notebooks/page.tsx` — Dashboard list
- `src/app/(dashboard)/notebooks/new/page.tsx` — Dedicated create flow

### Components (5 files)
- `src/components/features/notebook/notebooks/notebook-card.tsx` — Individual card
- `src/components/features/notebook/notebooks/notebook-grid.tsx` — Responsive grid + empty/loading states
- `src/components/features/notebook/notebooks/notebook-tag-badge.tsx` — Tag pill
- `src/components/features/notebook/notebooks/new-notebook-modal.tsx` — Create form
- `src/components/features/notebook/notebooks/index.ts` — Barrel export

### Layout Update (1 file — REPLACE)
- `src/components/layout/nav-config.ts` — Adds `Notebooks` to sidebar between
  Dashboard and Overview

---

## Prerequisites

### Phase A must be installed
Make sure `notebook-phase-a.zip` is already extracted into your project.
This phase depends on:
- `useNotebooks()` hook
- `getNotebookPageCount()`, `getTags()` storage functions
- `createNotebookSchema` validator
- Notebook types
- `ROUTES.NOTEBOOKS`, `ROUTES.NOTEBOOK_DETAIL`, `ROUTES.NOTEBOOK_SETTINGS`

### shadcn components needed
All should already be in your SaaS boilerplate. If `textarea` is missing:

```bash
pnpm dlx shadcn@latest add textarea
```

Full list of UI components used (all from existing boilerplate):
- `alert-dialog`, `button`, `card`, `dialog`, `dropdown-menu`,
- `form`, `input`, `textarea`

---

## Installation

### 1. Extract the ZIP

Extract `notebook-phase-b.zip` and copy the `src/` folder into your project,
merging with existing files.

### 2. Heads up on nav-config replacement

`src/components/layout/nav-config.ts` is a **REPLACE** of your existing file.
The only change is one new entry — `Notebooks` — between Dashboard and Overview.
If you've customized your nav-config, manually add this entry:

```ts
{
  title: "Notebooks",
  href: ROUTES.NOTEBOOKS,
  icon: BookOpen,
},
```

### 3. Verify

Start your dev server:

```bash
pnpm dev
```

Open `/notebooks` in browser. You should see:
- ✅ Empty state with "Create your first notebook" CTA
- ✅ "New Notebook" button in header
- ✅ "Notebooks" entry in sidebar nav
- ✅ Click "New Notebook" → modal opens with icon picker
- ✅ Create → toast notification + redirect to `/notebooks/[id]` (404 until Phase C)
- ✅ Refresh `/notebooks` → see your notebook in the grid
- ✅ Hover card → 3-dot menu appears, can Delete with confirmation
- ✅ Search by name works
- ✅ `/notebooks/new` shows the dedicated 2-option page (blank / import-soon)

---

## What's NOT in this phase

These are intentionally deferred:

- **Per-notebook settings page** → Phase G (`/notebooks/[id]/settings`)
- **Tag CRUD UI** → Phase G (tag display works, but can't create tags yet)
- **ZIP import** → Phase E (button shown as "Soon" placeholder)
- **Notebook editor + sidebar** → Phase C (clicking a card 404s until then)

---

## Design Notes

### Card hover behavior
The 3-dot menu sits on top of an absolutely-positioned Link (`z-10` above
`z-0`). This means:
- Clicking anywhere on the card → navigates to detail
- Clicking 3-dot menu → opens dropdown without navigation
- Hovering surfaces the menu via opacity transition

### Icon picker
24 curated emojis fitting "knowledge/notebook" vibe. Full emoji picker is
future scope — keeps the modal compact and decisive.

### Page count loading
Each card lazily fetches its page count via `getNotebookPageCount(id)` after
mount. Shows `…` skeleton state. Re-fetches when `notebook.updatedAt` changes
(touched by section/page mutations).

---

## Next: Phase C

Build the notebook editor page:
- `/notebooks/[id]/page.tsx` — Three-section layout (sidebar | editor | empty)
- Sidebar with section tree + pages (uses `useNotebook()` from Phase A)
- New section / new page menus
- Multi-select, drag-drop, context menus
- Search within notebook
