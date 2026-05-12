import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  UnpublishInput,
  UnpublishResult,
  PublishErrorResponse,
  PublishErrorCode,
} from "@/types/publish";

/**
 * POST /api/notebooks/unpublish
 *
 * Deletes a published notebook snapshot.
 * The notebook itself (in user's IndexedDB) is untouched.
 *
 * Body: { notebookLocalId: string }
 *
 * RLS handles ownership — the DELETE policy only allows the workspace
 * owner to delete their own publishes.
 *
 * ───────────────────────────────────────────────────────────
 * CACHE INVALIDATION (Phase Fix):
 * ───────────────────────────────────────────────────────────
 * Without revalidatePath, unpublished URLs would still serve cached
 * HTML until the cache naturally expires. Worse: cached HTML mismatches
 * fresh server render (404), causing hydration errors at the client.
 *
 * On unpublish we:
 *   1. Read the slug BEFORE delete (for revalidation)
 *   2. Delete the row
 *   3. revalidatePath() on workspace landing AND the deleted notebook URL
 *
 * After this, accessing the URL returns 404 cleanly (no hydration error).
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // ── 2. Parse + validate input ────────────────────────
    let body: UnpublishInput;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", "INVALID_INPUT", 400);
    }

    if (
      !body ||
      typeof body.notebookLocalId !== "string" ||
      !body.notebookLocalId.trim()
    ) {
      return errorResponse(
        "notebookLocalId is required",
        "INVALID_INPUT",
        400
      );
    }

    // ── 3. Resolve workspace ─────────────────────────────
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wsError || !workspace) {
      return errorResponse(
        "No workspace found for this user",
        "NO_WORKSPACE",
        404
      );
    }

    // ── 4. Lookup slug BEFORE delete (for revalidation) ──
    // If row doesn't exist, we still return success (idempotent),
    // but skip revalidation for that specific slug.
    const { data: existing } = await supabase
      .from("notebook_publishes")
      .select("notebook_slug")
      .eq("workspace_id", workspace.id)
      .eq("notebook_local_id", body.notebookLocalId)
      .maybeSingle();

    const slugToInvalidate = existing?.notebook_slug ?? null;

    // ── 5. Delete — RLS will enforce ownership ───────────
    const { error: deleteError } = await supabase
      .from("notebook_publishes")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("notebook_local_id", body.notebookLocalId);

    if (deleteError) {
      console.error("[unpublish] delete error:", deleteError);
      return errorResponse(
        "Failed to unpublish notebook",
        "INTERNAL_ERROR",
        500
      );
    }

    // ── 6. Invalidate Next.js cache ──────────────────────
    // Workspace landing (published list changed)
    revalidatePath(`/@${workspace.username}`);
    // The notebook URL (now should 404)
    // "layout" mode invalidates this path AND all nested page routes
    if (slugToInvalidate) {
      revalidatePath(
        `/@${workspace.username}/${slugToInvalidate}`,
        "layout"
      );
    }

    const result: UnpublishResult = { success: true };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[unpublish] unexpected error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// ============================================================
// Error response helper
// ============================================================

function errorResponse(
  message: string,
  code: PublishErrorCode,
  status: number
): NextResponse {
  const body: PublishErrorResponse = { error: message, code };
  return NextResponse.json(body, { status });
}