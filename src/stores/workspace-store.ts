/**
 * Workspace store — Zustand selector layer.
 *
 * IMPORTANT: workspace data lives in `useAuthStore` (fetched alongside
 * the user profile in a single round-trip). This store exists as a
 * convenience selector + provides imperative update helpers that keep
 * the auth-store cache in sync after a mutation.
 *
 * If you just need to READ the workspace, prefer `useWorkspace()` hook
 * which is more idiomatic. This store is for components that need to
 * trigger updates and have the change reflected app-wide instantly.
 */

import { create } from "zustand";
import { useAuthStore } from "./auth-store";
import * as workspaceLib from "@/lib/workspace";
import type {
  UpdateWorkspaceInput,
  Workspace,
} from "@/types/workspace";

interface WorkspaceStoreState {
  /** True while a mutation is in flight. */
  isUpdating: boolean;
  /** Last error from an update, cleared on next attempt. */
  updateError: string | null;

  /**
   * Update the current workspace + sync auth-store cache.
   * Throws on error (so caller can toast / show inline).
   */
  updateWorkspace: (updates: UpdateWorkspaceInput) => Promise<Workspace>;

  /** Refetch workspace from DB and update auth-store cache. */
  refreshWorkspace: () => Promise<Workspace | null>;

  /** Clear error state. */
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  isUpdating: false,
  updateError: null,

  updateWorkspace: async (updates) => {
    const authState = useAuthStore.getState();
    const workspace = authState.workspace;

    if (!workspace) {
      const err = "No workspace found";
      set({ updateError: err });
      throw new Error(err);
    }

    set({ isUpdating: true, updateError: null });

    try {
      const updated = await workspaceLib.updateWorkspace(
        workspace.id,
        updates
      );

      // Sync the auth-store cache so all consumers see the new value
      useAuthStore.setState({ workspace: updated });

      set({ isUpdating: false });
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update workspace";
      set({ isUpdating: false, updateError: message });
      throw err;
    }
  },

  refreshWorkspace: async () => {
    const fresh = await workspaceLib.getCurrentUserWorkspace();
    useAuthStore.setState({ workspace: fresh });
    return fresh;
  },

  clearError: () => set({ updateError: null }),
}));
