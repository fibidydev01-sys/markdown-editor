"use client";

/**
 * useSearchIndex — build a Fuse.js index from a notebook's pages.
 *
 * Strategy:
 *   - Build once per notebook (memoized by notebook id)
 *   - Index page title + truncated content + section name
 *   - Threshold tuned for forgiving but not too loose (0.3)
 */

import { useMemo } from "react";
import Fuse from "fuse.js";
import type { DocsPageNode, DocsTreeNode } from "@/lib/public-docs";
import { flattenPages } from "@/lib/public-docs";

export interface SearchablePage {
  id: string;
  title: string;
  /** First ~500 chars of content (frontmatter stripped) for snippet matching. */
  content: string;
  /** URL to navigate to on click. */
  path: string;
  /** Parent section name (or null). */
  sectionName: string | null;
}

export interface SearchResult {
  page: SearchablePage;
  /** Fuse match info — for highlighting. */
  matches?: ReadonlyArray<{
    indices: ReadonlyArray<readonly [number, number]>;
    value?: string;
    key?: string;
  }>;
}

/**
 * Build the search index from a notebook's tree.
 *
 * @param tree - the docs tree built from snapshot
 * @param notebookBaseUrl - prefix for navigation links (e.g. /@andre/saas-boilerplate)
 */
export function useSearchIndex(
  tree: DocsTreeNode[],
  notebookBaseUrl: string
): Fuse<SearchablePage> {
  return useMemo(() => {
    const pages = flattenPages(tree);

    const docs: SearchablePage[] = pages.map((p) =>
      pageToSearchable(p, notebookBaseUrl)
    );

    return new Fuse<SearchablePage>(docs, {
      keys: [
        { name: "title", weight: 0.6 },
        { name: "content", weight: 0.3 },
        { name: "sectionName", weight: 0.1 },
      ],
      threshold: 0.3,
      includeMatches: true,
      ignoreLocation: true, // match anywhere in the string
      minMatchCharLength: 2,
    });
  }, [tree, notebookBaseUrl]);
}

// ============================================================
// Helpers
// ============================================================

function pageToSearchable(
  page: DocsPageNode,
  notebookBaseUrl: string
): SearchablePage {
  return {
    id: page.id,
    title: page.title,
    content: stripMarkdown(page.content).slice(0, 500),
    path: `${notebookBaseUrl}/${page.pathSegments.join("/")}`,
    sectionName: page.parentSectionName,
  };
}

/**
 * Strip markdown markers from content for cleaner search matching + snippets.
 */
function stripMarkdown(md: string): string {
  return md
    // Strip frontmatter
    .replace(/^---\n[\s\S]*?\n---\n?/, "")
    // Strip code fences (keep content though, since search may want it)
    .replace(/```[\s\S]*?```/g, " ")
    // Inline code
    .replace(/`[^`]+`/g, "")
    // Headings markers
    .replace(/^#{1,6}\s+/gm, "")
    // Bold/italic/strike markers
    .replace(/[*_~]/g, "")
    // Link/image syntax — keep just the text
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, "$1")
    // HTML tags
    .replace(/<[^>]+>/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}
