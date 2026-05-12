/**
 * Publish status — check if a local notebook is currently published.
 *
 * Used by the editor to:
 *   - Show "Published" badge
 *   - Display public URL
 *   - Decide whether the publish modal pre-fills slug from existing pub
 */

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublishStatus } from "@/types/publish";

// ============================================================
// Get publish status for a single notebook
// ============================================================

/**
 * Check if a specific notebook (by IndexedDB id) is published.
 * Returns publish info if yes, or `isPublished: false` if no.
 *
 * Implementation note: reads from `useAuthStore.getState().workspace`
 * to avoid a separate workspace fetch. If workspace isn't loaded yet,
 * returns "not published" — caller should retry after auth resolves.
 */
export async function getPublishStatus(
  notebookLocalId: string
): Promise<PublishStatus> {
  const workspace = useAuthStore.getState().workspace;

  if (!workspace) {
    return {
      isPublished: false,
      publishId: null,
      publishedAt: null,
      updatedAt: null,
      publicUrl: null,
      notebookSlug: null,
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("notebook_publishes")
    .select("id, notebook_slug, published_at, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("notebook_local_id", notebookLocalId)
    .maybeSingle();

  if (error) {
    console.error("[getPublishStatus] error:", error);
    return {
      isPublished: false,
      publishId: null,
      publishedAt: null,
      updatedAt: null,
      publicUrl: null,
      notebookSlug: null,
    };
  }

  if (!data) {
    return {
      isPublished: false,
      publishId: null,
      publishedAt: null,
      updatedAt: null,
      publicUrl: null,
      notebookSlug: null,
    };
  }

  return {
    isPublished: true,
    publishId: data.id,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    publicUrl: buildPublicUrl(workspace.username, data.notebook_slug),
    notebookSlug: data.notebook_slug,
  };
}

// ============================================================
// Get publish status for multiple notebooks (dashboard badges)
// ============================================================

/**
 * Get publish status for many notebooks at once.
 * Returns a Map keyed by notebookLocalId.
 * Notebooks NOT in the map are not published.
 */
export async function getPublishStatusMap(
  notebookLocalIds: string[]
): Promise<Map<string, PublishStatus>> {
  const result = new Map<string, PublishStatus>();

  if (notebookLocalIds.length === 0) return result;

  const workspace = useAuthStore.getState().workspace;
  if (!workspace) return result;

  const supabase = createClient();

  const { data, error } = await supabase
    .from("notebook_publishes")
    .select("id, notebook_local_id, notebook_slug, published_at, updated_at")
    .eq("workspace_id", workspace.id)
    .in("notebook_local_id", notebookLocalIds);

  if (error) {
    console.error("[getPublishStatusMap] error:", error);
    return result;
  }

  for (const row of data ?? []) {
    result.set(row.notebook_local_id, {
      isPublished: true,
      publishId: row.id,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      publicUrl: buildPublicUrl(workspace.username, row.notebook_slug),
      notebookSlug: row.notebook_slug,
    });
  }

  return result;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Build a public URL for a published notebook.
 * Uses window.location.origin client-side, NEXT_PUBLIC_APP_URL server-side.
 */
export function buildPublicUrl(username: string, slug: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  return `${baseUrl}/@${username}/${slug}`;
}
