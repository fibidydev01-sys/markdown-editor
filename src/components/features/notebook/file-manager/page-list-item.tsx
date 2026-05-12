"use client";

/**
 * Page list item — Notion-style EAGER SWAP edition.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHAT CHANGED (Stage 2 polish):
 * ──────────────────────────────────────────────────────────────────
 * BEFORE: rendered <DropIndicator> based on position classification
 *         (before/after). User had to be presisi.
 *
 * NOW:    No drop indicator. The item itself ANIMATES into the new
 *         position as soon as the cursor reaches it. This is the
 *         Notion / Linear / Trello pattern.
 *
 * dnd-kit's `useSortable` returns a `transform` that includes the
 * computed translate to make space for the incoming item. As soon as
 * the parent's optimistic state updates (which `useSortable` reads
 * from `SortableContext`'s items array), the list rearranges with a
 * smooth CSS transition.
 *
 * The visual cue is the gap that opens up + the dragged item's
 * overlay following the cursor. No line, no indicator, no precision
 * targeting needed.
 */

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileText,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  FolderInput,
  Check,
  GripVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import type { NotebookPage, NotebookSection } from "@/types/notebook";
import { cn } from "@/lib/utils";

interface PageListItemProps {
  page: NotebookPage;
  sections: NotebookSection[];
  isActive: boolean;
  isSelected: boolean;
  selectionActive: boolean;
  depth: number;
  onClick: (page: NotebookPage, event: React.MouseEvent) => void;
  onToggleSelect: (id: string, event: React.MouseEvent) => void;
  onRename: (id: string, newTitle: string) => void | Promise<void>;
  onDuplicate: (id: string) => void | Promise<void>;
  onMove: (id: string, sectionId: string | null) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function PageListItem({
  page,
  sections,
  isActive,
  isSelected,
  selectionActive,
  depth,
  onClick,
  onToggleSelect,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
}: PageListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    id: page.id,
    data: { kind: "page" },
    disabled: isRenaming,
  });

  // Focus rename input
  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  // Sync external title changes
  useEffect(() => {
    if (!isRenaming) {
      setRenameValue(page.title);
    }
  }, [page.title, isRenaming]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== page.title) {
      onRename(page.id, trimmed);
    } else {
      setRenameValue(page.title);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(page.title);
    setIsRenaming(false);
  };

  // Apply dnd transform — smooth motion handled by dnd-kit's transition
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 12 + 8}px`,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onClick={(e) => {
          if (isRenaming) return;
          onClick(page, e);
        }}
        onDoubleClick={() => {
          if (!selectionActive) setIsRenaming(true);
        }}
        className={cn(
          "group relative flex items-center gap-1.5 rounded-md py-1 pr-1 text-sm cursor-pointer transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : isSelected
              ? "bg-accent/60"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          // Hide source during drag — overlay represents it.
          // We keep the slot (opacity instead of display:none) so
          // surrounding items don't jump.
          isDragging && "opacity-30"
        )}
        role="treeitem"
        aria-selected={isSelected}
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

        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(page.id, e);
          }}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border flex-shrink-0 transition-opacity",
            isSelected
              ? "border-primary bg-primary text-primary-foreground opacity-100"
              : "border-muted-foreground/30 bg-background opacity-0 group-hover:opacity-100",
            selectionActive && "opacity-100"
          )}
          aria-label={isSelected ? "Deselect page" : "Select page"}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>

        {/* Icon */}
        <FileText className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />

        {/* Title / rename input */}
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
          <span className="flex-1 truncate min-w-0">
            {page.title || "Untitled"}
          </span>
        )}

        {/* Context menu */}
        {!isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-background transition-opacity flex-shrink-0"
                aria-label="Page options"
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(page.id);
                }}
                className="cursor-pointer"
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-3.5 w-3.5" />
                  Move to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(page.id, null);
                    }}
                    disabled={page.sectionId === null}
                    className="cursor-pointer"
                  >
                    <span className="text-muted-foreground italic">
                      Root (no section)
                    </span>
                  </DropdownMenuItem>
                  {sections.length > 0 && <DropdownMenuSeparator />}
                  {sections.map((sec) => (
                    <DropdownMenuItem
                      key={sec.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(page.id, sec.id);
                      }}
                      disabled={page.sectionId === sec.id}
                      className="cursor-pointer"
                    >
                      {sec.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{page.title || "Untitled"}</strong> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete(page.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
