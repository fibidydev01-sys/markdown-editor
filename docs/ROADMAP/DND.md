# 🔍 Real-time UX Audit — Markdown Editor

**Goal:** Identify semua area di app yang masih kerasa "tunggu refresh" dan kasih plan implementasi optimistic pattern (kayak yang udah berhasil di `notebooks/[id]/page.tsx`).

**Pattern reference:** Stage 2.1 `withOptimistic()` helper di `src/app/(dashboard)/notebooks/[id]/page.tsx`.

---

## 📊 Priority Matrix

| Priority | Definition | Action |
|---|---|---|
| 🔴 **CRITICAL** | User pasti notice, sering dipakai, lag visible | Implement ASAP |
| 🟠 **HIGH** | User notice kalau perhatiin, dipakai medium-frequency | Plan next |
| 🟡 **MEDIUM** | Edge case atau jarang dipakai, lag tolerable | Polish later |
| 🟢 **LOW** | One-time operation, user expects loading | Skip / loading state cukup |

---

## 🔴 CRITICAL Areas

### 1. Notebook list page (`/notebooks`)

**File:** `src/app/(dashboard)/notebooks/page.tsx`
**Related:**
- `src/hooks/notebook/use-notebooks.ts`
- `src/components/features/notebook/notebooks/notebook-grid.tsx`
- `src/components/features/notebook/notebooks/notebook-card.tsx`
- `src/components/features/notebook/notebooks/new-notebook-modal.tsx`
- `src/lib/notebook/storage/notebooks.ts`

#### Actions yang butuh optimistic:

| Action | Current behavior likely | Optimistic strategy |
|---|---|---|
| Create notebook | Loading → muncul | Sync insert dengan placeholder ID, swap pas storage balik |
| Rename notebook | Loading → update name | Sync update `name` field |
| Update icon/emoji | Loading → update icon | Sync update `icon` field |
| Delete notebook | Loading → hilang | Sync filter out |
| Add tag to notebook | Loading → badge muncul | Sync update `tagIds` array |
| Remove tag from notebook | Loading → badge hilang | Sync update `tagIds` array |

#### Implementation plan:

```ts
// In src/app/(dashboard)/notebooks/page.tsx
const [optimisticNotebooks, setOptimisticNotebooks] = useState<Notebook[]>([]);
const isPendingRef = useRef(0);
const optimisticRef = useRef<Notebook[]>([]);

// Sync effect (skip during action)
useEffect(() => {
  if (isPendingRef.current > 0) return;
  setOptimisticNotebooks(notebooks);
}, [notebooks]);

// Helper (same pattern as page.tsx)
const withOptimistic = async <T,>(args: {
  apply: () => void;
  storage: () => Promise<T>;
  errorMessage: string;
}) => { /* ... copy from notebooks/[id]/page.tsx ... */ };

// Handler example
const handleRenameNotebook = async (id: string, name: string) => {
  await withOptimistic({
    apply: () => {
      setOptimisticNotebooks(prev =>
        prev.map(n => n.id === id ? { ...n, name, updatedAt: Date.now() } : n)
      );
    },
    storage: () => updateNotebook(id, { name }),
    errorMessage: "Failed to rename notebook",
  });
};
```

#### Edge cases:
- **Sort by updatedAt**: setiap action update `updatedAt`, jadi grid bisa reorder. Pastikan optimistic update juga set `updatedAt: Date.now()` biar consistent.
- **Page count badge**: badge `notebookPageCount` dihitung lewat `getNotebookPageCount()`. Kalau lo display ini, butuh optimistic count juga atau accept slight delay.

---

### 2. Page editor — title save → sidebar sync

**File:** `src/components/features/notebook/editor/notebook-editor.tsx`
**Already covered partially in Stage 2.1** lewat `flushSave()` yang manggil `setOptimisticPages(prev => prev.map(...))`. **Tapi cek dulu apakah title yang diketik di editor langsung update di sidebar.**

#### Verifikasi yang perlu lo lakuin:
- Ketik di title field editor (kalau ada) — apakah sidebar item langsung update?
- Kalau enggak: editor harus call callback yang trigger optimistic update di parent

#### Potential gap:
Kalau `notebook-editor.tsx` punya title input terpisah, dia harus:
1. Call `onScheduleSave({ title: newTitle })` (yang udah debounced)
2. Tapi sidebar **butuh update SEKARANG**, bukan tunggu debounce

#### Fix plan:
```ts
// Option A: scheduleSave langsung apply optimistic
const scheduleSave = (updates) => {
  pendingRef.current = { ...pendingRef.current, ...updates };

  // ADD THIS: optimistic title update for sidebar
  if (updates.title !== undefined && editingPageIdRef.current) {
    setOptimisticPages(prev =>
      prev.map(p =>
        p.id === editingPageIdRef.current
          ? { ...p, title: updates.title!, updatedAt: Date.now() }
          : p
      )
    );
  }

  // ... existing debounce timer
};
```

---

## 🟠 HIGH Priority

### 3. Tags management

**Files:**
- `src/lib/notebook/storage/tags.ts`
- `src/components/features/notebook/notebooks/notebook-tag-badge.tsx`
- Tag UI lokasi: kemungkinan di notebook card / notebook detail / settings

#### Where tags appear:
1. **On notebook cards** — badge tag di grid
2. **In new-notebook-modal** — tag picker pas create
3. **Maybe in settings** — tag management page (cek `settings/page.tsx`)

#### Actions yang butuh optimistic:
- Create tag → muncul instant di picker
- Rename tag → semua badge update instant (cascade)
- Delete tag → semua badge yang pake tag itu hilang instant
- Assign tag to notebook → badge muncul di card
- Unassign tag from notebook → badge hilang dari card

#### Implementation plan:
**Centralized: bikin `useTagsOptimistic` hook** karena tags global (cross-notebook).

```ts
// src/hooks/notebook/use-tags-optimistic.ts (NEW)
export function useTagsOptimistic() {
  const { tags, refresh } = useTags(); // assume this exists or create
  const [optimisticTags, setOptimisticTags] = useState<Tag[]>([]);
  const isPendingRef = useRef(0);
  const optimisticRef = useRef<Tag[]>([]);

  useEffect(() => { optimisticRef.current = optimisticTags; }, [optimisticTags]);
  useEffect(() => {
    if (isPendingRef.current > 0) return;
    setOptimisticTags(tags);
  }, [tags]);

  const withOptimistic = /* same pattern */;

  return {
    tags: optimisticTags,
    createTag: async (input) => withOptimistic({...}),
    updateTag: async (id, updates) => withOptimistic({...}),
    deleteTag: async (id) => withOptimistic({...}),
  };
}
```

#### Cross-cutting concern:
Pas tag di-delete, **notebooks yang punya tag itu di `tagIds`** juga harus update. Decision:
- **Option A:** Storage layer auto-remove tag dari semua notebook (cascade) — clean tapi butuh storage refactor
- **Option B:** UI optimistic both — delete tag + filter `tagIds` di semua notebook optimistic state
- **Recommended:** Option A kalau lo gampang refactor, fallback Option B

---

### 4. Workspace / username editor

**Files:**
- `src/app/(dashboard)/settings/workspace/page.tsx`
- `src/components/features/workspace/username-editor.tsx`
- `src/components/features/workspace/workspace-info-card.tsx`
- `src/hooks/use-workspace.ts`
- `src/stores/workspace-store.ts`
- `src/lib/workspace/client.ts`

#### Actions:
- Update username → display name di header/sidebar harus update
- Update workspace info (display name, bio, avatar?) → reflect everywhere

#### Concern:
Kalau username dipake di **route paths** (`/[username]/[notebookSlug]/...`), update username:
1. Optimistic update store ✅
2. **TAPI** existing published notebook URLs ikut berubah?
3. Server-side validation (Supabase) bisa fail → revert

#### Implementation plan:
```ts
// In workspace-store.ts or hook
const updateUsername = async (newUsername: string) => {
  const snapshot = workspace;

  // Optimistic
  setWorkspace(prev => prev ? { ...prev, username: newUsername } : null);

  try {
    await workspaceClient.updateUsername(newUsername);
  } catch (err) {
    // Revert
    setWorkspace(snapshot);
    toast.error("Username taken or invalid");
    throw err;
  }
};
```

**Important:** Tampilkan loading state pada button (disabled + spinner) karena ini server-validated. Optimistic boleh, tapi user butuh tau ini "uncommitted" sampe server konfirmasi.

---

### 5. Publish flow

**Files:**
- `src/components/features/notebook/publish/publish-button.tsx`
- `src/components/features/notebook/publish/publish-modal.tsx`
- `src/components/features/notebook/publish/publish-status-badge.tsx`
- `src/components/features/notebook/publish/unpublish-confirm-modal.tsx`
- `src/hooks/notebook/use-publish-action.ts`
- `src/hooks/notebook/use-publish-status.ts`
- `src/lib/notebook/publish/publisher.ts`
- `src/lib/notebook/publish/unpublisher.ts`
- `src/app/api/notebooks/publish/route.ts`
- `src/app/api/notebooks/unpublish/route.ts`

#### Why this matters:
Publish = **server roundtrip** (API call ke Supabase). Lebih lambat dari IndexedDB. User klik "Publish" → tunggu 1-3 detik → status badge update. **Visible lag.**

#### Actions:
- Click Publish → badge "Publishing..." (intermediate) → "Published" (success) or revert (fail)
- Click Unpublish → badge "Unpublishing..." → "Draft"
- Update slug on published notebook → status preserved, slug updates

#### Implementation plan:
**Pattern beda** dari local actions karena ada **intermediate "pending" state**:

```ts
// In use-publish-action.ts
const publish = async (notebookId: string) => {
  // Optimistic: set status to "publishing" (intermediate)
  setPublishStatus(notebookId, "publishing");

  try {
    const result = await fetch("/api/notebooks/publish", { ... });
    if (!result.ok) throw new Error("Failed");
    const data = await result.json();

    // Real success
    setPublishStatus(notebookId, "published", { publishedAt: data.publishedAt });
  } catch (err) {
    // Revert
    setPublishStatus(notebookId, "draft");
    toast.error("Failed to publish");
  }
};
```

#### Status badge design:
```
draft         → grey badge
publishing    → blue badge with spinner (intermediate)
published     → green badge
unpublishing  → orange badge with spinner (intermediate)
```

**Note:** Karena network call, optimistic disini lebih ke "show progress" daripada "fake success". User butuh feedback proses jalan.

---

### 6. Notebook detail page editor — content save indicator

**Already covered in Stage 2.1** via `isSaving` state, tapi pastikan:
- `isSaving` indicator visible (spinner kecil di toolbar atau "Saving..." text)
- Setelah save, "Saved" indicator briefly (1-2s) lalu hilang
- Kalau error: "Save failed - retrying" inline indicator (bukan cuma toast)

#### Verification needed:
Lihat `notebook-editor.tsx` apa udah render `isSaving` dengan baik. Kalau enggak:
```tsx
<div className="text-xs text-muted-foreground">
  {isSaving ? "Saving..." : "Saved"}
</div>
```

---

## 🟡 MEDIUM Priority

### 7. Settings page

**Files:**
- `src/app/(dashboard)/settings/page.tsx`
- `src/hooks/notebook/use-notebook-settings.ts`
- `src/lib/notebook/storage/settings.ts`

#### Why MEDIUM:
Settings biasanya stored locally (IndexedDB or localStorage), sub-10ms latency. Most settings:
- Theme toggle → instant (CSS variable change)
- Sidebar width → instant (already optimistic in `localSidebarWidth` state)
- Default editor mode → no visual change until next page open

#### Action:
Spot-check setiap toggle/dropdown di settings page. Kalau ada yang kerasa lag, terapin pattern yang sama.

#### Quick win:
Wrap setting updates dengan optimistic kalau belum:
```ts
const updateSettings = async (updates) => {
  const snapshot = settings;
  setSettings(prev => ({ ...prev, ...updates })); // optimistic
  try {
    await storage.updateSettings(updates);
  } catch (err) {
    setSettings(snapshot); // revert
    toast.error("Failed to save settings");
  }
};
```

---

### 8. Profile page

**File:** `src/app/(dashboard)/profile/page.tsx`

#### Likely actions:
- Update display name → header refresh
- Update avatar → all avatar instances refresh
- Update bio → reflect in public docs viewer

#### Why MEDIUM:
Profile changes typically infrequent. Tapi avatar terutama butuh optimistic karena dipake di banyak tempat (header, sidebar, comments?). Saat update, semua avatar harus refresh sekaligus.

#### Plan:
Same pattern as workspace editor. Pakai store (auth-store / workspace-store) sebagai single source of truth, optimistic update di store sebelum API call.

---

### 9. Import / Export flow

**Files:**
- `src/components/features/notebook/import/*`
- `src/components/features/notebook/export/*`
- `src/lib/notebook/import/*`
- `src/lib/notebook/export/*`

#### Why MEDIUM:
Bulk operations — user **expects** progress indicator. Tapi after import selesai, sidebar/grid harus reflect **instant**.

#### Plan:
1. **During import**: progress bar (sudah ada di `import-progress.tsx`)
2. **After import**: trigger refresh, **tapi juga update optimistic state langsung** kalau import jalan sukses (gausah tunggu refresh round-trip)
3. **For ZIP export**: ga butuh optimistic — download triggered, ga ada state change

#### Specific scenario:
User import 50 markdown files → progress 0-100% → done. Right now sidebar mungkin tunggu refresh ke-trigger. Fix:

```ts
// In importer.ts or its caller
const handleImportComplete = (newPages, newSections) => {
  // Don't just call refresh() — also update optimistic immediately
  setOptimisticPages(prev => [...prev, ...newPages]);
  setOptimisticSections(prev => [...prev, ...newSections]);
  refresh(); // background reconcile
};
```

---

### 10. Backup restore

**Files:**
- `src/components/features/notebook/export/backup-restore-section.tsx`
- `src/components/features/notebook/export/restore-confirm-modal.tsx`
- `src/lib/notebook/storage/backup.ts`

#### Why MEDIUM:
Restore = **destructive** (replaces all data). User expects loading state + redirect/refresh. **Optimistic ga cocok** disini — kasih proper loading + success state aja.

#### Plan:
- Show loading modal during restore
- After success: hard reload atau navigate to dashboard with toast
- Pattern: **NOT optimistic, just good loading UX**

---

## 🟢 LOW Priority / Skip

### 11. Auth flows (login/register)

**Files:** `src/components/features/auth/*`

**Reason skip:** Server validation required (Supabase auth). User expects loading state. Optimistic auth = security antipattern.

**Action:** Make sure loading states are present (already likely have via `useAuth`).

---

### 12. Billing / Lemon Squeezy

**Files:** `src/components/billing/*`, `src/app/api/lemonsqueezy/*`

**Reason skip:** External payment flow, opens modal/redirect, user expects to wait. Optimistic doesn't apply here.

---

### 13. Admin page

**File:** `src/app/(dashboard)/admin/page.tsx`

**Reason skip:** Internal tooling, low frequency, admin tolerates loading.

---

### 14. Public docs viewer (`/[username]/[notebookSlug]/...`)

**Files:** `src/app/[username]/...`, `src/components/features/public-docs/*`

**Reason skip:** Read-only public view. No mutations. Pure rendering. Cache strategy at Next.js/CDN level, not state management.

---

### 15. Marketing / landing pages

**Files:** `src/app/(marketing)/*`, `src/components/landing/*`

**Reason skip:** Static content.

---

### 16. Pay / overview / dashboard pages

**Files:**
- `src/app/(dashboard)/pay/page.tsx`
- `src/app/(dashboard)/overview/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`

**Reason skip:** Probably read-only summary views. Cek dulu — kalau ada action buttons, naikkan priority sesuai action type. Kalau cuma display stats: LOW.

---

## 🎯 Recommended Implementation Order

Sort by **impact × effort**:

| # | Area | Impact | Effort | Order |
|---|---|---|---|---|
| 1 | Notebook list page | 🔴🔴🔴 | Medium | **1st** |
| 2 | Title edit → sidebar | 🔴🔴 | Small | **2nd (quick win)** |
| 3 | Tag management | 🟠🟠 | Medium-Large | **3rd** |
| 4 | Publish flow | 🟠🟠 | Medium (network) | **4th** |
| 5 | Workspace/username | 🟠 | Small | **5th** |
| 6 | Settings | 🟡 | Small | **Quick win bundle** |
| 7 | Import optimistic merge | 🟡 | Small | **Bundle** |
| 8 | Profile | 🟡 | Small-Medium | **Last** |

---

## 🧰 Reusable Helper to Extract

The `withOptimistic` helper di `notebooks/[id]/page.tsx` bagus banget tapi **inline** di file itu. Refactor jadi shared hook:

### Plan: extract to `src/hooks/notebook/use-optimistic-state.ts`

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseOptimisticStateOptions<T> {
  /** Source-of-truth data from storage (via refresh hook). */
  source: T[];
  /** Identity function: how to identify an item (default: by `id` field). */
  getId?: (item: T) => string;
}

interface UseOptimisticStateReturn<T> {
  /** What the UI should render. */
  state: T[];
  /** Manually set the state (for drag flows). */
  setState: React.Dispatch<React.SetStateAction<T[]>>;
  /** Ref to current state — for handlers that read without re-rendering. */
  stateRef: React.MutableRefObject<T[]>;
  /** Lock the sync from source until released (use during drag). */
  lock: () => void;
  unlock: () => void;
  /** Wrap a mutation: applies optimistic, runs storage, reverts on error. */
  withOptimistic: <R>(args: {
    apply: () => void;
    storage: () => Promise<R>;
    errorMessage: string;
  }) => Promise<R | null>;
}

export function useOptimisticState<T extends { id: string }>(
  options: UseOptimisticStateOptions<T>
): UseOptimisticStateReturn<T> {
  const { source } = options;
  const [state, setState] = useState<T[]>([]);
  const stateRef = useRef<T[]>([]);
  const lockedRef = useRef(0);
  const pendingRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (lockedRef.current > 0) return;
    if (pendingRef.current > 0) return;
    setState(source);
  }, [source]);

  const lock = useCallback(() => {
    lockedRef.current += 1;
  }, []);

  const unlock = useCallback(() => {
    lockedRef.current = Math.max(0, lockedRef.current - 1);
  }, []);

  const withOptimistic = useCallback(
    async <R,>(args: {
      apply: () => void;
      storage: () => Promise<R>;
      errorMessage: string;
    }): Promise<R | null> => {
      const snapshot = stateRef.current;
      pendingRef.current += 1;
      try {
        args.apply();
        return await args.storage();
      } catch (err) {
        console.error(`[useOptimisticState] ${args.errorMessage}:`, err);
        setState(snapshot);
        toast.error(args.errorMessage);
        return null;
      } finally {
        setTimeout(() => {
          pendingRef.current = Math.max(0, pendingRef.current - 1);
        }, 0);
      }
    },
    []
  );

  // Watchdog
  useEffect(() => {
    const t = setInterval(() => {
      if (pendingRef.current > 0) {
        console.warn("[useOptimisticState] watchdog reset");
        pendingRef.current = 0;
      }
    }, 10000);
    return () => clearInterval(t);
  }, []);

  return { state, setState, stateRef, lock, unlock, withOptimistic };
}
```

**Then each page uses it:**

```ts
// In notebooks/[id]/page.tsx (refactored)
const {
  state: optimisticPages,
  setState: setOptimisticPages,
  stateRef: optimisticPagesRef,
  lock: lockPagesSync,
  unlock: unlockPagesSync,
  withOptimistic,
} = useOptimisticState({ source: pages });

// Drag: lock() at dragStart, unlock() at dragEnd
// Actions: use withOptimistic() wrapper
```

**Benefit:** Pattern reusable di **`notebooks/page.tsx`**, **tags page (if any)**, **anywhere else**. Less code duplication.

---

## 📦 Suggested Chat Sessions

Buat ngerjain ini di chat baru, gue saranin pecah jadi **4 sessions** (jangan one-shot semua, terlalu besar):

### Session 1: Quick wins + extract helper
- Extract `useOptimisticState` hook
- Refactor `notebooks/[id]/page.tsx` pakai helper (sanity check pattern still works)
- Apply to **notebooks list page** (`/notebooks`)
- Apply title-edit → sidebar sync gap

**Files to share with new chat:**
- `notebooks/[id]/page.tsx` (current Stage 2.1)
- `notebooks/page.tsx`
- `use-notebooks.ts`
- `notebook-grid.tsx` + `notebook-card.tsx`
- `notebook-editor.tsx`
- `storage/notebooks.ts`

### Session 2: Tags + Publish
- Tag management optimistic
- Publish/unpublish status flow

**Files to share:**
- All tag-related files
- All publish-related files
- `storage/tags.ts`

### Session 3: Workspace + Profile + Settings
- Username editor
- Profile updates
- Settings toggles

**Files to share:**
- `username-editor.tsx`, `workspace-info-card.tsx`
- `profile/page.tsx`
- `settings/page.tsx`, `use-notebook-settings.ts`
- `workspace-store.ts`

### Session 4: Import/Export polish
- Post-import optimistic merge
- Loading states audit

**Files to share:**
- All import/export files
- `backup.ts`

---

## ✅ Validation Checklist (per session)

Before declaring "done" per session, test:

- [ ] Action via menu/dropdown — instant feedback (no refresh needed)
- [ ] Network/storage error — UI reverts cleanly, toast shows
- [ ] Rapid clicks (spam-click action button) — no race condition
- [ ] Drag-and-drop (where applicable) — still works
- [ ] Refresh page mid-action — recovers gracefully
- [ ] Offline scenario — error path triggers
- [ ] Multi-tab (if applicable) — second tab eventually catches up via refresh

---

## 🚨 Anti-patterns to Avoid

1. **Don't optimistically update server-validated fields** without showing pending state. Username, slug, anything with uniqueness constraint.
2. **Don't skip error revert.** Every `apply` needs a snapshot revert path.
3. **Don't nest `withOptimistic`** — flatten into single mutation per user action.
4. **Don't optimistic on auth flows.** Security boundary.
5. **Don't forget activePageId / URL state.** When deleting active page/notebook, redirect handling needs to be in the storage callback, not the optimistic apply.

---

## 🎁 Bonus: Storage layer subscription (future)

Long term, the **best** solution adalah storage layer sendiri yang emit events:

```ts
// Future architecture
storage.subscribe('pages', (changes) => {
  // Auto-update all consumers
});
```

This eliminates the need for manual `refresh()` calls entirely. Pakai library kayak [Dexie's liveQuery](https://dexie.org/docs/liveQuery()) or roll your own pub/sub on top of `idb`.

**Not now**, but kalau lo grow this app lebih besar, this is the endgame.

---

## 📝 Summary

**Total areas identified:** 16
- 🔴 CRITICAL: 2 (notebook list, title sync)
- 🟠 HIGH: 4 (tags, workspace, publish, editor save indicator)
- 🟡 MEDIUM: 4 (settings, profile, import, backup)
- 🟢 LOW/Skip: 6 (auth, billing, admin, public docs, marketing, dashboard reads)

**Reusable helper:** Extract `useOptimisticState` — drop-in untuk semua list-based optimistic flows.

**Estimated impact:** Setelah Session 1 & 2 selesai, **90% of UX lag** dari user perspective bakal hilang. Sessions 3-4 polish-level.