/**
 * ZIP builder for notebook export.
 *
 * Takes loaded notebook data (sections + pages) and constructs a JSZip
 * archive with folder/file structure mirroring the section hierarchy.
 *
 * Output layout (round-trip with Phase E import):
 *
 *   notebook-name/
 *   ├── 01-intro/
 *   │   ├── 01-overview.md
 *   │   └── 02-getting-started.md
 *   ├── 02-guides/
 *   │   └── 01-basics.md
 *   └── readme.md            ← root-level page
 *
 * The top-level folder name is the notebook's slug — this matches Phase E's
 * common-prefix detection so re-import strips it cleanly.
 */

import JSZip from "jszip";
import {
  buildPageFilename,
  buildSectionFolderName,
} from "./filename-builder";
import { serializePageToMarkdown } from "./md-serializer";
import { slugify } from "@/lib/notebook/utils/slugify";
import type {
  Notebook,
  NotebookPage,
  NotebookSection,
} from "@/types/notebook";

// ============================================================
// Progress reporting
// ============================================================

export interface ExportProgress {
  phase: "preparing" | "serializing-pages" | "zipping" | "done";
  total: number;
  current: number;
  message?: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

// ============================================================
// Main entry: build a ZIP blob from notebook data
// ============================================================

export interface BuildZipOptions {
  notebook: Notebook;
  sections: NotebookSection[];
  pages: NotebookPage[];
  /** Wrap everything in a top-level folder named after the notebook. */
  includeRootFolder?: boolean;
}

export async function buildNotebookZip(
  options: BuildZipOptions,
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  const { notebook, sections, pages, includeRootFolder = true } = options;
  const total = pages.length;
  let current = 0;

  onProgress?.({
    phase: "preparing",
    total,
    current,
    message: "Preparing files…",
  });

  const zip = new JSZip();
  const rootFolder = includeRootFolder
    ? zip.folder(slugify(notebook.name) || "notebook")
    : zip;

  if (!rootFolder) {
    // Defensive — JSZip's `.folder()` only returns null for invalid names
    throw new Error("Failed to create root folder in ZIP");
  }

  // ── Build a map of sectionId → folder path within the ZIP ──
  // Process sections in dependency order (parents before children).
  const sectionFolderPaths = buildSectionPaths(sections);

  // ── Track used filenames per parent folder for dedup ──
  // Key: parent path ("" for root), Value: Set of lowercased filenames
  const usedNamesByParent = new Map<string, Set<string>>();
  const getUsedSet = (parentPath: string): Set<string> => {
    let set = usedNamesByParent.get(parentPath);
    if (!set) {
      set = new Set();
      usedNamesByParent.set(parentPath, set);
    }
    return set;
  };

  // ── Compute max order per sibling group (for zero-pad width) ──
  const maxOrderInGroup = computeMaxOrderInGroup(sections, pages);

  // ── Create section folders (so empty sections are preserved) ──
  for (const section of sections) {
    const path = sectionFolderPaths.get(section.id);
    if (!path) continue;
    rootFolder.folder(path);
  }

  // ── Write pages ──
  onProgress?.({
    phase: "serializing-pages",
    total,
    current,
    message: `Writing ${total} ${total === 1 ? "page" : "pages"}…`,
  });

  for (const page of pages) {
    const parentPath = page.sectionId
      ? sectionFolderPaths.get(page.sectionId) ?? ""
      : "";

    const usedSet = getUsedSet(parentPath);
    const maxOrder =
      maxOrderInGroup.get(`page:${page.sectionId ?? "__root__"}`) ?? 0;

    const filename = buildPageFilename(
      page.title || "untitled",
      page.order,
      maxOrder,
      usedSet
    );

    const fullPath = parentPath ? `${parentPath}/${filename}` : filename;
    const content = serializePageToMarkdown(page);

    rootFolder.file(fullPath, content);

    current++;
    if (current % 5 === 0 || current === total) {
      onProgress?.({
        phase: "serializing-pages",
        total,
        current,
        message: `Writing pages (${current}/${total})…`,
      });
    }
  }

  // ── Generate ZIP blob ──
  onProgress?.({
    phase: "zipping",
    total,
    current,
    message: "Compressing ZIP…",
  });

  const blob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (meta) => {
      // JSZip's generation progress is 0..100
      onProgress?.({
        phase: "zipping",
        total,
        current,
        message: `Compressing… ${Math.round(meta.percent)}%`,
      });
    }
  );

  onProgress?.({
    phase: "done",
    total,
    current,
    message: "Export complete",
  });

  return blob;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Build a map sectionId → folder path (relative to notebook root).
 *
 * Processes sections in depth order so parent paths are resolved before
 * children. Sibling sections at the same level get numeric prefixes based
 * on their `order` field (with shared zero-pad width).
 *
 * Example output:
 *   sec_intro → "01-intro"
 *   sec_intro_basics → "01-intro/01-basics"
 */
function buildSectionPaths(
  sections: NotebookSection[]
): Map<string, string> {
  const pathMap = new Map<string, string>();

  // Group sections by parent for sibling order + max calculation
  const sectionsByParent = new Map<string | null, NotebookSection[]>();
  for (const s of sections) {
    const key = s.parentId;
    if (!sectionsByParent.has(key)) sectionsByParent.set(key, []);
    sectionsByParent.get(key)!.push(s);
  }

  // Sort each sibling group by order
  for (const list of sectionsByParent.values()) {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  // Process recursively from root
  function process(parentId: string | null, parentPath: string) {
    const siblings = sectionsByParent.get(parentId) ?? [];
    const maxOrder = Math.max(0, ...siblings.map((s) => s.order ?? 0));

    for (const section of siblings) {
      const folderName = buildSectionFolderName(
        section.name,
        section.order,
        maxOrder
      );
      const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      pathMap.set(section.id, fullPath);

      // Recurse
      process(section.id, fullPath);
    }
  }

  process(null, "");
  return pathMap;
}

/**
 * Compute the max order within each sibling group, both for sections
 * and pages. Used to decide zero-pad width for ordering prefixes.
 *
 * Key format:
 *   "section:<parentId|__root__>"
 *   "page:<sectionId|__root__>"
 */
function computeMaxOrderInGroup(
  sections: NotebookSection[],
  pages: NotebookPage[]
): Map<string, number> {
  const map = new Map<string, number>();

  for (const s of sections) {
    const key = `section:${s.parentId ?? "__root__"}`;
    const current = map.get(key) ?? 0;
    if ((s.order ?? 0) > current) map.set(key, s.order ?? 0);
  }

  for (const p of pages) {
    const key = `page:${p.sectionId ?? "__root__"}`;
    const current = map.get(key) ?? 0;
    if ((p.order ?? 0) > current) map.set(key, p.order ?? 0);
  }

  return map;
}
