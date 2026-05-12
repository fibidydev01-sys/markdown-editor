/**
 * Page CRUD operations (markdown documents inside a notebook).
 *
 * Pages can be at the root of a notebook (sectionId=null) or
 * inside a section (sectionId=sectionId).
 */

import { v4 as uuidv4 } from "uuid";
import { getDB } from "./db";
import { touchNotebook } from "./notebooks";
import {
  NEW_PAGE_DEFAULT_CONTENT,
  NEW_PAGE_DEFAULT_TITLE,
} from "@/constants/notebook";
import type {
  CreatePageInput,
  NotebookPage,
  UpdatePageInput,
} from "@/types/notebook";

// ============================================================
// Read
// ============================================================

/**
 * Get all pages in a notebook (flat list, unsorted).
 */
export async function getPages(notebookId: string): Promise<NotebookPage[]> {
  const db = await getDB();
  return db.getAllFromIndex("pages", "by-notebook", notebookId);
}

/**
 * Get a single page by ID.
 */
export async function getPage(id: string): Promise<NotebookPage | undefined> {
  const db = await getDB();
  return db.get("pages", id);
}

/**
 * Get all pages in a section (or root if sectionId=null).
 * Sorted by order ascending.
 */
export async function getPagesInSection(
  notebookId: string,
  sectionId: string | null
): Promise<NotebookPage[]> {
  const all = await getPages(notebookId);
  return all
    .filter((p) => p.sectionId === sectionId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Search pages by title or content (case-insensitive substring).
 * Scoped to a notebook.
 */
export async function searchPages(
  notebookId: string,
  query: string
): Promise<NotebookPage[]> {
  const all = await getPages(notebookId);
  const q = query.toLowerCase().trim();
  if (!q) return all;

  return all.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
  );
}

// ============================================================
// Create
// ============================================================

/**
 * Create a new page in a notebook.
 * Auto-assigns order to be at end of siblings.
 */
export async function createPage(
  notebookId: string,
  input: CreatePageInput = {}
): Promise<NotebookPage> {
  // Find max order among siblings
  const siblings = await getPagesInSection(
    notebookId,
    input.sectionId ?? null
  );
  const maxOrder = siblings.reduce(
    (max, p) => Math.max(max, p.order ?? 0),
    0
  );

  const now = Date.now();
  const page: NotebookPage = {
    id: uuidv4(),
    notebookId,
    sectionId: input.sectionId ?? null,
    title: input.title ?? NEW_PAGE_DEFAULT_TITLE,
    content: input.content ?? NEW_PAGE_DEFAULT_CONTENT,
    blockNoteContent: input.blockNoteContent ?? null,
    frontmatter: input.frontmatter ?? null,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDB();
  await db.put("pages", page);
  await touchNotebook(notebookId);
  return page;
}

// ============================================================
// Update
// ============================================================

/**
 * Update a page. Auto-updates `updatedAt`.
 */
export async function updatePage(
  id: string,
  updates: UpdatePageInput
): Promise<NotebookPage> {
  const db = await getDB();
  const existing = await db.get("pages", id);
  if (!existing) throw new Error(`Page ${id} not found`);

  const updated: NotebookPage = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  await db.put("pages", updated);
  await touchNotebook(existing.notebookId);
  return updated;
}

/**
 * Bulk move pages to a different section (or root).
 * Used by drag-drop and multi-select operations.
 */
export async function movePages(
  pageIds: string[],
  targetSectionId: string | null
): Promise<void> {
  if (pageIds.length === 0) return;

  const db = await getDB();
  const tx = db.transaction("pages", "readwrite");
  const touchedNotebooks = new Set<string>();
  const now = Date.now();

  for (const id of pageIds) {
    const existing = await tx.store.get(id);
    if (!existing) continue;

    await tx.store.put({
      ...existing,
      sectionId: targetSectionId,
      updatedAt: now,
    });

    touchedNotebooks.add(existing.notebookId);
  }

  await tx.done;

  for (const nbId of touchedNotebooks) {
    await touchNotebook(nbId);
  }
}

/**
 * Reorder pages within their current section.
 */
export async function reorderPages(
  updates: { id: string; order: number }[]
): Promise<void> {
  if (updates.length === 0) return;

  const db = await getDB();
  const tx = db.transaction("pages", "readwrite");
  const touchedNotebooks = new Set<string>();
  const now = Date.now();

  for (const u of updates) {
    const existing = await tx.store.get(u.id);
    if (!existing) continue;

    await tx.store.put({
      ...existing,
      order: u.order,
      updatedAt: now,
    });

    touchedNotebooks.add(existing.notebookId);
  }

  await tx.done;

  for (const nbId of touchedNotebooks) {
    await touchNotebook(nbId);
  }
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a page (hard delete).
 */
export async function deletePage(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get("pages", id);
  if (!existing) return;

  await db.delete("pages", id);
  await touchNotebook(existing.notebookId);
}

/**
 * Bulk delete pages.
 */
export async function deletePages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const db = await getDB();
  const tx = db.transaction("pages", "readwrite");
  const touchedNotebooks = new Set<string>();

  for (const id of ids) {
    const existing = await tx.store.get(id);
    if (!existing) continue;
    await tx.store.delete(id);
    touchedNotebooks.add(existing.notebookId);
  }

  await tx.done;

  for (const nbId of touchedNotebooks) {
    await touchNotebook(nbId);
  }
}

/**
 * Duplicate a page (creates a copy with " (copy)" suffix).
 */
export async function duplicatePage(id: string): Promise<NotebookPage> {
  const original = await getPage(id);
  if (!original) throw new Error(`Page ${id} not found`);

  return createPage(original.notebookId, {
    title: `${original.title} (copy)`,
    content: original.content,
    blockNoteContent: original.blockNoteContent,
    sectionId: original.sectionId,
    frontmatter: original.frontmatter,
  });
}
