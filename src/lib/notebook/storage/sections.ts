/**
 * Section CRUD operations (folders inside a notebook).
 *
 * Sections support nesting via parentId.
 * Sections have order field for manual sorting within their parent level.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB } from "./db";
import { touchNotebook } from "./notebooks";
import type {
  CreateSectionInput,
  NotebookSection,
  ReorderInput,
  UpdateSectionInput,
} from "@/types/notebook";

// ============================================================
// Read
// ============================================================

/**
 * Get all sections in a notebook (flat list, unsorted).
 * For tree building, use `buildTree` from utils/sort.ts.
 */
export async function getSections(
  notebookId: string
): Promise<NotebookSection[]> {
  const db = await getDB();
  return db.getAllFromIndex("sections", "by-notebook", notebookId);
}

/**
 * Get a single section by ID.
 */
export async function getSection(
  id: string
): Promise<NotebookSection | undefined> {
  const db = await getDB();
  return db.get("sections", id);
}

/**
 * Get direct child sections of a parent section.
 * Pass null for root-level sections in a notebook.
 */
export async function getChildSections(
  notebookId: string,
  parentId: string | null
): Promise<NotebookSection[]> {
  const all = await getSections(notebookId);
  return all
    .filter((s) => s.parentId === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// ============================================================
// Create
// ============================================================

/**
 * Create a new section in a notebook.
 * Auto-assigns order to be at the end of siblings.
 */
export async function createSection(
  notebookId: string,
  input: CreateSectionInput
): Promise<NotebookSection> {
  // Find max order among siblings
  const siblings = await getChildSections(notebookId, input.parentId ?? null);
  const maxOrder = siblings.reduce(
    (max, s) => Math.max(max, s.order ?? 0),
    0
  );

  const section: NotebookSection = {
    id: uuidv4(),
    notebookId,
    name: input.name,
    parentId: input.parentId ?? null,
    order: maxOrder + 1,
    createdAt: Date.now(),
  };

  const db = await getDB();
  await db.put("sections", section);
  await touchNotebook(notebookId);
  return section;
}

// ============================================================
// Update
// ============================================================

/**
 * Update a section (rename, move, reorder).
 */
export async function updateSection(
  id: string,
  updates: UpdateSectionInput
): Promise<NotebookSection> {
  const db = await getDB();
  const existing = await db.get("sections", id);
  if (!existing) throw new Error(`Section ${id} not found`);

  // Prevent circular references — can't make a section its own descendant
  if (
    updates.parentId !== undefined &&
    updates.parentId !== null &&
    updates.parentId !== existing.parentId
  ) {
    await assertNotDescendant(id, updates.parentId);
  }

  const updated: NotebookSection = {
    ...existing,
    ...updates,
  };

  await db.put("sections", updated);
  await touchNotebook(existing.notebookId);
  return updated;
}

/**
 * Bulk reorder sections (and optionally move them to a new parent).
 * Used by drag-drop UI.
 */
export async function reorderSections(
  updates: ReorderInput[]
): Promise<void> {
  if (updates.length === 0) return;

  const db = await getDB();
  const tx = db.transaction("sections", "readwrite");
  const touchedNotebooks = new Set<string>();

  for (const u of updates) {
    const existing = await tx.store.get(u.id);
    if (!existing) continue;

    const next: NotebookSection = {
      ...existing,
      order: u.order,
      ...(u.parentId !== undefined ? { parentId: u.parentId } : {}),
    };

    await tx.store.put(next);
    touchedNotebooks.add(existing.notebookId);
  }

  await tx.done;

  // Touch all affected notebooks
  for (const nbId of touchedNotebooks) {
    await touchNotebook(nbId);
  }
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a section. Also deletes all child sections AND
 * orphans all pages inside (moves them to root or deletes them
 * based on `pageStrategy`).
 *
 * @param id - section to delete
 * @param pageStrategy - 'orphan' (move to root) or 'delete'
 */
export async function deleteSection(
  id: string,
  pageStrategy: "orphan" | "delete" = "orphan"
): Promise<void> {
  const db = await getDB();
  const section = await db.get("sections", id);
  if (!section) return;

  const notebookId = section.notebookId;

  // Recursively collect all descendant section IDs
  const allSections = await getSections(notebookId);
  const toDelete = collectDescendants(id, allSections);

  const tx = db.transaction(["sections", "pages"], "readwrite");

  // Handle pages in deleted sections
  for (const sectionId of toDelete) {
    const pages = await tx
      .objectStore("pages")
      .index("by-section")
      .getAll(sectionId);

    for (const page of pages) {
      if (pageStrategy === "delete") {
        await tx.objectStore("pages").delete(page.id);
      } else {
        // Orphan: move to root level
        await tx.objectStore("pages").put({
          ...page,
          sectionId: null,
          updatedAt: Date.now(),
        });
      }
    }

    await tx.objectStore("sections").delete(sectionId);
  }

  await tx.done;
  await touchNotebook(notebookId);
}

// ============================================================
// Helpers
// ============================================================

/**
 * Collect all descendant section IDs (including the section itself).
 */
function collectDescendants(
  rootId: string,
  allSections: NotebookSection[]
): string[] {
  const result: string[] = [rootId];
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = allSections.filter((s) => s.parentId === current);
    for (const child of children) {
      result.push(child.id);
      queue.push(child.id);
    }
  }

  return result;
}

/**
 * Throw if `newParentId` is a descendant of `sectionId` (would create cycle).
 */
async function assertNotDescendant(
  sectionId: string,
  newParentId: string
): Promise<void> {
  if (sectionId === newParentId) {
    throw new Error("Section cannot be its own parent");
  }

  const db = await getDB();
  const target = await db.get("sections", newParentId);
  if (!target) return;

  const allSections = await getSections(target.notebookId);
  const descendants = collectDescendants(sectionId, allSections);

  if (descendants.includes(newParentId)) {
    throw new Error("Cannot move section into its own descendant");
  }
}
