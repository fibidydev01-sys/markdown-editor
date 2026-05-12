/**
 * Build a hierarchical tree of sections + pages from a published notebook
 * snapshot. Used by:
 *   - Left sidebar navigation
 *   - Prev/next page resolution (flat in-order traversal of the tree)
 *   - Slug-path → page lookup (matches URL segments against tree)
 *
 * Each node carries its URL path segments (slugified), so the tree
 * can be rendered without re-slugifying at every nesting level.
 */

import { slugify } from "@/lib/notebook/utils/slugify";
import type {
  NotebookPage,
  NotebookSection,
} from "@/types/notebook";

export type DocsTreeNode = DocsSectionNode | DocsPageNode;

export interface DocsSectionNode {
  type: "section";
  id: string;
  name: string;
  /** URL-safe slug for this section. */
  slug: string;
  /** Full path segments from notebook root to this section. */
  pathSegments: string[];
  children: DocsTreeNode[];
}

export interface DocsPageNode {
  type: "page";
  id: string;
  /** Original page title. */
  title: string;
  /** URL-safe slug for this page. */
  slug: string;
  /** Full path segments from notebook root to this page. */
  pathSegments: string[];
  /** Full markdown content (loaded eagerly from snapshot). */
  content: string;
  /** Order within siblings. */
  order: number;
  /** Reference to source page for full data access. */
  page: NotebookPage;
  /** Parent section name (for breadcrumbs). null if at root. */
  parentSectionName: string | null;
}

/**
 * Build the docs tree from raw snapshot data.
 *
 * Strategy:
 *   1. Group sections by parent
 *   2. Group pages by section
 *   3. Recursively build, sorting by `order` at each level
 *   4. Slugify section/page names with conflict resolution (sibling-scope)
 */
export function buildDocsTree(
  sections: NotebookSection[],
  pages: NotebookPage[]
): DocsTreeNode[] {
  // Index by parent
  const sectionsByParent = new Map<string | null, NotebookSection[]>();
  for (const sec of sections) {
    const key = sec.parentId;
    if (!sectionsByParent.has(key)) sectionsByParent.set(key, []);
    sectionsByParent.get(key)!.push(sec);
  }

  const pagesBySection = new Map<string | null, NotebookPage[]>();
  for (const page of pages) {
    const key = page.sectionId;
    if (!pagesBySection.has(key)) pagesBySection.set(key, []);
    pagesBySection.get(key)!.push(page);
  }

  // Build a fast section-id → section lookup (for parent name resolution)
  const sectionById = new Map<string, NotebookSection>();
  for (const sec of sections) sectionById.set(sec.id, sec);

  function buildLevel(
    parentSectionId: string | null,
    parentPathSegments: string[]
  ): DocsTreeNode[] {
    const childSections = (
      sectionsByParent.get(parentSectionId) ?? []
    ).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const childPages = (
      pagesBySection.get(parentSectionId) ?? []
    ).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Track used slugs within this sibling group for dedup
    const usedSlugs = new Set<string>();

    const sectionNodes: DocsSectionNode[] = childSections.map((sec) => {
      const slug = dedupeSlug(slugify(sec.name) || "section", usedSlugs);
      const pathSegments = [...parentPathSegments, slug];
      return {
        type: "section",
        id: sec.id,
        name: sec.name,
        slug,
        pathSegments,
        children: buildLevel(sec.id, pathSegments),
      };
    });

    const parentSection = parentSectionId
      ? sectionById.get(parentSectionId) ?? null
      : null;
    const parentName = parentSection?.name ?? null;

    const pageNodes: DocsPageNode[] = childPages.map((page) => {
      const slug = dedupeSlug(
        slugify(page.title) || "untitled",
        usedSlugs
      );
      const pathSegments = [...parentPathSegments, slug];
      return {
        type: "page",
        id: page.id,
        title: page.title,
        slug,
        pathSegments,
        content: page.content,
        order: page.order ?? 0,
        page,
        parentSectionName: parentName,
      };
    });

    return [...sectionNodes, ...pageNodes];
  }

  return buildLevel(null, []);
}

/**
 * Flatten a docs tree into a list of pages in document order.
 * Used for prev/next navigation.
 */
export function flattenPages(tree: DocsTreeNode[]): DocsPageNode[] {
  const result: DocsPageNode[] = [];

  function walk(nodes: DocsTreeNode[]) {
    for (const node of nodes) {
      if (node.type === "page") {
        result.push(node);
      } else {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return result;
}

// ============================================================
// Helpers
// ============================================================

function dedupeSlug(base: string, used: Set<string>): string {
  let candidate = base;
  let i = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${i}`;
    i++;
  }
  used.add(candidate);
  return candidate;
}
