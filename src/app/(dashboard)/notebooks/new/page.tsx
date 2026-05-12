"use client";

/**
 * /notebooks/new — dedicated create flow page.
 *
 * UPDATED in Phase E: wired ZIP import option (was "Soon" placeholder).
 *
 * Two entry options:
 *   1. Create blank notebook (opens NewNotebookModal from Phase B)
 *   2. Import from ZIP (opens preview modal, creates notebook on confirm)
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Upload,
  BookOpen,
  Sparkles,
  FolderArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { NewNotebookModal } from "@/components/features/notebook/notebooks";
import {
  ImportZipButton,
  ImportPreviewModal,
} from "@/components/features/notebook/import";
import {
  importZipAsNewNotebook,
  type ImportProgress,
} from "@/lib/notebook/import/importer";
import type { ParsedZip } from "@/lib/notebook/import/zip-parser";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export default function NewNotebookPage() {
  const router = useRouter();

  // Blank-notebook modal (from Phase B)
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ZIP import state
  const [parsedZip, setParsedZip] = useState<ParsedZip | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );
  const [isImporting, setIsImporting] = useState(false);

  // ─── Handle ZIP parsed: open preview modal ───
  const handleZipParsed = (parsed: ParsedZip) => {
    setParsedZip(parsed);
    setImportProgress(null);
  };

  // ─── Handle import confirm ───
  const handleImportConfirm = async (options: {
    notebookName?: string;
    notebookIcon?: string;
  }) => {
    if (!parsedZip || !options.notebookName) return;

    setIsImporting(true);
    try {
      const result = await importZipAsNewNotebook(
        parsedZip,
        {
          notebookName: options.notebookName,
          notebookIcon: options.notebookIcon ?? null,
        },
        (progress) => setImportProgress(progress)
      );

      toast.success(
        `Imported ${result.pagesCreated} ${
          result.pagesCreated === 1 ? "page" : "pages"
        } into "${options.notebookName}"`
      );

      // Close modal + navigate
      setParsedZip(null);
      setImportProgress(null);
      router.push(ROUTES.NOTEBOOK_DETAIL(result.notebookId));
    } catch (err) {
      console.error("[NewNotebookPage] import error:", err);
      toast.error("Failed to import — please try again");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Render ───

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
            Create a new notebook
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start from scratch or import an existing folder of markdown files.
          </p>
        </div>

        {/* Options grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Option 1: Blank */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="text-left"
          >
            <Card
              className={cn(
                "h-full transition-all hover:shadow-md hover:border-primary/40 cursor-pointer",
                "group"
              )}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Start from scratch</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create an empty notebook and start writing. Add sections
                    and pages as you go.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                  <Plus className="h-3.5 w-3.5" />
                  Create blank notebook
                </div>
              </CardContent>
            </Card>
          </button>

          {/* Option 2: Import from ZIP — NOW WIRED */}
          <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all group">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderArchive className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Import from ZIP</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a folder of{" "}
                  <code className="text-[11px] bg-muted px-1 rounded">
                    .md
                  </code>{" "}
                  files — sections and pages auto-detected from the folder
                  structure.
                </p>
              </div>
              <ImportZipButton
                onParsed={handleZipParsed}
                variant="default"
                size="sm"
                label="Choose ZIP file"
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Tip */}
        <div className="rounded-lg bg-muted/50 border p-4 text-sm">
          <p className="font-medium mb-1">💡 Folder structure tip</p>
          <p className="text-muted-foreground">
            Use{" "}
            <code className="text-xs bg-background px-1 rounded">
              01-intro
            </code>
            ,{" "}
            <code className="text-xs bg-background px-1 rounded">
              02-guides
            </code>{" "}
            prefixes for ordering. Each subfolder becomes a section, each{" "}
            <code className="text-xs bg-background px-1 rounded">.md</code>{" "}
            file becomes a page.
          </p>
        </div>
      </div>

      {/* Blank-notebook modal */}
      <NewNotebookModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={(id) => router.push(ROUTES.NOTEBOOK_DETAIL(id))}
      />

      {/* ZIP import preview modal */}
      {parsedZip && (
        <ImportPreviewModal
          open={!!parsedZip}
          onOpenChange={(open) => {
            if (!open && !isImporting) setParsedZip(null);
          }}
          parsed={parsedZip}
          mode={{ kind: "new" }}
          progress={importProgress}
          isImporting={isImporting}
          onConfirm={handleImportConfirm}
        />
      )}
    </>
  );
}
