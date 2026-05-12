/**
 * Username validation utilities.
 *
 * Three layers of validation:
 *   1. Format check (regex, length) — instant, client-side
 *   2. Reserved word check — instant, client-side
 *   3. Availability check — async, hits DB
 *
 * The DB also enforces (1) and (2) via CHECK constraints, and (3) via
 * UNIQUE constraint. Client-side checks are for UX (fast feedback) only.
 */

import { createClient } from "@/lib/supabase/client";
import {
  RESERVED_USERNAMES,
  USERNAME_LIMITS,
  type UsernameValidationResult,
} from "@/types/workspace";

// ============================================================
// Format check (instant)
// ============================================================

const USERNAME_FORMAT_REGEX = /^[a-z0-9-]{3,30}$/;

/**
 * Check if a username has valid format + isn't reserved.
 * Does NOT check availability (use `checkUsernameAvailable` for that).
 */
export function validateUsernameFormat(
  username: string
): { isValid: boolean; error?: string } {
  const trimmed = username.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { isValid: false, error: "Username is required" };
  }

  if (trimmed.length < USERNAME_LIMITS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_LIMITS.MIN_LENGTH} characters`,
    };
  }

  if (trimmed.length > USERNAME_LIMITS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be ${USERNAME_LIMITS.MAX_LENGTH} characters or less`,
    };
  }

  if (!USERNAME_FORMAT_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    };
  }

  // No leading/trailing hyphens
  if (trimmed.startsWith("-") || trimmed.endsWith("-")) {
    return {
      isValid: false,
      error: "Username can't start or end with a hyphen",
    };
  }

  // No consecutive hyphens (cleaner URLs)
  if (trimmed.includes("--")) {
    return {
      isValid: false,
      error: "Username can't contain consecutive hyphens",
    };
  }

  if (RESERVED_USERNAMES.has(trimmed)) {
    return {
      isValid: false,
      error: "This username is reserved",
    };
  }

  return { isValid: true };
}

// ============================================================
// Availability check (async)
// ============================================================

/**
 * Check if a username is available in the database.
 *
 * @param username   - candidate username (will be lowercased)
 * @param excludeUserId - if provided, allow the username if it belongs to
 *                        this user (so the user keeping their own username
 *                        doesn't show as "taken")
 * @returns true if available, false if taken
 */
export async function checkUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  const supabase = createClient();

  try {
    // Use the SQL helper function — does format + reserved + uniqueness in one shot
    const { data, error } = await supabase.rpc("is_username_available", {
      candidate: normalized,
      exclude_user_id: excludeUserId ?? null,
    });

    if (error) {
      console.error("[checkUsernameAvailable] RPC error:", error);
      // Fallback to a direct query
      return checkUsernameAvailableFallback(normalized, excludeUserId);
    }

    return data === true;
  } catch (err) {
    console.error("[checkUsernameAvailable] unexpected error:", err);
    return checkUsernameAvailableFallback(normalized, excludeUserId);
  }
}

/**
 * Fallback: direct query if RPC fails (e.g., migration not applied yet).
 */
async function checkUsernameAvailableFallback(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const supabase = createClient();

  let query = supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("username", username);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("[checkUsernameAvailableFallback] error:", error);
    // On error, assume taken to prevent collisions on save
    return false;
  }

  return (count ?? 0) === 0;
}

// ============================================================
// Combined validator (format + availability)
// ============================================================

/**
 * Full validation: format + reserved + availability.
 * Use this when the user has stopped typing (debounced).
 */
export async function validateUsername(
  username: string,
  excludeUserId?: string
): Promise<UsernameValidationResult> {
  const formatCheck = validateUsernameFormat(username);

  if (!formatCheck.isValid) {
    return {
      isValid: false,
      isAvailable: false,
      error: formatCheck.error,
    };
  }

  const isAvailable = await checkUsernameAvailable(username, excludeUserId);

  if (!isAvailable) {
    return {
      isValid: true,
      isAvailable: false,
      error: "This username is already taken",
    };
  }

  return { isValid: true, isAvailable: true };
}

// ============================================================
// Cooldown helpers
// ============================================================

/**
 * Calculate the next date the user can change their username.
 * Returns null if the cooldown has already elapsed.
 */
export function getNextUsernameChangeDate(
  lastChangedAt: string | Date
): Date | null {
  const last =
    typeof lastChangedAt === "string"
      ? new Date(lastChangedAt)
      : lastChangedAt;

  const next = new Date(last);
  next.setDate(next.getDate() + USERNAME_LIMITS.CHANGE_COOLDOWN_DAYS);

  if (next <= new Date()) return null;
  return next;
}

/**
 * Check if username can be changed right now.
 */
export function canChangeUsername(lastChangedAt: string | Date): boolean {
  return getNextUsernameChangeDate(lastChangedAt) === null;
}
