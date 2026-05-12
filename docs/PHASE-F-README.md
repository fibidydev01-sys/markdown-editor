# 🔧 Roadmap Fixes — Replace Guide

**Target directory:** `d:\MOBILE-WEB-APP\MARKDOWN-EDITOR\ROADMAP`

This ZIP contains **11 fixed files** organized by phase. Replace the matching files in your `ROADMAP/` folder before copying to `src/`.

---

## 📋 Quick Replace Map

| ZIP Path | Replace In Your Project |
|----------|------------------------|
| `phase-c/src/components/features/notebook/file-manager/page-list-item.tsx` | `ROADMAP/phase-c/src/components/features/notebook/file-manager/page-list-item.tsx` |
| `phase-e/src/lib/notebook/import/importer.ts` | `ROADMAP/phase-e/src/lib/notebook/import/importer.ts` |
| `phase-f/src/lib/notebook/export/exporter.ts` | **NEW** — Create `ROADMAP/phase-f/src/lib/notebook/export/exporter.ts` |
| `phase-f/src/lib/notebook/export/zip-builder.ts` | **NEW** — Create at same path |
| `phase-f/src/lib/notebook/export/md-serializer.ts` | **NEW** — Create at same path |
| `phase-f/src/lib/notebook/export/filename-builder.ts` | **NEW** — Create at same path |
| `phase-f/src/lib/notebook/export/index.ts` | **NEW** — Create at same path |
| `phase-f/src/components/features/notebook/export/export-zip-button.tsx` | **NEW** — Create at same path |
| `phase-f/src/components/features/notebook/export/backup-restore-section.tsx` | **NEW** — Create at same path |
| `phase-f/src/components/features/notebook/export/restore-confirm-modal.tsx` | **NEW** — Create at same path |
| `phase-f/src/components/features/notebook/export/index.ts` | **NEW** — Create at same path |

---

## ⚠️ Phase F: Delete Old `1/` and `2/` Folders

After copying the new `phase-f/src/` structure, **delete the old folders**:

```
ROADMAP/phase-f/1/   ← DELETE
ROADMAP/phase-f/2/   ← DELETE
```

Old folder structure was ambiguous (mixed lib + components). New structure follows the roadmap path convention:
- `src/lib/notebook/export/` for pure data layer
- `src/components/features/notebook/export/` for React components

---

## 🐛 What Was Fixed

### 🔴 Phase F Critical Bugs (would crash at runtime)

1. **`exporter.ts`** — Fixed `backup.data.notebooks` → `backup.notebooks` (the `NotebookBackup` type is flat, not nested under `.data`)
2. **`backup-restore-section.tsx`** — Same fix + wrapped `parseBackupJSON` in try/catch (it throws on invalid input, not returns null)
3. **`restore-confirm-modal.tsx`** — Same fix + `backup.createdAt` → `backup.exportedAt` (correct field name from Phase A types)

### 🟡 Phase F Structural

4. **Folder restructure** — Pisah `phase-f/1/` dan `phase-f/2/` ke proper structure (`src/lib/` vs `src/components/`)
5. **`components/.../export/index.ts`** — Updated barrel to export all 3 components (was only exporting `ExportZipButton`)
6. **Import path normalization** — `zip-builder.ts` and `filename-builder.ts` now use `@/lib/notebook/utils/slugify` alias (was relative `../utils/slugify`)
7. **`exporter.ts`** import path — Now uses `@/lib/notebook/storage` alias

### 🟢 Cleanup (optional, but included)

8. **Phase C `page-list-item.tsx`** — Removed unused `X as XIcon` import
9. **Phase E `importer.ts`** — Removed unused `Notebook` and `NotebookSection` imports + added `const`/`let` cleanup

---

## ✅ Verification After Replace

After replacing, verify Phase F integrity:

```bash
cd ROADMAP/phase-f/src
# Should see clean structure:
tree -L 4
# Expected:
# src
# ├── components/features/notebook/export/
# │   ├── backup-restore-section.tsx
# │   ├── export-zip-button.tsx
# │   ├── index.ts
# │   └── restore-confirm-modal.tsx
# └── lib/notebook/export/
#     ├── exporter.ts
#     ├── filename-builder.ts
#     ├── index.ts
#     ├── md-serializer.ts
#     └── zip-builder.ts
```

---

## 🚀 Then: Copy to Main `src/`

Once `ROADMAP/` is clean, you can safely copy each phase's `src/` into your project's main `src/` folder, phase by phase, per roadmap order: A → B → C → D → E → F.

Don't forget Phase F prerequisites:
```bash
pnpm dlx shadcn@latest add progress
```

And wire `<BackupRestoreSection />` into your settings or dashboard page where appropriate (roadmap suggests `/(dashboard)/settings/page.tsx`).
