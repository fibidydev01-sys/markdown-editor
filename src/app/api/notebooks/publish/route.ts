import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type {
  PublishInput,
  PublishResult,
  PublishErrorResponse,
  PublishErrorCode,
} from "@/types/publish";
import { PUBLISH_LIMITS } from "@/types/publish";

/**
 * POST /api/notebooks/publish
 *
 * Publishes a notebook snapshot to Supabase.
 *
 * Flow:
 *   1. Auth check (session cookie)
 *   2. Validate input
 *   3. Resolve workspace
 *   4. Check slug format (DB will also enforce via CHECK constraint)
 *   5. Free tier enforcement (only for NEW publishes, not re-publishes)
 *   6. Upsert by (workspace_id, notebook_local_id)
 *   7. Invalidate Next.js cache for affected paths
 *   8. Return public URL
 *
 * ───────────────────────────────────────────────────────────
 * CACHE INVALIDATION (Phase Fix):
 * ───────────────────────────────────────────────────────────
 * Public docs pages are server-rendered and cached by Next.js. Without
 * explicit invalidation, re-publishes don't show updated content until
 * the cache expires.
 *
 * On every publish we invalidate:
 *   - /@username                  (workspace landing — published list changes)
 *   - /@username/<new-slug>       (new notebook URL)
 *   - /@username/<old-slug>       (only if slug changed — old URL must 404)
 *
 * Strategy: uses user's authenticated Supabase client (RLS-backed) instead
 * of supabaseAdmin. RLS policies on notebook_publishes already enforce
 * workspace ownership, so we don't need to re-implement that guard here.
 */

const SLUG_FORMAT_REGEX = /^[a-z0-9-]{1,100}$/;

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
    let body: PublishInput;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", "INVALID_INPUT", 400);
    }

    const validationError = validatePublishInput(body);
    if (validationError) {
      return errorResponse(validationError, "INVALID_INPUT", 400);
    }

    const normalizedSlug = body.notebookSlug.trim().toLowerCase();
    if (!SLUG_FORMAT_REGEX.test(normalizedSlug)) {
      return errorResponse(
        "Slug must be 1-100 chars, lowercase letters, numbers, and hyphens only",
        "INVALID_SLUG",
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

    // ── 4. Check if this is a re-publish ─────────────────
    const { data: existing } = await supabase
      .from("notebook_publishes")
      .select("id, notebook_slug")
      .eq("workspace_id", workspace.id)
      .eq("notebook_local_id", body.notebookLocalId)
      .maybeSingle();

    const isUpdate = existing !== null;
    const oldSlug = existing?.notebook_slug ?? null;
    const slugChanged = oldSlug !== null && oldSlug !== normalizedSlug;

    // ── 5. Free tier enforcement (only for NEW publishes) ─
    if (!isUpdate) {
      const hasAccess = await checkPaidOrTrialAccess(supabase, user.id);

      if (!hasAccess) {
        const { count, error: countError } = await supabase
          .from("notebook_publishes")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);

        if (countError) {
          console.error("[publish] count error:", countError);
          return errorResponse(
            "Failed to check publish quota",
            "INTERNAL_ERROR",
            500
          );
        }

        const currentCount = count ?? 0;
        const limit = PUBLISH_LIMITS.FREE_MAX_PUBLISHED_NOTEBOOKS;

        if (currentCount >= limit) {
          return errorResponse(
            `Free tier allows ${limit} published notebook${limit === 1 ? "" : "s"
            }. Upgrade to publish more.`,
            "FREE_TIER_LIMIT",
            402,
            { currentCount, limit }
          );
        }
      }
    }

    // ── 6. Check slug uniqueness within workspace ────────
    if (!isUpdate || existing.notebook_slug !== normalizedSlug) {
      const { data: slugConflict } = await supabase
        .from("notebook_publishes")
        .select("id, notebook_local_id")
        .eq("workspace_id", workspace.id)
        .eq("notebook_slug", normalizedSlug)
        .maybeSingle();

      if (slugConflict && slugConflict.notebook_local_id !== body.notebookLocalId) {
        return errorResponse(
          "This slug is already used by another notebook",
          "SLUG_TAKEN",
          409
        );
      }
    }

    // ── 7. Upsert ────────────────────────────────────────
    const upsertPayload = {
      workspace_id: workspace.id,
      notebook_local_id: body.notebookLocalId,
      notebook_slug: normalizedSlug,
      notebook_name: body.notebookName,
      notebook_icon: body.notebookIcon,
      notebook_description: body.notebookDescription,
      sections: body.sections as unknown as Json,
      pages: body.pages as unknown as Json,
      tags: body.tags as unknown as Json,
    };

    const { data: published, error: upsertError } = await supabase
      .from("notebook_publishes")
      .upsert(upsertPayload, {
        onConflict: "workspace_id,notebook_local_id",
      })
      .select("id, published_at")
      .single();

    if (upsertError || !published) {
      console.error("[publish] upsert error:", upsertError);

      if (upsertError?.code === "23505") {
        return errorResponse(
          "This slug is already used by another notebook",
          "SLUG_TAKEN",
          409
        );
      }
      if (upsertError?.code === "23514") {
        return errorResponse(
          "Invalid slug format",
          "INVALID_SLUG",
          400
        );
      }

      return errorResponse(
        "Failed to publish notebook",
        "INTERNAL_ERROR",
        500
      );
    }

    // ── 8. Invalidate Next.js cache ──────────────────────
    // Workspace landing page (published list changed)
    revalidatePath(`/@${workspace.username}`);
    // New notebook URL — covers re-publishes with same slug + first publishes
    revalidatePath(`/@${workspace.username}/${normalizedSlug}`, "layout");
    // Old URL if slug changed — force it to 404 on next request
    if (slugChanged && oldSlug) {
      revalidatePath(`/@${workspace.username}/${oldSlug}`, "layout");
    }

    // ── 9. Build public URL + return ─────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const publicUrl = `${baseUrl}/@${workspace.username}/${normalizedSlug}`;

    const result: PublishResult = {
      publishId: published.id,
      publicUrl,
      publishedAt: published.published_at,
      isUpdate,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[publish] unexpected error:", err);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// ============================================================
// Free tier / trial access check
// ============================================================

async function checkPaidOrTrialAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (subscription) return true;

  const { data: trial } = await supabase
    .from("user_trials")
    .select("trial_end_time, is_trial_used")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    trial &&
    !trial.is_trial_used &&
    new Date(trial.trial_end_time) > new Date()
  ) {
    return true;
  }

  return false;
}

// ============================================================
// Input validation
// ============================================================

function validatePublishInput(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Invalid request body";

  const b = body as Record<string, unknown>;

  if (typeof b.notebookLocalId !== "string" || !b.notebookLocalId.trim()) {
    return "notebookLocalId is required";
  }
  if (typeof b.notebookSlug !== "string" || !b.notebookSlug.trim()) {
    return "notebookSlug is required";
  }
  if (typeof b.notebookName !== "string" || !b.notebookName.trim()) {
    return "notebookName is required";
  }
  if (!Array.isArray(b.sections)) {
    return "sections must be an array";
  }
  if (!Array.isArray(b.pages)) {
    return "pages must be an array";
  }
  if (!Array.isArray(b.tags)) {
    return "tags must be an array";
  }

  if (
    b.notebookIcon !== null &&
    b.notebookIcon !== undefined &&
    typeof b.notebookIcon !== "string"
  ) {
    return "notebookIcon must be a string or null";
  }
  if (
    b.notebookDescription !== null &&
    b.notebookDescription !== undefined &&
    typeof b.notebookDescription !== "string"
  ) {
    return "notebookDescription must be a string or null";
  }

  return null;
}

// ============================================================
// Error response helper
// ============================================================

function errorResponse(
  message: string,
  code: PublishErrorCode,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  const body: PublishErrorResponse = { error: message, code, ...extra };
  return NextResponse.json(body, { status });
}