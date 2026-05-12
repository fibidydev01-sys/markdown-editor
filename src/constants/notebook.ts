/**
 * Notebook feature constants.
 */

import type { NotebookSettings } from "@/types/notebook";

// ============================================================
// IndexedDB
// ============================================================

export const NOTEBOOK_DB_NAME = "notebook-db";
export const NOTEBOOK_DB_VERSION = 1;

// ============================================================
// Default values
// ============================================================

export const DEFAULT_NOTEBOOK_SETTINGS: NotebookSettings = {
  theme: "system",
  onboardingDismissed: false,
  lastOpenedNotebookId: null,
  lastOpenedPageId: null,
  showWordCount: true,
  defaultEditorMode: "visual",
  sidebarWidth: 280,
};

export const DEFAULT_TAG_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
] as const;

export const DEFAULT_NOTEBOOK_ICON = "📓";

// ============================================================
// Limits
// ============================================================

export const NOTEBOOK_LIMITS = {
  // Sidebar
  MIN_SIDEBAR_WIDTH: 200,
  MAX_SIDEBAR_WIDTH: 500,

  // Names
  MAX_NOTEBOOK_NAME_LENGTH: 100,
  MAX_SECTION_NAME_LENGTH: 100,
  MAX_PAGE_TITLE_LENGTH: 200,
  MAX_TAG_NAME_LENGTH: 30,

  // Content
  MAX_DESCRIPTION_LENGTH: 500,

  // Free tier (enforced in storage layer when paid features added)
  FREE_MAX_NOTEBOOKS: 10,
  FREE_MAX_PAGES_PER_NOTEBOOK: 100,

  // Paid tier
  PAID_MAX_NOTEBOOKS: 100,
  PAID_MAX_PAGES_PER_NOTEBOOK: 1000,
} as const;

// ============================================================
// Auto-save
// ============================================================

export const AUTO_SAVE_DEBOUNCE_MS = 500;

// ============================================================
// Default content for new pages
// ============================================================

export const NEW_PAGE_DEFAULT_TITLE = "Untitled";
export const NEW_PAGE_DEFAULT_CONTENT = "";

// ============================================================
// Sample content (used by onboarding)
// ============================================================

export const SAMPLE_NOTEBOOK_NAME = "My First Notebook";
export const SAMPLE_PAGE_TITLE = "Welcome to VibesDoc";
export const SAMPLE_PAGE_CONTENT = `# Welcome to VibesDoc

This is your first **page** inside your first **notebook**.

## What you can do

- Write in **markdown** with a visual editor
- Organize pages into **sections** (like folders)
- Import a ZIP of markdown files and we'll auto-create sections
- Export as ZIP anytime — your data, your files
- Works **offline** — everything stored locally

## Try it out

- [ ] Edit this page
- [ ] Create a new section
- [ ] Add another page
- [ ] Import a ZIP folder

Happy writing!
`;

// ============================================================
// Storage keys for localStorage (non-IndexedDB persistence)
// ============================================================

export const LS_KEYS = {
  SIDEBAR_WIDTH: "notebook:sidebar-width",
  ONBOARDING_DISMISSED: "notebook:onboarding-dismissed",
  LAST_NOTEBOOK_ID: "notebook:last-notebook-id",
} as const;
