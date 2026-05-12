# VibesDoc Phase D — Editor Integration (BlockNote)

**Status:** ✅ Complete (4 new editor files + 1 page update + 1 barrel)

This phase wires up the real **markdown editor** to replace the placeholder
shown in Phase C. The notebook page is now a fully functional editing surface.

After Phase D, the user can:
- Click a page in the sidebar → see it open in the BlockNote visual editor
- Toggle between **Visual** mode (BlockNote rich editor) and **Source** mode
  (raw markdown textarea)
- Type to edit — changes auto-save 500ms after the last keystroke
- See "Saving…" / "Saved" indicator in the toolbar
- See live word + character count in the footer
- Toggle word count visibility via the eye icon
- Type in the title input — also auto-saves and reflects in sidebar
- Switch between pages without losing edits (pending flushes before nav)
- Theme follows light/dark mode automatically (system or `.dark` class)

---

## What's Included

### New Components (4 files)
- `src/components/features/notebook/editor/notebook-editor.tsx` — Main editor
  with BlockNote + source toggle, owns all editor-local state
- `src/components/features/notebook/editor/editor-toolbar.tsx` — Title input,
  save indicator, Visual/Source mode toggle
- `src/components/features/notebook/editor/source-editor.tsx` — Plain
  textarea with monospace font, Tab→2 spaces handling
- `src/components/features/notebook/editor/word-count-footer.tsx` — Sticky
  footer with word/char count + visibility toggle

### Barrel (1 file)
- `src/components/features/notebook/editor/index.ts`

### Page Update (1 file — REPLACE)
- `src/app/(dashboard)/notebooks/[id]/page.tsx` — REPLACE Phase C version.
  Now wires `NotebookEditor` + inline debounced save logic.

---

## Prerequisites

### Phase A + B + C must be installed

Phase D depends on:
- All Phase A storage / hooks / types
- `NotebookSidebar` from Phase C
- `FullPageLoader` from `@/components/shared`
- ROUTES constants

### Dependencies

These should already be installed if you followed the Phase A README:

```bash
pnpm add @blocknote/core @blocknote/react @blocknote/mantine
```

If `@blocknote/*` is missing in your project, install now.

### Shadcn components

No new shadcn components — same as Phase C (`button`, `sheet`).

---

## Installation

### 1. Extract the ZIP

Copy `phase-d/src/` into your project, merging with existing structure.

### 2. Heads up on page replacement

`src/app/(dashboard)/notebooks/[id]/page.tsx` is a **REPLACE** of the
Phase C version. The new file inlines a debounced save mechanism that
replaces the placeholder editor.

### 3. Verify

Start dev server, then:

1. Open a notebook (`/notebooks/[id]`)
2. Click a page → editor opens
3. ✅ Title input at top, mode toggle in toolbar, footer at bottom
4. Type in editor — see word count update live
5. Stop typing for 500ms — see "Saving…" → "Saved" indicator
6. Refresh page → content persists
7. Toggle to "Source" mode → see raw markdown
8. Edit raw markdown → "Saved" fires
9. Toggle back to "Visual" → markdown parsed into blocks
10. Type title → see it sync to sidebar after debounce
11. Rename from sidebar → editor title updates
12. Switch pages quickly → no edits lost (pending flushed)

---

## Architecture Notes

### Save mechanism — inline in page, not via `useCurrentPage`

We deliberately **don't** use `useCurrentPage` from Phase A here. Why:
- `useCurrentPage` is a standalone editor hook with its own data fetching
- This page already loads all pages via `useNotebook()` for the sidebar
- Saving via `useCurrentPage` would update its internal page state but NOT
  trigger the notebook's refresh — sidebar would show stale data
- Inline save logic + `refresh()` keeps sidebar + editor in sync

The inline mechanism uses:
- `pendingRef: { [field]: value }` — accumulates partial updates
- `timerRef` — 500ms debounce
- `editingPageIdRef` — tracks which page the pending edits belong to
- `flushSave()` — commits pending + triggers `refresh()`
- `scheduleSave(updates)` — merges into pending, resets debounce

### Mode switch flow

**Visual → Source:**
1. Extract markdown via `editor.blocksToMarkdownLossy()`
2. Set local `markdown` state
3. Flush pending save
4. Switch mode

**Source → Visual:**
1. Parse markdown via `editor.tryParseMarkdownToBlocks()`
2. Replace BlockNote blocks
3. Schedule save with parsed blocks + markdown
4. Flush
5. Switch mode

The flush on switch is intentional — ensures DB state matches UI state
before BlockNote re-parses, preventing data loss if the parse fails.

### Theme detection

Editor watches:
1. `.dark` class on `<html>` element (via `MutationObserver`)
2. System preference (`prefers-color-scheme: dark` media query)

Whichever resolves to "dark" first wins. Result passed to
`<BlockNoteView theme={resolvedTheme}>`.

This works regardless of whether your boilerplate uses `next-themes`
or just CSS variables — we don't impose a theme system.

### Editor re-mount on page switch

`<NotebookEditor key={activePage.id}>` — when the user clicks a different
page, the editor unmounts (flushing pending saves) and remounts fresh
with the new page's content. This is simpler than imperatively syncing
state and avoids stale BlockNote internals.

### First-load markdown parsing

For imported pages (Phase E future) that have `content` (markdown string)
but no `blockNoteContent` (BlockNote JSON), the editor parses markdown into
blocks on first mount. Includes a safety check that the editor is empty
before replacing — prevents clobbering user input if a race occurs.

---

## What's NOT in this phase

- **Markdown import (.md or ZIP)** → Phase E
- **Export (per-notebook ZIP)** → Phase F
- **Frontmatter editing UI** → Future polish (frontmatter is parsed/stored
  but no UI to edit it yet)
- **Code block syntax highlighting customization** → BlockNote defaults used
- **Slash commands / custom blocks** → BlockNote defaults

---

## Known Limitations

### `blocksToMarkdownLossy` called on every keystroke
Each BlockNote `onChange` fires markdown serialization. For large pages
(>10k chars) this might cause minor lag. Acceptable for typical use.
Future optimization: debounce the serialization itself, only run on flush.

### No collaborative editing
Single-device only. Phase ? (paid feature) will add Supabase realtime sync.

### Browser refresh during typing
If user refreshes within 500ms of last keystroke, the most recent typing is
lost. Auto-save isn't immediate. Browser `beforeunload` warning is a future
polish addition.

---

## Next: Phase E — Import (MD + ZIP)

Will add:
- Drag-drop `.md` files to import as new pages
- Upload ZIP with folder structure → auto-create sections + pages
- Preview modal showing the import tree before commit
- Merge vs replace modes
- Numeric prefix detection (`01-`, `02-`) for ordering
- Frontmatter parsing on import
