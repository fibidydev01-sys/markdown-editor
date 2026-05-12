"use client";

/**
 * UnifiedDropzone — single dropzone that accepts BOTH:
 *   - 1 `.zip` file  → triggers ZIP import flow (sections + pages auto-detected)
 *   - N `.md` files  → triggers Markdown import flow (flat pages, no sections)
 *
 * Uses `react-dropzone` for proper drag/drop UX:
 *   - Click anywhere to open file picker
 *   - Drop file(s) from OS
 *   - Reject feedback for invalid file types
 *   - Touch-friendly
 *
 * Branching rules:
 *   - All files are .zip → take the first one, ignore rest with a toast
 *   - All files are .md  → forward all of them
 *   - Mixed (.zip + .md) → reject with toast "drop ZIP or markdown files, not both"
 *
 * Visual states (intentional, distinctive design):
 *   - idle           → dashed border, soft glow on hover
 *   - drag-active    → primary border, scale-up, subtle pulse
 *   - drag-reject    → destructive border + bg tint
 *   - processing     → spinner + disabled
 */

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Upload,
  FileArchive,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UnifiedDropzoneProps {
  onZipDropped: (file: File) => void;
  onMarkdownFilesDropped: (files: File[]) => void;
  isProcessing?: boolean;
  className?: string;
}

const ACCEPT = {
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "text/markdown": [".md", ".markdown"],
  // Some browsers send markdown as text/plain — react-dropzone matches on
  // extension when mime is generic, so we list extensions on text/plain too.
  "text/plain": [".md", ".markdown"],
};

export function UnifiedDropzone({
  onZipDropped,
  onMarkdownFilesDropped,
  isProcessing,
  className,
}: UnifiedDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      // Surface rejections first so user knows something was filtered out
      if (rejected.length > 0) {
        const names = rejected.slice(0, 2).map((r) => r.file.name).join(", ");
        const more = rejected.length > 2 ? ` and ${rejected.length - 2} more` : "";
        toast.error(
          `Couldn't accept ${names}${more}. Only .zip or .md files allowed.`
        );
      }

      if (accepted.length === 0) return;

      // Classify accepted files
      const zips = accepted.filter((f) =>
        f.name.toLowerCase().endsWith(".zip")
      );
      const mds = accepted.filter((f) =>
        /\.(md|markdown)$/i.test(f.name)
      );

      // Mixed bag → reject
      if (zips.length > 0 && mds.length > 0) {
        toast.error(
          "Drop a ZIP file OR markdown files — not both at the same time."
        );
        return;
      }

      // Multiple zips → take first, warn
      if (zips.length > 1) {
        toast.info(
          `Found ${zips.length} ZIP files. Using "${zips[0].name}" — drop them one at a time for the rest.`
        );
      }

      if (zips.length >= 1) {
        onZipDropped(zips[0]);
        return;
      }

      if (mds.length >= 1) {
        onMarkdownFilesDropped(mds);
        return;
      }
    },
    [onZipDropped, onMarkdownFilesDropped]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    disabled: isProcessing,
    noClick: isProcessing,
    noKeyboard: isProcessing,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        // Base
        "relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
        "px-6 py-16 sm:px-12 sm:py-20",
        "flex flex-col items-center justify-center gap-5 text-center",
        "cursor-pointer select-none group",

        // Idle state
        !isDragActive && !isProcessing && [
          "border-border bg-muted/20",
          "hover:border-primary/50 hover:bg-primary/[0.03]",
        ],

        // Drag-accept state (valid files hovering)
        isDragAccept && [
          "border-primary bg-primary/10 scale-[1.01]",
          "shadow-[0_0_0_4px_rgba(0,0,0,0.02)]",
        ],

        // Drag-reject state (invalid files)
        isDragReject && "border-destructive bg-destructive/10 scale-[1.01]",

        // Processing
        isProcessing && "opacity-60 cursor-wait pointer-events-none",

        className
      )}
    >
      <input {...getInputProps()} />

      {/* Decorative grid pattern background — adds texture without being noisy */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          isDragActive ? "opacity-100" : "opacity-30 group-hover:opacity-50"
        )}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
          color: "var(--muted-foreground)",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      {/* Content — z-10 to sit above grid */}
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-md">
        {/* Icon — changes based on state */}
        <div
          className={cn(
            "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragAccept && "bg-primary text-primary-foreground scale-110",
            isDragReject && "bg-destructive text-destructive-foreground scale-110",
            !isDragActive && !isProcessing && [
              "bg-primary/10 text-primary",
              "group-hover:scale-105 group-hover:bg-primary/15",
            ],
            isProcessing && "bg-muted text-muted-foreground"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : isDragReject ? (
            <AlertCircle className="h-7 w-7" />
          ) : (
            <Upload
              className={cn(
                "h-7 w-7 transition-transform duration-300",
                isDragAccept && "-translate-y-1"
              )}
            />
          )}

          {/* Pulse ring when drag-active */}
          {isDragAccept && (
            <span className="absolute inset-0 rounded-2xl border-2 border-primary animate-ping opacity-40" />
          )}
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">
            {isProcessing
              ? "Processing…"
              : isDragReject
                ? "That file type isn't supported"
                : isDragAccept
                  ? "Release to import"
                  : "Drop a ZIP or markdown files"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isProcessing
              ? "Hang tight, importing your content"
              : isDragReject
                ? "Only .zip, .md, or .markdown files are allowed"
                : (
                  <>
                    Or{" "}
                    <span className="text-primary font-medium underline-offset-2 group-hover:underline">
                      click anywhere
                    </span>{" "}
                    to browse
                  </>
                )}
          </p>
        </div>

        {/* File type hints */}
        {!isDragActive && !isProcessing && (
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <FileTypePill
              icon={<FileArchive className="h-3 w-3" />}
              label=".zip"
              description="Sections auto-detected"
            />
            <FileTypePill
              icon={<FileText className="h-3 w-3" />}
              label=".md"
              description="Multiple files OK"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: file type pill
// ============================================================

function FileTypePill({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur-sm px-2.5 py-1 text-xs">
      <span className="text-primary">{icon}</span>
      <code className="font-mono font-medium">{label}</code>
      <span className="text-muted-foreground hidden sm:inline">·</span>
      <span className="text-muted-foreground hidden sm:inline">
        {description}
      </span>
    </div>
  );
}
