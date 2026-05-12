/**
 * Notebook tags CRUD operations.
 *
 * Tags categorize notebooks (e.g. "Personal", "Work", "Archive").
 * NOT to be confused with per-page tags in the original Markpad.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB } from "./db";
import { DEFAULT_TAG_COLORS } from "@/constants/notebook";
import type { Notebook, NotebookTag } from "@/types/notebook";

// ============================================================
// Read
// ============================================================

/**
 * Get all tags, sorted alphabetically.
 */
export async function getTags(): Promise<NotebookTag[]> {
  const db = await getDB();
  const all = await db.getAll("tags");
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single tag by ID.
 */
export async function getTag(id: string): Promise<NotebookTag | undefined> {
  const db = await getDB();
  return db.get("tags", id);
}

// ============================================================
// Create
// ============================================================

/**
 * Create a new tag. Auto-assigns a color from the default palette
 * if not provided.
 */
export async function createTag(
  name: string,
  color?: string
): Promise<NotebookTag> {
  // Pick a random default color if none provided
  const finalColor =
    color ??
    DEFAULT_TAG_COLORS[
      Math.floor(Math.random() * DEFAULT_TAG_COLORS.length)
    ];

  const tag: NotebookTag = {
    id: uuidv4(),
    name: name.trim(),
    color: finalColor,
  };

  const db = await getDB();
  await db.put("tags", tag);
  return tag;
}

// ============================================================
// Update
// ============================================================

/**
 * Update a tag (rename or recolor).
 */
export async function updateTag(
  id: string,
  updates: Partial<Pick<NotebookTag, "name" | "color">>
): Promise<NotebookTag> {
  const db = await getDB();
  const existing = await db.get("tags", id);
  if (!existing) throw new Error(`Tag ${id} not found`);

  const updated: NotebookTag = {
    ...existing,
    ...updates,
  };

  await db.put("tags", updated);
  return updated;
}

// ============================================================
// Delete
// ============================================================

/**
 * Delete a tag. Also removes the tag from all notebooks that reference it.
 */
export async function deleteTag(id: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(["tags", "notebooks"], "readwrite");

  // Remove tag reference from all notebooks
  const notebooks = await tx.objectStore("notebooks").getAll();
  for (const nb of notebooks) {
    if (nb.tagIds.includes(id)) {
      const updated: Notebook = {
        ...nb,
        tagIds: nb.tagIds.filter((t) => t !== id),
        updatedAt: Date.now(),
      };
      await tx.objectStore("notebooks").put(updated);
    }
  }

  await tx.objectStore("tags").delete(id);
  await tx.done;
}

// ============================================================
// Queries
// ============================================================

/**
 * Get all notebooks that have a specific tag.
 */
export async function getNotebooksByTag(
  tagId: string
): Promise<Notebook[]> {
  const db = await getDB();
  const all = await db.getAll("notebooks");
  return all.filter((nb) => nb.tagIds.includes(tagId));
}
