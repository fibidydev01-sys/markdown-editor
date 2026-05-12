/**
 * Single markdown file parsing for import.
 *
 * Handles:
 *   - YAML frontmatter extraction (via gray-matter utility)
 *   - Title resolution: frontmatter.title → H1 in content → filename
 *   - Content normalization
 */

import { parseFrontmatter, extractTitle } from "../utils/frontmatter";
import {
  filenameToTitle,
  isMarkdownFile,
  stripExtension,
} from "../utils/filename-utils";

export interface ImportablePage {
  /** Resolved title (best guess). */
  title: string;
  /** Markdown content WITHOUT frontmatter. */
  content: string;
  /** Parsed frontmatter (null if none). */
  frontmatter: Record<string, unknown> | null;
  /** Original filename (for path reconstruction). */
  filename: string;
}

/**
 * Parse a raw markdown string + filename into ImportablePage.
 *
 * @param content - raw file content (may include frontmatter)
 * @param filename - original filename (used for title fallback)
 */
export function parseMarkdownString(
  content: string,
  filename: string
): ImportablePage {
  const { content: body, frontmatter } = parseFrontmatter(content);

  const title =
    extractTitle(frontmatter, body) ?? filenameToTitle(filename);

  return {
    title,
    content: body,
    frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : null,
    filename,
  };
}

/**
 * Parse a File object (from drag-drop or file picker) into ImportablePage.
 * Reads the file as text first.
 *
 * @returns null if the file isn't a markdown file
 */
export async function parseMarkdownFile(
  file: File
): Promise<ImportablePage | null> {
  if (!isMarkdownFile(file.name)) return null;

  try {
    const text = await file.text();
    return parseMarkdownString(text, file.name);
  } catch (err) {
    console.error("[md-parser] Failed to read file:", file.name, err);
    return null;
  }
}

/**
 * Parse multiple File objects, filtering out non-markdown files.
 *
 * @returns array of parsed pages (only successful parses)
 */
export async function parseMarkdownFiles(
  files: File[] | FileList
): Promise<ImportablePage[]> {
  const fileArray = Array.from(files);
  const parsed = await Promise.all(
    fileArray.map((f) => parseMarkdownFile(f))
  );
  return parsed.filter((p): p is ImportablePage => p !== null);
}

/**
 * Build a notebook name from a single filename (drop extension).
 * Used when creating a notebook from a single MD file import.
 */
export function notebookNameFromFilename(filename: string): string {
  return filenameToTitle(stripExtension(filename));
}
