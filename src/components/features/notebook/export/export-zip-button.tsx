"use client";

/**
 * Export ZIP button — exports a single notebook as ZIP and downloads it.
 *
 * Used from:
 *   - Notebook card dropdown menu (dashboard)
 *   - Future: notebook detail page header
 *
 * Variants:
 *   - "button" (default) — renders as a Button
 *   - "menu-item" — renders just the click handler + label content for use
 *     inside an existing dropdown (caller provides DropdownMenuItem)
 *
 * Progress is reported via toast (no separate modal) since per-notebook
 * exports complete quickly for typical sizes.
 */

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportNotebookAsZip } from "@/lib/notebook/export";
import { cn } from "@/lib/utils";

interface ExportZipButtonProps {
  notebookId: string;
  notebookName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  showIcon?: boolean;
  disabled?: boolean;
  /** Optional callback after successful export. */
  onExported?: (result: { filename: string; pagesExported: number }) => void;
}

export function ExportZipButton({
  notebookId,
  notebookName,
  variant = "outline",
  size = "default",
  className,
  label = "Export ZIP",
  showIcon = true,
  disabled,
  onExported,
}: ExportZipButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    const toastId = toast.loading(
      notebookName
        ? `Exporting "${notebookName}"…`
        : "Exporting notebook…"
    );

    try {
      const result = await exportNotebookAsZip(notebookId, (progress) => {
        if (progress.phase === "zipping" && progress.message) {
          toast.loading(progress.message, { id: toastId });
        }
      });

      toast.success(
        `Downloaded ${result.filename} (${formatBytes(result.sizeBytes)})`,
        { id: toastId }
      );

      onExported?.({
        filename: result.filename,
        pagesExported: result.pagesExported,
      });
    } catch (err) {
      console.error("[ExportZipButton] error:", err);
      toast.error("Export failed — please try again", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={cn(className)}
    >
      {isExporting ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", label && "mr-2")} />
      ) : showIcon ? (
        <Download className={cn("h-4 w-4", label && "mr-2")} />
      ) : null}
      {isExporting ? "Exporting…" : label}
    </Button>
  );
}

// ============================================================
// Helper: format bytes for toast message
// ============================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
