/**
 * Find the previous and next pages relative to a given page.
 * Used by the page-nav-footer (Prev / Next buttons at bottom of content).
 *
 * Uses flat document-order traversal of the tree.
 */

import { flattenPages, type DocsPageNode, type DocsTreeNode } from "./build-page-tree";

export interface PrevNextResult {
  prev: DocsPageNode | null;
  next: DocsPageNode | null;
}

export function findPrevNextPage(
  tree: DocsTreeNode[],
  currentPageId: string
): PrevNextResult {
  const flat = flattenPages(tree);
  const idx = flat.findIndex((p) => p.id === currentPageId);

  if (idx === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}
