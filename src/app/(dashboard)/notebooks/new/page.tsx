"use client";

/**
 * /notebooks/new — dedicated import flow page.
 *
 * UPDATED in Stage 1 (DnD migration):
 *   - REMOVED: "Start from scratch" card (redundant — already in /notebooks dashboard)
 *   - REMOVED: "Import from ZIP" file-picker card
 *   - ADDED: UnifiedDropzone — drag-and-drop area accepting both .zip and .md files
 *
 * Flow:
 *   - User drops .zip   → parseZipFile → ImportPreviewModal (mode: new)
 *   - User drops N .md  → MdNotebookModal (confirm name) → importMarkdownFilesAsNewNotebook
 *
 * The dropzone also functions as a file picker on click — react-dropzone
 * handles both interactions natively.
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  UnifiedDropzone,
  MdNotebookModal,
  ImportPreviewModal,
} from "@/components/features/notebook/import";
import {
  parseZipFile,
  getZipErrorMessage,
  type ParsedZip,
} from "@/lib/notebook/import/zip-parser";
import {
  importZipAsNewNotebook,
  type ImportProgress,
} from "@/lib/notebook/import/importer";
import { ROUTES } from "@/constants";

export default function NewNotebookPage() {
  const router = useRouter();

  // ── ZIP flow state ──────────────────────────────────────
  const [parsedZip, setParsedZip] = useState<ParsedZip | null>(null);
  const [zipImportProgress, setZipImportProgress] =
    useState<ImportProgress | null>(null);
  const [isZipImporting, setIsZipImporting] = useState(false);
  const [isParsingZip, setIsParsingZip] = useState(false);

  // ── MD flow state ───────────────────────────────────────
  const [mdFiles, setMdFiles] = useState<File[] | null>(null);

  const isProcessing = isParsingZip || isZipImporting || mdFiles !== null;

  // ════════════════════════════════════════════════════════
  // ZIP HANDLERS
  // ════════════════════════════════════════════════════════

  const handleZipDropped = async (file: File) => {
    setIsParsingZip(true);
    try {
      const result = await parseZipFile(file);
      if (!result.ok) {
        toast.error(getZipErrorMessage(result.error));
        return;
      }
      setParsedZip(result.data);
    } catch (err) {
      console.error("[NewNotebookPage] zip parse error:", err);
      toast.error("Failed to read ZIP file");
    } finally {
      setIsParsingZip(false);
    }
  };

  const handleZipImportConfirm = async (options: {
    notebookName?: string;
    notebookIcon?: string;
  }) => {
    if (!parsedZip || !options.notebookName) return;

    setIsZipImporting(true);
    try {
      const result = await importZipAsNewNotebook(
        parsedZip,
        {
          notebookName: options.notebookName,
          notebookIcon: options.notebookIcon ?? null,
        },
        (progress) => setZipImportProgress(progress)
      );

      toast.success(
        `Imported ${result.pagesCreated} ${
          result.pagesCreated === 1 ? "page" : "pages"
        } into "${options.notebookName}"`
      );

      setParsedZip(null);
      setZipImportProgress(null);
      router.push(ROUTES.NOTEBOOK_DETAIL(result.notebookId));
    } catch (err) {
      console.error("[NewNotebookPage] zip import error:", err);
      toast.error("Failed to import — please try again");
    } finally {
      setIsZipImporting(false);
    }
  };

  // ════════════════════════════════════════════════════════
  // MD HANDLERS
  // ════════════════════════════════════════════════════════

  const handleMarkdownDropped = (files: File[]) => {
    setMdFiles(files);
  };

  const handleMdModalClose = (open: boolean) => {
    if (!open) {
      setMdFiles(null);
    }
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back link */}
        <Link
          href={ROUTES.NOTEBOOKS}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to notebooks
        </Link>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import to a new notebook
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Drop a ZIP archive or markdown files. Folder structure becomes
            sections automatically.
          </p>
        </div>

        {/* The dropzone — main interaction */}
        <UnifiedDropzone
          onZipDropped={handleZipDropped}
          onMarkdownFilesDropped={handleMarkdownDropped}
          isProcessing={isProcessing}
        />

        {/* Tips section */}
        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Folder structure tips</p>
              <ul className="space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-muted-foreground/60">→</span>
                  <span>
                    Use{" "}
                    <code className="text-[11px] bg-background px-1.5 py-0.5 rounded font-mono">
                      01-intro
                    </code>
                    ,{" "}
                    <code className="text-[11px] bg-background px-1.5 py-0.5 rounded font-mono">
                      02-guides
                    </code>{" "}
                    prefixes for ordering
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/60">→</span>
                  <span>
                    Each subfolder becomes a section, each{" "}
                    <code className="text-[11px] bg-background px-1.5 py-0.5 rounded font-mono">
                      .md
                    </code>{" "}
                    file becomes a page
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/60">→</span>
                  <span>
                    YAML frontmatter (
                    <code className="text-[11px] bg-background px-1.5 py-0.5 rounded font-mono">
                      title:
                    </code>
                    ) is preserved for page metadata
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-muted-foreground/60">→</span>
                  <span>
                    Multiple loose{" "}
                    <code className="text-[11px] bg-background px-1.5 py-0.5 rounded font-mono">
                      .md
                    </code>{" "}
                    files work too — they become flat pages
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ZIP preview + import modal */}
      {parsedZip && (
        <ImportPreviewModal
          open={!!parsedZip}
          onOpenChange={(open) => {
            if (!open && !isZipImporting) setParsedZip(null);
          }}
          parsed={parsedZip}
          mode={{ kind: "new" }}
          progress={zipImportProgress}
          isImporting={isZipImporting}
          onConfirm={handleZipImportConfirm}
        />
      )}

      {/* MD confirm + import modal */}
      {mdFiles && (
        <MdNotebookModal
          open={mdFiles !== null}
          onOpenChange={handleMdModalClose}
          files={mdFiles}
        />
      )}
    </>
  );
}
