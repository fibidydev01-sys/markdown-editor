# VibesDoc — Production Roadmap

**Notebook-Based Markdown Documentation Editor**

> Status: **Phase A–F Complete** · Ready for merge to main project · Phase G–H planned

---

## Table of Contents

1. [Vision & Tagline](#1-vision--tagline)
2. [Naming Convention](#2-naming-convention)
3. [Feature Catalog](#3-feature-catalog)
4. [Tech Stack](#4-tech-stack)
5. [Data Model (Contract Lock)](#5-data-model-contract-lock)
6. [Final File Structure](#6-final-file-structure)
7. [Routing Map](#7-routing-map)
8. [Phase Status Tracker](#8-phase-status-tracker)
9. [Per-Phase Feature Breakdown](#9-per-phase-feature-breakdown)
10. [Storage API Contract](#10-storage-api-contract)
11. [Hooks API Contract](#11-hooks-api-contract)
12. [Production Readiness Checklist](#12-production-readiness-checklist)
13. [Merge Strategy](#13-merge-strategy)
14. [Free vs Paid Tier](#14-free-vs-paid-tier)
15. [Open Decisions](#15-open-decisions)
16. [Context Handoff Template](#16-context-handoff-template)

---

## 1. Vision & Tagline

**Tagline:** *Obsidian meets Mintlify — affordable.*

**Core Concept:** A notebook-based markdown editor where each notebook is a self-contained documentation workspace.

- Users create **Notebooks** (analogous to Obsidian vaults / documentation sites)
- Each notebook contains **Sections** (folders) + **Pages** (markdown documents)
- Edit experience: Obsidian-style sidebar + file manager + rich editor
- Output: Fumadocs-style 3-column public docs (paid feature, Phase I+)

**Target users:** Indie developers, technical writers, small SaaS teams who need a self-hosted-feeling docs tool without the Notion/Mintlify pricing.

---

## 2. Naming Convention

| Layer | Term | Example |
|-------|------|---------|
| **Brand (UI only)** | VibesDoc | Page titles, marketing copy, landing page |
| **Code identifier** | `notebook` | Types, hooks, storage, file paths |

**Rationale:** Decouples brand from code — rebranding never requires a refactor.

### UI ↔ Code Term Mapping

| User-facing (UI) | Developer-facing (Code) |
|------------------|-------------------------|
| Notebook | `Notebook` / `notebook` |
| Section | `NotebookSection` / `section` |
| Page | `NotebookPage` / `page` |
| Tag | `NotebookTag` / `tag` |

---

## 3. Feature Catalog

### 3.1 Notebook Management

| Feature | Status | Phase |
|---------|--------|-------|
| Create notebook (manual: name + icon + description + tags) | ✅ | B |
| Notebook dashboard (responsive card grid) | ✅ | B |
| Search notebooks by name + description | ✅ | B |
| Filter notebooks by tag | 🟡 Component ready, wiring deferred | B / G |
| Delete notebook (with confirmation, cascade to sections + pages) | ✅ | B |
| Notebook icon picker (24 curated emojis) | ✅ | B |
| Per-notebook settings page (rename, change icon, manage tags) | 🟥 Planned | G |
| Notebook tags CRUD (create, color picker, edit, delete) | 🟥 Planned | G |
| Empty state with CTA (`Create your first notebook`) | ✅ | B |
| Last-opened notebook persistence | ✅ | C |

### 3.2 Section + Page Tree (File Manager)

| Feature | Status | Phase |
|---------|--------|-------|
| Recursive section tree in sidebar | ✅ | C |
| Collapsible sections (expand/collapse on click) | ✅ | C |
| Create root section / nested section | ✅ | C |
| Create root page / page inside section | ✅ | C |
| Inline rename (double-click or context menu) | ✅ | C |
| Delete page (with confirmation) | ✅ | C |
| Delete section (choice: orphan pages to root OR cascade delete) | ✅ | C |
| Duplicate page (`(copy)` suffix) | ✅ | C |
| Move page between sections (context menu submenu) | ✅ | C |
| Drag-drop pages onto sections | ✅ | C |
| Drag-drop pages to root drop zone | ✅ | C |
| Multi-select pages (shift-click range, cmd/ctrl-click toggle) | ✅ | C |
| Bulk move selected pages | ✅ | C |
| Bulk delete selected pages | ✅ | C |
| Search pages within notebook (title + content match) | ✅ | C |
| Resizable sidebar (drag right edge, persists width) | ✅ | C |
| Mobile sidebar in Sheet drawer (hamburger trigger) | ✅ | C |
| Page reordering within section via drag | 🟥 Planned | G |
| Section reordering via drag | 🟥 Planned | G |
| Drop position indicators (above/inside/below) | 🟥 Planned | G |

### 3.3 Markdown Editor

| Feature | Status | Phase |
|---------|--------|-------|
| BlockNote visual editor (rich WYSIWYG) | ✅ | D |
| Source mode (raw markdown textarea) | ✅ | D |
| Toggle between Visual ↔ Source (lossless via BlockNote API) | ✅ | D |
| Title input (separate from content body) | ✅ | D |
| Auto-save with 500ms debounce | ✅ | D |
| `Saving…` / `Saved` indicator | ✅ | D |
| Flush pending save on page switch (no edits lost) | ✅ | D |
| Word + character count footer | ✅ | D |
| Toggle word count visibility | ✅ | D |
| Theme-aware editor (light/dark via `.dark` class + system preference) | ✅ | D |
| Tab → 2 spaces in source mode | ✅ | D |
| Markdown parsing fallback for imported MD without BlockNote JSON | ✅ | D |
| Deep-linking via URL query (`?page=[id]`) | ✅ | D |

### 3.4 Import (Markdown + ZIP)

| Feature | Status | Phase |
|---------|--------|-------|
| Upload ZIP → parse folder structure | ✅ | E |
| Auto-detect sections from folders | ✅ | E |
| Auto-detect pages from `.md` / `.markdown` files | ✅ | E |
| Numeric prefix detection (`01-intro`, `02-guides`) for ordering | ✅ | E |
| Strip numeric prefix from display names | ✅ | E |
| Common-prefix detection (strip top-level wrapper folder) | ✅ | E |
| Preview modal (hierarchical tree before commit) | ✅ | E |
| Notebook name suggestion from ZIP filename / folder | ✅ | E |
| Icon picker in preview modal | ✅ | E |
| Title resolution priority (frontmatter.title → H1 → filename) | ✅ | E |
| YAML frontmatter parsing (via gray-matter) | ✅ | E |
| Skip non-markdown files + display skipped count | ✅ | E |
| Skip hidden + system files (`.git`, `__MACOSX`, `.DS_Store`) | ✅ | E |
| Live progress (preparing → sections → pages → done) | ✅ | E |
| Import as new notebook | ✅ | E |
| Import into existing notebook (merge mode) | 🟡 Lib ready, UI wiring deferred | E / G |
| Import into existing notebook (replace mode, destructive) | 🟡 Lib ready, UI wiring deferred | E / G |
| Drag-drop MD files onto notebook page | 🟡 Component ready, wiring deferred | E / G |
| Safety limit: max 1000 files per ZIP | ✅ | E |

### 3.5 Export + Backup

| Feature | Status | Phase |
|---------|--------|-------|
| Export single notebook as ZIP | ✅ | F |
| Round-trip preservation (export → import = identical tree) | ✅ | F |
| Numeric prefix on exported filenames (preserves order) | ✅ | F |
| Frontmatter preserved on export | ✅ | F |
| Filesystem-safe filename slugification | ✅ | F |
| Filename dedup within same folder | ✅ | F |
| Section folders mirror tree hierarchy | ✅ | F |
| Empty sections preserved in ZIP | ✅ | F |
| Live progress during export (compress %) | ✅ | F |
| Browser download trigger (object URL + cleanup) | ✅ | F |
| Full-app JSON backup (all notebooks + sections + pages + tags + settings) | ✅ | F |
| Restore from JSON backup (with destructive confirm: type `REPLACE ALL`) | ✅ | F |
| Backup version field (forward-compat) | ✅ | F |
| Pre-restore preview (counts: what's in backup vs current data) | ✅ | F |
| Backup/restore section integration | 🟡 Component ready, page wiring deferred | F / G |

### 3.6 Settings

| Feature | Status | Phase |
|---------|--------|-------|
| Theme selection (light / dark / system) | ✅ Type | A |
| Default editor mode (visual / source) | ✅ Type + Hook | A / D |
| Sidebar width persistence | ✅ | C |
| Word count visibility toggle | ✅ | D |
| Onboarding dismissed flag | ✅ Type | A |
| Last-opened notebook + page IDs | ✅ | C |
| Settings page section integration | 🟥 Planned | G |
| Reset settings to defaults | ✅ Storage util | A |

### 3.7 Onboarding

| Feature | Status | Phase |
|---------|--------|-------|
| First-time welcome modal | 🟥 Planned | G |
| Sample notebook creation option | 🟥 Planned | G |
| Dismiss-once flag persisted in settings | ✅ Type only | A / G |

### 3.8 Sharing (TBD)

| Feature | Status | Phase |
|---------|--------|-------|
| Per-page encrypted share link | 🟥 Decision pending | H |
| Per-notebook public docs URL (`/docs/[slug]`) | 🟥 Paid feature | I+ |
| Custom domain support | 🟥 Paid feature | I+ |

---

## 4. Tech Stack

### Core Framework
- **Next.js 16** (App Router, RSC-aware)
- **React 19**
- **TypeScript** (strict mode)

### Editor
- **BlockNote** (`@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`) — Visual + source markdown editor with theme support

### Storage
- **IndexedDB** via `idb` — Client-side persistence (5MB+ quota, async API)
- **Zustand** — Volatile UI state (selections, active IDs)

### File Handling
- **JSZip** — Browser-native ZIP read/write for import + export
- **gray-matter** — YAML frontmatter parsing

### UI
- **shadcn/ui** — Component library (Radix UI + Tailwind)
- **lucide-react** — Icons
- **Tailwind CSS** — Styling
- **sonner** — Toast notifications

### Forms
- **react-hook-form** + **zod** — Type-safe forms with validation

### Utilities
- **uuid** — Unique IDs for entities

### Required Dependencies
```bash
pnpm add @blocknote/core @blocknote/react @blocknote/mantine
pnpm add idb uuid jszip gray-matter
pnpm add -D @types/uuid
```

### Required shadcn Components
```bash
pnpm dlx shadcn@latest add \
  alert-dialog button card dialog dropdown-menu \
  form input label progress radio-group sheet \
  textarea
```

---

## 5. Data Model (Contract Lock)

> ⚠️ **CONTRACT LOCK:** These types are FINAL. All consumers depend on them. Changes require a coordinated migration across storage + hooks + components.

```typescript
// src/types/notebook.ts

// ────────────────────────────────────────────
// Core Entities
// ────────────────────────────────────────────

export interface Notebook {
  id: string;
  name: string;
  slug: string;                    // URL-friendly, stable, unique
  description: string | null;
  icon: string | null;             // emoji or lucide icon name
  tagIds: string[];                // refs to NotebookTag.id
  createdAt: number;
  updatedAt: number;
}

export interface NotebookSection {
  id: string;
  notebookId: string;
  name: string;
  parentId: string | null;         // null = root-level section
  order: number;
  createdAt: number;
}

export interface NotebookPage {
  id: string;
  notebookId: string;
  sectionId: string | null;        // null = root-level page
  title: string;
  content: string;                 // markdown string (source of truth)
  blockNoteContent: unknown;       // BlockNote JSON (lossless editing)
  frontmatter: Record<string, unknown> | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface NotebookTag {
  id: string;
  name: string;
  color: string;                   // hex code
}

// ────────────────────────────────────────────
// Settings & Backup
// ────────────────────────────────────────────

export interface NotebookSettings {
  theme: "light" | "dark" | "system";
  onboardingDismissed: boolean;
  lastOpenedNotebookId: string | null;
  lastOpenedPageId: string | null;
  showWordCount: boolean;
  defaultEditorMode: "visual" | "source";
  sidebarWidth: number;
}

export interface NotebookBackup {
  version: 1;
  exportedAt: number;
  notebooks: Notebook[];
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
  settings: NotebookSettings;
}

// ────────────────────────────────────────────
// Sort / Filter
// ────────────────────────────────────────────

export type SortField = "title" | "createdAt" | "updatedAt" | "order";
export type SortDirection = "asc" | "desc";

// ────────────────────────────────────────────
// Selection (Zustand store)
// ────────────────────────────────────────────

export interface NotebookSelection {
  activeNotebookId: string | null;
  activePageId: string | null;
  selectedPageIds: string[];
  selectedSectionIds: string[];
}

// ────────────────────────────────────────────
// Import
// ────────────────────────────────────────────

export interface ImportPreviewNode {
  type: "section" | "page";
  name: string;
  path: string;
  children?: ImportPreviewNode[];
  pageCount?: number;              // for sections: total incl. nested
}

export interface ImportResult {
  notebookId: string;
  sectionsCreated: number;
  pagesCreated: number;
}

// ────────────────────────────────────────────
// CRUD Input Types
// ────────────────────────────────────────────

export interface CreateNotebookInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  tagIds?: string[];
}

export interface UpdateNotebookInput {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  tagIds?: string[];
}

export interface CreateSectionInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateSectionInput {
  name?: string;
  parentId?: string | null;
  order?: number;
}

export interface CreatePageInput {
  title?: string;
  content?: string;
  blockNoteContent?: unknown;
  sectionId?: string | null;
  frontmatter?: Record<string, unknown> | null;
}

export interface UpdatePageInput {
  title?: string;
  content?: string;
  blockNoteContent?: unknown;
  sectionId?: string | null;
  frontmatter?: Record<string, unknown> | null;
  order?: number;
}

export interface ReorderInput {
  id: string;
  order: number;
  parentId?: string | null;
}

// ────────────────────────────────────────────
// Bulk Data Containers
// ────────────────────────────────────────────

export interface NotebookFullData {
  notebook: Notebook;
  sections: NotebookSection[];
  pages: NotebookPage[];
}

export interface AllNotebookData {
  notebooks: Notebook[];
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
  settings: NotebookSettings;
}
```

### IndexedDB Schema

**Database:** `notebook-db` (v1)

| Store | Key | Indexes |
|-------|-----|---------|
| `notebooks` | `id` | `by-updated` |
| `sections` | `id` | `by-notebook`, `by-parent` |
| `pages` | `id` | `by-notebook`, `by-section`, `by-updated` |
| `tags` | `id` | — |
| `settings` | `id` (singleton `'app'`) | — |

---

## 6. Final File Structure

This is the **canonical layout** as built across Phase A–F. All paths use the `@/` alias resolving to `src/`.

```
src/
│
├── app/(dashboard)/notebooks/
│   ├── page.tsx                              # Dashboard grid + search
│   ├── new/page.tsx                          # Create flow (blank or ZIP import)
│   └── [id]/
│       ├── page.tsx                          # Editor page (sidebar + content)
│       └── settings/page.tsx                 # 🟥 Phase G
│
├── components/
│   ├── layout/
│   │   └── nav-config.ts                     # ⚙️ UPDATED: adds Notebooks entry
│   │
│   └── features/notebook/
│       ├── editor/
│       │   ├── notebook-editor.tsx           # BlockNote + source toggle + autosave
│       │   ├── editor-toolbar.tsx            # Title input + save indicator + mode toggle
│       │   ├── source-editor.tsx             # Plain textarea for raw markdown
│       │   ├── word-count-footer.tsx         # Live word/char count + visibility toggle
│       │   └── index.ts                      # Barrel
│       │
│       ├── file-manager/
│       │   ├── notebook-sidebar.tsx          # Main left panel (header + tree + toolbar)
│       │   ├── section-node.tsx              # Recursive section row + drop target
│       │   ├── page-list-item.tsx            # Page row + multi-select + context menu
│       │   ├── page-card.tsx                 # Alt card layout for browse views
│       │   ├── search-bar.tsx                # Scoped search within notebook
│       │   ├── new-item-menu.tsx             # Create page/section dropdown
│       │   └── index.ts                      # Barrel
│       │
│       ├── notebooks/
│       │   ├── notebook-card.tsx             # Dashboard card with icon + page count
│       │   ├── notebook-grid.tsx             # Responsive grid + empty/loading states
│       │   ├── new-notebook-modal.tsx        # Create form (icon picker + name + desc)
│       │   ├── notebook-tag-badge.tsx        # Tag pill
│       │   └── index.ts                      # Barrel
│       │
│       ├── import/
│       │   ├── import-zip-button.tsx         # File picker → parse → trigger preview
│       │   ├── import-preview-modal.tsx      # Hierarchical tree + name/mode form
│       │   ├── import-md-handler.tsx         # Drag-drop overlay for MD files
│       │   ├── import-progress.tsx           # Progress bar with phase labels
│       │   └── index.ts                      # Barrel
│       │
│       ├── export/
│       │   ├── export-zip-button.tsx         # Per-notebook ZIP download trigger
│       │   ├── backup-restore-section.tsx    # Full-app backup/restore panel
│       │   ├── restore-confirm-modal.tsx     # Destructive action guard (typed confirm)
│       │   └── index.ts                      # Barrel
│       │
│       └── onboarding/                       # 🟥 Phase G
│           └── onboarding-modal.tsx
│
├── constants/
│   ├── notebook.ts                           # Defaults, limits, sample content, LS keys
│   ├── routes.ts                             # ⚙️ UPDATED: NOTEBOOKS routes
│   └── index.ts                              # ⚙️ UPDATED: re-export notebook constants
│
├── hooks/notebook/
│   ├── use-notebooks.ts                      # List + create/update/delete
│   ├── use-notebook.ts                       # Single notebook + sections + pages + tree
│   ├── use-sections.ts                       # Section action callbacks
│   ├── use-pages.ts                          # Page action callbacks
│   ├── use-current-page.ts                   # Single-page editor data with autosave
│   └── use-notebook-settings.ts              # App settings hook
│
├── lib/notebook/
│   ├── storage/
│   │   ├── db.ts                             # IndexedDB setup + singleton
│   │   ├── notebooks.ts                      # Notebook CRUD + cascade delete
│   │   ├── sections.ts                       # Section CRUD + reorder + cycle guard
│   │   ├── pages.ts                          # Page CRUD + move + bulk + duplicate
│   │   ├── tags.ts                           # Tag CRUD + cascade reference removal
│   │   ├── settings.ts                       # Settings get/update/reset
│   │   ├── backup.ts                         # buildBackup, restoreBackup, parseBackupJSON
│   │   └── index.ts                          # Barrel
│   │
│   ├── utils/
│   │   ├── slugify.ts                        # URL-safe slugs + uniqueness suffix
│   │   ├── sort.ts                           # Sort helpers + buildTree
│   │   ├── filename-utils.ts                 # Strip prefix, extract title, paths
│   │   └── frontmatter.ts                    # Parse + serialize YAML frontmatter
│   │
│   ├── validators.ts                         # Zod schemas for all forms
│   │
│   ├── import/
│   │   ├── md-parser.ts                      # Single MD file → ImportablePage
│   │   ├── zip-parser.ts                     # ZIP → ParsedZip (with preview tree)
│   │   └── importer.ts                       # Commit to storage (new / merge / replace)
│   │
│   └── export/
│       ├── exporter.ts                       # Orchestrator: load → build → download
│       ├── zip-builder.ts                    # Pure ZIP construction (JSZip)
│       ├── md-serializer.ts                  # Page → markdown string with frontmatter
│       ├── filename-builder.ts               # Safe filenames + numeric prefix + dedup
│       └── index.ts                          # Barrel
│
├── stores/
│   └── notebook-store.ts                     # Zustand: active IDs + multi-select
│
└── types/
    └── notebook.ts                           # All TypeScript types (contract lock)
```

### File Count Summary

| Layer | Files | Status |
|-------|-------|--------|
| Types | 1 | ✅ |
| Constants | 3 | ✅ |
| Stores | 1 | ✅ |
| Hooks | 6 | ✅ |
| Storage | 8 | ✅ |
| Utils + Validators | 5 | ✅ |
| Import (lib) | 3 | ✅ |
| Export (lib) | 5 | ✅ |
| Editor components | 5 (4 + barrel) | ✅ |
| File manager components | 7 (6 + barrel) | ✅ |
| Notebooks components | 5 (4 + barrel) | ✅ |
| Import components | 5 (4 + barrel) | ✅ |
| Export components | 4 (3 + barrel) | ✅ |
| Layout | 1 | ✅ |
| App routes | 3 | ✅ |
| **Phase A–F Total** | **62 files** | **✅ Built** |
| Phase G additions | ~3–4 files | 🟥 Planned |

---

## 7. Routing Map

### Current Routes (Phase A–F)

```
/notebooks                           List all notebooks (dashboard)
/notebooks/new                       Create flow (blank or ZIP import)
/notebooks/[id]                      Notebook editor (sidebar + content)
/notebooks/[id]?page=[pageId]        Editor with active page (deep-linkable)
```

### Planned Routes (Phase G+)

```
/notebooks/[id]/settings             Per-notebook settings
```

### Future Paid Routes (Phase I+)

```
/docs/[slug]                         Public Fumadocs-style 3-column docs
/docs/[slug]/[...path]               Public page within published notebook
```

### Sidebar Navigation Entry

Added to `mainNavItems` in `src/components/layout/nav-config.ts`:

```ts
{
  title: "Notebooks",
  href: ROUTES.NOTEBOOKS,
  icon: BookOpen,
}
```

Position: between `Dashboard` and `Overview`.

---

## 8. Phase Status Tracker

| Phase | Goal | Files | Status |
|-------|------|-------|--------|
| **A** | Foundation (types + storage + hooks + utils + store) | 22 | ✅ Complete |
| **B** | Notebooks dashboard + create flow | 7 | ✅ Complete |
| **C** | Notebook editor page + sidebar (file manager) | 8 | ✅ Complete |
| **D** | Editor integration (BlockNote + autosave) | 5 | ✅ Complete |
| **E** | Import flow (MD + ZIP with preview) | 8 | ✅ Complete |
| **F** | Export + backup/restore | 10 | ✅ Complete |
| **G** | Polish (onboarding + settings page + drag reorder + tags UI) | ~7 | 🟥 Planned |
| **H** | Sharing decision + implementation | TBD | 🟥 Planned |
| **I+** | Cloud sync + publish (paid features) | TBD | 🟥 Future |

---

## 9. Per-Phase Feature Breakdown

### Phase A — Foundation Maximalist

**Goal:** Build all non-UI infrastructure (zero React components). After Phase A, every subsequent phase consumes the locked contract.

**Delivered:**
- All TypeScript types (`Notebook`, `NotebookSection`, `NotebookPage`, `NotebookTag`, `NotebookSettings`, `NotebookBackup`)
- IndexedDB schema with 5 stores + indexes
- Full CRUD for notebooks, sections, pages, tags
- Cascade delete logic (notebook → sections → pages)
- Cycle-guard for section nesting
- Bulk operations (move, delete, reorder)
- Backup serialization + restoration
- Slug generation with uniqueness suffix
- YAML frontmatter parse/serialize (gray-matter)
- Filename utilities (numeric prefix detection, title extraction)
- 6 React hooks for UI consumption
- Zustand store for multi-select state
- Zod validators for all forms

**Verification:**
```ts
import { createNotebook, createSection, createPage, getNotebooks }
  from "@/lib/notebook/storage";

const nb = await createNotebook({ name: "Test" });
const sec = await createSection(nb.id, { name: "Intro" });
const page = await createPage(nb.id, { title: "Welcome", sectionId: sec.id });
await getNotebooks(); // [{ id, name, slug: "test", ... }]
```

---

### Phase B — Notebooks Dashboard

**Goal:** First user-facing surface. Users land on `/notebooks` and can create their first notebook.

**Delivered:**
- Responsive card grid (1/2/3 columns)
- Notebook card with icon, name, description, page count, last-updated relative time
- Hover-revealed 3-dot menu (Settings link + Delete)
- Delete confirmation dialog
- New Notebook modal (icon picker with 24 emojis + name + optional description)
- Dedicated `/notebooks/new` page with 2 entry options (blank / ZIP — ZIP wired in Phase E)
- Search by name + description (live filter)
- Empty state with prominent CTA
- Sidebar nav entry (`Notebooks` between Dashboard and Overview)
- Tag badge component (rendered but no CRUD UI yet — Phase G)

---

### Phase C — File Manager (Notebook Editor Sidebar)

**Goal:** Editing surface with full file management. Editor itself is placeholder (Phase D wires BlockNote).

**Delivered:**
- Three-pane layout: sidebar tree + editor area + (mobile sheet)
- Recursive section tree with collapse/expand
- Page rows with active highlight + multi-select checkbox
- Inline rename (double-click or context menu)
- Context menus per item (rename, duplicate, move, delete)
- Move-to submenu (lists all sections + root option)
- Section delete with strategy choice (orphan pages OR cascade)
- HTML5 drag-drop for pages onto sections
- Multi-select with shift-range, cmd/ctrl-toggle
- Bulk move toolbar (appears when items selected)
- Bulk delete with confirmation
- Search bar (filters tree to flat result list)
- Resizable sidebar (drag handle, persists width via settings)
- Mobile: sidebar in `Sheet` component triggered by hamburger
- Active page tracked via URL query (`?page=[id]`) for deep-linking

---

### Phase D — Editor Integration

**Goal:** Replace placeholder with real BlockNote editor + source mode + autosave.

**Delivered:**
- BlockNote visual editor with `@blocknote/mantine` styling
- Source mode (plain textarea, Tab → 2 spaces, no spellcheck)
- Lossless toggle: Visual → markdown (`blocksToMarkdownLossy`), Markdown → blocks (`tryParseMarkdownToBlocks`)
- Editor toolbar: title input + Saving/Saved indicator + Visual/Source toggle
- Word count footer with visibility toggle
- Auto-save with 500ms debounce
- Pending-save flush on:
  - Page switch (sidebar click)
  - Page create / duplicate
  - Page rename
  - Component unmount
- Editor re-mount on page switch (`<NotebookEditor key={page.id}>`) for clean state
- First-load markdown parsing fallback (for imported pages without BlockNote JSON)
- Theme detection: `.dark` class on `<html>` + system preference via `matchMedia`
- Click below content focuses cursor at end of last block
- Mobile-aware toolbar layout (hides labels on small screens)

---

### Phase E — Import (MD + ZIP with Preview)

**Goal:** Unlock the real workflow — bulk import existing markdown folders.

**Delivered:**

**Library layer (3 files):**
- `md-parser.ts` — Single file parsing with title resolution priority (frontmatter → H1 → filename)
- `zip-parser.ts` — Browser ZIP extraction via JSZip, builds `ParsedZip` with sections + pages + preview tree
- `importer.ts` — Commits to storage with progress callbacks (3 modes: new / merge / replace)

**UI layer (5 files):**
- `ImportZipButton` — File picker that triggers parsing
- `ImportPreviewModal` — Hierarchical tree + form (notebook name + icon picker OR merge/replace radio)
- `ImportMdHandler` — Drag-drop overlay for `.md` files (component ready, wiring deferred to Phase G)
- `ImportProgress` — Progress bar with phase labels
- Barrel export

**Key features:**
- Common prefix detection (strips `my-docs/` wrapper if present)
- Numeric prefix → order conversion (`01-intro` → order=1)
- Section folders auto-detected from directory structure
- Title from frontmatter `title` → first H1 → filename title-case
- Skip non-markdown + hidden + system files (with count display)
- Max 1000 files safety cap
- Friendly error messages (`invalid-zip`, `empty-zip`, `no-markdown`, `too-many-files`)
- Wired into `/notebooks/new` page (replaces Phase B "Soon" placeholder)

---

### Phase F — Export + Backup/Restore

**Goal:** Round-trip safety. Users can export notebooks as ZIP and full backup as JSON.

**Delivered:**

**Library layer (5 files):**
- `exporter.ts` — Orchestrator (load → build → download trigger)
- `zip-builder.ts` — Pure ZIP construction with section folder mapping
- `md-serializer.ts` — Page → markdown with frontmatter (via gray-matter)
- `filename-builder.ts` — Safe filename generation with numeric prefix + dedup
- Barrel export

**UI layer (4 files):**
- `ExportZipButton` — Per-notebook ZIP export (toast progress)
- `BackupRestoreSection` — Full-app backup panel (renders inline, not modal)
- `RestoreConfirmModal` — Destructive action guard (type `REPLACE ALL` to confirm)
- Barrel export

**Key features:**
- Round-trip integrity (export → import = identical tree modulo IDs)
- Section folders mirror tree hierarchy
- Numeric prefixes on filenames preserve sibling order (`01-overview.md`, `02-intro.md`)
- Filename dedup within same folder (`name.md`, `name-2.md`, ...)
- Empty sections preserved in ZIP
- Compression level 6 (balanced size/speed)
- JSZip generation progress reported
- Full backup JSON includes everything: notebooks + sections + pages + tags + settings
- Restore replaces ALL existing data (no merge mode — by design, simpler mental model)
- Destructive confirm requires typing `REPLACE ALL` (not just clicking)
- Pre-restore preview shows what's in backup + what will be lost

---

### Phase G — Polish (Planned)

**Goal:** First-time UX + remaining polish items.

**Planned features:**
- `OnboardingModal` — First-time welcome with sample notebook creation option
- `/notebooks/[id]/settings/page.tsx` — Per-notebook rename, icon change, tag management
- `NotebookTagsFilter` — Wire tag filter UI into dashboard
- Tag CRUD UI (create, color picker, edit, delete)
- Drag-drop reordering for pages within a section
- Drag-drop reordering for sections
- Drop position indicators (above/inside/below)
- Wire `BackupRestoreSection` into `/settings` page
- Wire `ImportMdHandler` into notebook detail page
- Wire `ImportPreviewModal` "merge into existing" mode
- Refined empty states throughout

**Estimated files:** ~7

---

### Phase H — Sharing (TBD)

**Decision point:** Two approaches under consideration.

**Option A — Per-page encrypted share link** (Markpad-style)
- URL: `/share/[encrypted-token]`
- Single page, ephemeral, no auth required
- Pros: Quick sharing, no friction
- Cons: Limited to one page at a time

**Option B — Per-notebook share-link** (whole docs site)
- URL: `/docs/[slug]`
- Full notebook navigable
- Pros: Better UX for documentation use case
- Cons: Need cloud sync (paid feature territory)

**Recommendation:** Discuss before Phase G completion.

---

### Phase I+ — Cloud Sync + Publish (Paid)

**Future scope:**
- Supabase backend for cloud sync
- Public notebooks via `/docs/[slug]` with Fumadocs 3-column layout
- TOC auto-generation
- Custom domain support
- Analytics (paid tier add-on)

---

## 10. Storage API Contract

> All functions in `@/lib/notebook/storage` are async and return Promises.

### Notebooks

```ts
getNotebooks(): Promise<Notebook[]>
getNotebook(id: string): Promise<Notebook | undefined>
getNotebookBySlug(slug: string): Promise<Notebook | undefined>
createNotebook(input: CreateNotebookInput): Promise<Notebook>
updateNotebook(id: string, updates: UpdateNotebookInput): Promise<Notebook>
touchNotebook(id: string): Promise<void>
deleteNotebook(id: string): Promise<void>  // cascade deletes sections + pages
getNotebookPageCount(notebookId: string): Promise<number>
getNotebookSectionCount(notebookId: string): Promise<number>
```

### Sections

```ts
getSections(notebookId: string): Promise<NotebookSection[]>
getSection(id: string): Promise<NotebookSection | undefined>
getChildSections(notebookId: string, parentId: string | null): Promise<NotebookSection[]>
createSection(notebookId: string, input: CreateSectionInput): Promise<NotebookSection>
updateSection(id: string, updates: UpdateSectionInput): Promise<NotebookSection>
reorderSections(updates: ReorderInput[]): Promise<void>
deleteSection(id: string, pageStrategy?: "orphan" | "delete"): Promise<void>
```

### Pages

```ts
getPages(notebookId: string): Promise<NotebookPage[]>
getPage(id: string): Promise<NotebookPage | undefined>
getPagesInSection(notebookId: string, sectionId: string | null): Promise<NotebookPage[]>
searchPages(notebookId: string, query: string): Promise<NotebookPage[]>
createPage(notebookId: string, input?: CreatePageInput): Promise<NotebookPage>
updatePage(id: string, updates: UpdatePageInput): Promise<NotebookPage>
movePages(pageIds: string[], targetSectionId: string | null): Promise<void>
reorderPages(updates: { id: string; order: number }[]): Promise<void>
deletePage(id: string): Promise<void>
deletePages(ids: string[]): Promise<void>
duplicatePage(id: string): Promise<NotebookPage>
```

### Tags

```ts
getTags(): Promise<NotebookTag[]>
getTag(id: string): Promise<NotebookTag | undefined>
createTag(name: string, color?: string): Promise<NotebookTag>
updateTag(id: string, updates: Partial<Pick<NotebookTag, "name" | "color">>): Promise<NotebookTag>
deleteTag(id: string): Promise<void>  // cascade removes from notebooks
getNotebooksByTag(tagId: string): Promise<Notebook[]>
```

### Settings

```ts
getSettings(): Promise<NotebookSettings>
updateSettings(updates: Partial<NotebookSettings>): Promise<NotebookSettings>
resetSettings(): Promise<NotebookSettings>
```

### Backup

```ts
getAllData(): Promise<AllNotebookData>
buildBackup(): Promise<NotebookBackup>
isValidBackup(obj: unknown): obj is NotebookBackup
restoreBackup(backup: NotebookBackup, merge?: boolean): Promise<{
  notebooks: number; sections: number; pages: number; tags: number;
}>
getBackupFilename(): string
parseBackupJSON(content: string): NotebookBackup  // throws on invalid
```

### DB Utilities

```ts
getDB(): Promise<IDBPDatabase<NotebookDB>>
deleteDB(): Promise<void>
clearAllData(): Promise<void>
```

---

## 11. Hooks API Contract

### `useNotebooks()`

```ts
{
  notebooks: Notebook[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createNotebook: (input: CreateNotebookInput) => Promise<Notebook>;
  updateNotebook: (id: string, updates: UpdateNotebookInput) => Promise<Notebook>;
  removeNotebook: (id: string) => Promise<void>;
}
```

### `useNotebook(notebookId: string | null)`

```ts
{
  notebook: Notebook | null;
  sections: NotebookSection[];
  pages: NotebookPage[];
  tree: TreeNode[];                // built hierarchy
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refresh: () => Promise<void>;
}
```

### `useSections(onMutate?: () => void | Promise<void>)`

```ts
{
  createSection: (notebookId: string, input: CreateSectionInput) => Promise<NotebookSection>;
  updateSection: (id: string, updates: UpdateSectionInput) => Promise<NotebookSection>;
  reorderSections: (updates: ReorderInput[]) => Promise<void>;
  deleteSection: (id: string, pageStrategy?: "orphan" | "delete") => Promise<void>;
}
```

### `usePages(onMutate?: () => void | Promise<void>)`

```ts
{
  createPage: (notebookId: string, input?: CreatePageInput) => Promise<NotebookPage>;
  updatePage: (id: string, updates: UpdatePageInput) => Promise<NotebookPage>;
  movePages: (pageIds: string[], targetSectionId: string | null) => Promise<void>;
  reorderPages: (updates: { id: string; order: number }[]) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  deletePages: (ids: string[]) => Promise<void>;
  duplicatePage: (id: string) => Promise<NotebookPage>;
  searchPages: (notebookId: string, query: string) => Promise<NotebookPage[]>;
}
```

### `useCurrentPage(pageId: string | null)`

```ts
{
  page: NotebookPage | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  scheduleSave: (updates: UpdatePageInput) => void;  // debounced
  flushSave: () => Promise<void>;                     // immediate
  refresh: () => Promise<void>;
}
```

> ⚠️ **Note:** `useCurrentPage` is a standalone hook. The notebook editor page (`/notebooks/[id]/page.tsx`) uses inline save logic instead, so that saves trigger `useNotebook.refresh()` and update the sidebar in real-time.

### `useNotebookSettings()`

```ts
{
  settings: NotebookSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<NotebookSettings>) => Promise<NotebookSettings>;
  resetSettings: () => Promise<NotebookSettings>;
}
```

### `useNotebookStore()` (Zustand)

```ts
{
  // State
  activeNotebookId: string | null;
  activePageId: string | null;
  selectedPageIds: string[];
  selectedSectionIds: string[];

  // Actions
  setActiveNotebookId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
  togglePageSelection: (id: string) => void;
  selectPages: (ids: string[]) => void;
  setSelectedPageIds: (ids: string[]) => void;
  clearPageSelection: () => void;
  toggleSectionSelection: (id: string) => void;
  selectSections: (ids: string[]) => void;
  setSelectedSectionIds: (ids: string[]) => void;
  clearSectionSelection: () => void;
  reset: () => void;
}
```

---

## 12. Production Readiness Checklist

### ✅ Architecture

- [x] Brand-agnostic code naming (rebrand without refactor)
- [x] Clear separation: types ↔ storage ↔ hooks ↔ components
- [x] Contract lock on data model (Section 5)
- [x] Barrel exports for all component folders
- [x] Path alias `@/` consistently used
- [x] Server/client component boundaries correct (`'use client'` where needed)
- [x] Cloud-sync-ready (swap storage layer without touching hooks)

### ✅ Data Layer

- [x] IndexedDB with proper schema versioning
- [x] Singleton DB connection pattern
- [x] SSR-safe (`typeof window` guard in `getDB`)
- [x] Transactional writes for cascade operations
- [x] Cycle prevention in section nesting
- [x] Cascade delete logic (notebook → sections → pages)
- [x] Backup version field for forward compatibility
- [x] Schema validation on restore (`isValidBackup`)

### ✅ Error Handling

- [x] Try/catch on all storage operations in UI handlers
- [x] User-friendly toast notifications (sonner)
- [x] Console errors logged with context prefix (`[NotebookPage]`, `[Importer]`, etc.)
- [x] Defensive null checks throughout
- [x] Graceful frontmatter parse failure (returns raw content)

### ✅ UX

- [x] Loading states (spinners, skeletons)
- [x] Empty states with CTAs
- [x] Confirmation dialogs for destructive actions
- [x] Auto-save with visible indicator
- [x] Optimistic UI updates
- [x] Mobile-responsive layouts
- [x] Keyboard shortcuts (Tab in source editor, Enter/Escape in rename)
- [x] Accessible roles (`treeitem`, `aria-selected`, `aria-expanded`)
- [x] Theme support (light/dark/system)

### ✅ Performance

- [x] Debounced auto-save (500ms)
- [x] Debounced settings persistence (sidebar width: 300ms)
- [x] `useMemo` on tree building + filtering
- [x] Editor re-mount only on page switch (not on every prop change)
- [x] Lazy page count fetching per card

### 🟡 Recommended Before Production Deploy

- [ ] Add `beforeunload` warning if pending unsaved changes exist
- [ ] Add IndexedDB quota error handling (storage full)
- [ ] Add error boundaries around editor + sidebar
- [ ] Add telemetry/error reporting (Sentry or similar)
- [ ] Add e2e tests for critical paths (create → edit → save → reload)
- [ ] Add image attachment handling (currently broken on import — see Phase E limitations)
- [ ] Add bundle analysis (`@next/bundle-analyzer`)
- [ ] Add PWA manifest + service worker (offline support)

### 🟥 Phase G Polish

- [ ] Onboarding modal
- [ ] Per-notebook settings page
- [ ] Tag CRUD UI
- [ ] Tag filter wiring in dashboard
- [ ] Drag-drop reordering (pages + sections)
- [ ] `BackupRestoreSection` wiring into settings page
- [ ] `ImportMdHandler` wiring into notebook detail page

---

## 13. Merge Strategy

### Pre-Merge Validation

1. **Verify `ROADMAP/src/` structure matches Section 6** — should already be aligned post-audit
2. **Install dependencies in main project:**
   ```bash
   cd d:\MOBILE-WEB-APP\MARKDOWN-EDITOR
   pnpm add @blocknote/core @blocknote/react @blocknote/mantine
   pnpm add idb uuid jszip gray-matter
   pnpm add -D @types/uuid
   ```
3. **Install shadcn components:**
   ```bash
   pnpm dlx shadcn@latest add \
     alert-dialog button card dialog dropdown-menu \
     form input label progress radio-group sheet \
     textarea
   ```

### Files That Will REPLACE Existing Files

⚠️ **Backup these before merging:**

| File | Reason |
|------|--------|
| `src/constants/routes.ts` | Phase A adds `NOTEBOOKS` routes |
| `src/constants/index.ts` | Phase A adds notebook constants re-export |
| `src/components/layout/nav-config.ts` | Phase B adds `Notebooks` sidebar entry |

If you have custom modifications to these files, merge manually instead of overwriting.

### Files That Are NEW (No Conflict Risk)

Everything under these paths is brand-new namespace:
- `src/types/notebook.ts`
- `src/lib/notebook/**/*`
- `src/hooks/notebook/**/*`
- `src/stores/notebook-store.ts`
- `src/constants/notebook.ts`
- `src/app/(dashboard)/notebooks/**/*`
- `src/components/features/notebook/**/*`

### Recommended Merge Order

Per-phase, with smoke test after each:

1. **Phase A** (foundation) → verify with console snippet in Section 9
2. **Phase B** (dashboard) → visit `/notebooks`, create a notebook
3. **Phase C** (sidebar) → click notebook, create section + page
4. **Phase D** (editor) → type in editor, verify autosave + theme
5. **Phase E** (import) → upload test ZIP, verify preview + import
6. **Phase F** (export) → export the notebook, verify round-trip via re-import

### Post-Merge Wiring (Phase F Component Activation)

Add to `src/app/(dashboard)/settings/page.tsx` (or wherever appropriate):

```tsx
import { BackupRestoreSection } from "@/components/features/notebook/export";

// In your settings page JSX:
<BackupRestoreSection onRestored={() => router.refresh()} />
```

Add `ExportZipButton` to notebook card dropdown menu (Phase B file: `notebook-card.tsx`):

```tsx
import { ExportZipButton } from "@/components/features/notebook/export";

// In the dropdown menu:
<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
  <ExportZipButton
    notebookId={notebook.id}
    notebookName={notebook.name}
    variant="ghost"
    size="sm"
    className="w-full justify-start"
  />
</DropdownMenuItem>
```

---

## 14. Free vs Paid Tier

| Feature | Free | Paid |
|---------|:----:|:----:|
| BlockNote editor (visual + source) | ✅ | ✅ |
| Notebook + Section + Page structure | ✅ | ✅ |
| Unlimited notebooks (client-side) | ✅ | ✅ |
| ZIP import with auto-section detection | ✅ | ✅ |
| ZIP export per notebook | ✅ | ✅ |
| Full-app JSON backup/restore | ✅ | ✅ |
| IndexedDB local storage | ✅ | ✅ |
| Theme (light/dark/system) | ✅ | ✅ |
| PWA offline support | ✅ | ✅ |
| **Cloud sync (Supabase)** | ❌ | ✅ |
| **Multi-device sync** | ❌ | ✅ |
| **Publish to public URL** (`/docs/[slug]`) | ❌ | ✅ |
| **Fumadocs 3-column public render** | ❌ | ✅ |
| **TOC auto-generation** | ❌ | ✅ |
| **Custom domain** | ❌ | ✅ (future) |
| **Analytics on published docs** | ❌ | ✅ (future) |

**Pricing strategy (TBD):** Likely flat monthly for paid features, no per-notebook limit. Free tier remains fully functional offline.

---

## 15. Open Decisions

These need resolution before respective phases:

| Question | Phase | Status |
|----------|-------|--------|
| Per-page encrypted share OR per-notebook public URL? | H | TBD |
| Numeric prefix display in sidebar: stripped or visible? | G | TBD |
| Drag-drop reordering: implement before or after Phase H? | G | TBD |
| Notebook icon: emoji-only (current), add lucide icons too? | G | TBD |
| Onboarding sample content: ship with imported example notebook? | G | TBD |
| Trial limit for paid tier? Notebook count or feature-only? | I+ | TBD |
| Sidebar position: left only (current) or toggleable like VSCode? | G | TBD |

---

## 16. Context Handoff Template

When a chat session approaches token limits, paste this into a fresh session:

```
Gw lagi build VibesDoc (brand) — notebook-based markdown editor
di Next.js 16 SaaS boilerplate.

Code naming: "notebook" prefix (brand-agnostic).

[Paste sections needed:]
- Section 2: Naming Convention
- Section 5: Data Model (CONTRACT LOCK — most important)
- Section 6: Final File Structure
- Section 8: Phase Status Tracker
- Section 10: Storage API Contract
- Section 11: Hooks API Contract

[Plus the phase I'm currently building:]
- Section 9: [Phase X details]

Status: Phase X — [name]
Phases complete: A, B, C, D, E, F
Last instruction from me: [paste]

Continue with same naming + contract.
```

**Tip:** Once a phase ships, the source code itself is part of the contract. Reference completed source files in handoff — new chats consume rather than reinvent.

---

## Appendix A — Migration from Markpad (Legacy)

For reference if porting old Markpad data:

| Markpad (legacy) | VibesDoc (new) | Migration Notes |
|------------------|----------------|-----------------|
| `MarkpadDocument` | `NotebookPage` | + `notebookId`, + `frontmatter`, + `order` |
| `Folder` | `NotebookSection` | + `notebookId` |
| `Tag` (per-doc) | `NotebookTag` (per-notebook) | Reframe semantics |
| `AppSettings` | `NotebookSettings` | + 3 new fields |
| `WorkspaceBackup` | `NotebookBackup` | + `notebooks` array |
| `getAllDocuments()` | `getPages(notebookId)` | Scoped per notebook |
| IndexedDB `markpad` | IndexedDB `notebook-db` | Fresh DB, no auto-migration |
| Vite + React Router | Next.js 16 App Router | RSC-aware |

---

## Appendix B — Known Limitations

### Image References in Imported Markdown

Markdown files often contain image refs like `![](./image.png)`. The importer reads MD as-is but does **not** extract image files from the ZIP. References to images will be broken in imported pages.

**Workaround (manual):** Embed images as base64 in markdown before importing.
**Planned fix (Phase G+):** Extract images + store as base64 in IndexedDB, or warn user pre-import.

### Large ZIP Performance

Parsing happens entirely in-browser. ZIPs with hundreds of files may take several seconds. Progress bar covers commit phase only (parse phase has no progress reporting).

**Mitigation:** 1000-file safety cap with friendly error message.

### Single-Device Storage

IndexedDB is per-browser. No multi-device sync without paid cloud feature.

### Browser Refresh During Typing

If user refreshes within 500ms of last keystroke, the most recent typing is lost (debounce window). No `beforeunload` warning yet — listed in Phase G polish.

### No Collaborative Editing

Single-user only. Multi-user real-time editing is future scope (post-Phase I).

---

**End of Roadmap.** Last updated when Phase F shipped.