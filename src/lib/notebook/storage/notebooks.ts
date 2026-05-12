/**
 * Notebook CRUD operations.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB } from "./db";
import { slugify, makeUniqueSlug } from "../utils/slugify";
import { DEFAULT_NOTEBOOK_ICON } from "@/constants/notebook";
import type {
  CreateNotebookInput,
  Notebook,
  UpdateNotebookInput,
} from "@/types/notebook";

// ============================================================
// Read
// ============================================================

/**
 * Get all notebooks, sorted by updatedAt descending.
 */
export async function getNotebooks(): Promise<Notebook[]> {
  const db = await getDB();
  const all = await db.getAll("notebooks");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Get a single notebook by ID. Returns undefined if not found.
 */
export async function getNotebook(id: string): Promise<Notebook | undefined> {
  const db = await getDB();
  return db.get("notebooks", id);
}

/**
 * Find a notebook by slug. Used for future publish URLs.
 */
export async function getNotebookBySlug(
  slug: string
): Promise<Notebook | undefined> {
  const all = await getNotebooks();
  return all.find((nb) => nb.slug === slug);
}

// ============================================================
// Create
// ============================================================

/**
 * Create a new notebook. Auto-generates slug from name,
 * makes it unique if conflict.
 */
export async function createNotebook(
  input: CreateNotebookInput
): Promise<Notebook> {
  const existing = await getNotebooks();
  const existingSlugs = existing.map((nb) => nb.slug);
  const baseSlug = slugify(input.name) || "notebook";
  const slug = makeUniqueSlug(baseSlug, existingSlugs);

  const now = Date.now();
  const notebook: Notebook = {
    id: uuidv4(),
    name: input.name,
    slug,
    description: input.description ?? null,
    icon: input.icon ?? DEFAULT_NOTEBOOK_ICON,
    tagIds: input.tagIds ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDB();
  await db.put("notebooks", notebook);
  return notebook;
}

// ============================================================
// Update
// ============================================================

/**
 * Update a notebook. Updates `updatedAt` automatically.
 * If `name` is changed, slug is NOT auto-regenerated (slugs are stable).
 * Use `slug` field explicitly if you want to change it.
 */
export async function updateNotebook(
  id: string,
  updates: UpdateNotebookInput
): Promise<Notebook> {
  const db = await getDB();
  const existing = await db.get("notebooks", id);
  if (!existing) throw new Error(`Notebook ${id} not found`);

  // If slug is explicitly provided, ensure it's unique
  let nextSlug = existing.slug;
  if (updates.slug !== undefined && updates.slug !== existing.slug) {
    const all = await getNotebooks();
    const otherSlugs = all
      .filter((nb) => nb.id !== id)
      .map((nb) => nb.slug);
    nextSlug = makeUniqueSlug(slugify(updates.slug) || "notebook", otherSlugs);
  }

  const updated: Notebook = {
    ...existing,
    ...updates,
    slug: nextSlug,
    updatedAt: Date.now(),
  };

  await db.put("notebooks", updated);
  return updated;
}

/**
 * Touch a notebook (update its updatedAt without other changes).
 * Used when sections/pages inside change.
 */
export async function touchNotebook(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get("notebooks", id);
  if (!existing) return;
  await db.put("notebooks", {
    ...existing,
    updatedAt: Date.now(),
  });
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a notebook AND all its sections and pages.
 * This is a hard delete — no undo.
 */
export async function deleteNotebook(id: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(
    ["notebooks", "sections", "pages"],
    "readwrite"
  );

  // Delete all pages in this notebook
  const pageIds = await tx
    .objectStore("pages")
    .index("by-notebook")
    .getAllKeys(id);
  for (const pageId of pageIds) {
    await tx.objectStore("pages").delete(pageId);
  }

  // Delete all sections in this notebook
  const sectionIds = await tx
    .objectStore("sections")
    .index("by-notebook")
    .getAllKeys(id);
  for (const sectionId of sectionIds) {
    await tx.objectStore("sections").delete(sectionId);
  }

  // Delete the notebook
  await tx.objectStore("notebooks").delete(id);

  await tx.done;
}

// ============================================================
// Counts (for UI badges)
// ============================================================

/**
 * Get count of pages in a notebook.
 */
export async function getNotebookPageCount(
  notebookId: string
): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("pages", "by-notebook", notebookId);
}

/**
 * Get count of sections in a notebook.
 */
export async function getNotebookSectionCount(
  notebookId: string
): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("sections", "by-notebook", notebookId);
}
