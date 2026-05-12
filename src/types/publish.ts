/**
 * Publish feature types.
 *
 * A PublishedNotebook is a snapshot of a local notebook (from IndexedDB)
 * uploaded to Supabase. Reading from Supabase = public docs renderer
 * (Phase J). Writing to Supabase = "Publish" action in the editor.
 *
 * MVP: one row per notebook. Re-publish overwrites in-place.
 * No version history.
 */

import type {
  NotebookPage,
  NotebookSection,
  NotebookTag,
} from "./notebook";

// ============================================================
// Core entity (matches DB row)
// ============================================================

export interface PublishedNotebook {
  id: string;
  workspace_id: string;
  notebook_local_id: string;
  notebook_slug: string;
  notebook_name: string;
  notebook_icon: string | null;
  notebook_description: string | null;
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
  published_at: string;
  updated_at: string;
}

/**
 * Joined view used by public docs renderer (Phase J).
 * Includes workspace info to avoid a second query.
 */
export interface PublishedNotebookWithWorkspace
  extends PublishedNotebook {
  username: string;
  workspace_display_name: string | null;
}

// ============================================================
// Input types (for API + storage layer)
// ============================================================

export interface PublishInput {
  /** The IndexedDB notebook.id — used to identify which local notebook this is. */
  notebookLocalId: string;
  /** URL-safe slug. Must be unique within the workspace. */
  notebookSlug: string;
  notebookName: string;
  notebookIcon: string | null;
  notebookDescription: string | null;
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
}

export interface UnpublishInput {
  notebookLocalId: string;
}

// ============================================================
// API response shapes
// ============================================================

export interface PublishResult {
  publishId: string;
  publicUrl: string;              // /@username/notebook-slug
  publishedAt: string;
  /** True if this was a re-publish (existing row updated). */
  isUpdate: boolean;
}

export interface UnpublishResult {
  success: true;
}

// ============================================================
// Publish status (for editor "is this notebook published?" check)
// ============================================================

export interface PublishStatus {
  isPublished: boolean;
  publishId: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  publicUrl: string | null;
  notebookSlug: string | null;
}

// ============================================================
// Error codes (for API → UI message mapping)
// ============================================================

export type PublishErrorCode =
  | "UNAUTHORIZED"
  | "NO_WORKSPACE"
  | "FREE_TIER_LIMIT"
  | "SLUG_TAKEN"
  | "INVALID_SLUG"
  | "INVALID_INPUT"
  | "INTERNAL_ERROR";

export interface PublishErrorResponse {
  error: string;
  code: PublishErrorCode;
  /** For FREE_TIER_LIMIT: how many notebooks the user already has published. */
  currentCount?: number;
  /** For FREE_TIER_LIMIT: the limit. */
  limit?: number;
}

// ============================================================
// Limits
// ============================================================

export const PUBLISH_LIMITS = {
  FREE_MAX_PUBLISHED_NOTEBOOKS: 1,
  MAX_SLUG_LENGTH: 100,
  MIN_SLUG_LENGTH: 1,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;
