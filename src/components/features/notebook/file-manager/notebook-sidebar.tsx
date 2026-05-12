"use client";

/**
 * Notebook sidebar — Notion-style EAGER SWAP edition.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHAT CHANGED (Stage 2 polish):
 * ──────────────────────────────────────────────────────────────────
 * - Removed `onUpdatePages` / `onUpdateSections` props (old commit
 *   pattern from drag-end).
 * - Added `onLiveSwap` / `onCommit` / `onCancel` props (new eager
 *   swap pattern).
 * - Manages a local "expandRequest" state so the dnd-context can
 *   trigger auto-expand-on-hover for section nesting.
 *
 * The sidebar itself doesn't own the optimistic state — it just
 * renders whatever pages/sections the parent passes in. The parent
 * (notebook detail page) owns both the source-of-truth state AND
 * the optimistic-during-drag state.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  FolderInput,
  X,
} from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  Notebook,
  NotebookPage,
  NotebookSection,
} from "@/types/notebook";
import { ROUTES, NOTEBOOK_LIMITS } from "@/constants";
import { useNotebookStore } from "@/stores/notebook-store";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";
import { NewItemMenu } from "./new-item-menu";
import { SectionNode } from "./section-node";
import { PageListItem } from "./page-list-item";
import { NotebookDndContext, useDndState } from "./dnd-context";

// ============================================================
// Props
// ============================================================

interface NotebookSidebarProps {
  notebook: Notebook;
  /** Pages — already optimistic-merged by parent. */
  pages: NotebookPage[];
  /** Sections — already optimistic-merged by parent. */
  sections: NotebookSection[];
  activePageId: string | null;
  width: number;
  onWidthChange: (width: number) => void;

  onSelectPage: (pageId: string) => void;
  onCreatePage: (sectionId: string | null) => void | Promise<void>;
  onCreateSection: (parentId: string | null) => void | Promise<void>;
  onRenamePage: (id: string, newTitle: string) => void | Promise<void>;
  onDuplicatePage: (id: string) => void | Promise<void>;
  onMovePage: (id: string, sectionId: string | null) => void | Promise<void>;
  onDeletePage: (id: string) => void | Promise<void>;
  onRenameSection: (id: string, newName: string) => void | Promise<void>;
  onDeleteSection: (
    id: string,
    pageStrategy: "orphan" | "delete"
  ) => void | Promise<void>;
  onMovePages: (
    pageIds: string[],
    targetSectionId: string | null
  ) => void | Promise<void>;
  onDeletePages: (pageIds: string[]) => void | Promise<void>;

  /**
   * NEW — DnD eager swap callbacks (replaces onUpdatePages/onUpdateSections).
   */
  onLiveSwap: (next: {
    pages: NotebookPage[];
    sections: NotebookSection[];
  }) => void;
  onCommit: (updates: {
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
  }) => void | Promise<void>;
  onCancel: (snapshot: {
    pages: NotebookPage[];
    sections: NotebookSection[];
  }) => void;

  isMobile?: boolean;
}

// ============================================================
// Main component
// ============================================================

export function NotebookSidebar(props: NotebookSidebarProps) {
  const {
    notebook,
    sections,
    pages,
    activePageId,
    width,
    onWidthChange,
    onSelectPage,
    onCreatePage,
    onCreateSection,
    onRenamePage,
    onDuplicatePage,
    onMovePage,
    onDeletePage,
    onRenameSection,
    onDeleteSection,
    onMovePages,
    onDeletePages,
    onLiveSwap,
    onCommit,
    onCancel,
    isMobile,
  } = props;

  // ── Selection state ──
  const selectedPageIds = useNotebookStore((s) => s.selectedPageIds);
  const selectedSectionIds = useNotebookStore((s) => s.selectedSectionIds);
  const togglePageSelection = useNotebookStore((s) => s.togglePageSelection);
  const setSelectedPageIds = useNotebookStore((s) => s.setSelectedPageIds);
  const clearPageSelection = useNotebookStore((s) => s.clearPageSelection);

  const selectionActive = selectedPageIds.length > 0;

  // ── Search + bulk delete ──
  const [search, setSearch] = useState("");
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // ── Last-selected ref for shift-click range select ──
  const lastSelectedIdRef = useRef<string | null>(null);

  // ── Auto-expand request (triggered by dnd-context on long hover) ──
  const [expandRequest, setExpandRequest] = useState<string | null>(null);

  // ── Derived tree data ──
  const rootSections = useMemo(
    () =>
      sections
        .filter((s) => s.parentId === null)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [sections]
  );

  const rootPages = useMemo(
    () =>
      pages
        .filter((p) => p.sectionId === null)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [pages]
  );

  // Filtered for search
  const filteredPages = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [pages, search]);

  // Full flat ID list for SortableContext (document order)
  const sortableIds = useMemo(() => {
    const ids: string[] = [];
    function walk(parentSecId: string | null) {
      const secs = sections
        .filter((s) => s.parentId === parentSecId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const sec of secs) {
        ids.push(sec.id);
        walk(sec.id);
      }
      const pgs = pages
        .filter((p) => p.sectionId === parentSecId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const p of pgs) ids.push(p.id);
    }
    walk(null);
    return ids;
  }, [sections, pages]);

  // ── Page click handler ──
  const handlePageClick = useCallback(
    (page: NotebookPage, event: React.MouseEvent) => {
      if (event.shiftKey && lastSelectedIdRef.current) {
        const pageIds = pages.map((p) => p.id);
        const lastIdx = pageIds.indexOf(lastSelectedIdRef.current);
        const currentIdx = pageIds.indexOf(page.id);
        if (lastIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(lastIdx, currentIdx);
          const end = Math.max(lastIdx, currentIdx);
          const rangeIds = pageIds.slice(start, end + 1);
          const merged = Array.from(
            new Set([...selectedPageIds, ...rangeIds])
          );
          setSelectedPageIds(merged);
        }
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        togglePageSelection(page.id);
        lastSelectedIdRef.current = page.id;
        return;
      }

      if (selectionActive) {
        togglePageSelection(page.id);
        lastSelectedIdRef.current = page.id;
        return;
      }

      lastSelectedIdRef.current = page.id;
      onSelectPage(page.id);
    },
    [
      pages,
      selectedPageIds,
      selectionActive,
      setSelectedPageIds,
      togglePageSelection,
      onSelectPage,
    ]
  );

  const handleToggleSelect = useCallback(
    (id: string) => {
      togglePageSelection(id);
      lastSelectedIdRef.current = id;
    },
    [togglePageSelection]
  );

  // ── Resize handle ──
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const next = Math.min(
          NOTEBOOK_LIMITS.MAX_SIDEBAR_WIDTH,
          Math.max(
            NOTEBOOK_LIMITS.MIN_SIDEBAR_WIDTH,
            startWidth + delta
          )
        );
        onWidthChange(next);
      };

      const onMouseUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [isMobile, width, onWidthChange]
  );

  // ── Render ──
  return (
    <>
      <aside
        className="relative flex flex-col h-full bg-card border-r"
        style={{ width: isMobile ? "100%" : width }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-7 w-7 flex-shrink-0"
          >
            <Link
              href={ROUTES.NOTEBOOKS}
              aria-label="Back to notebooks"
              title="Back to notebooks"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-lg leading-none select-none">
              {notebook.icon || "📓"}
            </span>
            <span className="font-semibold text-sm truncate">
              {notebook.name}
            </span>
          </div>

          <NewItemMenu
            onCreatePage={() => onCreatePage(null)}
            onCreateSection={() => onCreateSection(null)}
          />
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Tree / Search results */}
        <div
          className="flex-1 overflow-y-auto p-2"
          onClick={(e) => {
            if (e.target === e.currentTarget && selectionActive) {
              clearPageSelection();
            }
          }}
        >
          {filteredPages ? (
            <SearchResultsView
              pages={filteredPages}
              sections={sections}
              activePageId={activePageId}
              selectedPageIds={selectedPageIds}
              selectionActive={selectionActive}
              search={search}
              onPageClick={handlePageClick}
              onToggleSelect={handleToggleSelect}
              onRename={onRenamePage}
              onDuplicate={onDuplicatePage}
              onMove={onMovePage}
              onDelete={onDeletePage}
            />
          ) : (
            // Tree view — wrapped in DnD context + sortable
            <NotebookDndContext
              pages={pages}
              sections={sections}
              selectedPageIds={selectedPageIds}
              onLiveSwap={onLiveSwap}
              onCommit={onCommit}
              onCancel={onCancel}
              onRequestExpand={setExpandRequest}
            >
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                {/* Empty state */}
                {rootSections.length === 0 && rootPages.length === 0 && (
                  <EmptyTreeState
                    onCreatePage={() => onCreatePage(null)}
                    onCreateSection={() => onCreateSection(null)}
                  />
                )}

                {/* Root sections */}
                {rootSections.map((sec) => (
                  <SectionNode
                    key={sec.id}
                    section={sec}
                    allSections={sections}
                    allPages={pages}
                    activePageId={activePageId}
                    selectedPageIds={selectedPageIds}
                    selectedSectionIds={selectedSectionIds}
                    selectionActive={selectionActive}
                    depth={0}
                    expandRequest={expandRequest}
                    onSelectPage={handlePageClick}
                    onTogglePageSelect={handleToggleSelect}
                    onRenamePage={onRenamePage}
                    onDuplicatePage={onDuplicatePage}
                    onMovePage={onMovePage}
                    onDeletePage={onDeletePage}
                    onRenameSection={onRenameSection}
                    onDeleteSection={onDeleteSection}
                    onCreatePage={onCreatePage}
                    onCreateSection={onCreateSection}
                  />
                ))}

                {/* Root pages */}
                {rootPages.map((page) => (
                  <PageListItem
                    key={page.id}
                    page={page}
                    sections={sections}
                    isActive={page.id === activePageId}
                    isSelected={selectedPageIds.includes(page.id)}
                    selectionActive={selectionActive}
                    depth={0}
                    onClick={handlePageClick}
                    onToggleSelect={handleToggleSelect}
                    onRename={onRenamePage}
                    onDuplicate={onDuplicatePage}
                    onMove={onMovePage}
                    onDelete={onDeletePage}
                  />
                ))}

                {/* Root drop zone — appears when dragging */}
                <RootDroppable
                  hasContent={rootSections.length > 0 || rootPages.length > 0}
                />
              </SortableContext>
            </NotebookDndContext>
          )}
        </div>

        {/* Multi-select toolbar */}
        {selectionActive && (
          <div className="border-t bg-muted/40 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium">
                {selectedPageIds.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPageSelection}
                className="h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7">
                    <FolderInput className="mr-1 h-3.5 w-3.5" />
                    Move
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 max-h-64 overflow-y-auto"
                >
                  <DropdownMenuLabel className="text-xs">
                    Move {selectedPageIds.length} pages to
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onMovePages(selectedPageIds, null);
                      clearPageSelection();
                    }}
                    className="cursor-pointer"
                  >
                    <span className="italic text-muted-foreground">
                      Root (no section)
                    </span>
                  </DropdownMenuItem>
                  {sections.length > 0 && <DropdownMenuSeparator />}
                  {sections.map((sec) => (
                    <DropdownMenuItem
                      key={sec.id}
                      onClick={() => {
                        onMovePages(selectedPageIds, sec.id);
                        clearPageSelection();
                      }}
                      className="cursor-pointer"
                    >
                      {sec.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkDelete(true)}
                className="h-7 text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Resize handle */}
        {!isMobile && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
            aria-label="Resize sidebar"
            role="separator"
          />
        )}
      </aside>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedPageIds.length}{" "}
              {selectedPageIds.length === 1 ? "page" : "pages"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected pages will be permanently deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDeletePages(selectedPageIds);
                clearPageSelection();
                setShowBulkDelete(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete {selectedPageIds.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// Root droppable — invisible zone at bottom of tree
// ============================================================

function RootDroppable({ hasContent }: { hasContent: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
    data: { kind: "root" },
  });
  const { activeItem } = useDndState();

  if (!activeItem) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-2 rounded-md border-2 border-dashed py-3 text-center text-xs transition-colors",
        isOver
          ? "border-primary bg-primary/10 text-primary"
          : "border-muted-foreground/20 text-muted-foreground/60"
      )}
    >
      {isOver ? "Drop here to move to root" : "or drop at root level"}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function EmptyTreeState({
  onCreatePage,
  onCreateSection,
}: {
  onCreatePage: () => void;
  onCreateSection: () => void;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-3xl mb-2 opacity-50">📭</div>
      <p className="text-sm font-medium text-muted-foreground mb-1">
        No pages yet
      </p>
      <p className="text-xs text-muted-foreground/70 mb-4">
        Start by creating your first page or section.
      </p>
      <div className="flex flex-col gap-2 items-center">
        <Button size="sm" onClick={onCreatePage}>
          Create first page
        </Button>
        <Button size="sm" variant="ghost" onClick={onCreateSection}>
          Or create a section
        </Button>
      </div>
    </div>
  );
}

function SearchResultsView({
  pages,
  sections,
  activePageId,
  selectedPageIds,
  selectionActive,
  search,
  onPageClick,
  onToggleSelect,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
}: {
  pages: NotebookPage[];
  sections: NotebookSection[];
  activePageId: string | null;
  selectedPageIds: string[];
  selectionActive: boolean;
  search: string;
  onPageClick: (page: NotebookPage, event: React.MouseEvent) => void;
  onToggleSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void | Promise<void>;
  onDuplicate: (id: string) => void | Promise<void>;
  onMove: (id: string, sectionId: string | null) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-xs text-muted-foreground">
          No pages match "<strong>{search}</strong>"
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-medium">
        {pages.length} {pages.length === 1 ? "result" : "results"}
      </p>
      {pages.map((page) => (
        <PageListItem
          key={page.id}
          page={page}
          sections={sections}
          isActive={page.id === activePageId}
          isSelected={selectedPageIds.includes(page.id)}
          selectionActive={selectionActive}
          depth={0}
          onClick={onPageClick}
          onToggleSelect={onToggleSelect}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
