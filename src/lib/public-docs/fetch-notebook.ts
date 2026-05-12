/**
 * Server-side notebook fetch — for SSR routes.
 *
 * Uses the joined view `published_notebooks_with_workspace` from Phase I
 * migration to avoid a second query for workspace info.
 */

import { createClient } from "@/lib/supabase/server";
import type { PublishedNotebookWithWorkspace } from "@/types/publish";

/**
 * Fetch a published notebook by (username, slug).
 * Returns null if not found.
 */
export async function fetchPublishedNotebook(
  username: string,
  slug: string
): Promise<PublishedNotebookWithWorkspace | null> {
  const supabase = await createClient();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();

  const { data, error } = await supabase
    .from("published_notebooks_with_workspace")
    .select("*")
    .eq("username", normalizedUsername)
    .eq("notebook_slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    console.error("[fetchPublishedNotebook] error:", error);
    return null;
  }

  return (data as PublishedNotebookWithWorkspace | null) ?? null;
}
