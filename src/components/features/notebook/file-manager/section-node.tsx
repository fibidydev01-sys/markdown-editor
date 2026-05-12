"use client";

/**
 * Section node — Notion-style EAGER SWAP edition.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHAT CHANGED (Stage 2 polish):
 * ──────────────────────────────────────────────────────────────────
 * BEFORE: DropIndicator before/after + "inside" ring based on
 *         pointer Y position (30/40/30 split).
 *
 * NOW:    No indicators. Just smooth transform via useSortable. The
 *         section animates to its new position as soon as cursor
 *         crosses it.
 *
 * Section nesting (becoming a child of another section):
 *   - When you hover over a section for 600ms+, it auto-expands.
 *   - Once expanded, dropping inside the expanded body adds the item
 *     as a child of that section.
 *   - This auto-expand is triggered by the parent dnd-context via
 *     `expandRequest` prop here.
 *
 * No more "inside" position classification — the act of hovering long
 * enough to trigger expansion IS the nesting gesture.
 */

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  FolderPlus,
  GripVertical,
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
import { useDndState } from "./dnd-context";

interface SectionNodeProps {
  section: NotebookSection;
  allSections: NotebookSection[];
  allPages: NotebookPage[];
  activePageId: string | null;
  selectedPageIds: string[];
  selectedSectionIds: string[];
  selectionActive: boolean;
  depth: number;
  /** Trigger from dnd-context: this section should auto-expand. */
  expandRequest?: string | null;
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
    expandRequest,
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
  } = props;

  // Children
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
  const inputRef = useRef<HTMLInputElement>(null);

  // ── dnd-kit sortable ──
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { kind: "section" },
    disabled: isRenaming,
  });

  // ── Shared dnd state — for "drag over me" visual ──
  const { activeItem, overId } = useDndState();
  const isOver = overId === section.id;
  const isDifferentItem = isOver && activeItem && activeItem.id !== section.id;

  const isSelected = selectedSectionIds.includes(section.id);

  // Count pages affected by delete
  const affectedPageCount = countDescendantPages(
    section.id,
    allSections,
    allPages
  );

  // ── Auto-expand on hover (from dnd-context) ──
  useEffect(() => {
    if (expandRequest === section.id && !isExpanded) {
      setIsExpanded(true);
    }
  }, [expandRequest, section.id, isExpanded]);

  // Focus rename input
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

  // Apply dnd transform
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 12 + 4}px`,
  };

  return (
    <>
      {/* Section row */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        data-section-id={section.id}
        onClick={() => {
          if (!isRenaming) setIsExpanded((v) => !v);
        }}
        className={cn(
          "group relative flex items-center gap-1 rounded-md py-1 pr-1 text-sm cursor-pointer transition-colors font-medium",
          isSelected ? "bg-accent/60" : "text-foreground hover:bg-muted",
          // Subtle highlight when another item is being dragged over.
          // Not a "drop indicator" — just a "yes, you're aimed here" cue.
          isDifferentItem && "bg-primary/5 ring-1 ring-primary/30 ring-inset",
          isDragging && "opacity-30"
        )}
        role="treeitem"
        aria-expanded={isExpanded}
      >
        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex h-5 w-3 items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isRenaming && "pointer-events-none opacity-0"
          )}
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>

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
          {childSections.map((child) => (
            <SectionNode
              key={child.id}
              {...props}
              section={child}
              depth={depth + 1}
            />
          ))}

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
