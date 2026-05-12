# VibesDoc Phase E — Import (MD + ZIP with Preview)

**Status:** ✅ Complete (8 new files + 1 page REPLACE)

This phase unlocks the **real workflow**: users can upload a folder of
markdown files as a ZIP, and the app auto-detects sections from folder
structure. Or drop individual .md files into an existing notebook.

After Phase E, the user can:
- Upload a ZIP file from `/notebooks/new` → preview the detected tree
- See suggested notebook name from ZIP folder/filename
- Customize notebook name + icon before committing
- See ignored files (non-markdown) listed clearly
- Get live progress during import
- Commit → notebook created, redirected to it
- (Component ready) Drag-drop `.md` files into a notebook (wiring in
  Phase F+ since current notebook page doesn't yet integrate this)

---

## What's Included

### Lib (3 files)
- `src/lib/notebook/import/md-parser.ts` — Parse single MD file with
  frontmatter, title resolution (frontmatter.title → H1 → filename)
- `src/lib/notebook/import/zip-parser.ts` — Parse ZIP via JSZip, detect
  folder structure, build preview tree, suggest notebook name
- `src/lib/notebook/import/importer.ts` — Commit parsed data to storage,
  with progress callbacks

### Components (5 files)
- `src/components/features/notebook/import/import-zip-button.tsx` —
  File picker button that triggers ZIP parsing
- `src/components/features/notebook/import/import-preview-modal.tsx` —
  Modal showing tree preview + notebook name/icon form + ignored files
- `src/components/features/notebook/import/import-md-handler.tsx` —
  Drop-zone wrapper for drag-drop MD files (ready for Phase F+ wiring)
- `src/components/features/notebook/import/import-progress.tsx` —
  Progress bar with phase labels
- `src/components/features/notebook/import/index.ts` — Barrel export

### Page Update (1 file — REPLACE)
- `src/app/(dashboard)/notebooks/new/page.tsx` — REPLACE Phase B version.
  Wires the ZIP import flow (was "Soon" placeholder).

---

## Prerequisites

### Phase A + B + C + D must be installed

Phase E depends on:
- Phase A: storage layer + utilities (slugify, filename-utils, frontmatter)
- Phase A: types (ImportPreviewNode, ImportResult)
- Phase B: NewNotebookModal, NotebookGrid
- ROUTES, DEFAULT_NOTEBOOK_ICON constants

### Dependencies

Phase A already installed `jszip` and `gray-matter` per the README instructions.
If you skipped them:

```bash
pnpm add jszip gray-matter
pnpm add -D @types/jszip   # optional, JSZip ships types
```

### Shadcn components

One NEW component for Phase E:

```bash
pnpm dlx shadcn@latest add progress
```

Full list of shadcn UI components used (most from earlier phases):
- `button`, `card`, `dialog`, `input`, `label`, `progress`, `radio-group`

---

## Installation

### 1. Extract the ZIP

Copy `phase-e/src/` into your project, merging with existing structure.

### 2. Install `progress` component (if missing)

```bash
pnpm dlx shadcn@latest add progress
```

### 3. Heads up on page replacement

`src/app/(dashboard)/notebooks/new/page.tsx` is a **REPLACE** of the
Phase B version. The new file wires ZIP import flow into the right card
(replacing the "Soon" placeholder).

### 4. Verify

Start dev server, then:

1. Go to `/notebooks/new` (or from dashboard → empty state → "Or import from ZIP")
2. ✅ "Import from ZIP" card now has a "Choose ZIP file" button
3. Prepare a test ZIP — e.g. create folder `test-docs/` with:
   ```
   test-docs/
   ├── 01-intro/
   │   ├── overview.md
   │   └── getting-started.md
   ├── 02-guides/
   │   ├── basics.md
   │   └── advanced.md
   └── readme.md
   ```
4. Zip it: `zip -r test-docs.zip test-docs/`
5. Click "Choose ZIP file" → select your ZIP
6. ✅ Preview modal opens showing:
   - Suggested name: "Test Docs"
   - Icon picker
   - Tree preview with expanded sections
   - Page counts per section
7. Edit name if desired → click "Import N pages"
8. ✅ Progress bar shows phases: notebook → sections → pages
9. ✅ Toast: "Imported N pages into 'Test Docs'"
10. ✅ Redirected to `/notebooks/[newId]` showing the imported content

---

## Architecture Notes

### Two-phase import (parse → preview → commit)

We deliberately split parsing from committing:

```
File selected → parseZipFile() → ParsedZip data
              → User confirms in preview modal
              → importZipAsNewNotebook() → storage writes
```

This lets the user **see what will be imported** before any data is
written. The preview tree is hierarchical (expandable folders), shows
page counts, and surfaces ignored files.

### Folder structure → section hierarchy

```
my-docs/                      → Notebook "My Docs"
├── 01-intro/                 → Section "Intro" (order=1)
│   ├── overview.md           → Page "Overview" (order=1)
│   └── guide.md              → Page "Guide" (order=2)
└── api/                      → Section "Api" (order=2)
    └── reference.md          → Page "Reference"
```

Numeric prefixes (`01-`, `02-`) are extracted for ordering and stripped
from display names.

### Common prefix detection

If ALL files share a top-level folder (`my-docs/...`), it's treated as the
ZIP wrapper and stripped. The first level **inside** becomes root sections.

If the ZIP has files at multiple top levels (or files at the root level),
no prefix is stripped.

### Title resolution priority

For each markdown file, the page title is determined by:

1. `title` field in YAML frontmatter
2. First H1 (`# Heading`) in content
3. Filename converted to title case (numeric prefix stripped)

This handles imports from various sources (Obsidian vaults, Hugo blogs,
plain markdown folders).

### Ignored files

Files skipped (not imported):
- Non-markdown (`.png`, `.pdf`, `.js`, etc.)
- Hidden files (start with `.`)
- System files (`__MACOSX/`, `Thumbs.db`, `desktop.ini`)
- Files inside hidden directories

The preview modal shows count + first 3 names.

### Safety limits

- **MAX_FILES = 1000** — ZIPs exceeding this are rejected
- Empty ZIP → rejected
- Invalid/corrupted ZIP → rejected
- ZIP with no markdown files → rejected

User-friendly error messages via `getZipErrorMessage()`.

### Progress callbacks

The importer accepts an `onProgress` callback fired during:
- preparing
- creating-notebook
- creating-sections (with N/M counter)
- cleaning (replace mode only)
- creating-pages (with N/M counter)
- done

The preview modal displays this via the `ImportProgress` component.

### Replace mode safety

In `mode: "replace"`, the importer first deletes ALL existing sections
and pages in the target notebook (preserving the notebook itself). This
is a destructive operation — the preview modal shows a clear warning
with red styling.

---

## What's NOT in this phase

- **Import into existing notebook** flow isn't wired into the notebook
  detail page yet (component is ready though — see "Future wiring")
- **Drag-drop MD files into notebook sidebar** — handler is built but
  not yet attached to the notebook page
- **Export** — see Phase F
- **TOC generation, Fumadocs-style render** — paid publish phase

### Future wiring for "into existing notebook"

To enable importing into an existing notebook (Phase F or G polish), add to
`src/app/(dashboard)/notebooks/[id]/page.tsx`:

```tsx
import { ImportZipButton, ImportPreviewModal, ImportMdHandler } from
  "@/components/features/notebook/import";
import { importZipIntoNotebook, importMarkdownFilesIntoNotebook } from
  "@/lib/notebook/import/importer";

// In your component:
const [parsedZip, setParsedZip] = useState<ParsedZip | null>(null);

// Wrap content area in <ImportMdHandler onImport={...}>
// Add "Import" button somewhere (sidebar header or page menu)
// Use ImportPreviewModal with mode={{ kind: "into", notebookName: notebook.name }}
// Call importZipIntoNotebook() on confirm
```

---

## Known Limitations

### Frontmatter formats
Only YAML frontmatter is parsed (the default `gray-matter` behavior).
TOML and JSON frontmatter pass through but won't be extracted as structured
data. The raw frontmatter delimiter block stays in the content.

### Image references in markdown
Markdown files may contain image references like `![](./image.png)`.
We import the markdown as-is — image files are NOT extracted from the ZIP.
The image references will be broken in the imported pages. A future
phase could:
- Extract images, store as base64 in IndexedDB
- Or warn the user about image references

### Large ZIPs
Parsing happens entirely in the browser. ZIPs with hundreds of files +
large content may take several seconds. The progress bar covers commit
phase but not parse phase (parse is fast for typical sizes).

### Encoding
ZIP files are read as UTF-8 strings. Non-UTF-8 markdown files may have
encoding artifacts.

---

## Next: Phase F — Export + Backup/Restore

Will add:
- Export per-notebook as ZIP (mirror of import — sections become folders)
- Round-trip preservation (export → import = identical structure)
- JSON backup of ALL notebooks for full-app backup/restore
- Settings page integration for backup/restore buttons
