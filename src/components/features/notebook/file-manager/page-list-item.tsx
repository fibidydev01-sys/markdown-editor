"use client";

/**
 * Page list item — a row in the notebook sidebar tree.
 *
 * Features:
 *   - Click → select page (navigate via parent callback)
 *   - Multi-select via checkbox (shift/cmd click handled by parent)
 *   - Inline rename (double-click or via context menu)
 *   - Context menu: rename, duplicate, move, delete
 *   - Drag handle for HTML5 drag/drop
 *   - Active highlight when current page
 */

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  FolderInput,
  Check,
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
  /** All sections in the notebook (for "Move to..." menu). */
  sections: NotebookSection[];
  /** Is this the currently-active page? */
  isActive: boolean;
  /** Is this page selected (multi-select)? */
  isSelected: boolean;
  /** Indentation depth based on section nesting (px). */
  depth: number;
  /** Click — parent decides whether to open or toggle select. */
  onClick: (page: NotebookPage, event: React.MouseEvent) => void;
  /** Checkbox click — explicit toggle select. */
  onToggleSelect: (id: string, event: React.MouseEvent) => void;
  /** Multi-select active anywhere in the notebook. */
  selectionActive: boolean;
  /** Action handlers — parent owns storage calls. */
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
  depth,
  onClick,
  onToggleSelect,
  selectionActive,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
}: PageListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  // Reset rename value when page title changes externally
  // (but NOT while user is actively renaming — don't clobber their input)
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

  // ── Drag start ────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent) => {
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    // If part of multi-select, drag all selected
    if (isSelected) {
      e.dataTransfer.setData(
        "application/notebook-page-ids",
        JSON.stringify([page.id])
      );
    } else {
      e.dataTransfer.setData("application/notebook-page-id", page.id);
    }
    e.dataTransfer.effectAllowed = "move";
  };

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
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
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        role="treeitem"
        aria-selected={isSelected}
      >
        {/* Checkbox (only shown when selection active or hovered) */}
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
