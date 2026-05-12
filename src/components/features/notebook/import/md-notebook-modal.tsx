"use client";

/**
 * MdNotebookModal — confirm name + icon before importing markdown files
 * as a new notebook.
 *
 * Why a separate modal (not reusing NewNotebookModal)?
 *   - NewNotebookModal navigates away after create. We need to import
 *     pages BEFORE navigation.
 *   - The "create" flow here is implicit — user already chose to import,
 *     so the modal should feel like a "confirm details" step, not a
 *     fresh creation form.
 *   - We want to show file count + preview list (UX clarity).
 *
 * Defaults:
 *   - Name: inferred from first file's basename (e.g. "intro.md" → "Intro")
 *     or "Imported Notes" if nothing useful.
 *   - Icon: 📓 (default notebook icon).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  parseMarkdownFiles,
  notebookNameFromFilename,
  type ImportablePage,
} from "@/lib/notebook/import/md-parser";
import { importMarkdownFilesAsNewNotebook } from "@/lib/notebook/import/importer";
import { ROUTES, DEFAULT_NOTEBOOK_ICON } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * Curated icon shortcuts (matches new-notebook-modal vibes).
 */
const ICON_OPTIONS = [
  "📓", "📔", "📕", "📗", "📘", "📙",
  "📚", "📖", "📝", "🗒️", "🗂️", "📂",
  "💡", "🧠", "🎯", "⚡", "🔥", "✨",
  "🚀", "🌟", "🎨", "🛠️", "🔬", "🧪",
] as const;

interface MdNotebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Files the user dropped — will be parsed inside this modal. */
  files: File[];
}

export function MdNotebookModal({
  open,
  onOpenChange,
  files,
}: MdNotebookModalProps) {
  const router = useRouter();

  const [parsedPages, setParsedPages] = useState<ImportablePage[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [notebookName, setNotebookName] = useState("");
  const [notebookIcon, setNotebookIcon] = useState<string>(
    DEFAULT_NOTEBOOK_ICON
  );
  const [isImporting, setIsImporting] = useState(false);

  // ── Parse files when modal opens ───────────────────────
  useEffect(() => {
    if (!open || files.length === 0) {
      setParsedPages([]);
      return;
    }

    let cancelled = false;
    setIsParsing(true);

    parseMarkdownFiles(files)
      .then((pages) => {
        if (cancelled) return;

        if (pages.length === 0) {
          toast.error("Couldn't read any of those files");
          onOpenChange(false);
          return;
        }

        setParsedPages(pages);

        // Smart default name:
        //   1. If there's only one file → use its title (often from H1 or frontmatter)
        //   2. If multiple files → "Imported Notes"
        const defaultName =
          pages.length === 1
            ? pages[0].title
            : notebookNameFromFilename(files[0].name).length > 0
              ? `${notebookNameFromFilename(files[0].name)} & ${pages.length - 1} more`
              : "Imported Notes";

        setNotebookName(defaultName.slice(0, 80));
        setNotebookIcon(DEFAULT_NOTEBOOK_ICON);
      })
      .catch((err) => {
        console.error("[MdNotebookModal] parse error:", err);
        toast.error("Failed to read files");
        onOpenChange(false);
      })
      .finally(() => {
        if (!cancelled) setIsParsing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, files, onOpenChange]);

  // ── Submit handler ─────────────────────────────────────
  const handleImport = async () => {
    if (!notebookName.trim() || parsedPages.length === 0) return;

    setIsImporting(true);
    try {
      const result = await importMarkdownFilesAsNewNotebook(
        parsedPages,
        notebookName.trim(),
        notebookIcon
      );

      toast.success(
        `Imported ${result.pagesCreated} ${
          result.pagesCreated === 1 ? "page" : "pages"
        }`
      );

      onOpenChange(false);
      router.push(ROUTES.NOTEBOOK_DETAIL(result.notebookId));
    } catch (err) {
      console.error("[MdNotebookModal] import error:", err);
      toast.error("Failed to import — please try again");
    } finally {
      setIsImporting(false);
    }
  };

  const canImport =
    notebookName.trim().length > 0 &&
    parsedPages.length > 0 &&
    !isParsing &&
    !isImporting;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isImporting && !next) return; // block close during import
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isImporting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isImporting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Create notebook from markdown</DialogTitle>
              <DialogDescription className="text-xs">
                {isParsing
                  ? "Reading files…"
                  : parsedPages.length > 0
                    ? `${parsedPages.length} ${parsedPages.length === 1 ? "page" : "pages"} ready to import`
                    : `${files.length} ${files.length === 1 ? "file" : "files"} selected`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isParsing ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Icon picker */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNotebookIcon(icon)}
                    disabled={isImporting}
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
              <Label htmlFor="md-notebook-name">Notebook name</Label>
              <Input
                id="md-notebook-name"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                placeholder="My Notes"
                disabled={isImporting}
                autoFocus
                maxLength={100}
              />
            </div>

            {/* Page preview list */}
            {parsedPages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Pages to import
                </Label>
                <div className="rounded-md border bg-muted/30 max-h-32 overflow-y-auto py-1.5">
                  <ul className="space-y-0.5">
                    {parsedPages.slice(0, 5).map((page, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-0.5 text-xs"
                      >
                        <FileText className="h-3 w-3 opacity-60 flex-shrink-0" />
                        <span className="truncate">{page.title}</span>
                      </li>
                    ))}
                    {parsedPages.length > 5 && (
                      <li className="px-3 py-0.5 text-xs text-muted-foreground italic">
                        … and {parsedPages.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
          >
            {isImporting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isImporting
              ? "Importing…"
              : `Import ${parsedPages.length} ${parsedPages.length === 1 ? "page" : "pages"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
