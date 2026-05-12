/**
 * Workspace storage client.
 *
 * All workspace operations go through Supabase. The workspace row is
 * auto-created on signup via a DB trigger, so we don't need a `create`
 * function client-side.
 */

import { createClient } from "@/lib/supabase/client";
import { canChangeUsername } from "./username-validator";
import type { UpdateDto } from "@/types/database";
import type {
  UpdateWorkspaceInput,
  Workspace,
} from "@/types/workspace";

// ============================================================
// Read
// ============================================================

/**
 * Get the workspace for the currently authenticated user.
 * Returns null if no user is logged in OR no workspace row exists yet.
 */
export async function getCurrentUserWorkspace(): Promise<Workspace | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentUserWorkspace] error:", error);
    return null;
  }

  return data as Workspace | null;
}

/**
 * Get workspace by user_id (admin / server use).
 */
export async function getWorkspaceByUserId(
  userId: string
): Promise<Workspace | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getWorkspaceByUserId] error:", error);
    return null;
  }

  return data as Workspace | null;
}

/**
 * Get workspace by username (used by public docs routes in Phase J).
 */
export async function getWorkspaceByUsername(
  username: string
): Promise<Workspace | null> {
  const supabase = createClient();
  const normalized = username.trim().toLowerCase();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("username", normalized)
    .maybeSingle();

  if (error) {
    console.error("[getWorkspaceByUsername] error:", error);
    return null;
  }

  return data as Workspace | null;
}

// ============================================================
// Update
// ============================================================

/**
 * Update the current user's workspace.
 *
 * Enforces the 30-day cooldown for username changes client-side
 * (the DB doesn't enforce this — UI does).
 *
 * Throws on error so callers can show a toast.
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: UpdateWorkspaceInput
): Promise<Workspace> {
  const supabase = createClient();

  // If changing username, enforce cooldown
  if (updates.username !== undefined) {
    const { data: current, error: fetchError } = await supabase
      .from("workspaces")
      .select("username, username_last_changed_at")
      .eq("id", workspaceId)
      .single();

    if (fetchError || !current) {
      throw new Error("Workspace not found");
    }

    // Only enforce cooldown if username is actually changing
    const newUsername = updates.username.trim().toLowerCase();
    if (newUsername !== current.username) {
      if (!canChangeUsername(current.username_last_changed_at)) {
        throw new Error(
          "Username can only be changed once every 30 days"
        );
      }
    }
  }

  // Build update payload — typed to match the workspaces Update shape so
  // Supabase's overload resolution accepts it.
  const payload: UpdateDto<"workspaces"> = {};

  if (updates.username !== undefined) {
    payload.username = updates.username.trim().toLowerCase();
    payload.username_last_changed_at = new Date().toISOString();
  }

  if (updates.display_name !== undefined) {
    payload.display_name = updates.display_name?.trim() || null;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No fields to update");
  }

  const { data, error } = await supabase
    .from("workspaces")
    .update(payload)
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    // Surface DB constraint violations with a friendlier message
    if (error.code === "23505") {
      throw new Error("This username is already taken");
    }
    if (error.code === "23514") {
      throw new Error(
        "Invalid username format (3-30 chars, lowercase, alphanumeric, hyphens)"
      );
    }
    throw new Error(error.message || "Failed to update workspace");
  }

  return data as Workspace;
}