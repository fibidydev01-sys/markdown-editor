/**
 * ZIP archive parsing for import.
 *
 * Steps:
 *   1. Unzip in browser (via jszip)
 *   2. Walk file tree, parse each .md file
 *   3. Build hierarchical preview tree (folders → sections, .md → pages)
 *   4. Compute order from numeric prefixes (01-, 02-, ...) when present
 *
 * The output (`ParsedZip`) is used by:
 *   - Preview modal (display tree)
 *   - Importer (commit to storage)
 */

import JSZip from "jszip";
import { parseMarkdownString, type ImportablePage } from "./md-parser";
import {
  extractNumericPrefix,
  filenameToTitle,
  getBasename,
  getDirPath,
  isMarkdownFile,
  stripExtension,
  stripNumericPrefix,
} from "../utils/filename-utils";
import type { ImportPreviewNode } from "@/types/notebook";

// ============================================================
// Output types
// ============================================================

export interface ParsedZipPage extends ImportablePage {
  /** Path relative to the ZIP root, e.g. "01-intro/getting-started.md". */
  path: string;
  /** Section path, e.g. "01-intro" — null if at ZIP root. */
  sectionPath: string | null;
  /** Resolved order from numeric prefix, defaults to a stable index. */
  order: number;
}

export interface ParsedZipSection {
  /** Path relative to the ZIP root, e.g. "01-intro" or "guides/api". */
  path: string;
  /** Display name (numeric prefix stripped, title-cased). */
  name: string;
  /** Direct parent section path — null if root-level. */
  parentPath: string | null;
  /** Order from numeric prefix. */
  order: number;
}

export interface ParsedZip {
  /** Suggested notebook name (from ZIP filename or root folder). */
  suggestedNotebookName: string;
  /** All sections (flat list, hierarchy via parentPath). */
  sections: ParsedZipSection[];
  /** All pages (flat list, parent via sectionPath). */
  pages: ParsedZipPage[];
  /** Tree representation for preview modal. */
  previewTree: ImportPreviewNode[];
  /** Count of non-markdown files that were ignored. */
  ignoredFileCount: number;
  /** List of ignored file names (for "skipped" message). */
  ignoredFiles: string[];
}

export type ZipParseError =
  | "invalid-zip"
  | "empty-zip"
  | "no-markdown"
  | "too-many-files";

const MAX_FILES = 1000; // safety cap

// ============================================================
// Main entry: parse a File (the uploaded ZIP) into ParsedZip
// ============================================================

export async function parseZipFile(
  file: File
): Promise<{ ok: true; data: ParsedZip } | { ok: false; error: ZipParseError }> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (err) {
    console.error("[zip-parser] loadAsync failed:", err);
    return { ok: false, error: "invalid-zip" };
  }

  // Collect file entries (skip dirs and dotfiles)
  const fileEntries: { path: string; entry: JSZip.JSZipObject }[] = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (isHiddenOrSystemFile(path)) return;
    fileEntries.push({ path: normalizePath(path), entry });
  });

  if (fileEntries.length === 0) {
    return { ok: false, error: "empty-zip" };
  }

  if (fileEntries.length > MAX_FILES) {
    return { ok: false, error: "too-many-files" };
  }

  // Detect common root prefix (e.g. "my-docs/" wrapping everything)
  // and strip it so the first level inside the wrapper becomes root.
  const commonPrefix = detectCommonPrefix(fileEntries.map((f) => f.path));

  // Process entries: parse markdown, track ignored
  const pages: ParsedZipPage[] = [];
  const ignoredFiles: string[] = [];
  const sectionPaths = new Set<string>();

  for (const { path, entry } of fileEntries) {
    const relativePath = commonPrefix
      ? path.slice(commonPrefix.length)
      : path;

    if (!relativePath) continue; // shouldn't happen but safety

    if (!isMarkdownFile(relativePath)) {
      ignoredFiles.push(relativePath);
      continue;
    }

    try {
      const rawContent = await entry.async("string");
      const dirPath = getDirPath(relativePath);
      const filename = getBasename(relativePath);
      const parsed = parseMarkdownString(rawContent, filename);

      const order = extractNumericPrefix(filename) ?? 0;

      const page: ParsedZipPage = {
        ...parsed,
        path: relativePath,
        sectionPath: dirPath || null,
        order,
        // Note: title from parseMarkdownString already prefers frontmatter
        // or H1, falling back to filenameToTitle. Override here if we want
        // the numeric prefix stripped from filename-fallback specifically.
      };

      pages.push(page);

      // Register all parent section paths
      if (dirPath) {
        for (const ancestorPath of getAncestorPaths(dirPath)) {
          sectionPaths.add(ancestorPath);
        }
      }
    } catch (err) {
      console.error(
        "[zip-parser] Failed to read file:",
        relativePath,
        err
      );
      ignoredFiles.push(relativePath);
    }
  }

  if (pages.length === 0) {
    return { ok: false, error: "no-markdown" };
  }

  // Build section entries from collected paths
  const sections: ParsedZipSection[] = Array.from(sectionPaths).map((p) => {
    const parts = p.split("/");
    const lastSegment = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/") || null;

    return {
      path: p,
      name: filenameToTitle(stripNumericPrefix(lastSegment)),
      parentPath,
      order: extractNumericPrefix(lastSegment) ?? 0,
    };
  });

  // Sort sections + pages by order for stable display
  sections.sort((a, b) => a.order - b.order || a.path.localeCompare(b.path));
  pages.sort((a, b) => a.order - b.order || a.path.localeCompare(b.path));

  // Assign stable order indices (1-based) within siblings
  assignOrderWithinSiblings(sections, pages);

  // Build preview tree
  const previewTree = buildPreviewTree(sections, pages);

  // Suggested notebook name
  const suggestedNotebookName = suggestNotebookName(file, commonPrefix);

  return {
    ok: true,
    data: {
      suggestedNotebookName,
      sections,
      pages,
      previewTree,
      ignoredFileCount: ignoredFiles.length,
      ignoredFiles,
    },
  };
}

// ============================================================
// Helpers
// ============================================================

/** Normalize Windows-style path separators and trim leading slash. */
function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

/** Filter out .DS_Store, __MACOSX, .git, etc. */
function isHiddenOrSystemFile(path: string): boolean {
  const normalized = normalizePath(path);
  const segments = normalized.split("/");
  return segments.some(
    (s) =>
      s.startsWith(".") ||
      s === "__MACOSX" ||
      s === "Thumbs.db" ||
      s === "desktop.ini"
  );
}

/**
 * Detect a common top-level folder wrapping all entries.
 * Example: ["docs/a.md", "docs/b/c.md"] → "docs/"
 * If files are at the root or there are mixed top-level folders, returns "".
 */
function detectCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";

  // Get the first segment of each path
  const firstSegments = new Set<string>();
  let anyRootFile = false;

  for (const p of paths) {
    const segments = p.split("/");
    if (segments.length === 1) {
      anyRootFile = true;
      break;
    }
    firstSegments.add(segments[0]);
  }

  // If any file is at root, no common prefix
  if (anyRootFile) return "";
  // If multiple top-level folders, no common prefix
  if (firstSegments.size !== 1) return "";

  return [...firstSegments][0] + "/";
}

/**
 * Get all ancestor paths of a path, inclusive of itself.
 * "a/b/c" → ["a", "a/b", "a/b/c"]
 */
function getAncestorPaths(path: string): string[] {
  const segments = path.split("/").filter(Boolean);
  const result: string[] = [];
  let acc = "";
  for (const seg of segments) {
    acc = acc ? `${acc}/${seg}` : seg;
    result.push(acc);
  }
  return result;
}

/**
 * Within each sibling group (same parent), assign 1-based order indices.
 * Preserves numeric-prefix order (which we already sorted by).
 */
function assignOrderWithinSiblings(
  sections: ParsedZipSection[],
  pages: ParsedZipPage[]
): void {
  // Group children by parent
  const sectionsByParent = new Map<string | null, ParsedZipSection[]>();
  const pagesByParent = new Map<string | null, ParsedZipPage[]>();

  for (const s of sections) {
    const key = s.parentPath;
    if (!sectionsByParent.has(key)) sectionsByParent.set(key, []);
    sectionsByParent.get(key)!.push(s);
  }

  for (const p of pages) {
    const key = p.sectionPath;
    if (!pagesByParent.has(key)) pagesByParent.set(key, []);
    pagesByParent.get(key)!.push(p);
  }

  // For each sibling group, assign stable order 1..N
  // (sections first, then pages, matching tree display)
  for (const list of sectionsByParent.values()) {
    list.forEach((s, i) => {
      s.order = i + 1;
    });
  }
  for (const list of pagesByParent.values()) {
    list.forEach((p, i) => {
      // Pages start AFTER sections at the same level, so we offset
      const siblingSections = sectionsByParent.get(p.sectionPath);
      const sectionCount = siblingSections?.length ?? 0;
      p.order = sectionCount + i + 1;
    });
  }
}

/**
 * Build a hierarchical preview tree from flat sections + pages.
 */
function buildPreviewTree(
  sections: ParsedZipSection[],
  pages: ParsedZipPage[]
): ImportPreviewNode[] {
  // Group by parent path
  const sectionsByParent = new Map<string | null, ParsedZipSection[]>();
  const pagesByParent = new Map<string | null, ParsedZipPage[]>();

  for (const s of sections) {
    const key = s.parentPath;
    if (!sectionsByParent.has(key)) sectionsByParent.set(key, []);
    sectionsByParent.get(key)!.push(s);
  }

  for (const p of pages) {
    const key = p.sectionPath;
    if (!pagesByParent.has(key)) pagesByParent.set(key, []);
    pagesByParent.get(key)!.push(p);
  }

  function build(parentPath: string | null): ImportPreviewNode[] {
    const childSections = (sectionsByParent.get(parentPath) ?? []).sort(
      (a, b) => a.order - b.order
    );
    const childPages = (pagesByParent.get(parentPath) ?? []).sort(
      (a, b) => a.order - b.order
    );

    const sectionNodes: ImportPreviewNode[] = childSections.map((s) => {
      const children = build(s.path);
      // Total pages under this section (direct + all descendants)
      const totalPages = pages.filter(
        (p) =>
          p.sectionPath === s.path ||
          (p.sectionPath !== null && p.sectionPath.startsWith(s.path + "/"))
      ).length;
      return {
        type: "section" as const,
        name: s.name,
        path: s.path,
        children,
        pageCount: totalPages,
      };
    });

    const pageNodes: ImportPreviewNode[] = childPages.map((p) => ({
      type: "page" as const,
      name: p.title,
      path: p.path,
    }));

    return [...sectionNodes, ...pageNodes];
  }

  return build(null);
}

/**
 * Suggest a notebook name from the ZIP filename or detected common prefix.
 */
function suggestNotebookName(file: File, commonPrefix: string): string {
  if (commonPrefix) {
    const folderName = commonPrefix.replace(/\/$/, "");
    return filenameToTitle(stripNumericPrefix(folderName));
  }

  // Fall back to ZIP filename without extension
  return filenameToTitle(stripExtension(file.name));
}

// ============================================================
// Helper: human-readable error messages
// ============================================================

export function getZipErrorMessage(error: ZipParseError): string {
  switch (error) {
    case "invalid-zip":
      return "This doesn't look like a valid ZIP file.";
    case "empty-zip":
      return "The ZIP file is empty.";
    case "no-markdown":
      return "No markdown (.md) files found in the ZIP.";
    case "too-many-files":
      return `ZIP contains too many files (max ${MAX_FILES}).`;
  }
}
