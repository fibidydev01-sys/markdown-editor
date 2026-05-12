/**
 * Importer — commits parsed import data to storage.
 *
 * Two flows:
 *   1. importAsNewNotebook — creates a notebook + sections + pages
 *   2. importIntoNotebook — adds to existing notebook (merge or replace)
 *
 * The replace mode deletes ALL existing sections+pages in the target
 * notebook before adding the imported ones. The notebook itself stays.
 */

import {
  createNotebook,
  createPage,
  createSection,
  deletePages,
  deleteSection,
  getPages,
  getSections,
} from "@/lib/notebook/storage";
import type { ParsedZip, ParsedZipPage } from "./zip-parser";
import type { ImportablePage } from "./md-parser";
import type { ImportResult } from "@/types/notebook";

// ============================================================
// Progress reporting
// ============================================================

export interface ImportProgress {
  phase:
    | "preparing"
    | "creating-notebook"
    | "creating-sections"
    | "creating-pages"
    | "cleaning"
    | "done";
  total: number;
  current: number;
  message?: string;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

// ============================================================
// Mode types
// ============================================================

export type ImportMode = "merge" | "replace";

export interface ImportZipAsNewOptions {
  notebookName: string;
  notebookIcon?: string | null;
  notebookDescription?: string | null;
}

export interface ImportZipIntoOptions {
  notebookId: string;
  mode: ImportMode;
}

// ============================================================
// Import ZIP as NEW notebook
// ============================================================

export async function importZipAsNewNotebook(
  parsed: ParsedZip,
  options: ImportZipAsNewOptions,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  const total = 1 + parsed.sections.length + parsed.pages.length;
  let current = 0;

  // 1. Create notebook
  onProgress?.({
    phase: "creating-notebook",
    total,
    current,
    message: "Creating notebook…",
  });

  const notebook = await createNotebook({
    name: options.notebookName,
    icon: options.notebookIcon ?? null,
    description: options.notebookDescription ?? null,
  });

  current++;

  // 2. Create sections (depth-first so parents exist before children)
  // Map: import path → created section id
  const sectionIdMap = new Map<string, string>();
  const sectionsCreated = await createSectionsInOrder(
    notebook.id,
    parsed.sections,
    sectionIdMap,
    (i) => {
      onProgress?.({
        phase: "creating-sections",
        total,
        current: current + i,
        message: `Creating sections (${i}/${parsed.sections.length})…`,
      });
    }
  );

  current += sectionsCreated;

  // 3. Create pages
  const pagesCreated = await createPagesInOrder(
    notebook.id,
    parsed.pages,
    sectionIdMap,
    (i) => {
      onProgress?.({
        phase: "creating-pages",
        total,
        current: current + i,
        message: `Creating pages (${i}/${parsed.pages.length})…`,
      });
    }
  );

  current += pagesCreated;

  onProgress?.({
    phase: "done",
    total,
    current,
    message: "Import complete",
  });

  return {
    notebookId: notebook.id,
    sectionsCreated,
    pagesCreated,
  };
}

// ============================================================
// Import ZIP INTO existing notebook
// ============================================================

export async function importZipIntoNotebook(
  parsed: ParsedZip,
  options: ImportZipIntoOptions,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  const totalAdd = parsed.sections.length + parsed.pages.length;
  const total = totalAdd;
  let current = 0;

  // Replace mode: delete existing content first
  if (options.mode === "replace") {
    onProgress?.({
      phase: "cleaning",
      total,
      current,
      message: "Clearing existing content…",
    });

    await deleteAllContentInNotebook(options.notebookId);
  }

  // Create sections
  const sectionIdMap = new Map<string, string>();
  const sectionsCreated = await createSectionsInOrder(
    options.notebookId,
    parsed.sections,
    sectionIdMap,
    (i) => {
      onProgress?.({
        phase: "creating-sections",
        total,
        current: current + i,
        message: `Creating sections (${i}/${parsed.sections.length})…`,
      });
    }
  );

  current += sectionsCreated;

  // Create pages
  const pagesCreated = await createPagesInOrder(
    options.notebookId,
    parsed.pages,
    sectionIdMap,
    (i) => {
      onProgress?.({
        phase: "creating-pages",
        total,
        current: current + i,
        message: `Creating pages (${i}/${parsed.pages.length})…`,
      });
    }
  );

  current += pagesCreated;

  onProgress?.({
    phase: "done",
    total,
    current,
    message: "Import complete",
  });

  return {
    notebookId: options.notebookId,
    sectionsCreated,
    pagesCreated,
  };
}

// ============================================================
// Import single MD files (no folder structure)
// ============================================================

export async function importMarkdownFilesIntoNotebook(
  pages: ImportablePage[],
  notebookId: string,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  const total = pages.length;
  let current = 0;

  onProgress?.({
    phase: "creating-pages",
    total,
    current,
    message: `Importing ${pages.length} pages…`,
  });

  for (const page of pages) {
    await createPage(notebookId, {
      title: page.title,
      content: page.content,
      frontmatter: page.frontmatter,
      sectionId: null, // root level
    });
    current++;
    onProgress?.({
      phase: "creating-pages",
      total,
      current,
      message: `Importing pages (${current}/${total})…`,
    });
  }

  onProgress?.({
    phase: "done",
    total,
    current,
    message: "Import complete",
  });

  return {
    notebookId,
    sectionsCreated: 0,
    pagesCreated: pages.length,
  };
}

/**
 * Import MD files as a NEW notebook.
 * Creates a notebook + all pages at root (no sections).
 */
export async function importMarkdownFilesAsNewNotebook(
  pages: ImportablePage[],
  notebookName: string,
  notebookIcon?: string | null,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  onProgress?.({
    phase: "creating-notebook",
    total: pages.length + 1,
    current: 0,
    message: "Creating notebook…",
  });

  const notebook = await createNotebook({
    name: notebookName,
    icon: notebookIcon ?? null,
  });

  return importMarkdownFilesIntoNotebook(pages, notebook.id, (progress) => {
    onProgress?.({
      ...progress,
      total: pages.length + 1,
      current: progress.current + 1,
    });
  });
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Create sections in dependency order (parents before children).
 * Updates `sectionIdMap` so subsequent calls can look up parent IDs.
 */
async function createSectionsInOrder(
  notebookId: string,
  sections: ParsedZip["sections"],
  sectionIdMap: Map<string, string>,
  onProgress?: (index: number) => void
): Promise<number> {
  // Sort: shallower paths first (parents before children)
  const sorted = [...sections].sort((a, b) => {
    const depthA = a.path.split("/").length;
    const depthB = b.path.split("/").length;
    if (depthA !== depthB) return depthA - depthB;
    return a.order - b.order;
  });

  let count = 0;
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const parentId = s.parentPath
      ? sectionIdMap.get(s.parentPath) ?? null
      : null;

    const created = await createSection(notebookId, {
      name: s.name,
      parentId,
    });

    sectionIdMap.set(s.path, created.id);
    count++;
    onProgress?.(count);
  }

  return count;
}

/**
 * Create pages, looking up parent section via the map.
 */
async function createPagesInOrder(
  notebookId: string,
  pages: ParsedZipPage[],
  sectionIdMap: Map<string, string>,
  onProgress?: (index: number) => void
): Promise<number> {
  let count = 0;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const sectionId = p.sectionPath
      ? sectionIdMap.get(p.sectionPath) ?? null
      : null;

    await createPage(notebookId, {
      title: p.title,
      content: p.content,
      frontmatter: p.frontmatter,
      sectionId,
    });

    count++;
    onProgress?.(count);
  }

  return count;
}

/**
 * Delete all sections and pages in a notebook (preserves the notebook itself).
 * Used by replace mode.
 */
async function deleteAllContentInNotebook(
  notebookId: string
): Promise<void> {
  const [sections, pages] = await Promise.all([
    getSections(notebookId),
    getPages(notebookId),
  ]);

  // Delete all pages first (in one bulk call)
  if (pages.length > 0) {
    await deletePages(pages.map((p) => p.id));
  }

  // Delete root sections — cascade handles descendants
  const rootSections = sections.filter((s) => s.parentId === null);
  for (const s of rootSections) {
    await deleteSection(s.id, "delete");
  }
}
