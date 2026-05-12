/**
 * Server-side workspace fetch — for SSR routes.
 *
 * Uses the server Supabase client (cookies-aware). Returns null if
 * the workspace doesn't exist. Anonymous reads are allowed by RLS.
 */

import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/types/workspace";

export interface WorkspaceWithPublishedList {
  workspace: Workspace;
  publishedNotebooks: PublishedNotebookSummary[];
}

export interface PublishedNotebookSummary {
  id: string;
  notebook_slug: string;
  notebook_name: string;
  notebook_icon: string | null;
  notebook_description: string | null;
  published_at: string;
  updated_at: string;
  pageCount: number;
}

/**
 * Fetch a workspace by its public username.
 * Returns null if the username doesn't exist.
 */
export async function fetchWorkspaceByUsername(
  username: string
): Promise<Workspace | null> {
  const supabase = await createClient();
  const normalized = username.trim().toLowerCase();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("username", normalized)
    .maybeSingle();

  if (error) {
    console.error("[fetchWorkspaceByUsername] error:", error);
    return null;
  }

  return (data as Workspace | null) ?? null;
}

/**
 * Fetch a workspace + the list of its published notebooks.
 * Used by the `/@[username]` workspace landing page.
 */
export async function fetchWorkspaceWithPublishedList(
  username: string
): Promise<WorkspaceWithPublishedList | null> {
  const workspace = await fetchWorkspaceByUsername(username);
  if (!workspace) return null;

  const supabase = await createClient();

  // Fetch published notebooks (only summary fields — not the full snapshot)
  const { data, error } = await supabase
    .from("notebook_publishes")
    .select(
      "id, notebook_slug, notebook_name, notebook_icon, notebook_description, published_at, updated_at, pages"
    )
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[fetchWorkspaceWithPublishedList] error:", error);
    return { workspace, publishedNotebooks: [] };
  }

  const publishedNotebooks: PublishedNotebookSummary[] = (data ?? []).map(
    (row) => ({
      id: row.id,
      notebook_slug: row.notebook_slug,
      notebook_name: row.notebook_name,
      notebook_icon: row.notebook_icon,
      notebook_description: row.notebook_description,
      published_at: row.published_at,
      updated_at: row.updated_at,
      // pages is JSONB array — count length without parsing the whole thing client-side
      pageCount: Array.isArray(row.pages) ? row.pages.length : 0,
    })
  );

  return { workspace, publishedNotebooks };
}
