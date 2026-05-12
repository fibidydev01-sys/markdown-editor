"use client";

/**
 * Publish button — main CTA mounted in the notebook editor page header.
 *
 * Behaviors:
 *   - Not published: shows "Publish" button → opens PublishModal
 *   - Published: shows split button — primary action "Update" opens modal,
 *     secondary menu has "View public", "Copy URL", "Unpublish"
 *   - Loading: shows skeleton/disabled state
 *
 * Per roadmap decision (4): mounted at page level (not editor toolbar),
 * keeps editor toolbar focused on writing actions.
 */

import { useState } from "react";
import {
  Globe,
  Loader2,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PublishModal } from "./publish-modal";
import { UnpublishConfirmModal } from "./unpublish-confirm-modal";
import { PublishStatusBadge } from "./publish-status-badge";
import { usePublishStatus } from "@/hooks/notebook/use-publish-status";
import { usePublishAction } from "@/hooks/notebook/use-publish-action";
import { PublishError } from "@/lib/notebook/publish";
import { useAuthStore } from "@/stores/auth-store";
import type { Notebook } from "@/types/notebook";
import { cn } from "@/lib/utils";

interface PublishButtonProps {
  notebook: Notebook;
  /** Compact mode for narrow toolbars (mobile). */
  compact?: boolean;
  className?: string;
}

export function PublishButton({
  notebook,
  compact,
  className,
}: PublishButtonProps) {
  const workspace = useAuthStore((s) => s.workspace);
  const hasFetchedAuth = useAuthStore((s) => s.hasFetched);

  const { status, isLoading, refresh } = usePublishStatus(notebook.id);
  const { unpublish, isUnpublishing } = usePublishAction();

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Workspace guard ───────────────────────────────────
  // If user has no workspace, don't render publish UI at all.
  // (Workspace should always exist after Phase H trigger, but defensive.)
  if (hasFetchedAuth && !workspace) {
    return null;
  }

  const isPublished = status?.isPublished ?? false;
  const publicUrl = status?.publicUrl ?? null;

  // ── Actions ────────────────────────────────────────────

  const handleUnpublish = async () => {
    try {
      await unpublish(notebook.id);
      toast.success("Notebook unpublished");
      await refresh();
      setShowUnpublishModal(false);
    } catch (err) {
      const message =
        err instanceof PublishError
          ? err.message
          : "Failed to unpublish — please try again";
      toast.error(message);
    }
  };

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy URL");
    }
  };

  // ── Render ─────────────────────────────────────────────

  // Loading state
  if (isLoading && !status) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Not published — single Publish button
  if (!isPublished) {
    return (
      <>
        <Button
          variant="default"
          size={compact ? "sm" : "default"}
          onClick={() => setShowPublishModal(true)}
          className={className}
        >
          <Upload className={cn("h-4 w-4", !compact && "mr-2")} />
          {!compact && "Publish"}
        </Button>

        <PublishModal
          open={showPublishModal}
          onOpenChange={setShowPublishModal}
          notebook={notebook}
          currentStatus={status}
          onSuccess={() => refresh()}
        />
      </>
    );
  }

  // Published — split button with dropdown
  return (
    <>
      <div className={cn("inline-flex items-center", className)}>
        {/* Status badge — only show in non-compact mode */}
        {!compact && (
          <PublishStatusBadge
            isPublished
            publishedAt={status?.updatedAt}
            variant="dot"
            className="mr-2.5"
          />
        )}

        {/* Split button group */}
        <div className="inline-flex rounded-md shadow-sm">
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => setShowPublishModal(true)}
            className="rounded-r-none border-r-0"
            title="Re-publish with latest changes"
          >
            <Upload className={cn("h-4 w-4", !compact && "mr-2")} />
            {!compact && "Update"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                className="rounded-l-none px-2"
                aria-label="Publish options"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {publicUrl && (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      View public page
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyUrl}
                    className="cursor-pointer"
                  >
                    {copied ? (
                      <Check className="mr-2 h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="mr-2 h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy public URL"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setShowUnpublishModal(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Unpublish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modals */}
      <PublishModal
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        notebook={notebook}
        currentStatus={status}
        onSuccess={() => refresh()}
      />

      <UnpublishConfirmModal
        open={showUnpublishModal}
        onOpenChange={setShowUnpublishModal}
        notebookName={notebook.name}
        publicUrl={publicUrl}
        isUnpublishing={isUnpublishing}
        onConfirm={handleUnpublish}
      />
    </>
  );
}
