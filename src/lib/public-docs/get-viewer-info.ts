/**
 * Server-side helper: determine the current viewer's relationship to
 * a workspace (anonymous / authenticated / owner).
 *
 * Used by SSR routes to render the auth-aware header without flashing.
 */

import { createClient } from "@/lib/supabase/server";

export interface ViewerInfo {
  isAuthenticated: boolean;
  isOwner: boolean;
  userId: string | null;
}

/**
 * Check viewer's relationship to a given workspace user_id.
 *
 * @param workspaceUserId - the user_id field of the workspace being viewed
 */
export async function getViewerInfo(
  workspaceUserId: string
): Promise<ViewerInfo> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      isOwner: false,
      userId: null,
    };
  }

  return {
    isAuthenticated: true,
    isOwner: user.id === workspaceUserId,
    userId: user.id,
  };
}
