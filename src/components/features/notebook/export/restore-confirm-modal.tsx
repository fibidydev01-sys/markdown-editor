"use client";

/**
 * Restore confirm modal — shown after a backup JSON is parsed.
 *
 * Restore is **destructive** — it replaces ALL existing notebooks, sections,
 * pages, tags, and settings with the contents of the backup. This modal
 * surfaces what will be replaced + what's coming in, and requires explicit
 * confirmation.
 *
 * After confirm:
 *   - All current data is cleared
 *   - Backup data is inserted
 *   - User is shown a success toast
 *   - Page reload is suggested (or auto-triggered) so all queries refresh
 */

import { useState } from "react";
import {
  AlertTriangle,
  Database,
  Loader2,
  FileJson,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NotebookBackup } from "@/types/notebook";
import { cn } from "@/lib/utils";

interface RestoreConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The parsed backup data. */
  backup: NotebookBackup;
  /** Current counts (before restore) — for "you'll lose X" warning. */
  currentCounts: {
    notebooks: number;
    sections: number;
    pages: number;
    tags: number;
  };
  /** True when restore is in flight. */
  isRestoring: boolean;
  /** Confirm callback — triggers actual restore. */
  onConfirm: () => void;
}

const CONFIRM_PHRASE = "REPLACE ALL";

export function RestoreConfirmModal({
  open,
  onOpenChange,
  backup,
  currentCounts,
  isRestoring,
  onConfirm,
}: RestoreConfirmModalProps) {
  const [typedConfirm, setTypedConfirm] = useState("");

  const canConfirm =
    typedConfirm.trim().toUpperCase() === CONFIRM_PHRASE && !isRestoring;

  const backupCounts = {
    notebooks: backup.notebooks.length,
    sections: backup.sections.length,
    pages: backup.pages.length,
    tags: backup.tags.length,
  };

  // Format backup creation date (NotebookBackup uses `exportedAt`)
  const createdAt = new Date(backup.exportedAt);
  const createdAtLabel = createdAt.toLocaleString();

  // Don't allow close during active restore
  const handleOpenChange = (next: boolean) => {
    if (isRestoring && !next) return;
    if (!next) setTypedConfirm("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          if (isRestoring) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isRestoring) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Restore from backup?</DialogTitle>
              <DialogDescription>
                This will <strong>permanently replace</strong> all your current
                data.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* What's in the backup */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileJson className="h-4 w-4 text-primary" />
              Backup file contents
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-mono">{createdAtLabel}</span>
              <span className="text-muted-foreground">Format version:</span>
              <span className="font-mono">v{backup.version}</span>
              <span className="text-muted-foreground">Notebooks:</span>
              <span className="font-medium">{backupCounts.notebooks}</span>
              <span className="text-muted-foreground">Sections:</span>
              <span className="font-medium">{backupCounts.sections}</span>
              <span className="text-muted-foreground">Pages:</span>
              <span className="font-medium">{backupCounts.pages}</span>
              <span className="text-muted-foreground">Tags:</span>
              <span className="font-medium">{backupCounts.tags}</span>
            </div>
          </div>

          {/* What you'll lose */}
          {hasAnyContent(currentCounts) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium mb-2 text-destructive">
                <Database className="h-4 w-4" />
                You'll lose
              </div>
              <p className="text-xs text-muted-foreground">
                Your current{" "}
                <strong className="text-foreground">
                  {currentCounts.notebooks}
                </strong>{" "}
                {currentCounts.notebooks === 1 ? "notebook" : "notebooks"},{" "}
                <strong className="text-foreground">
                  {currentCounts.pages}
                </strong>{" "}
                {currentCounts.pages === 1 ? "page" : "pages"}, and{" "}
                <strong className="text-foreground">
                  {currentCounts.tags}
                </strong>{" "}
                {currentCounts.tags === 1 ? "tag" : "tags"} will be deleted.
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                <strong>Tip:</strong> Export a backup first via "Export
                backup" before restoring.
              </p>
            </div>
          )}

          {/* Confirm input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-phrase" className="text-sm">
              Type{" "}
              <code className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">
                {CONFIRM_PHRASE}
              </code>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-phrase"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              disabled={isRestoring}
              autoComplete="off"
              autoFocus
              className={cn(
                "font-mono",
                canConfirm && "border-destructive focus-visible:ring-destructive/30"
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isRestoring && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isRestoring ? "Restoring…" : "Replace everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function hasAnyContent(counts: {
  notebooks: number;
  pages: number;
  tags: number;
}): boolean {
  return counts.notebooks > 0 || counts.pages > 0 || counts.tags > 0;
}
