"use client";

/**
 * useWorkspace — selector hook for the current user's workspace.
 *
 * The workspace is fetched alongside the user profile in `useAuthStore`,
 * so this hook is purely a selector — no fetching, no extra round-trip.
 *
 * For mutations, use `useWorkspaceStore()` directly (it syncs back to
 * the auth store cache).
 *
 * Usage:
 *   const { workspace, isLoading, hasWorkspace } = useWorkspace();
 *
 *   if (!hasWorkspace) return <NoWorkspaceState />;
 *   return <div>@{workspace.username}</div>;
 */

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  canChangeUsername as canChangeUsernameUtil,
  getNextUsernameChangeDate as getNextChangeUtil,
} from "@/lib/workspace";
import type { UpdateWorkspaceInput, Workspace } from "@/types/workspace";

interface UseWorkspaceReturn {
  /** The current user's workspace, or null if not loaded / doesn't exist. */
  workspace: Workspace | null;
  /** True while the parent auth-store is still fetching. */
  isLoading: boolean;
  /** True if workspace exists (auth loaded + row present). */
  hasWorkspace: boolean;
  /** Convenience: public URL to the workspace landing page (Phase J). */
  publicUrl: string | null;
  /** True if username can be changed right now (cooldown elapsed). */
  canChangeUsername: boolean;
  /** Next date the user can change their username, or null if available now. */
  nextUsernameChangeDate: Date | null;
  /** Update workspace (proxies to workspaceStore). */
  updateWorkspace: (updates: UpdateWorkspaceInput) => Promise<Workspace>;
  /** Refetch workspace from DB. */
  refreshWorkspace: () => Promise<Workspace | null>;
  /** True while a mutation is in flight. */
  isUpdating: boolean;
}

export function useWorkspace(): UseWorkspaceReturn {
  const workspace = useAuthStore((s) => s.workspace);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasFetched = useAuthStore((s) => s.hasFetched);

  const isUpdating = useWorkspaceStore((s) => s.isUpdating);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const refreshWorkspace = useWorkspaceStore((s) => s.refreshWorkspace);

  // Derived values memoized per workspace
  const derived = useMemo(() => {
    if (!workspace) {
      return {
        publicUrl: null,
        canChangeUsername: false,
        nextUsernameChangeDate: null,
      };
    }

    return {
      publicUrl: buildPublicUrl(workspace.username),
      canChangeUsername: canChangeUsernameUtil(
        workspace.username_last_changed_at
      ),
      nextUsernameChangeDate: getNextChangeUtil(
        workspace.username_last_changed_at
      ),
    };
  }, [workspace]);

  return {
    workspace,
    isLoading: isLoading || !hasFetched,
    hasWorkspace: workspace !== null,
    ...derived,
    updateWorkspace,
    refreshWorkspace,
    isUpdating,
  };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Build the public-facing URL for a workspace.
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise relative path.
 */
function buildPublicUrl(username: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  return `${baseUrl}/@${username}`;
}
