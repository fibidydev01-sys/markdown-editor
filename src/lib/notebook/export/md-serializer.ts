/**
 * Markdown serializer for export.
 *
 * Converts a NotebookPage into a single markdown string with frontmatter
 * prepended, matching the input format that the importer (Phase E)
 * expects. This enables clean round-trip: export → import = identical tree.
 *
 * Note: We use `gray-matter`'s stringify capability. It correctly handles
 * YAML serialization of the frontmatter object, including dates, arrays,
 * nested objects, etc.
 */

import matter from "gray-matter";
import type { NotebookPage } from "@/types/notebook";

/**
 * Serialize a page into markdown with frontmatter.
 *
 * If the page has frontmatter, it's prepended as a YAML block.
 * If not, just the raw content is returned.
 *
 * The page's title is NOT injected into the content — the filename
 * carries the title for export, and the title field stays in frontmatter
 * if present.
 */
export function serializePageToMarkdown(page: NotebookPage): string {
  const content = page.content ?? "";
  const frontmatter = page.frontmatter;

  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    // No frontmatter — just return content (ensure trailing newline)
    return ensureTrailingNewline(content);
  }

  // Use gray-matter to stringify. It produces `---\n...\n---\n\n{content}`.
  // We pass an empty content string and the data, then concatenate.
  try {
    const result = matter.stringify(content, frontmatter);
    return ensureTrailingNewline(result);
  } catch (err) {
    // If serialization fails (e.g. circular refs in frontmatter), fall
    // back to content only — losing frontmatter is preferable to crashing.
    console.error(
      "[md-serializer] Frontmatter serialization failed:",
      err
    );
    return ensureTrailingNewline(content);
  }
}

function ensureTrailingNewline(s: string): string {
  if (s.length === 0) return "";
  return s.endsWith("\n") ? s : s + "\n";
}
