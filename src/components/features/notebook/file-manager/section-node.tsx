"use client";

/**
 * Section node — a row in the notebook sidebar tree.
 *
 * Features:
 *   - Collapsible — click chevron or section row to expand/collapse
 *   - Inline rename
 *   - Context menu: rename, new page/section inside, delete
 *   - Drag handle for HTML5 drag/drop
 *   - Drop target for pages (move into) and sections (nest under)
 *   - Recursive — renders child sections and pages
 */

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  FileText,
  FolderPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type {
  NotebookPage,
  NotebookSection,
} from "@/types/notebook";
import { cn } from "@/lib/utils";
import { PageListItem } from "./page-list-item";

interface SectionNodeProps {
  section: NotebookSection;
  /** All sections in the notebook (for recursion). */
  allSections: NotebookSection[];
  /** All pages in the notebook (for finding children). */
  allPages: NotebookPage[];
  /** Active page id (for highlight). */
  activePageId: string | null;
  /** Multi-select state. */
  selectedPageIds: string[];
  selectedSectionIds: string[];
  selectionActive: boolean;
  /** Nesting depth in px. */
  depth: number;
  /** Callbacks (parent owns storage operations). */
  onSelectPage: (page: NotebookPage, event: React.MouseEvent) => void;
  onTogglePageSelect: (id: string, event: React.MouseEvent) => void;
  onRenamePage: (id: string, newTitle: string) => void | Promise<void>;
  onDuplicatePage: (id: string) => void | Promise<void>;
  onMovePage: (id: string, sectionId: string | null) => void | Promise<void>;
  onDeletePage: (id: string) => void | Promise<void>;
  onRenameSection: (id: string, newName: string) => void | Promise<void>;
  onDeleteSection: (
    id: string,
    pageStrategy: "orphan" | "delete"
  ) => void | Promise<void>;
  onCreatePage: (sectionId: string | null) => void | Promise<void>;
  onCreateSection: (parentId: string | null) => void | Promise<void>;
  onDropPagesIntoSection: (
    pageIds: string[],
    sectionId: string | null
  ) => void | Promise<void>;
}

export function SectionNode(props: SectionNodeProps) {
  const {
    section,
    allSections,
    allPages,
    activePageId,
    selectedPageIds,
    selectedSectionIds,
    selectionActive,
    depth,
    onSelectPage,
    onTogglePageSelect,
    onRenamePage,
    onDuplicatePage,
    onMovePage,
    onDeletePage,
    onRenameSection,
    onDeleteSection,
    onCreatePage,
    onCreateSection,
    onDropPagesIntoSection,
  } = props;

  // Children of this section
  const childSections = allSections
    .filter((s) => s.parentId === section.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const childPages = allPages
    .filter((p) => p.sectionId === section.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const hasChildren = childSections.length > 0 || childPages.length > 0;
  const childCount = childSections.length + childPages.length;

  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(section.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePageStrategy, setDeletePageStrategy] = useState<
    "orphan" | "delete"
  >("orphan");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedSectionIds.includes(section.id);

  // Count of pages that would be affected by delete
  const affectedPageCount = countDescendantPages(
    section.id,
    allSections,
    allPages
  );

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (!isRenaming) {
      setRenameValue(section.name);
    }
  }, [section.name, isRenaming]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== section.name) {
      onRenameSection(section.id, trimmed);
    } else {
      setRenameValue(section.name);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(section.name);
    setIsRenaming(false);
  };

  // ── Drag handlers ───────────────────────────────────

  const handleDragStart = (e: React.DragEvent) => {
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/notebook-section-id", section.id);
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (
      types.includes("application/notebook-page-id") ||
      types.includes("application/notebook-page-ids")
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Multi-page drop
    const idsJson = e.dataTransfer.getData("application/notebook-page-ids");
    if (idsJson) {
      try {
        const ids = JSON.parse(idsJson) as string[];
        if (ids.length > 0) {
          onDropPagesIntoSection(ids, section.id);
        }
      } catch {
        /* ignore malformed */
      }
      return;
    }

    // Single-page drop
    const id = e.dataTransfer.getData("application/notebook-page-id");
    if (id) {
      onDropPagesIntoSection([id], section.id);
    }
  };

  // ── Render ──────────────────────────────────────────

  return (
    <>
      {/* Section row */}
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isRenaming) setIsExpanded((v) => !v);
        }}
        className={cn(
          "group relative flex items-center gap-1 rounded-md py-1 pr-1 text-sm cursor-pointer transition-colors",
          isDragOver
            ? "bg-primary/15 ring-1 ring-primary"
            : isSelected
            ? "bg-accent/60"
            : "text-foreground hover:bg-muted",
          "font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        role="treeitem"
        aria-expanded={isExpanded}
      >
        {/* Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((v) => !v);
          }}
          className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        )}

        {/* Name / rename input */}
        {isRenaming ? (
          <Input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            className="h-6 text-sm flex-1 min-w-0"
          />
        ) : (
          <>
            <span className="flex-1 truncate min-w-0">{section.name}</span>
            {childCount > 0 && (
              <span className="text-[10px] text-muted-foreground opacity-60">
                {childCount}
              </span>
            )}
          </>
        )}

        {/* Context menu */}
        {!isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-background transition-opacity flex-shrink-0"
                aria-label="Section options"
              >
                <MoreVertical className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePage(section.id);
                  setIsExpanded(true);
                }}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-3.5 w-3.5" />
                New page inside
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSection(section.id);
                  setIsExpanded(true);
                }}
                className="cursor-pointer"
              >
                <FolderPlus className="mr-2 h-3.5 w-3.5" />
                New section inside
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children */}
      {isExpanded && (
        <div role="group">
          {/* Child sections (recurse) */}
          {childSections.map((child) => (
            <SectionNode
              key={child.id}
              {...props}
              section={child}
              depth={depth + 1}
            />
          ))}

          {/* Child pages */}
          {childPages.map((page) => (
            <PageListItem
              key={page.id}
              page={page}
              sections={allSections}
              isActive={page.id === activePageId}
              isSelected={selectedPageIds.includes(page.id)}
              selectionActive={selectionActive}
              depth={depth + 1}
              onClick={onSelectPage}
              onToggleSelect={onTogglePageSelect}
              onRename={onRenamePage}
              onDuplicate={onDuplicatePage}
              onMove={onMovePage}
              onDelete={onDeletePage}
            />
          ))}

          {/* Empty placeholder */}
          {!hasChildren && (
            <div
              className="text-xs text-muted-foreground/60 italic py-1"
              style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
            >
              Empty
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{section.name}</strong> will be deleted along with{" "}
              {childSections.length} sub-sections.
              {affectedPageCount > 0 && (
                <>
                  {" "}This section contains <strong>{affectedPageCount}</strong>{" "}
                  {affectedPageCount === 1 ? "page" : "pages"}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {affectedPageCount > 0 && (
            <div className="py-2">
              <RadioGroup
                value={deletePageStrategy}
                onValueChange={(v) =>
                  setDeletePageStrategy(v as "orphan" | "delete")
                }
                className="space-y-2"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem
                    value="orphan"
                    id={`orphan-${section.id}`}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`orphan-${section.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    <span className="font-medium">Keep pages</span> — move them
                    to the notebook root
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem
                    value="delete"
                    id={`delete-${section.id}`}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`delete-${section.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    <span className="font-medium text-destructive">
                      Delete pages
                    </span>{" "}
                    — remove the {affectedPageCount} pages permanently
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDeleteSection(section.id, deletePageStrategy);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// Helpers
// ============================================================

/**
 * Count all pages inside a section and its descendants.
 */
function countDescendantPages(
  sectionId: string,
  allSections: NotebookSection[],
  allPages: NotebookPage[]
): number {
  const collectIds = (rootId: string): string[] => {
    const children = allSections.filter((s) => s.parentId === rootId);
    return [
      rootId,
      ...children.flatMap((c) => collectIds(c.id)),
    ];
  };

  const allSectionIds = collectIds(sectionId);
  return allPages.filter(
    (p) => p.sectionId && allSectionIds.includes(p.sectionId)
  ).length;
}
