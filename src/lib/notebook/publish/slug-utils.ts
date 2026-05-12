/**
 * Slug utilities for the publish flow.
 *
 * Notebook slugs are scoped to a workspace (unique within a workspace).
 * They're used in the public URL: /@username/<slug>
 *
 * Rules:
 *   - Lowercase
 *   - Alphanumeric + hyphens
 *   - 1-100 chars
 *   - No leading/trailing/consecutive hyphens
 *
 * These rules align with the DB CHECK constraint in migration 002.
 */

import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/notebook/utils/slugify";
import { PUBLISH_LIMITS } from "@/types/publish";

// ============================================================
// Format validation
// ============================================================

const SLUG_FORMAT_REGEX = /^[a-z0-9-]{1,100}$/;

export interface SlugValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate slug format. Does NOT check availability.
 */
export function validateSlugFormat(slug: string): SlugValidationResult {
  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length < PUBLISH_LIMITS.MIN_SLUG_LENGTH) {
    return { isValid: false, error: "Slug is required" };
  }

  if (trimmed.length > PUBLISH_LIMITS.MAX_SLUG_LENGTH) {
    return {
      isValid: false,
      error: `Slug must be ${PUBLISH_LIMITS.MAX_SLUG_LENGTH} characters or less`,
    };
  }

  if (!SLUG_FORMAT_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    };
  }

  if (trimmed.startsWith("-") || trimmed.endsWith("-")) {
    return {
      isValid: false,
      error: "Slug can't start or end with a hyphen",
    };
  }

  if (trimmed.includes("--")) {
    return {
      isValid: false,
      error: "Slug can't contain consecutive hyphens",
    };
  }

  return { isValid: true };
}

// ============================================================
// Slug generation from notebook name
// ============================================================

/**
 * Suggest a slug from a notebook name.
 * Uses the existing slugify utility, with a fallback to "notebook" if empty.
 */
export function suggestSlugFromName(name: string): string {
  const slug = slugify(name).slice(0, PUBLISH_LIMITS.MAX_SLUG_LENGTH);
  return slug || "notebook";
}

// ============================================================
// Availability check
// ============================================================

/**
 * Check if a slug is available within a workspace.
 *
 * @param workspaceId   - the workspace to check within
 * @param slug          - candidate slug (will be lowercased)
 * @param excludeNotebookLocalId - if provided, allow the slug if it's owned
 *                                 by this notebook (so re-publishing keeps
 *                                 your own slug)
 */
export async function checkSlugAvailable(
  workspaceId: string,
  slug: string,
  excludeNotebookLocalId?: string
): Promise<boolean> {
  const supabase = createClient();
  const normalized = slug.trim().toLowerCase();

  let query = supabase
    .from("notebook_publishes")
    .select("id, notebook_local_id", { count: "exact", head: false })
    .eq("workspace_id", workspaceId)
    .eq("notebook_slug", normalized);

  const { data, error } = await query;

  if (error) {
    console.error("[checkSlugAvailable] error:", error);
    // On error, assume taken to prevent collisions on save
    return false;
  }

  if (!data || data.length === 0) return true;

  // If the only row that has this slug is the same notebook we're
  // re-publishing, it's "available" to us.
  if (excludeNotebookLocalId && data.length === 1) {
    return data[0].notebook_local_id === excludeNotebookLocalId;
  }

  return false;
}

/**
 * Combined: format check + availability check.
 */
export async function validateSlug(
  workspaceId: string,
  slug: string,
  excludeNotebookLocalId?: string
): Promise<{ isValid: boolean; isAvailable: boolean; error?: string }> {
  const formatCheck = validateSlugFormat(slug);
  if (!formatCheck.isValid) {
    return {
      isValid: false,
      isAvailable: false,
      error: formatCheck.error,
    };
  }

  const isAvailable = await checkSlugAvailable(
    workspaceId,
    slug,
    excludeNotebookLocalId
  );

  if (!isAvailable) {
    return {
      isValid: true,
      isAvailable: false,
      error: "This slug is already used by another notebook",
    };
  }

  return { isValid: true, isAvailable: true };
}
