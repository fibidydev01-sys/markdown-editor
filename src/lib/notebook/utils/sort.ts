/**
 * Sort utilities for notebook entities.
 *
 * Provides type-safe sortBy + specialized helpers for pages and notebooks.
 *
 * Also exports `buildTree` which builds a hierarchical tree from flat
 * sections + pages arrays (used by the notebook sidebar).
 *
 * NOTE on the generic:
 *   `sortBy<T>` uses `T` constrained to `object` so it accepts any record
 *   shape (including domain types like NotebookPage that don't declare
 *   an index signature). We index into the value with a runtime key cast
 *   to `keyof T`, which is safe because the caller passes a valid key.
 */

import type {
  Notebook,
  NotebookPage,
  NotebookSection,
  SortDirection,
  SortField,
} from "@/types/notebook";

// ============================================================
// Generic sortBy
// ============================================================

/**
 * Stable sort an array of objects by a given field.
 *
 * - `T extends object` is wide enough to accept any record shape, while
 *   still letting TypeScript preserve the input type in the return value.
 * - We use a non-mutating spread so the original array isn't reordered.
 *
 * @param items     array of items to sort
 * @param field     key on each item to sort by
 * @param direction "asc" | "desc"
 */
export function sortBy<T extends object>(
  items: T[],
  field: keyof T | string,
  direction: SortDirection = "asc"
): T[] {
  const key = field as keyof T;
  const dir = direction === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];

    // null / undefined sort to the end regardless of direction
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }

    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * dir;
    }

    // Fallback: coerce to string and compare
    return String(av).localeCompare(String(bv)) * dir;
  });
}

// ============================================================
// Specialized sorters
// ============================================================

/**
 * Sort pages — supports the standard notebook fields.
 */
export function sortPages(
  pages: NotebookPage[],
  field: SortField = "order",
  direction: SortDirection = "asc"
): NotebookPage[] {
  return sortBy(pages, field, direction);
}

/**
 * Sort notebooks — supports name, createdAt, updatedAt.
 */
export function sortNotebooks(
  notebooks: Notebook[],
  field: SortField | "name" = "updatedAt",
  direction: SortDirection = "desc"
): Notebook[] {
  // `name` isn't in SortField but is valid for notebooks
  return sortBy(notebooks, field, direction);
}

/**
 * Sort sections by order (ascending).
 */
export function sortSections(
  sections: NotebookSection[]
): NotebookSection[] {
  return sortBy(sections, "order", "asc");
}

// ============================================================
// Tree builder
// ============================================================

/**
 * Node in the sidebar tree — either a section (with children) or a page (leaf).
 */
export type TreeNode =
  | {
    type: "section";
    section: NotebookSection;
    children: TreeNode[];
  }
  | {
    type: "page";
    page: NotebookPage;
  };

/**
 * Build a hierarchical tree from flat sections + pages.
 *
 * Sections are grouped by `parentId`, pages by `sectionId`. Each level is
 * sorted by `order` ascending. Sections render before pages at the same level.
 */
export function buildTree(
  sections: NotebookSection[],
  pages: NotebookPage[]
): TreeNode[] {
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

  function buildLevel(parentSectionId: string | null): TreeNode[] {
    const childSections = (
      sectionsByParent.get(parentSectionId) ?? []
    )
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const childPages = (pagesBySection.get(parentSectionId) ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const sectionNodes: TreeNode[] = childSections.map((sec) => ({
      type: "section",
      section: sec,
      children: buildLevel(sec.id),
    }));

    const pageNodes: TreeNode[] = childPages.map((page) => ({
      type: "page",
      page,
    }));

    return [...sectionNodes, ...pageNodes];
  }

  return buildLevel(null);
}