# VibesDoc Phase A — Foundation Maximalist

**Status:** ✅ Complete (22 new files + 2 updates)

This phase builds the entire **non-UI foundation** of the notebook feature:
types, IndexedDB storage layer, utilities, validators, hooks, and Zustand store.

After Phase A, all subsequent phases (B–G) can build UI components without
inventing types or storage signatures. Contract is locked.

---

## What's Included

### Types (1 file)
- `src/types/notebook.ts` — All TypeScript interfaces

### Constants (3 files — 1 new, 2 updates)
- `src/constants/notebook.ts` — **NEW** — defaults, limits, sample content
- `src/constants/routes.ts` — **UPDATE** — added NOTEBOOKS routes
- `src/constants/index.ts` — **UPDATE** — barrel re-export

### Storage Layer (8 files)
- `src/lib/notebook/storage/db.ts` — IndexedDB setup via `idb`
- `src/lib/notebook/storage/notebooks.ts` — Notebook CRUD
- `src/lib/notebook/storage/sections.ts` — Section CRUD + reorder + cascade delete
- `src/lib/notebook/storage/pages.ts` — Page CRUD + move + bulk delete + duplicate
- `src/lib/notebook/storage/tags.ts` — Notebook tags CRUD
- `src/lib/notebook/storage/settings.ts` — Settings CRUD
- `src/lib/notebook/storage/backup.ts` — Backup/restore JSON
- `src/lib/notebook/storage/index.ts` — Barrel export

### Utilities (4 files)
- `src/lib/notebook/utils/slugify.ts` — URL-safe slugs + unique suffixes
- `src/lib/notebook/utils/sort.ts` — Sort helpers + tree builder
- `src/lib/notebook/utils/filename-utils.ts` — Strip prefixes, paths, titles
- `src/lib/notebook/utils/frontmatter.ts` — YAML frontmatter parse/serialize

### Validators (1 file)
- `src/lib/notebook/validators.ts` — Zod schemas for all forms

### Hooks (6 files)
- `src/hooks/notebook/use-notebooks.ts` — List all notebooks
- `src/hooks/notebook/use-notebook.ts` — Single notebook + sections + pages + tree
- `src/hooks/notebook/use-sections.ts` — Section actions
- `src/hooks/notebook/use-pages.ts` — Page actions
- `src/hooks/notebook/use-current-page.ts` — Editor data with debounced auto-save
- `src/hooks/notebook/use-notebook-settings.ts` — Settings

### Store (1 file)
- `src/stores/notebook-store.ts` — Zustand for active selections + multi-select

---

## Installation

### 1. Install dependencies

```bash
pnpm add idb uuid jszip gray-matter
pnpm add -D @types/uuid

# BlockNote (will be used in Phase D, install now to avoid surprises)
pnpm add @blocknote/core @blocknote/react @blocknote/mantine
```

### 2. Copy files to your project

Extract the ZIP and copy the `src/` folder into your project root (merging
with existing `src/`).

> **Heads up:** `src/constants/routes.ts` and `src/constants/index.ts`
> are **REPLACEMENTS** for your existing files. Make sure to merge any
> custom routes you may have added.

### 3. Verify

Open browser console on your dev server, then:

```ts
import {
  createNotebook,
  createSection,
  createPage,
  getNotebooks,
} from "@/lib/notebook/storage";

const nb = await createNotebook({ name: "Test Docs" });
const sec = await createSection(nb.id, { name: "Getting Started" });
const page = await createPage(nb.id, {
  title: "Welcome",
  content: "# Welcome",
  sectionId: sec.id,
});

console.log(await getNotebooks());
// → [{ id, name, slug: "test-docs", icon: "📓", ... }]
```

If you see your notebook in the result, Phase A is wired correctly. ✅

---

## API Contract Summary

### Storage Layer

```ts
// Notebooks
createNotebook(input: CreateNotebookInput): Promise<Notebook>
updateNotebook(id, updates: UpdateNotebookInput): Promise<Notebook>
deleteNotebook(id): Promise<void>  // cascade deletes sections + pages
getNotebooks(): Promise<Notebook[]>
getNotebook(id): Promise<Notebook | undefined>

// Sections
createSection(notebookId, input: CreateSectionInput): Promise<NotebookSection>
updateSection(id, updates: UpdateSectionInput): Promise<NotebookSection>
reorderSections(updates: ReorderInput[]): Promise<void>
deleteSection(id, pageStrategy?: "orphan" | "delete"): Promise<void>
getSections(notebookId): Promise<NotebookSection[]>

// Pages
createPage(notebookId, input?: CreatePageInput): Promise<NotebookPage>
updatePage(id, updates: UpdatePageInput): Promise<NotebookPage>
movePages(pageIds, targetSectionId): Promise<void>
deletePage(id): Promise<void>
deletePages(ids): Promise<void>
duplicatePage(id): Promise<NotebookPage>
searchPages(notebookId, query): Promise<NotebookPage[]>

// Tags, Settings, Backup — see storage/index.ts for full API
```

### Hooks

```ts
useNotebooks()  // { notebooks, isLoading, createNotebook, ... }
useNotebook(id) // { notebook, sections, pages, tree, refresh, ... }
useSections(onMutate)  // action callbacks
usePages(onMutate)     // action callbacks
useCurrentPage(pageId) // { page, scheduleSave, flushSave, ... }
useNotebookSettings()  // { settings, updateSettings, ... }
```

### Store

```ts
useNotebookStore()
// state: activeNotebookId, activePageId, selectedPageIds, selectedSectionIds
// actions: setActiveNotebookId, togglePageSelection, clearPageSelection, ...
```

---

## Next: Phase B

Build the notebooks dashboard:
- `src/app/(dashboard)/notebooks/page.tsx` — list grid
- `src/app/(dashboard)/notebooks/new/page.tsx` — create form
- Components: NotebookCard, NotebookGrid, NewNotebookModal, NotebookTagBadge
- Update `nav-config.ts` to add Notebooks to sidebar

Phase B will consume `useNotebooks()` hook and `createNotebook()` action from
this Phase A foundation.
