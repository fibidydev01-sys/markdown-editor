/**
 * Filename builder for ZIP export.
 *
 * Generates filesystem-safe, unique filenames from page/section names.
 * Optionally prefixes with numeric ordering (`01-`, `02-`, ...) to preserve
 * the user's intended order when re-imported.
 *
 * Round-trip goal: export → re-import should reproduce the same tree
 * structure (modulo IDs and timestamps).
 */

import { slugify } from "@/lib/notebook/utils/slugify";

const MAX_SLUG_LEN = 60;

/**
 * Build a section folder name with optional numeric prefix.
 *
 * @param name - section display name
 * @param order - 1-based order (0 or undefined → no prefix)
 * @param maxOrderInGroup - largest order in the same sibling group
 *                          (used to decide zero-pad width: 2 digits if >=10)
 */
export function buildSectionFolderName(
  name: string,
  order: number | undefined,
  maxOrderInGroup: number
): string {
  const slug = truncate(slugify(name) || "untitled", MAX_SLUG_LEN);
  if (!order || order < 1) return slug;
  const width = maxOrderInGroup >= 10 ? 2 : 1;
  return `${String(order).padStart(width, "0")}-${slug}`;
}

/**
 * Build a page filename (with .md extension) with optional numeric prefix.
 *
 * @param title - page title
 * @param order - 1-based order within the parent section
 * @param maxOrderInGroup - largest order in the same sibling group
 * @param usedNames - Set of already-used filenames in the same folder
 *                    (for dedup with `-2`, `-3` suffix)
 *
 * The function records the chosen name into `usedNames` so subsequent
 * calls within the same folder dedup correctly.
 */
export function buildPageFilename(
  title: string,
  order: number | undefined,
  maxOrderInGroup: number,
  usedNames: Set<string>
): string {
  const slug = truncate(slugify(title) || "untitled", MAX_SLUG_LEN);

  let base: string;
  if (order && order >= 1) {
    const width = maxOrderInGroup >= 10 ? 2 : 1;
    base = `${String(order).padStart(width, "0")}-${slug}`;
  } else {
    base = slug;
  }

  // Dedup
  let candidate = `${base}.md`;
  let i = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base}-${i}.md`;
    i++;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

/**
 * Build a filename for the exported ZIP itself.
 * Example: "my-docs-2025-01-15.zip"
 */
export function buildZipFilename(
  notebookName: string,
  date: Date = new Date()
): string {
  const slug = slugify(notebookName) || "notebook";
  const isoDate = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${slug}-${isoDate}.zip`;
}

// ============================================================
// Helpers
// ============================================================

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  // Truncate at last hyphen before maxLen for clean break
  const truncated = s.slice(0, maxLen);
  const lastHyphen = truncated.lastIndexOf("-");
  if (lastHyphen > maxLen - 15) {
    return truncated.slice(0, lastHyphen);
  }
  return truncated;
}
