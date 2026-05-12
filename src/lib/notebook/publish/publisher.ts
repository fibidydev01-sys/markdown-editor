/**
 * Publisher — builds the snapshot from IndexedDB data and posts it
 * to the /api/notebooks/publish endpoint.
 *
 * The actual DB write happens server-side (API route uses the user's
 * Supabase session via cookies, so RLS handles ownership). This module
 * only handles:
 *   1. Loading the local notebook data
 *   2. Building the PublishInput payload
 *   3. POSTing to the API
 *   4. Surfacing errors cleanly
 */

import {
  getNotebook,
  getSections,
  getPages,
  getTags,
} from "@/lib/notebook/storage";
import type {
  PublishInput,
  PublishResult,
  PublishErrorResponse,
} from "@/types/publish";

// ============================================================
// Main publish function
// ============================================================

export interface PublishOptions {
  notebookId: string;
  slug: string;
}

export class PublishError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PublishError";
  }
}

/**
 * Publish a notebook: build snapshot from IndexedDB + upload via API.
 *
 * Throws PublishError on failure — caller should catch and toast.
 */
export async function publishNotebook(
  options: PublishOptions
): Promise<PublishResult> {
  const { notebookId, slug } = options;

  // 1. Load notebook + children from IndexedDB
  const notebook = await getNotebook(notebookId);
  if (!notebook) {
    throw new PublishError("Notebook not found", "INVALID_INPUT");
  }

  const [sections, pages, tagsAll] = await Promise.all([
    getSections(notebookId),
    getPages(notebookId),
    getTags(),
  ]);

  // Filter tags to only those used by this notebook
  const tags = tagsAll.filter((t) => notebook.tagIds.includes(t.id));

  // 2. Build payload
  const payload: PublishInput = {
    notebookLocalId: notebook.id,
    notebookSlug: slug.trim().toLowerCase(),
    notebookName: notebook.name,
    notebookIcon: notebook.icon,
    notebookDescription: notebook.description,
    sections,
    pages,
    tags,
  };

  // 3. POST to API
  const response = await fetch("/api/notebooks/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // 4. Handle errors
  if (!response.ok) {
    let errorData: PublishErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      throw new PublishError(
        `Server error (${response.status})`,
        "INTERNAL_ERROR"
      );
    }

    throw new PublishError(errorData.error, errorData.code, {
      currentCount: errorData.currentCount,
      limit: errorData.limit,
    });
  }

  return (await response.json()) as PublishResult;
}
