"use client";

/**
 * Notebook editor page — `/notebooks/[id]`.
 *
 * ──────────────────────────────────────────────────────────────────
 * STAGE 2.1 — OPTIMISTIC UPDATES EVERYWHERE
 * ──────────────────────────────────────────────────────────────────
 * Previously: only DnD operations had optimistic state. Other actions
 * (move-via-menu, rename, delete, duplicate) waited for storage round-
 * trip → refresh → re-render before showing changes. Result: UI felt
 * stuck — user thought they had to refresh the page.
 *
 * NOW: ALL mutating actions update `optimisticPages`/`optimisticSections`
 * synchronously BEFORE calling storage. Storage writes happen in the
 * background. When the storage refresh arrives via the sync effect,
 * it reconciles (usually a no-op because optimistic already matches).
 *
 * Pattern per handler (via `withOptimistic` helper):
 *   1. Snapshot current optimistic state (for revert on failure)
 *   2. Apply optimistic mutation → UI updates immediately
 *   3. await storage operation in background
 *   4. On error: revert optimistic + toast
 *   5. usePages/useSections internally calls refresh() which sets
 *      pages/sections; sync effect catches up.
 *
 * Sync guards:
 *   - `isDragActiveRef` — blocks sync DURING drag (start → end/cancel)
 *   - `pendingActionRef` (counter) — blocks sync DURING action storage
 *     write so the optimistic-then-real-data swap doesn't cause flicker
 *
 * Watchdog clears `pendingActionRef` after 10s in case anything sticks.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
  notFound,
} from "next/navigation";
import {
  Menu,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { useNotebook } from "@/hooks/notebook/use-notebook";
import { useSections } from "@/hooks/notebook/use-sections";
import { usePages } from "@/hooks/notebook/use-pages";
import { useNotebookSettings } from "@/hooks/notebook/use-notebook-settings";
import { useNotebookStore } from "@/stores/notebook-store";
import { NotebookSidebar } from "@/components/features/notebook/file-manager/notebook-sidebar";
import { NotebookEditor } from "@/components/features/notebook/editor/notebook-editor";
import { PublishButton } from "@/components/features/notebook/publish";
import { FullPageLoader } from "@/components/shared";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  NEW_PAGE_DEFAULT_TITLE,
} from "@/constants/notebook";
import { updatePage, updateSection } from "@/lib/notebook/storage";
import type {
  NotebookPage,
  NotebookSection,
  UpdatePageInput,
} from "@/types/notebook";

export default function NotebookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const notebookId = params.id;
  const activePageId = searchParams.get("page");

  const {
    notebook,
    sections,
    pages,
    isLoading,
    notFound: isNotFound,
    refresh,
  } = useNotebook(notebookId);

  const sectionActions = useSections(refresh);
  const pageActions = usePages(refresh);

  // ════════════════════════════════════════════════════
  // OPTIMISTIC STATE LAYER
  // ════════════════════════════════════════════════════
  const [optimisticPages, setOptimisticPages] = useState<NotebookPage[]>([]);
  const [optimisticSections, setOptimisticSections] = useState<
    NotebookSection[]
  >([]);

  // Sync guards: when truthy, the storage→optimistic effect won't clobber.
  const isDragActiveRef = useRef(false);
  const pendingActionRef = useRef(0);

  // Refs mirror state so handlers can read current optimistic without
  // adding state to their useCallback deps (would invalidate closures).
  const optimisticPagesRef = useRef<NotebookPage[]>([]);
  const optimisticSectionsRef = useRef<NotebookSection[]>([]);
  useEffect(() => {
    optimisticPagesRef.current = optimisticPages;
  }, [optimisticPages]);
  useEffect(() => {
    optimisticSectionsRef.current = optimisticSections;
  }, [optimisticSections]);

  // Sync storage → optimistic ONLY when not actively mutating.
  // When unguarded, mirror storage 1:1.
  useEffect(() => {
    if (isDragActiveRef.current) return;
    if (pendingActionRef.current > 0) return;
    setOptimisticPages(pages);
    setOptimisticSections(sections);
  }, [pages, sections]);

  /**
   * Wraps a mutation with optimistic-first + revert-on-error.
   * Snapshot is taken at call time (so it captures pre-mutation state).
   */
  const withOptimistic = useCallback(
    async <T,>(args: {
      apply: () => void;
      storage: () => Promise<T>;
      errorMessage: string;
    }): Promise<T | null> => {
      // Snapshot BEFORE applying optimistic mutation
      const snapshotP = optimisticPagesRef.current;
      const snapshotS = optimisticSectionsRef.current;

      pendingActionRef.current += 1;
      try {
        args.apply();
        const result = await args.storage();
        return result;
      } catch (err) {
        console.error(`[NotebookPage] ${args.errorMessage}:`, err);
        setOptimisticPages(snapshotP);
        setOptimisticSections(snapshotS);
        toast.error(args.errorMessage);
        return null;
      } finally {
        // Release guard on next tick so the storage refresh that
        // usePages/useSections runs internally can land first (its
        // setState lands in the SAME tick as our await resolves;
        // by deferring guard release, the sync effect that fires
        // from THAT setState sees pendingActionRef > 0 and skips,
        // letting our optimistic state win until next render).
        setTimeout(() => {
          pendingActionRef.current = Math.max(
            0,
            pendingActionRef.current - 1
          );
        }, 0);
      }
    },
    []
  );

  // ── Settings ──────────────────────────────────────────
  const { settings, updateSettings } = useNotebookSettings();
  const [localSidebarWidth, setLocalSidebarWidth] = useState(
    settings.sidebarWidth
  );

  useEffect(() => {
    setLocalSidebarWidth(settings.sidebarWidth);
  }, [settings.sidebarWidth]);

  // ── Active notebook in store ──────────────────────────
  const setActiveNotebookId = useNotebookStore((s) => s.setActiveNotebookId);
  const setActivePageId = useNotebookStore((s) => s.setActivePageId);
  const resetStore = useNotebookStore((s) => s.reset);

  useEffect(() => {
    setActiveNotebookId(notebookId);
    return () => {
      resetStore();
    };
  }, [notebookId, setActiveNotebookId, resetStore]);

  useEffect(() => {
    setActivePageId(activePageId);
  }, [activePageId, setActivePageId]);

  useEffect(() => {
    if (!notebookId) return;
    const timer = setTimeout(() => {
      updateSettings({
        lastOpenedNotebookId: notebookId,
        lastOpenedPageId: activePageId,
      });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId, activePageId]);

  // ── Mobile sidebar sheet ──────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Active page lookup (from optimistic state) ────────
  const activePage = useMemo(
    () =>
      activePageId
        ? optimisticPages.find((p) => p.id === activePageId)
        : null,
    [optimisticPages, activePageId]
  );

  // ════════════════════════════════════════════════════
  // EDITOR SAVE LOGIC
  // ════════════════════════════════════════════════════
  const pendingRef = useRef<UpdatePageInput>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingPageIdRef = useRef<string | null>(activePageId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    editingPageIdRef.current = activePageId;
  }, [activePageId]);

  const flushSave = useCallback(async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const id = editingPageIdRef.current;
    const pending = pendingRef.current;

    if (!id || Object.keys(pending).length === 0) return;

    pendingRef.current = {};

    setIsSaving(true);
    try {
      await updatePage(id, pending);
      // Apply to optimistic too — editor changes (title, content) should
      // reflect in the sidebar immediately.
      setOptimisticPages((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...pending, updatedAt: Date.now() } : p
        )
      );
      await refresh();
    } catch (err) {
      console.error("[NotebookPage] save error:", err);
      toast.error("Failed to save changes");
      pendingRef.current = { ...pending, ...pendingRef.current };
    } finally {
      setIsSaving(false);
    }
  }, [refresh]);

  const scheduleSave = useCallback(
    (updates: UpdatePageInput) => {
      if (!editingPageIdRef.current) return;
      pendingRef.current = { ...pendingRef.current, ...updates };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flushSave();
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    [flushSave]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const id = editingPageIdRef.current;
      const pending = pendingRef.current;
      if (id && Object.keys(pending).length > 0) {
        pendingRef.current = {};
        updatePage(id, pending)
          .then(() => refresh())
          .catch((err) =>
            console.error("[NotebookPage] cleanup save error:", err)
          );
      }
    };
  }, [activePageId, refresh]);

  // ════════════════════════════════════════════════════
  // DnD eager swap handlers
  // ════════════════════════════════════════════════════

  const handleLiveSwap = useCallback(
    (next: { pages: NotebookPage[]; sections: NotebookSection[] }) => {
      isDragActiveRef.current = true;
      setOptimisticPages(next.pages);
      setOptimisticSections(next.sections);
    },
    []
  );

  const handleCommit = useCallback(
    async (updates: {
      pageUpdates: Array<{
        id: string;
        order: number;
        sectionId: string | null;
      }>;
      sectionUpdates: Array<{
        id: string;
        order: number;
        parentId: string | null;
      }>;
    }) => {
      try {
        await Promise.all([
          ...updates.pageUpdates.map((u) =>
            updatePage(u.id, {
              order: u.order,
              sectionId: u.sectionId,
            })
          ),
          ...updates.sectionUpdates.map((u) =>
            updateSection(u.id, {
              order: u.order,
              parentId: u.parentId,
            })
          ),
        ]);

        isDragActiveRef.current = false;
        refresh();
      } catch (err) {
        console.error("[NotebookPage] commit error:", err);
        isDragActiveRef.current = false;
        throw err;
      }
    },
    [refresh]
  );

  const handleCancel = useCallback(
    (snapshot: {
      pages: NotebookPage[];
      sections: NotebookSection[];
    }) => {
      setOptimisticPages(snapshot.pages);
      setOptimisticSections(snapshot.sections);
      isDragActiveRef.current = false;
    },
    []
  );

  // ════════════════════════════════════════════════════
  // ACTION HANDLERS — optimistic-first pattern
  // ════════════════════════════════════════════════════

  const handleSelectPage = useCallback(
    async (pageId: string) => {
      await flushSave();
      const url = new URL(window.location.href);
      url.searchParams.set("page", pageId);
      router.push(url.pathname + url.search);
      setMobileSidebarOpen(false);
    },
    [router, flushSave]
  );

  // ─── CREATE page ────────────────────────────────────
  // No optimistic insert here — we need the storage-generated ID for
  // navigation. Storage is local IndexedDB, so latency is sub-10ms.
  // After create resolves, the sync effect picks it up.
  const handleCreatePage = useCallback(
    async (sectionId: string | null) => {
      try {
        await flushSave();
        const page = await pageActions.createPage(notebookId, {
          title: NEW_PAGE_DEFAULT_TITLE,
          sectionId,
        });
        const url = new URL(window.location.href);
        url.searchParams.set("page", page.id);
        router.push(url.pathname + url.search);
        setMobileSidebarOpen(false);
      } catch (err) {
        console.error("[NotebookPage] create page error:", err);
        toast.error("Failed to create page");
      }
    },
    [notebookId, pageActions, flushSave, router]
  );

  const handleCreateSection = useCallback(
    async (parentId: string | null) => {
      try {
        await sectionActions.createSection(notebookId, {
          name: "New section",
          parentId,
        });
      } catch (err) {
        console.error("[NotebookPage] create section error:", err);
        toast.error("Failed to create section");
      }
    },
    [notebookId, sectionActions]
  );

  // ─── RENAME page ────────────────────────────────────
  const handleRenamePage = useCallback(
    async (id: string, newTitle: string) => {
      await withOptimistic({
        apply: () => {
          setOptimisticPages((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, title: newTitle, updatedAt: Date.now() }
                : p
            )
          );
        },
        storage: async () => {
          if (id === editingPageIdRef.current) await flushSave();
          return pageActions.updatePage(id, { title: newTitle });
        },
        errorMessage: "Failed to rename page",
      });
    },
    [pageActions, flushSave, withOptimistic]
  );

  // ─── DUPLICATE page ─────────────────────────────────
  // Optimistic insert with placeholder ID; replace with real one after storage.
  const handleDuplicatePage = useCallback(
    async (id: string) => {
      const original = optimisticPagesRef.current.find((p) => p.id === id);
      if (!original) return;

      const placeholderId = `__pending_${Date.now()}__`;
      const now = Date.now();
      const placeholder: NotebookPage = {
        ...original,
        id: placeholderId,
        title: `${original.title} (copy)`,
        order: (original.order ?? 0) + 0.5, // sort right after original
        createdAt: now,
        updatedAt: now,
      };

      const result = await withOptimistic({
        apply: () => {
          setOptimisticPages((prev) => [...prev, placeholder]);
        },
        storage: async () => {
          if (id === editingPageIdRef.current) await flushSave();
          return pageActions.duplicatePage(id);
        },
        errorMessage: "Failed to duplicate page",
      });

      if (result) {
        // Swap placeholder for real page in optimistic state — prevents
        // brief flicker before sync effect catches up.
        setOptimisticPages((prev) =>
          prev.map((p) => (p.id === placeholderId ? result : p))
        );
        toast.success(`Duplicated as "${result.title}"`);
      }
    },
    [pageActions, flushSave, withOptimistic]
  );

  // ─── MOVE page (single, via "Move to" dropdown) ─────
  // This is the action user complained about ("harus refresh dulu").
  // Optimistic move + storage write in background.
  const handleMovePage = useCallback(
    async (id: string, sectionId: string | null) => {
      await withOptimistic({
        apply: () => {
          setOptimisticPages((prev) => {
            const moving = prev.find((p) => p.id === id);
            if (!moving) return prev;
            if (moving.sectionId === sectionId) return prev; // no-op

            const sourceSectionId = moving.sectionId;

            // Order at target = end of target section + 1
            const targetSiblings = prev.filter(
              (p) => p.sectionId === sectionId && p.id !== id
            );
            const maxTargetOrder = targetSiblings.reduce(
              (m, p) => Math.max(m, p.order ?? 0),
              0
            );

            // Compute new order numbers for source section to close gap
            const sourceRemaining = prev
              .filter(
                (p) =>
                  p.sectionId === sourceSectionId && p.id !== id
              )
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const sourceOrderMap = new Map<string, number>();
            sourceRemaining.forEach((p, idx) => {
              sourceOrderMap.set(p.id, idx + 1);
            });

            const now = Date.now();
            return prev.map((p) => {
              if (p.id === id) {
                return {
                  ...p,
                  sectionId,
                  order: maxTargetOrder + 1,
                  updatedAt: now,
                };
              }
              const newOrder = sourceOrderMap.get(p.id);
              if (newOrder !== undefined) {
                return { ...p, order: newOrder };
              }
              return p;
            });
          });
        },
        storage: () => pageActions.updatePage(id, { sectionId }),
        errorMessage: "Failed to move page",
      });
    },
    [pageActions, withOptimistic]
  );

  // ─── MOVE pages (bulk, via toolbar) ─────────────────
  const handleMovePages = useCallback(
    async (pageIds: string[], targetSectionId: string | null) => {
      const idSet = new Set(pageIds);

      const result = await withOptimistic({
        apply: () => {
          setOptimisticPages((prev) => {
            // Source sections that need gap-closing
            const sourceSectionIds = new Set<string | null>();
            for (const p of prev) {
              if (idSet.has(p.id) && p.sectionId !== targetSectionId) {
                sourceSectionIds.add(p.sectionId);
              }
            }

            // Build per-source-section new-order map
            const sourceOrderMaps = new Map<
              string | null,
              Map<string, number>
            >();
            for (const sid of sourceSectionIds) {
              const remaining = prev
                .filter(
                  (p) => p.sectionId === sid && !idSet.has(p.id)
                )
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              const m = new Map<string, number>();
              remaining.forEach((p, idx) => m.set(p.id, idx + 1));
              sourceOrderMaps.set(sid, m);
            }

            // Max order in target section (excluding moving pages)
            const targetSiblings = prev.filter(
              (p) => p.sectionId === targetSectionId && !idSet.has(p.id)
            );
            const maxTargetOrder = targetSiblings.reduce(
              (m, p) => Math.max(m, p.order ?? 0),
              0
            );

            const now = Date.now();
            let counter = 1;
            return prev.map((p) => {
              if (idSet.has(p.id)) {
                return {
                  ...p,
                  sectionId: targetSectionId,
                  order: maxTargetOrder + counter++,
                  updatedAt: now,
                };
              }
              const sourceMap = sourceOrderMaps.get(p.sectionId);
              if (sourceMap) {
                const newOrder = sourceMap.get(p.id);
                if (newOrder !== undefined) {
                  return { ...p, order: newOrder };
                }
              }
              return p;
            });
          });
        },
        storage: () => pageActions.movePages(pageIds, targetSectionId),
        errorMessage: "Failed to move pages",
      });

      if (result !== null) {
        toast.success(
          `Moved ${pageIds.length} ${
            pageIds.length === 1 ? "page" : "pages"
          }`
        );
      }
    },
    [pageActions, withOptimistic]
  );

  // ─── DELETE page ────────────────────────────────────
  const handleDeletePage = useCallback(
    async (id: string) => {
      await withOptimistic({
        apply: () => {
          setOptimisticPages((prev) => prev.filter((p) => p.id !== id));
        },
        storage: async () => {
          if (id === editingPageIdRef.current) {
            pendingRef.current = {};
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
          await pageActions.deletePage(id);
          if (id === activePageId) {
            const url = new URL(window.location.href);
            url.searchParams.delete("page");
            router.push(url.pathname + url.search);
          }
        },
        errorMessage: "Failed to delete page",
      });
    },
    [pageActions, activePageId, router, withOptimistic]
  );

  // ─── DELETE pages (bulk) ────────────────────────────
  const handleDeletePages = useCallback(
    async (ids: string[]) => {
      const idSet = new Set(ids);

      const result = await withOptimistic({
        apply: () => {
          setOptimisticPages((prev) =>
            prev.filter((p) => !idSet.has(p.id))
          );
        },
        storage: async () => {
          if (
            editingPageIdRef.current &&
            idSet.has(editingPageIdRef.current)
          ) {
            pendingRef.current = {};
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
          await pageActions.deletePages(ids);
          if (activePageId && idSet.has(activePageId)) {
            const url = new URL(window.location.href);
            url.searchParams.delete("page");
            router.push(url.pathname + url.search);
          }
        },
        errorMessage: "Failed to delete pages",
      });

      if (result !== null) {
        toast.success(
          `Deleted ${ids.length} ${ids.length === 1 ? "page" : "pages"}`
        );
      }
    },
    [pageActions, activePageId, router, withOptimistic]
  );

  // ─── RENAME section ─────────────────────────────────
  const handleRenameSection = useCallback(
    async (id: string, newName: string) => {
      await withOptimistic({
        apply: () => {
          setOptimisticSections((prev) =>
            prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
          );
        },
        storage: () => sectionActions.updateSection(id, { name: newName }),
        errorMessage: "Failed to rename section",
      });
    },
    [sectionActions, withOptimistic]
  );

  // ─── DELETE section (with orphan/delete strategy) ───
  const handleDeleteSection = useCallback(
    async (id: string, pageStrategy: "orphan" | "delete") => {
      // Collect all descendant section IDs from CURRENT optimistic sections
      const collectDescendants = (rootId: string): Set<string> => {
        const result = new Set<string>([rootId]);
        let added = true;
        while (added) {
          added = false;
          for (const s of optimisticSectionsRef.current) {
            if (
              s.parentId &&
              result.has(s.parentId) &&
              !result.has(s.id)
            ) {
              result.add(s.id);
              added = true;
            }
          }
        }
        return result;
      };

      const descendants = collectDescendants(id);

      // Does deleting this remove the active page?
      const willDeleteActive =
        pageStrategy === "delete" &&
        activePageId &&
        (() => {
          const ap = optimisticPagesRef.current.find(
            (p) => p.id === activePageId
          );
          return !!(ap?.sectionId && descendants.has(ap.sectionId));
        })();

      const result = await withOptimistic({
        apply: () => {
          // Remove descendant sections
          setOptimisticSections((prev) =>
            prev.filter((s) => !descendants.has(s.id))
          );
          // Handle pages
          setOptimisticPages((prev) => {
            if (pageStrategy === "delete") {
              return prev.filter(
                (p) => !p.sectionId || !descendants.has(p.sectionId)
              );
            }
            // Orphan: move pages to root
            const now = Date.now();
            return prev.map((p) =>
              p.sectionId && descendants.has(p.sectionId)
                ? { ...p, sectionId: null, updatedAt: now }
                : p
            );
          });
        },
        storage: async () => {
          if (willDeleteActive) {
            pendingRef.current = {};
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
          await sectionActions.deleteSection(id, pageStrategy);
          if (willDeleteActive) {
            const url = new URL(window.location.href);
            url.searchParams.delete("page");
            router.push(url.pathname + url.search);
          }
        },
        errorMessage: "Failed to delete section",
      });

      if (result !== null) toast.success("Section deleted");
    },
    [sectionActions, activePageId, router, withOptimistic]
  );

  const handleToggleWordCount = useCallback(() => {
    updateSettings({ showWordCount: !settings.showWordCount });
  }, [settings.showWordCount, updateSettings]);

  // Sidebar width persistence
  useEffect(() => {
    if (localSidebarWidth === settings.sidebarWidth) return;
    const timer = setTimeout(() => {
      updateSettings({ sidebarWidth: localSidebarWidth });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSidebarWidth]);

  // Watchdog: if pendingActionRef somehow stays > 0 for >10s, force-reset.
  // Defense in depth — shouldn't normally fire.
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (pendingActionRef.current > 0) {
        console.warn(
          "[NotebookPage] pendingActionRef watchdog reset (was",
          pendingActionRef.current,
          ")"
        );
        pendingActionRef.current = 0;
      }
    }, 10000);
    return () => clearInterval(watchdog);
  }, []);

  if (isLoading) {
    return <FullPageLoader text="Loading notebook..." />;
  }

  if (isNotFound || !notebook) {
    notFound();
  }

  const sidebarProps = {
    notebook,
    sections: optimisticSections,
    pages: optimisticPages,
    activePageId,
    width: localSidebarWidth,
    onWidthChange: setLocalSidebarWidth,
    onSelectPage: handleSelectPage,
    onCreatePage: handleCreatePage,
    onCreateSection: handleCreateSection,
    onRenamePage: handleRenamePage,
    onDuplicatePage: handleDuplicatePage,
    onMovePage: handleMovePage,
    onDeletePage: handleDeletePage,
    onRenameSection: handleRenameSection,
    onDeleteSection: handleDeleteSection,
    onMovePages: handleMovePages,
    onDeletePages: handleDeletePages,
    onLiveSwap: handleLiveSwap,
    onCommit: handleCommit,
    onCancel: handleCancel,
  };

  return (
    <div
      className={
        "flex h-[calc(100vh-3.5rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 " +
        "max-md:h-[calc(100vh-3.5rem-5rem)]"
      }
    >
      <div className="hidden md:flex">
        <NotebookSidebar {...sidebarProps} />
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85vw] sm:w-80">
          <VisuallyHidden>
            <SheetTitle>Notebook sidebar</SheetTitle>
          </VisuallyHidden>
          <NotebookSidebar {...sidebarProps} isMobile />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex items-center gap-2 border-b px-3 py-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1.5 min-w-0 md:hidden">
            <span className="text-base leading-none">
              {notebook.icon || "📓"}
            </span>
            <span className="font-semibold text-sm truncate">
              {notebook.name}
            </span>
          </div>

          <div className="flex-1" />

          <PublishButton notebook={notebook} />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activePage ? (
            <NotebookEditor
              key={activePage.id}
              page={activePage}
              defaultMode={settings.defaultEditorMode}
              showWordCount={settings.showWordCount}
              onToggleWordCount={handleToggleWordCount}
              onScheduleSave={scheduleSave}
              onFlushSave={flushSave}
              isSaving={isSaving}
            />
          ) : (
            <NoPageSelected
              hasPages={optimisticPages.length > 0}
              onCreatePage={() => handleCreatePage(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NoPageSelected({
  hasPages,
  onCreatePage,
}: {
  hasPages: boolean;
  onCreatePage: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
          {hasPages ? (
            <FileText className="h-8 w-8 text-muted-foreground" />
          ) : (
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {hasPages ? "Select a page" : "This notebook is empty"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasPages
              ? "Choose a page from the sidebar to start editing."
              : "Create your first page to start writing."}
          </p>
        </div>
        {!hasPages && (
          <Button onClick={onCreatePage}>
            <FileText className="mr-2 h-4 w-4" />
            Create first page
          </Button>
        )}
      </div>
    </div>
  );
}
