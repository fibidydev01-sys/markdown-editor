/**
 * Workspace library — barrel export.
 *
 * Usage:
 *   import { getCurrentUserWorkspace, validateUsername } from "@/lib/workspace";
 */

export {
  getCurrentUserWorkspace,
  getWorkspaceByUserId,
  getWorkspaceByUsername,
  updateWorkspace,
} from "./client";

export {
  validateUsernameFormat,
  checkUsernameAvailable,
  validateUsername,
  getNextUsernameChangeDate,
  canChangeUsername,
} from "./username-validator";
