/**
 * Constants barrel export.
 *
 * UPDATED in Phase H: re-export workspace constants.
 */

export { ROUTES } from "./routes";
export { PLANS, type PlanTier } from "./plans";

// Notebook constants (Phase A)
export {
  NOTEBOOK_DB_NAME,
  NOTEBOOK_DB_VERSION,
  DEFAULT_NOTEBOOK_SETTINGS,
  DEFAULT_TAG_COLORS,
  DEFAULT_NOTEBOOK_ICON,
  NOTEBOOK_LIMITS,
  AUTO_SAVE_DEBOUNCE_MS,
  NEW_PAGE_DEFAULT_TITLE,
  NEW_PAGE_DEFAULT_CONTENT,
  SAMPLE_NOTEBOOK_NAME,
  SAMPLE_PAGE_TITLE,
  SAMPLE_PAGE_CONTENT,
  LS_KEYS,
} from "./notebook";

// Workspace constants (Phase H — re-exported from types for convenience)
export {
  USERNAME_LIMITS,
  DISPLAY_NAME_LIMITS,
  RESERVED_USERNAMES,
} from "@/types/workspace";
