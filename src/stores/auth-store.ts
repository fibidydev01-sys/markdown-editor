/**
 * Auth store — Zustand state for the authenticated user.
 *
 * UPDATED in Phase H:
 *   - Now fetches the user's workspace alongside the profile in a single
 *     round-trip (joined query on user_profiles + workspaces).
 *   - Exposes `workspace` field in state. Consumers can use `useWorkspace()`
 *     hook for a clean selector, or read `state.workspace` directly.
 */

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import type { Workspace } from "@/types/workspace";

interface AuthState {
  user: UserProfile | null;
  workspace: Workspace | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasFetched: boolean;
  fetchPromise: Promise<void> | null;

  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  workspace: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  hasFetched: false,
  fetchPromise: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  fetchUser: async () => {
    const state = get();

    if (state.hasFetched && state.user) return;
    if (state.fetchPromise) return state.fetchPromise;
    if (state.isLoading) return;

    const supabase = createClient();

    const promise = (async () => {
      try {
        set({ isLoading: true });

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          set({
            ...initialState,
            hasFetched: true,
          });
          return;
        }

        // ── Fetch profile + workspace in parallel ──
        // Two queries instead of a join because:
        //   1. user_profiles → fetched with is_active filter
        //   2. workspaces    → may not exist yet for old users created
        //                       before Phase H migration ran
        const [profileResult, workspaceResult] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .eq("is_active", true)
            .single(),
          supabase
            .from("workspaces")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle(),
        ]);

        const { data: profile, error: profileError } = profileResult;
        const { data: workspace, error: workspaceError } = workspaceResult;

        if (profileError || !profile) {
          set({
            ...initialState,
            hasFetched: true,
          });
          return;
        }

        // Workspace might be null for users created before Phase H —
        // that's OK, the settings page will surface this gracefully.
        if (workspaceError) {
          console.warn(
            "[fetchUser] workspace fetch error (non-fatal):",
            workspaceError
          );
        }

        set({
          user: profile,
          workspace: (workspace as Workspace | null) ?? null,
          isAuthenticated: true,
          isAdmin: profile.role === "super_admin",
          isLoading: false,
          hasFetched: true,
          fetchPromise: null,
        });
      } catch (err) {
        console.error("fetchUser error:", err);
        set({
          ...initialState,
          hasFetched: true,
        });
      }
    })();

    // Set promise BEFORE async resolve — fix race condition
    set({ fetchPromise: promise });
    return promise;
  },

  logout: async () => {
    const supabase = createClient();

    // Clear state first, then signOut
    set({ ...initialState });

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  },

  reset: () => set({ ...initialState }),
}));
