/**
 * YAML frontmatter parser for markdown documents.
 *
 * Uses gray-matter under the hood. Wrapped for type safety
 * and consistent API.
 *
 * Frontmatter format:
 * ---
 * title: My Doc
 * tags: [intro, getting-started]
 * draft: false
 * ---
 * # Content here
 */

import matter from "gray-matter";

export interface ParsedMarkdown {
  /** Markdown content with frontmatter stripped */
  content: string;
  /** Parsed frontmatter data (empty object if none) */
  frontmatter: Record<string, unknown>;
  /** True if frontmatter was actually found and parsed */
  hasFrontmatter: boolean;
}

/**
 * Parse markdown string, extracting YAML frontmatter.
 *
 * @param markdown - raw markdown string (may or may not have frontmatter)
 * @returns parsed content + frontmatter
 */
export function parseFrontmatter(markdown: string): ParsedMarkdown {
  try {
    const parsed = matter(markdown);
    const hasFrontmatter = Object.keys(parsed.data).length > 0;
    return {
      content: parsed.content,
      frontmatter: parsed.data as Record<string, unknown>,
      hasFrontmatter,
    };
  } catch (err) {
    // Malformed frontmatter — return raw content
    console.warn("[frontmatter] Parse error:", err);
    return {
      content: markdown,
      frontmatter: {},
      hasFrontmatter: false,
    };
  }
}

/**
 * Serialize content + frontmatter back to markdown.
 *
 * @param content - markdown body
 * @param frontmatter - frontmatter object (empty/null = no frontmatter)
 * @returns markdown string with frontmatter prepended (if any)
 */
export function serializeFrontmatter(
  content: string,
  frontmatter: Record<string, unknown> | null
): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return content;
  }

  try {
    return matter.stringify(content, frontmatter);
  } catch (err) {
    console.warn("[frontmatter] Serialize error:", err);
    return content;
  }
}

/**
 * Extract title from frontmatter, falling back to first H1 in content.
 *
 * @param frontmatter - parsed frontmatter
 * @param content - markdown content (without frontmatter)
 * @returns title or null if not found
 */
export function extractTitle(
  frontmatter: Record<string, unknown>,
  content: string
): string | null {
  // Try frontmatter title first
  if (typeof frontmatter.title === "string" && frontmatter.title.trim()) {
    return frontmatter.title.trim();
  }

  // Fall back to first H1 in content
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();

  return null;
}
