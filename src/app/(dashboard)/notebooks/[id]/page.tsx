"use client";

/**
 * Notebook editor page — `/notebooks/[id]`.
 *
 * UPDATED in Phase I: integrated <PublishButton /> into page header.
 *
 * Layout:
 *   ┌──────────┬──────────────────────────────────────────┐
 *   │ Sidebar  │ [Header: hamburger | name | PublishBtn]  │
 *   │ (tree)   │                                          │
 *   │          │ NotebookEditor (visual+source)           │
 *   │          │   - or NoPageSelected state              │
 *   └──────────┴──────────────────────────────────────────┘
 *
 * Save flow (unchanged from Phase D):
 *   - Inline debounce (500ms) for title + content updates
 *   - Pending updates buffered in ref
 *   - Flush on page switch, notebook switch, or unmount
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
import { updatePage } from "@/lib/notebook/storage";
import type { UpdatePageInput } from "@/types/notebook";

export default function NotebookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const notebookId = params.id;
  const activePageId = searchParams.get("page");

  // ── Data ─────────────────────────────────────────────
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

  // Settings
  const { settings, updateSettings } = useNotebookSettings();
  const [localSidebarWidth, setLocalSidebarWidth] = useState(
    settings.sidebarWidth
  );

  useEffect(() => {
    setLocalSidebarWidth(settings.sidebarWidth);
  }, [settings.sidebarWidth]);

  // ── Active notebook in store ─────────────────────────
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

  // ── Persist last-opened ids (debounced) ─────────────
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

  // ── Mobile sidebar sheet ─────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Active page lookup ──────────────────────────────
  const activePage = useMemo(
    () => (activePageId ? pages.find((p) => p.id === activePageId) : null),
    [pages, activePageId]
  );

  // ════════════════════════════════════════════════════
  // EDITOR SAVE LOGIC (inline debounced save) — unchanged from Phase D
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
  // ACTION HANDLERS (for sidebar) — unchanged from Phase D
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

  const handleRenamePage = useCallback(
    async (id: string, newTitle: string) => {
      try {
        if (id === editingPageIdRef.current) {
          await flushSave();
        }
        await pageActions.updatePage(id, { title: newTitle });
      } catch (err) {
        console.error("[NotebookPage] rename page error:", err);
        toast.error("Failed to rename page");
      }
    },
    [pageActions, flushSave]
  );

  const handleDuplicatePage = useCallback(
    async (id: string) => {
      try {
        if (id === editingPageIdRef.current) {
          await flushSave();
        }
        const newPage = await pageActions.duplicatePage(id);
        toast.success(`Duplicated as "${newPage.title}"`);
      } catch (err) {
        console.error("[NotebookPage] duplicate error:", err);
        toast.error("Failed to duplicate page");
      }
    },
    [pageActions, flushSave]
  );

  const handleMovePage = useCallback(
    async (id: string, sectionId: string | null) => {
      try {
        await pageActions.updatePage(id, { sectionId });
      } catch (err) {
        console.error("[NotebookPage] move page error:", err);
        toast.error("Failed to move page");
      }
    },
    [pageActions]
  );

  const handleMovePages = useCallback(
    async (pageIds: string[], targetSectionId: string | null) => {
      try {
        await pageActions.movePages(pageIds, targetSectionId);
        toast.success(
          `Moved ${pageIds.length} ${
            pageIds.length === 1 ? "page" : "pages"
          }`
        );
      } catch (err) {
        console.error("[NotebookPage] bulk move error:", err);
        toast.error("Failed to move pages");
      }
    },
    [pageActions]
  );

  const handleDeletePage = useCallback(
    async (id: string) => {
      try {
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
      } catch (err) {
        console.error("[NotebookPage] delete page error:", err);
        toast.error("Failed to delete page");
      }
    },
    [pageActions, activePageId, router]
  );

  const handleDeletePages = useCallback(
    async (ids: string[]) => {
      try {
        if (
          editingPageIdRef.current &&
          ids.includes(editingPageIdRef.current)
        ) {
          pendingRef.current = {};
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
        await pageActions.deletePages(ids);
        if (activePageId && ids.includes(activePageId)) {
          const url = new URL(window.location.href);
          url.searchParams.delete("page");
          router.push(url.pathname + url.search);
        }
        toast.success(
          `Deleted ${ids.length} ${ids.length === 1 ? "page" : "pages"}`
        );
      } catch (err) {
        console.error("[NotebookPage] bulk delete error:", err);
        toast.error("Failed to delete pages");
      }
    },
    [pageActions, activePageId, router]
  );

  const handleRenameSection = useCallback(
    async (id: string, newName: string) => {
      try {
        await sectionActions.updateSection(id, { name: newName });
      } catch (err) {
        console.error("[NotebookPage] rename section error:", err);
        toast.error("Failed to rename section");
      }
    },
    [sectionActions]
  );

  const handleDeleteSection = useCallback(
    async (id: string, pageStrategy: "orphan" | "delete") => {
      try {
        const willDeleteActive =
          pageStrategy === "delete" &&
          activePageId &&
          (() => {
            const ap = pages.find((p) => p.id === activePageId);
            if (!ap?.sectionId) return false;
            let cur: string | null | undefined = ap.sectionId;
            while (cur) {
              if (cur === id) return true;
              const sec = sections.find((s) => s.id === cur);
              cur = sec?.parentId ?? null;
            }
            return false;
          })();

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

        toast.success("Section deleted");
      } catch (err) {
        console.error("[NotebookPage] delete section error:", err);
        toast.error("Failed to delete section");
      }
    },
    [sectionActions, pages, sections, activePageId, router]
  );

  const handleToggleWordCount = useCallback(() => {
    updateSettings({ showWordCount: !settings.showWordCount });
  }, [settings.showWordCount, updateSettings]);

  // ── Sidebar width persistence (debounced) ──────────
  useEffect(() => {
    if (localSidebarWidth === settings.sidebarWidth) return;
    const timer = setTimeout(() => {
      updateSettings({ sidebarWidth: localSidebarWidth });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSidebarWidth]);

  // ── Loading / not found ─────────────────────────────
  if (isLoading) {
    return <FullPageLoader text="Loading notebook..." />;
  }

  if (isNotFound || !notebook) {
    notFound();
  }

  // ── Render ──────────────────────────────────────────

  const sidebarProps = {
    notebook,
    sections,
    pages,
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
  };

  return (
    <div
      className={
        "flex h-[calc(100vh-3.5rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 " +
        "max-md:h-[calc(100vh-3.5rem-5rem)]"
      }
    >
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <NotebookSidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85vw] sm:w-80">
          <VisuallyHidden>
            <SheetTitle>Notebook sidebar</SheetTitle>
          </VisuallyHidden>
          <NotebookSidebar {...sidebarProps} isMobile />
        </SheetContent>
      </Sheet>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* ═══════════════════════════════════════════════════════
           Page header — UPDATED in Phase I: now also visible on
           desktop (was mobile-only) so PublishButton has a home.
           ═══════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 border-b px-3 py-2 flex-shrink-0">
          {/* Mobile: hamburger to open sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Notebook name + icon (mobile only — desktop shows in sidebar) */}
          <div className="flex items-center gap-1.5 min-w-0 md:hidden">
            <span className="text-base leading-none">
              {notebook.icon || "📓"}
            </span>
            <span className="font-semibold text-sm truncate">
              {notebook.name}
            </span>
          </div>

          {/* Spacer pushes publish button to the right */}
          <div className="flex-1" />

          {/* Publish button — main CTA */}
          <PublishButton notebook={notebook} />
        </div>

        {/* Editor or empty state */}
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
              hasPages={pages.length > 0}
              onCreatePage={() => handleCreatePage(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================

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
