"use client";

/**
 * Backup / Restore section — a panel on the dashboard showing buttons
 * to export a full-app JSON backup or restore from one.
 *
 * Renders inline in the dashboard, NOT as a modal. The restore confirm
 * is its own modal (RestoreConfirmModal), opened after a JSON file is
 * selected and parsed.
 */

import { useRef, useState } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  Loader2,
  FileJson,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { exportFullBackupAsJson } from "@/lib/notebook/export";
import {
  getAllData,
  parseBackupJSON,
  restoreBackup,
} from "@/lib/notebook/storage";
import type { NotebookBackup } from "@/types/notebook";
import { RestoreConfirmModal } from "./restore-confirm-modal";

interface BackupRestoreSectionProps {
  /** Called after a successful restore so parent can refresh data. */
  onRestored?: () => void;
}

export function BackupRestoreSection({
  onRestored,
}: BackupRestoreSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<NotebookBackup | null>(
    null
  );
  const [isParsingBackup, setIsParsingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentCounts, setCurrentCounts] = useState<{
    notebooks: number;
    sections: number;
    pages: number;
    tags: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export backup ──────────────────────────────
  const handleExportBackup = async () => {
    if (isExporting) return;
    setIsExporting(true);

    const toastId = toast.loading("Creating backup…");
    try {
      const result = await exportFullBackupAsJson();
      toast.success(
        `Downloaded ${result.filename} (${formatBytes(result.sizeBytes)}, ${result.notebookCount} notebooks)`,
        { id: toastId }
      );
    } catch (err) {
      console.error("[BackupRestoreSection] export error:", err);
      toast.error("Failed to create backup", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Import backup: file picker → parse → open modal ──────────────────
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-select
    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith(".json") &&
      file.type !== "application/json"
    ) {
      toast.error("Please select a .json backup file");
      return;
    }

    setIsParsingBackup(true);
    try {
      const text = await file.text();

      // parseBackupJSON throws on invalid — wrap in try/catch
      let backup: NotebookBackup;
      try {
        backup = parseBackupJSON(text);
      } catch (parseErr) {
        console.error("[BackupRestoreSection] parse error:", parseErr);
        toast.error(
          parseErr instanceof Error
            ? parseErr.message
            : "Invalid backup file — could not parse"
        );
        return;
      }

      // Load current counts so the modal can show "you'll lose X" warning
      const allData = await getAllData();
      setCurrentCounts({
        notebooks: allData.notebooks.length,
        sections: allData.sections.length,
        pages: allData.pages.length,
        tags: allData.tags.length,
      });

      setParsedBackup(backup);
    } catch (err) {
      console.error("[BackupRestoreSection] read error:", err);
      toast.error("Failed to read backup file");
    } finally {
      setIsParsingBackup(false);
    }
  };

  // ── Confirm restore ───────────────────────────
  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;
    setIsRestoring(true);
    try {
      await restoreBackup(parsedBackup);
      toast.success(
        `Restored ${parsedBackup.notebooks.length} notebooks, ${parsedBackup.pages.length} pages`
      );
      setParsedBackup(null);
      setCurrentCounts(null);
      onRestored?.();
    } catch (err) {
      console.error("[BackupRestoreSection] restore error:", err);
      toast.error("Restore failed — your data may be in an inconsistent state");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Backup & Restore</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Notebooks are stored locally in your browser. Export a JSON
                backup regularly to protect against data loss.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full justify-start"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Creating backup…" : "Export backup (.json)"}
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingBackup || isRestoring}
              className="w-full justify-start"
            >
              {isParsingBackup ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isParsingBackup ? "Reading backup…" : "Restore from backup…"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Helper hint */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5">
            <FileJson className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-60" />
            <p>
              The JSON backup contains <strong>all</strong> your notebooks,
              sections, pages, tags, and settings. It's lossless — a full
              snapshot you can restore to.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Restore confirm modal */}
      {parsedBackup && currentCounts && (
        <RestoreConfirmModal
          open={!!parsedBackup}
          onOpenChange={(open) => {
            if (!open && !isRestoring) {
              setParsedBackup(null);
              setCurrentCounts(null);
            }
          }}
          backup={parsedBackup}
          currentCounts={currentCounts}
          isRestoring={isRestoring}
          onConfirm={handleConfirmRestore}
        />
      )}
    </>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
