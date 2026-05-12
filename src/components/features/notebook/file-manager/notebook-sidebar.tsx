"use client";

/**
 * Notebook sidebar — left panel inside `/notebooks/[id]`.
 *
 * Layout:
 *   ┌──────────────────────────────┐
 *   │  Header (notebook name + +)  │
 *   ├──────────────────────────────┤
 *   │  Search bar                  │
 *   ├──────────────────────────────┤
 *   │  Tree (sections + pages)     │
 *   │  - Root-level drop zone      │
 *   ├──────────────────────────────┤
 *   │  Multi-select toolbar        │
 *   │  (only when selection active)│
 *   └──────────────────────────────┘
 *
 * Resize:
 *   - Drag right edge to resize (desktop only)
 *   - Width persisted via NotebookSettings
 *
 * Mobile:
 *   - Rendered inside a Sheet from parent
 *   - Resize handle hidden
 */

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  FolderInput,
  X,
} from "lucide-react";
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

interface NotebookSidebarProps {
  notebook: Notebook;
  sections: NotebookSection[];
  pages: NotebookPage[];
  /** Active page id (sync with URL). */
  activePageId: string | null;
  /** Sidebar width (px). Owner: page component. */
  width: number;
  /** Called on resize commit. */
  onWidthChange: (width: number) => void;

  /** Action callbacks — owned by parent (page). */
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

  /** Mobile mode — hide resize handle. */
  isMobile?: boolean;
}

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
    isMobile,
  } = props;

  // Selection state from store
  const selectedPageIds = useNotebookStore((s) => s.selectedPageIds);
  const selectedSectionIds = useNotebookStore((s) => s.selectedSectionIds);
  const togglePageSelection = useNotebookStore((s) => s.togglePageSelection);
  const setSelectedPageIds = useNotebookStore((s) => s.setSelectedPageIds);
  const clearPageSelection = useNotebookStore((s) => s.clearPageSelection);

  const selectionActive = selectedPageIds.length > 0;

  // Search
  const [search, setSearch] = useState("");

  // Bulk delete dialog
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Root-level drop zone state
  const [rootDragOver, setRootDragOver] = useState(false);

  // ── Last-selected ref for shift-click range select ──
  const lastSelectedIdRef = useRef<string | null>(null);

  // ── Tree data (root level) ─────────────────────────
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

  // ── Filtered pages for search ──────────────────────
  const filteredPages = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [pages, search]);

  // ── Page click — handles select vs open ─────────────
  const handlePageClick = useCallback(
    (page: NotebookPage, event: React.MouseEvent) => {
      // Shift/Cmd/Ctrl click → toggle multi-select
      if (event.shiftKey && lastSelectedIdRef.current) {
        // Shift-click → range select
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

      // Plain click while selection active → toggle
      if (selectionActive) {
        togglePageSelection(page.id);
        lastSelectedIdRef.current = page.id;
        return;
      }

      // Plain click → open page
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
    (id: string, _event: React.MouseEvent) => {
      togglePageSelection(id);
      lastSelectedIdRef.current = id;
    },
    [togglePageSelection]
  );

  // ── Drop handler for root-level drop zone ───────────
  const handleRootDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (
      types.includes("application/notebook-page-id") ||
      types.includes("application/notebook-page-ids")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setRootDragOver(true);
    }
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setRootDragOver(false);

    const idsJson = e.dataTransfer.getData("application/notebook-page-ids");
    if (idsJson) {
      try {
        const ids = JSON.parse(idsJson) as string[];
        if (ids.length > 0) onMovePages(ids, null);
      } catch {
        /* ignore */
      }
      return;
    }

    const id = e.dataTransfer.getData("application/notebook-page-id");
    if (id) onMovePage(id, null);
  };

  // ── Drop handler for section nodes ──────────────────
  const handleDropPagesIntoSection = useCallback(
    (pageIds: string[], sectionId: string | null) => {
      if (pageIds.length === 1) {
        return onMovePage(pageIds[0], sectionId);
      }
      return onMovePages(pageIds, sectionId);
    },
    [onMovePage, onMovePages]
  );

  // ── Resize handle ────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────

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
            // Click on empty background clears selection
            if (e.target === e.currentTarget && selectionActive) {
              clearPageSelection();
            }
          }}
        >
          {filteredPages ? (
            // ─── Search results view ───
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
            // ─── Tree view ───
            <>
              {/* Empty state */}
              {rootSections.length === 0 && rootPages.length === 0 && (
                <EmptyTreeState
                  onCreatePage={() => onCreatePage(null)}
                  onCreateSection={() => onCreateSection(null)}
                />
              )}

              {/* Root sections (recursive) */}
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
                  onDropPagesIntoSection={handleDropPagesIntoSection}
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

              {/* Root drop zone — only when sections exist (else click empty bg) */}
              {(rootSections.length > 0 || rootPages.length > 0) && (
                <div
                  onDragOver={handleRootDragOver}
                  onDragLeave={() => setRootDragOver(false)}
                  onDrop={handleRootDrop}
                  className={cn(
                    "mt-2 rounded-md border-2 border-dashed py-3 text-center text-xs transition-colors",
                    rootDragOver
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground/0 hover:border-muted-foreground/20 hover:text-muted-foreground/60"
                  )}
                >
                  {rootDragOver
                    ? "Drop to move to root"
                    : "Drag pages here for root level"}
                </div>
              )}
            </>
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
              {/* Move dropdown */}
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

              {/* Delete */}
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

        {/* Resize handle (desktop only) */}
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
  onToggleSelect: (id: string, event: React.MouseEvent) => void;
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
