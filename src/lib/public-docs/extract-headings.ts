/**
 * Extract H2 and H3 headings from a markdown string.
 *
 * Used to build the right-side "On this page" TOC.
 *
 * Strategy: regex-based parsing (not full markdown AST). We only need:
 *   - Heading depth (## = 2, ### = 3)
 *   - Heading text (stripped of inline markdown markers)
 *   - Anchor slug (matches what rehype-slug generates)
 *
 * Edge cases handled:
 *   - Code blocks (```...```): headings inside code don't count
 *   - Frontmatter (---...---): skipped if present at start
 *   - Indented code (4-space): skipped
 */

import { slugifyHeading } from "./slugify-heading";

export interface Heading {
  /** Slug used in anchor href (matches rehype-slug output). */
  id: string;
  /** Display text (no markdown markers). */
  text: string;
  /** Heading depth — 2 or 3 only. */
  depth: 2 | 3;
}

export interface TocNode {
  id: string;
  text: string;
  /** Nested H3 children of an H2. Only populated for depth=2 nodes. */
  children: TocNode[];
}

/**
 * Extract H2 + H3 headings from a markdown string.
 * Returns a flat list in document order.
 */
export function extractHeadings(markdown: string): Heading[] {
  if (!markdown) return [];

  // Strip leading frontmatter block (--- ... ---)
  const content = stripFrontmatter(markdown);

  const lines = content.split("\n");
  const headings: Heading[] = [];

  let inCodeFence = false;
  let codeFenceMarker = "";

  for (const line of lines) {
    // Track code fence state (```  or ~~~)
    const fenceMatch = line.match(/^([ \t]*)(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[2][0]; // ` or ~
      if (!inCodeFence) {
        inCodeFence = true;
        codeFenceMarker = marker;
      } else if (codeFenceMarker === marker) {
        inCodeFence = false;
        codeFenceMarker = "";
      }
      continue;
    }

    if (inCodeFence) continue;

    // Skip indented code blocks (4+ spaces or tab at start)
    if (/^( {4}|\t)/.test(line)) continue;

    // Match heading: optional 0-3 leading spaces, then ## or ###
    const match = line.match(/^ {0,3}(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const depth = match[1].length as 2 | 3;
    const rawText = match[2];

    // Strip inline markdown markers from display text
    const text = stripInlineMarkdown(rawText);
    if (!text) continue;

    headings.push({
      id: slugifyHeading(text),
      text,
      depth,
    });
  }

  // Dedupe ids (if two headings produce the same slug, suffix the
  // second one — matches rehype-slug behavior)
  return dedupeIds(headings);
}

/**
 * Build a nested TOC structure from a flat heading list.
 * H3s are nested under the nearest preceding H2.
 */
export function buildTocTree(headings: Heading[]): TocNode[] {
  const tree: TocNode[] = [];
  let currentH2: TocNode | null = null;

  for (const h of headings) {
    if (h.depth === 2) {
      currentH2 = { id: h.id, text: h.text, children: [] };
      tree.push(currentH2);
    } else if (h.depth === 3) {
      const node: TocNode = { id: h.id, text: h.text, children: [] };
      if (currentH2) {
        currentH2.children.push(node);
      } else {
        // H3 with no preceding H2 — promote to top level
        tree.push(node);
      }
    }
  }

  return tree;
}

// ============================================================
// Helpers
// ============================================================

function stripFrontmatter(markdown: string): string {
  // Match leading --- ... --- block
  const match = markdown.match(/^---\n[\s\S]*?\n---\n?/);
  if (match) return markdown.slice(match[0].length);
  return markdown;
}

function stripInlineMarkdown(text: string): string {
  return text
    // Inline code: `text` → text
    .replace(/`([^`]+)`/g, "$1")
    // Bold: **text** or __text__ → text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // Italic: *text* or _text_ → text
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Images: ![alt](url) → alt (just in case heading has image)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // HTML tags: strip
    .replace(/<[^>]+>/g, "")
    .trim();
}

function dedupeIds(headings: Heading[]): Heading[] {
  const seen = new Map<string, number>();
  return headings.map((h) => {
    const count = seen.get(h.id) ?? 0;
    seen.set(h.id, count + 1);
    if (count === 0) return h;
    return { ...h, id: `${h.id}-${count}` };
  });
}
