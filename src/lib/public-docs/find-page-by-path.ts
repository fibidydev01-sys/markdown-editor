/**
 * Resolve URL path segments → DocsPageNode.
 *
 * Examples:
 *   /@andre/saas-boilerplate/intro          → segments=["intro"]
 *   /@andre/saas-boilerplate/setup/install  → segments=["setup", "install"]
 *
 * Strategy: walk the tree following the segments. The LAST segment
 * must resolve to a page; intermediate segments must resolve to sections.
 */

import type { DocsPageNode, DocsTreeNode } from "./build-page-tree";
import { flattenPages } from "./build-page-tree";

/**
 * Find a page by URL path segments.
 * Returns null if no page matches.
 */
export function findPageByPath(
  tree: DocsTreeNode[],
  pathSegments: string[]
): DocsPageNode | null {
  if (pathSegments.length === 0) return null;

  let currentLevel: DocsTreeNode[] = tree;
  let resolved: DocsPageNode | null = null;

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    const isLast = i === pathSegments.length - 1;

    const match = currentLevel.find((n) => n.slug === segment);
    if (!match) return null;

    if (isLast) {
      // Last segment must be a page
      if (match.type === "page") {
        resolved = match;
      } else {
        return null;
      }
    } else {
      // Intermediate segment must be a section
      if (match.type === "section") {
        currentLevel = match.children;
      } else {
        return null;
      }
    }
  }

  return resolved;
}

/**
 * Find the first page in the tree (in document order).
 * Used to redirect from `/@user/slug` → first page.
 */
export function findFirstPage(tree: DocsTreeNode[]): DocsPageNode | null {
  const all = flattenPages(tree);
  return all[0] ?? null;
}
