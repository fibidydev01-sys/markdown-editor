/**
 * Backup & restore — export/import all notebook data as JSON.
 *
 * Phase F UI will consume these functions.
 */

import { clearAllData, getDB } from "./db";
import { getSettings, updateSettings } from "./settings";
import type {
  AllNotebookData,
  Notebook,
  NotebookBackup,
  NotebookPage,
  NotebookSection,
  NotebookTag,
} from "@/types/notebook";

// ============================================================
// Export — get all data
// ============================================================

/**
 * Get all data from the database (for backup or full export).
 */
export async function getAllData(): Promise<AllNotebookData> {
  const db = await getDB();
  const [notebooks, sections, pages, tags, settings] = await Promise.all([
    db.getAll("notebooks"),
    db.getAll("sections"),
    db.getAll("pages"),
    db.getAll("tags"),
    getSettings(),
  ]);

  return {
    notebooks,
    sections,
    pages,
    tags,
    settings,
  };
}

/**
 * Build a backup object (versioned, timestamped).
 */
export async function buildBackup(): Promise<NotebookBackup> {
  const data = await getAllData();
  return {
    version: 1,
    exportedAt: Date.now(),
    ...data,
  };
}

// ============================================================
// Import — restore from backup
// ============================================================

/**
 * Validate a backup object (structural check).
 */
export function isValidBackup(obj: unknown): obj is NotebookBackup {
  if (!obj || typeof obj !== "object") return false;
  const b = obj as Record<string, unknown>;
  return (
    typeof b.version === "number" &&
    typeof b.exportedAt === "number" &&
    Array.isArray(b.notebooks) &&
    Array.isArray(b.sections) &&
    Array.isArray(b.pages) &&
    Array.isArray(b.tags) &&
    !!b.settings
  );
}

/**
 * Restore data from a backup.
 *
 * @param backup - validated backup object
 * @param merge - if true, append to existing data (skip ID collisions).
 *                if false, replace all data first.
 */
export async function restoreBackup(
  backup: NotebookBackup,
  merge = false
): Promise<{
  notebooks: number;
  sections: number;
  pages: number;
  tags: number;
}> {
  if (!merge) {
    await clearAllData();
  }

  const db = await getDB();
  const tx = db.transaction(
    ["notebooks", "sections", "pages", "tags"],
    "readwrite"
  );

  let nbCount = 0;
  let secCount = 0;
  let pageCount = 0;
  let tagCount = 0;

  // Notebooks
  for (const nb of backup.notebooks) {
    if (merge) {
      const existing = await tx.objectStore("notebooks").get(nb.id);
      if (existing) continue; // skip on collision
    }
    await tx.objectStore("notebooks").put(nb);
    nbCount++;
  }

  // Sections
  for (const sec of backup.sections) {
    if (merge) {
      const existing = await tx.objectStore("sections").get(sec.id);
      if (existing) continue;
    }
    await tx.objectStore("sections").put(sec);
    secCount++;
  }

  // Pages
  for (const page of backup.pages) {
    if (merge) {
      const existing = await tx.objectStore("pages").get(page.id);
      if (existing) continue;
    }
    await tx.objectStore("pages").put(page);
    pageCount++;
  }

  // Tags
  for (const tag of backup.tags) {
    if (merge) {
      const existing = await tx.objectStore("tags").get(tag.id);
      if (existing) continue;
    }
    await tx.objectStore("tags").put(tag);
    tagCount++;
  }

  await tx.done;

  // Settings — only restore if not merging
  if (!merge && backup.settings) {
    await updateSettings(backup.settings);
  }

  return {
    notebooks: nbCount,
    sections: secCount,
    pages: pageCount,
    tags: tagCount,
  };
}

// ============================================================
// Helpers for Phase F (file download/upload)
// ============================================================

/**
 * Generate a filename for the backup file.
 */
export function getBackupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `vibesdoc-backup-${date}.json`;
}

/**
 * Parse a JSON file content into a backup object.
 * Throws if invalid.
 */
export function parseBackupJSON(content: string): NotebookBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON file");
  }

  if (!isValidBackup(parsed)) {
    throw new Error("File is not a valid notebook backup");
  }

  return parsed;
}
