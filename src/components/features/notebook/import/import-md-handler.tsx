"use client";

/**
 * Drag-drop handler for markdown files.
 *
 * Provides a full-viewport drop overlay that activates when the user
 * drags .md files over the page. Used inside a notebook detail page
 * (Phase E doesn't fully wire this into the notebook page — but the
 * component is ready for Phase F+ usage).
 *
 * Can also be used as a controlled wrapper around any content to enable
 * drop targeting within that region.
 *
 * Usage:
 *   <ImportMdHandler onImport={async (pages) => { ... }}>
 *     <YourPage />
 *   </ImportMdHandler>
 */

import { useCallback, useRef, useState, type ReactNode } from "react";
import { FileText, Upload } from "lucide-react";
import { parseMarkdownFiles } from "@/lib/notebook/import/md-parser";
import type { ImportablePage } from "@/lib/notebook/import/md-parser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportMdHandlerProps {
  /** Called after files are parsed. Receives ImportablePage[]. */
  onImport: (pages: ImportablePage[]) => void | Promise<void>;
  /** When true, the drop overlay is rendered. Default: true. */
  enabled?: boolean;
  /** Wrapped children (the drop target region). */
  children: ReactNode;
  className?: string;
}

export function ImportMdHandler({
  onImport,
  enabled = true,
  children,
  className,
}: ImportMdHandlerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      // Only show overlay when dragging actual files (not other DnD types)
      if (!e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      dragCounter.current += 1;
      if (dragCounter.current === 1) setIsDragging(true);
    },
    [enabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    },
    [enabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!enabled) return;
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, [enabled]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Filter to .md / .markdown only
      const mdFiles = files.filter((f) =>
        /\.(md|markdown)$/i.test(f.name)
      );

      if (mdFiles.length === 0) {
        toast.error("Drop .md or .markdown files to import");
        return;
      }

      const skipped = files.length - mdFiles.length;
      if (skipped > 0) {
        toast.info(
          `Skipping ${skipped} non-markdown ${
            skipped === 1 ? "file" : "files"
          }`
        );
      }

      try {
        const pages = await parseMarkdownFiles(mdFiles);
        if (pages.length === 0) {
          toast.error("Failed to read any files");
          return;
        }
        await onImport(pages);
      } catch (err) {
        console.error("[ImportMdHandler] error:", err);
        toast.error("Failed to import files");
      }
    },
    [enabled, onImport]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn("relative", className)}
    >
      {children}

      {isDragging && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
          <div className="rounded-xl border-2 border-dashed border-primary bg-card p-12 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">
              Drop to import
            </p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              .md or .markdown files only
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
