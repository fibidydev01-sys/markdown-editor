/**
 * Exporter — orchestrates notebook export end-to-end.
 *
 * Two flows:
 *   1. exportNotebookAsZip(notebookId) — loads notebook + builds ZIP +
 *      triggers browser download
 *   2. exportFullBackupAsJson() — uses Phase A storage's buildBackup to
 *      create a full-app JSON dump + triggers download
 *
 * Both use the same `triggerDownload` helper to save to user's disk.
 */

import {
  buildBackup,
  getBackupFilename,
  getNotebook,
  getPages,
  getSections,
} from "@/lib/notebook/storage";
import {
  buildNotebookZip,
  type ExportProgress,
  type ExportProgressCallback,
} from "./zip-builder";
import { buildZipFilename } from "./filename-builder";

export type { ExportProgress, ExportProgressCallback };

// ============================================================
// Per-notebook ZIP export
// ============================================================

export interface ExportZipResult {
  notebookId: string;
  filename: string;
  sizeBytes: number;
  pagesExported: number;
}

export async function exportNotebookAsZip(
  notebookId: string,
  onProgress?: ExportProgressCallback
): Promise<ExportZipResult> {
  onProgress?.({
    phase: "preparing",
    total: 0,
    current: 0,
    message: "Loading notebook…",
  });

  // Load data
  const [notebook, sections, pages] = await Promise.all([
    getNotebook(notebookId),
    getSections(notebookId),
    getPages(notebookId),
  ]);

  if (!notebook) {
    throw new Error("Notebook not found");
  }

  // Build ZIP
  const blob = await buildNotebookZip(
    { notebook, sections, pages },
    onProgress
  );

  // Filename + download
  const filename = buildZipFilename(notebook.name);
  triggerDownload(blob, filename);

  return {
    notebookId,
    filename,
    sizeBytes: blob.size,
    pagesExported: pages.length,
  };
}

// ============================================================
// Full-app JSON backup export
// ============================================================

export interface ExportBackupResult {
  filename: string;
  sizeBytes: number;
  notebookCount: number;
  pageCount: number;
}

export async function exportFullBackupAsJson(): Promise<ExportBackupResult> {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const filename = getBackupFilename();

  triggerDownload(blob, filename);

  return {
    filename,
    sizeBytes: blob.size,
    notebookCount: backup.notebooks.length,
    pageCount: backup.pages.length,
  };
}

// ============================================================
// Download helper
// ============================================================

/**
 * Trigger a browser download for the given blob.
 *
 * Uses the `URL.createObjectURL` + `<a download>` pattern.
 * Cleans up the object URL after a short delay (some browsers need the URL
 * to remain valid briefly after the click event).
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke URL after a tick so the download completes
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
