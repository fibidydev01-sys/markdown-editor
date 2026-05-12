# VibesDoc Phase C — Notebook Editor Page + Sidebar (File Manager)

**Status:** ✅ Complete (8 new files)

This phase builds the **core editing surface**: `/notebooks/[id]` with a
file-manager sidebar (sections + pages tree). Click a page in the sidebar
→ content area shows a placeholder editor (Phase D will wire BlockNote).

After Phase C, the user can:
- Navigate into a notebook from the dashboard
- See all sections and pages in a collapsible tree sidebar
- Create new pages (root or inside a section)
- Create new sections (root or nested)
- Rename pages and sections inline (double-click or context menu)
- Delete pages (with confirmation)
- Delete sections (with choice: orphan pages to root OR delete pages too)
- Duplicate pages
- Move pages between sections (drag-drop OR via "Move to" submenu)
- Multi-select pages (shift-click, cmd/ctrl-click, or via checkbox)
- Bulk move / bulk delete selected pages
- Search pages within the notebook
- Resize sidebar by dragging right edge (width persisted)
- Use sidebar on mobile via Sheet (hamburger button)

---

## What's Included

### Page (1 file)
- `src/app/(dashboard)/notebooks/[id]/page.tsx` — Main orchestrator route

### Components (7 files)
- `src/components/features/notebook/file-manager/notebook-sidebar.tsx` —
  Main left panel: header + search + tree + drop zone + multi-select toolbar
- `src/components/features/notebook/file-manager/section-node.tsx` —
  Recursive section row with collapse, context menu, drop target
- `src/components/features/notebook/file-manager/page-list-item.tsx` —
  Sidebar row for a page with multi-select checkbox, context menu, drag
- `src/components/features/notebook/file-manager/page-card.tsx` —
  Alt card view (for future browse layouts)
- `src/components/features/notebook/file-manager/search-bar.tsx` —
  Notebook-scoped search input
- `src/components/features/notebook/file-manager/new-item-menu.tsx` —
  Dropdown for creating page or section
- `src/components/features/notebook/file-manager/index.ts` — Barrel export

---

## Prerequisites

### Phase A + B must be installed

Phase C depends on:
- `useNotebook()`, `useSections()`, `usePages()`, `useNotebookSettings()` hooks
- `useNotebookStore` for multi-select state
- All storage functions from Phase A
- `FullPageLoader` from `@/components/shared`
- ROUTES constants

### Shadcn components needed

Likely **NEW** for Phase C (run if missing):

```bash
pnpm dlx shadcn@latest add sheet label radio-group
```

Full list of shadcn UI components used:
- `alert-dialog`, `button`, `card`, `dropdown-menu`, `input`,
- `label`, `radio-group`, `sheet` (the last three may be new for your project)

Existing dep (from boilerplate Phase 7 VideoModal):
- `@radix-ui/react-visually-hidden`

---

## Installation

### 1. Extract the ZIP

Copy `phase-c/src/` into your project, merging with existing structure.

### 2. Install missing shadcn components (if needed)

```bash
pnpm dlx shadcn@latest add sheet label radio-group
```

### 3. Verify

Start dev server, then:

1. Visit `/notebooks` — see the dashboard (Phase B)
2. Click any notebook card → opens `/notebooks/[id]`
3. ✅ Should see sidebar on left with notebook name + icon
4. ✅ Empty state in main area: "This notebook is empty"
5. Click "Create first page" or use sidebar "+" button → "New page"
6. ✅ New page appears in sidebar, content shows placeholder editor
7. Try renaming a page (double-click or context menu)
8. Try creating a section, then create pages inside
9. Try drag-drop: hold a page row and drag onto a section
10. Hold shift / cmd-click to multi-select pages → toolbar appears
11. Use bulk move / bulk delete
12. Resize sidebar by dragging right edge
13. On mobile: hamburger button shows sidebar in a Sheet

---

## Architecture Notes

### Active page state via URL query

The active page is tracked via `?page=[pageId]` URL search param, not state.
This makes:
- Deep-linking possible (`/notebooks/abc?page=xyz`)
- Browser back/forward work naturally
- No state lost on refresh

### Multi-select via Zustand store

The `useNotebookStore` from Phase A holds:
- `selectedPageIds: string[]`
- `selectedSectionIds: string[]`
- `activePageId`, `activeNotebookId`

The store is **reset on unmount** of the notebook page (cleanup effect)
to prevent stale selections leaking when navigating away.

### Drag-and-drop

Uses native HTML5 drag/drop API (no React-DnD). Data transfer types:
- `application/notebook-page-id` (single page drag)
- `application/notebook-page-ids` (multi-page drag, JSON array)
- `application/notebook-section-id` (sections — for future reorder)

**Note:** Section-to-section reordering is **NOT** wired in Phase C
(scope decision). Users can still create nested sections via the
"New section inside" context menu. Reordering is a Phase G polish item.

### Storage refresh pattern

`useSections(refresh)` and `usePages(refresh)` take the parent's `refresh`
callback (from `useNotebook`). Every mutation:
1. Calls storage function (e.g. `updatePage`)
2. Triggers `refresh()` → re-fetches notebook + sections + pages
3. UI re-renders with fresh data

This is simple and correct but does mean every action causes a full refresh
of the notebook data. For typical notebook sizes (<1000 pages) this is fine.
For larger scale, Phase D+E might introduce more granular updates.

### Sidebar width persistence

Width is local state (for smooth drag) + debounced save to
`NotebookSettings.sidebarWidth` (300ms after last drag stop).

### Rename UX

Double-click row OR pick "Rename" from context menu → inline `<Input>`
takes over. Press Enter to commit, Escape to cancel. External refreshes
don't clobber in-progress rename input.

---

## What's NOT in this phase

- **Editor itself** → Phase D (placeholder shown for now)
- **Section reordering via drag** → Phase G polish
- **Page reordering within a section via drag** → Phase G polish
- **Drop position indicators** (before/inside/after) → Phase G polish
- **Tags filter / display in sidebar** → Phase G
- **Per-notebook settings page** → Phase G

---

## Next: Phase D — Editor Integration

Will replace `PageEditorPlaceholder` with:
- BlockNote visual editor + source toggle
- Title input that syncs with page data
- Auto-save 500ms debounce (via `useCurrentPage` from Phase A)
- Word count footer
- Theme-aware (light/dark)
