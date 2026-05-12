"use client";

/**
 * Import preview modal — shown after a ZIP is parsed, before committing.
 *
 * Two modes (controlled by `mode` prop):
 *   1. "new" — creating a NEW notebook from the ZIP
 *      Shows: notebook name input, icon picker, preview tree, ignored files
 *   2. "into" — importing into an EXISTING notebook
 *      Shows: merge/replace radio, preview tree, ignored files
 *
 * User clicks "Import" → calls onConfirm callback with chosen options.
 * Parent handles the actual storage operations + progress.
 */

import { useEffect, useState } from "react";
import {
  Folder,
  FileText,
  ChevronRight,
  AlertTriangle,
  Loader2,
  FolderOpen,
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ImportProgress } from "./import-progress";
import type { ParsedZip } from "@/lib/notebook/import/zip-parser";
import type {
  ImportMode,
  ImportProgress as ImportProgressData,
} from "@/lib/notebook/import/importer";
import type { ImportPreviewNode } from "@/types/notebook";
import { DEFAULT_NOTEBOOK_ICON } from "@/constants/notebook";
import { cn } from "@/lib/utils";

// ============================================================
// Curated icons (matches new-notebook-modal)
// ============================================================

const ICON_OPTIONS = [
  "📓", "📔", "📕", "📗", "📘", "📙",
  "📚", "📖", "📝", "🗒️", "🗂️", "📂",
  "💡", "🧠", "🎯", "⚡", "🔥", "✨",
  "🚀", "🌟", "🎨", "🛠️", "🔬", "🧪",
] as const;

// ============================================================
// Props
// ============================================================

type Mode =
  | { kind: "new" }
  | { kind: "into"; notebookName: string };

interface ImportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The parsed ZIP data. */
  parsed: ParsedZip;
  /** Mode: creating new notebook or importing into existing. */
  mode: Mode;
  /** Current import progress (null = not started yet). */
  progress: ImportProgressData | null;
  /** True when an import is in flight. */
  isImporting: boolean;
  /** Confirm callback. Receives chosen options. */
  onConfirm: (options: {
    notebookName?: string;
    notebookIcon?: string;
    importMode?: ImportMode;
  }) => void;
}

// ============================================================
// Component
// ============================================================

export function ImportPreviewModal({
  open,
  onOpenChange,
  parsed,
  mode,
  progress,
  isImporting,
  onConfirm,
}: ImportPreviewModalProps) {
  const [notebookName, setNotebookName] = useState(
    parsed.suggestedNotebookName
  );
  const [notebookIcon, setNotebookIcon] = useState<string>(
    DEFAULT_NOTEBOOK_ICON
  );
  const [importMode, setImportMode] = useState<ImportMode>("merge");

  // Reset form when parsed data or mode changes (new ZIP loaded)
  useEffect(() => {
    setNotebookName(parsed.suggestedNotebookName);
    setNotebookIcon(DEFAULT_NOTEBOOK_ICON);
    setImportMode("merge");
  }, [parsed.suggestedNotebookName, mode.kind]);

  const totalPages = parsed.pages.length;
  const totalSections = parsed.sections.length;

  const canImport =
    mode.kind === "new" ? notebookName.trim().length > 0 : true;

  const handleConfirm = () => {
    if (!canImport) return;
    if (mode.kind === "new") {
      onConfirm({
        notebookName: notebookName.trim(),
        notebookIcon,
      });
    } else {
      onConfirm({ importMode });
    }
  };

  // Don't allow closing during active import
  const handleOpenChange = (next: boolean) => {
    if (isImporting && !next) return; // ignore close attempts
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => {
          if (isImporting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isImporting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            {mode.kind === "new"
              ? "Import as new notebook"
              : `Import into "${mode.notebookName}"`}
          </DialogTitle>
          <DialogDescription>
            {totalPages} {totalPages === 1 ? "page" : "pages"} across{" "}
            {totalSections} {totalSections === 1 ? "section" : "sections"}{" "}
            detected.
          </DialogDescription>
        </DialogHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          {/* Active import: show progress instead of form */}
          {isImporting && progress ? (
            <ImportProgress progress={progress} className="py-4" />
          ) : (
            <>
              {/* ── New notebook form ─── */}
              {mode.kind === "new" && (
                <div className="space-y-3 pt-2">
                  {/* Icon picker */}
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="grid grid-cols-8 gap-1.5">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNotebookIcon(icon)}
                          className={cn(
                            "h-9 rounded-md text-lg flex items-center justify-center border transition-colors",
                            notebookIcon === icon
                              ? "border-primary bg-primary/10 ring-1 ring-primary"
                              : "border-transparent hover:bg-muted"
                          )}
                          aria-label={`Use icon ${icon}`}
                          aria-pressed={notebookIcon === icon}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name input */}
                  <div className="space-y-2">
                    <Label htmlFor="notebook-name">Notebook name</Label>
                    <Input
                      id="notebook-name"
                      value={notebookName}
                      onChange={(e) => setNotebookName(e.target.value)}
                      placeholder="My Imported Docs"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* ── Merge / Replace radio ─── */}
              {mode.kind === "into" && (
                <div className="space-y-2 pt-2">
                  <Label>Import mode</Label>
                  <RadioGroup
                    value={importMode}
                    onValueChange={(v) => setImportMode(v as ImportMode)}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem
                        value="merge"
                        id="mode-merge"
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="mode-merge"
                        className="flex-1 font-normal cursor-pointer"
                      >
                        <span className="font-medium block">
                          Merge — add to existing
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Imported sections and pages will be added alongside
                          your current content.
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 p-3 hover:bg-destructive/5 transition-colors">
                      <RadioGroupItem
                        value="replace"
                        id="mode-replace"
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="mode-replace"
                        className="flex-1 font-normal cursor-pointer"
                      >
                        <span className="font-medium block text-destructive">
                          Replace — delete everything first
                        </span>
                        <span className="text-xs text-muted-foreground">
                          All existing sections and pages in this notebook
                          will be permanently deleted before importing.
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* ── Preview tree ─── */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="rounded-lg border bg-muted/30 p-3 max-h-72 overflow-y-auto">
                  {parsed.previewTree.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No content to preview.
                    </p>
                  ) : (
                    <TreeView nodes={parsed.previewTree} depth={0} />
                  )}
                </div>
              </div>

              {/* ── Ignored files ─── */}
              {parsed.ignoredFileCount > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/40 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-yellow-900 dark:text-yellow-200">
                        {parsed.ignoredFileCount}{" "}
                        {parsed.ignoredFileCount === 1
                          ? "file was"
                          : "files were"}{" "}
                        skipped
                      </p>
                      <p className="text-[10px] text-yellow-700 dark:text-yellow-300 mt-0.5">
                        Only .md and .markdown files are imported. Skipped:{" "}
                        {parsed.ignoredFiles.slice(0, 3).join(", ")}
                        {parsed.ignoredFiles.length > 3 &&
                          ` and ${parsed.ignoredFiles.length - 3} more`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canImport || isImporting}>
            {isImporting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isImporting
              ? "Importing…"
              : mode.kind === "new"
              ? `Import ${totalPages} ${
                  totalPages === 1 ? "page" : "pages"
                }`
              : importMode === "replace"
              ? `Replace & import ${totalPages} ${
                  totalPages === 1 ? "page" : "pages"
                }`
              : `Add ${totalPages} ${totalPages === 1 ? "page" : "pages"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Tree view (recursive)
// ============================================================

function TreeView({
  nodes,
  depth,
}: {
  nodes: ImportPreviewNode[];
  depth: number;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node, i) => (
        <TreeNodeRow key={`${depth}-${i}-${node.path}`} node={node} depth={depth} />
      ))}
    </ul>
  );
}

function TreeNodeRow({
  node,
  depth,
}: {
  node: ImportPreviewNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2); // expand first 2 levels by default

  if (node.type === "page") {
    return (
      <li
        className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <FileText className="h-3 w-3 flex-shrink-0 opacity-60" />
        <span className="truncate">{node.name}</span>
      </li>
    );
  }

  // Section
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 w-full text-left py-0.5 text-xs font-medium hover:text-foreground transition-colors"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform text-muted-foreground",
            expanded && "rotate-90"
          )}
        />
        {expanded && hasChildren ? (
          <FolderOpen className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
        {typeof node.pageCount === "number" && node.pageCount > 0 && (
          <span className="ml-1 text-[10px] text-muted-foreground/60 font-normal">
            {node.pageCount} {node.pageCount === 1 ? "page" : "pages"}
          </span>
        )}
      </button>
      {expanded && hasChildren && (
        <TreeView nodes={node.children!} depth={depth + 1} />
      )}
    </li>
  );
}
