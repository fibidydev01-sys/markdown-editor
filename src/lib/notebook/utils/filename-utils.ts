/**
 * Filename parsing utilities for ZIP/MD import.
 *
 * Handles:
 * - Stripping numeric prefixes (01-name → name)
 * - Extracting display names from filenames
 * - Computing display order from numeric prefix
 * - Path manipulation
 */

/**
 * Strip the file extension from a filename.
 *
 * Examples:
 *   "hello.md" → "hello"
 *   "01-intro.md" → "01-intro"
 *   "no-extension" → "no-extension"
 */
export function stripExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return filename;
  return filename.substring(0, lastDot);
}

/**
 * Get the file extension (lowercase, without dot).
 *
 * Examples:
 *   "hello.md" → "md"
 *   "doc.MD" → "md"
 *   "noext" → ""
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot < 0) return "";
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Check if a filename is a supported markdown file (.md or .markdown).
 */
export function isMarkdownFile(filename: string): boolean {
  const ext = getExtension(filename);
  return ext === "md" || ext === "markdown";
}

/**
 * Extract numeric prefix from a filename (e.g., "01-intro" → 1).
 * Returns null if no numeric prefix found.
 *
 * Supports formats:
 *   "01-name" → 1
 *   "01_name" → 1
 *   "01.name" → 1
 *   "001-name" → 1
 *   "name" → null
 */
export function extractNumericPrefix(name: string): number | null {
  const match = name.match(/^(\d+)[-_.]/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Strip numeric prefix from a name.
 *
 * Examples:
 *   "01-intro" → "intro"
 *   "001_getting-started" → "getting-started"
 *   "intro" → "intro" (no change)
 */
export function stripNumericPrefix(name: string): string {
  return name.replace(/^\d+[-_.]/, "");
}

/**
 * Convert a kebab/snake-case filename to a human-readable title.
 *
 * Examples:
 *   "getting-started" → "Getting Started"
 *   "api_reference" → "Api Reference"
 *   "01-intro" → "Intro" (prefix stripped first)
 *   "my-cool-doc.md" → "My Cool Doc"
 */
export function filenameToTitle(filename: string): string {
  return stripExtension(filename)
    .split("/").pop()! // get last segment (handle paths)
    .replace(/^\d+[-_.]/, "") // strip numeric prefix
    .split(/[-_.\s]+/) // split on separators
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extract a title from markdown content (first H1) or fall back to filename.
 *
 * Examples:
 *   content: "# My Title\n..." → "My Title"
 *   content: "no heading" → fallback
 */
export function titleFromMarkdown(
  content: string,
  fallbackFilename: string
): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return filenameToTitle(fallbackFilename);
}

/**
 * Split a path into segments, filtering empty parts.
 *
 * Examples:
 *   "folder/subfolder/file.md" → ["folder", "subfolder", "file.md"]
 *   "/leading/slash.md" → ["leading", "slash.md"]
 *   "single" → ["single"]
 */
export function splitPath(path: string): string[] {
  return path.split(/[/\\]+/).filter(Boolean);
}

/**
 * Get the directory portion of a path (without the filename).
 *
 * Examples:
 *   "folder/file.md" → "folder"
 *   "a/b/c/file.md" → "a/b/c"
 *   "file.md" → ""
 */
export function getDirPath(path: string): string {
  const segments = splitPath(path);
  if (segments.length <= 1) return "";
  return segments.slice(0, -1).join("/");
}

/**
 * Get just the filename portion of a path.
 *
 * Examples:
 *   "folder/file.md" → "file.md"
 *   "file.md" → "file.md"
 */
export function getBasename(path: string): string {
  const segments = splitPath(path);
  return segments[segments.length - 1] ?? "";
}
