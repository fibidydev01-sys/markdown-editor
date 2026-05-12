/**
 * Unpublisher — deletes the published snapshot via API.
 *
 * The notebook itself (in IndexedDB) stays. Only the public-facing
 * Supabase row is removed.
 */

import { PublishError } from "./publisher";
import type { UnpublishResult, PublishErrorResponse } from "@/types/publish";

/**
 * Unpublish a notebook by its local (IndexedDB) id.
 *
 * Throws PublishError on failure — caller should catch and toast.
 */
export async function unpublishNotebook(
  notebookLocalId: string
): Promise<UnpublishResult> {
  const response = await fetch("/api/notebooks/unpublish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notebookLocalId }),
  });

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
    throw new PublishError(errorData.error, errorData.code);
  }

  return (await response.json()) as UnpublishResult;
}
