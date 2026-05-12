"use client";

/**
 * Notebook card — displayed in the dashboard grid.
 *
 * UPDATED in Phase Fix (HARD DELETE):
 *   - Delete now cascades: if notebook is published, automatically
 *     unpublishes from Supabase first, then deletes local IndexedDB.
 *   - No extra confirmation — single click on Delete = gone for good.
 *   - Dialog copy updated to inform user about cascade behavior.
 *
 * Shows:
 *   - Icon (emoji)
 *   - Name + description
 *   - Published badge
 *   - Page count + last updated relative time
 *   - Tags (if any)
 *   - Context menu (settings, delete)
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { MoreVertical, FileText, Trash2, Settings, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ROUTES } from "@/constants";
import { getNotebookPageCount } from "@/lib/notebook/storage";
import { unpublishNotebook, PublishError } from "@/lib/notebook/publish";
import type { Notebook, NotebookTag } from "@/types/notebook";
import type { PublishStatus } from "@/types/publish";
import { NotebookTagBadge } from "./notebook-tag-badge";
import { PublishStatusBadge } from "@/components/features/notebook/publish";
import { cn } from "@/lib/utils";

interface NotebookCardProps {
  notebook: Notebook;
  tags?: NotebookTag[];
  /** Publish status — parent loads in batch for efficiency. */
  publishStatus?: PublishStatus | null;
  /** Local delete callback — should remove from IndexedDB. */
  onDelete?: (id: string) => void | Promise<void>;
  className?: string;
}

function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function NotebookCard({
  notebook,
  tags = [],
  publishStatus,
  onDelete,
  className,
}: NotebookCardProps) {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load page count
  useEffect(() => {
    let cancelled = false;
    getNotebookPageCount(notebook.id).then((count) => {
      if (!cancelled) setPageCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [notebook.id, notebook.updatedAt]);

  const notebookTags = tags.filter((t) => notebook.tagIds.includes(t.id));
  const isPublished = publishStatus?.isPublished ?? false;

  // ═══════════════════════════════════════════════════════════
  // HARD DELETE — cascade unpublish + local delete
  // ═══════════════════════════════════════════════════════════
  //
  // Flow:
  //   1. If published → unpublish from Supabase first
  //      (so /@user/slug returns 404 immediately + free tier slot freed)
  //   2. Delete from IndexedDB (local notebook + sections + pages)
  //   3. Single toast at the end (no intermediate "unpublishing..." spam)
  //
  // If step 1 fails (network/auth), abort step 2 — better to keep local
  // than have a ghost published page with no local source of truth.
  //
  // Edge cases handled:
  //   - Notebook not actually published (publishStatus stale) — unpublish
  //     endpoint is idempotent, returns success
  //   - Network error during unpublish — abort + toast error
  //   - Local delete error — surface error, but unpublish already succeeded
  //     (user can retry; the local state is recoverable via backup)
  // ═══════════════════════════════════════════════════════════
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      // Step 1: Cascade unpublish if published
      if (isPublished) {
        try {
          await unpublishNotebook(notebook.id);
        } catch (err) {
          // Unpublish failed — STOP. Don't delete local if remote still exists.
          // User can retry, or if it's permanently broken, use cleanup admin.
          console.error("[NotebookCard] cascade unpublish failed:", err);
          const message =
            err instanceof PublishError
              ? err.message
              : "Failed to unpublish notebook";
          toast.error(`Couldn't delete: ${message}`);
          setIsDeleting(false);
          return;
        }
      }

      // Step 2: Delete local IndexedDB
      await onDelete(notebook.id);

      toast.success(
        isPublished
          ? `Notebook "${notebook.name}" deleted and unpublished`
          : `Notebook "${notebook.name}" deleted`
      );
      setShowDeleteDialog(false);
    } catch (err) {
      // Local delete failed AFTER successful unpublish — awkward state
      console.error("[NotebookCard] local delete error:", err);
      toast.error(
        "Local delete failed — published version was already removed. Try refreshing."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative h-full transition-all hover:shadow-md hover:border-foreground/20",
          isPublished && "border-green-200/60 dark:border-green-900/40",
          className
        )}
      >
        {/* Card body — wrapped in link for navigation */}
        <Link
          href={ROUTES.NOTEBOOK_DETAIL(notebook.id)}
          className="absolute inset-0 z-0"
          aria-label={`Open ${notebook.name}`}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Icon */}
              <div className="text-3xl leading-none flex-shrink-0 select-none">
                {notebook.icon || "📓"}
              </div>

              {/* Title + description */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate text-base">
                    {notebook.name}
                  </h3>
                </div>
                {notebook.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {notebook.description}
                  </p>
                )}
              </div>
            </div>

            {/* Menu — must be z-10 to sit above the absolute Link */}
            <div className="relative z-10 -mr-2 -mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Notebook options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.NOTEBOOK_SETTINGS(notebook.id)}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Publish status badge */}
          {isPublished && (
            <div className="relative z-10 flex items-center">
              <PublishStatusBadge
                isPublished
                publishedAt={publishStatus?.updatedAt}
                variant="dot"
              />
            </div>
          )}

          {/* Tags */}
          {notebookTags.length > 0 && (
            <div className="relative z-10 flex flex-wrap gap-1">
              {notebookTags.slice(0, 3).map((tag) => (
                <NotebookTagBadge key={tag.id} tag={tag} />
              ))}
              {notebookTags.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{notebookTags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>
                {pageCount === null
                  ? "…"
                  : `${pageCount} ${pageCount === 1 ? "page" : "pages"}`}
              </span>
            </div>
            <span>{relativeTime(notebook.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation — single confirmation, cascade behavior baked in */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (isDeleting && !open) return; // block close mid-delete
        setShowDeleteDialog(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{notebook.name}</strong> and all its sections and pages
              will be permanently deleted. This cannot be undone.
              {isPublished && (
                <>
                  {" "}The public URL (
                  <code className="text-xs font-mono">
                    /@{publishStatus?.notebookSlug ? `…/${publishStatus.notebookSlug}` : "…"}
                  </code>
                  ) will also be removed and return 404.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting
                ? isPublished
                  ? "Unpublishing & deleting…"
                  : "Deleting…"
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}