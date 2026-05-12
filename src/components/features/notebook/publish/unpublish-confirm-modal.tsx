"use client";

/**
 * Unpublish confirm modal — simple destructive confirm.
 *
 * Unpublish is REVERSIBLE (user can re-publish anytime), so we don't
 * use the heavy "type to confirm" pattern. Just a clear warning.
 *
 * The local notebook (IndexedDB) is untouched — only the public-facing
 * snapshot in Supabase is removed.
 */

import { Loader2, Globe, AlertTriangle } from "lucide-react";
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

interface UnpublishConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookName: string;
  publicUrl: string | null;
  isUnpublishing: boolean;
  onConfirm: () => void;
}

export function UnpublishConfirmModal({
  open,
  onOpenChange,
  notebookName,
  publicUrl,
  isUnpublishing,
  onConfirm,
}: UnpublishConfirmModalProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isUnpublishing && !next) return; // block close during op
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0 text-left">
              <AlertDialogTitle>Unpublish notebook?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong className="text-foreground">{notebookName}</strong>{" "}
                will no longer be publicly accessible.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-1">
          {publicUrl && (
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Will return 404
              </p>
              <code className="text-xs font-mono break-all">{publicUrl}</code>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-md bg-muted/30 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-60" />
            <p>
              Your local notebook stays safe — only the published snapshot is
              removed. You can re-publish anytime.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnpublishing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isUnpublishing}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isUnpublishing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Unpublish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
