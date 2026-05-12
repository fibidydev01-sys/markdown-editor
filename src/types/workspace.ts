/**
 * Workspace feature types.
 *
 * A Workspace is the container for a user's publishable notebooks.
 * It's 1:1 with auth.users for MVP (future: team workspaces = 1:many).
 *
 * The workspace's `username` is the public URL slug: vibesdoc.com/@username
 */

// ============================================================
// Core entity
// ============================================================

export interface Workspace {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  username_last_changed_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Input types
// ============================================================

export interface UpdateWorkspaceInput {
  username?: string;
  display_name?: string | null;
}

// ============================================================
// Validation
// ============================================================

/**
 * Result of validating a candidate username.
 *
 * - isValid:    format/length/reserved-list check passes
 * - isAvailable: not currently taken by another user
 * - error:      human-readable message (if !isValid || !isAvailable)
 */
export interface UsernameValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
}

// ============================================================
// Constants
// ============================================================

export const USERNAME_LIMITS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  /** Cooldown between username changes (in days). */
  CHANGE_COOLDOWN_DAYS: 30,
} as const;

export const DISPLAY_NAME_LIMITS = {
  MIN_LENGTH: 0, // optional field
  MAX_LENGTH: 100,
} as const;

/**
 * Reserved usernames — must match the DB CHECK constraint and trigger.
 * Keep this list in sync with `supabase-migrations/001_workspaces.sql`.
 */
export const RESERVED_USERNAMES = new Set<string>([
  "admin", "api", "docs", "app", "www", "help",
  "support", "blog", "pricing", "login", "register",
  "dashboard", "settings", "profile", "pay", "overview",
  "notebooks", "about", "contact", "terms", "privacy",
  "root", "system", "mail", "webmaster", "noreply",
]);
