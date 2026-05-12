/**
 * Notebook feature types.
 *
 * Brand-agnostic naming. "VibesDoc" is the brand (UI only),
 * "notebook" is the code identifier.
 *
 * Hierarchy: Notebook → Section → Page
 * Equivalent to: Obsidian Vault → Folder → Note
 */

// ============================================================
// Core entities
// ============================================================

export interface Notebook {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null; // emoji or lucide icon name
  tagIds: string[]; // refs to NotebookTag.id
  createdAt: number;
  updatedAt: number;
}

export interface NotebookSection {
  id: string;
  notebookId: string;
  name: string;
  parentId: string | null; // null = root section in notebook
  order: number;
  createdAt: number;
}

export interface NotebookPage {
  id: string;
  notebookId: string;
  sectionId: string | null; // null = root-level page in notebook
  title: string;
  content: string; // markdown string
  blockNoteContent: unknown; // BlockNote JSON for lossless editing
  frontmatter: Record<string, unknown> | null; // parsed YAML frontmatter
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface NotebookTag {
  id: string;
  name: string;
  color: string; // hex color
}

// ============================================================
// Settings & Backup
// ============================================================

export interface NotebookSettings {
  theme: "light" | "dark" | "system";
  onboardingDismissed: boolean;
  lastOpenedNotebookId: string | null;
  lastOpenedPageId: string | null;
  showWordCount: boolean;
  defaultEditorMode: "visual" | "source";
  sidebarWidth: number; // px
}

export interface NotebookBackup {
  version: 1;
  exportedAt: number;
  notebooks: Notebook[];
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
  settings: NotebookSettings;
}

// ============================================================
// Sort & filter
// ============================================================

export type SortField = "title" | "createdAt" | "updatedAt" | "order";
export type SortDirection = "asc" | "desc";

// ============================================================
// Selection state (Zustand)
// ============================================================

export interface NotebookSelection {
  activeNotebookId: string | null;
  activePageId: string | null;
  selectedPageIds: string[];
  selectedSectionIds: string[];
}

// ============================================================
// Import preview
// ============================================================

export interface ImportPreviewNode {
  type: "section" | "page";
  name: string;
  path: string; // original path from ZIP/file structure
  children?: ImportPreviewNode[];
  pageCount?: number; // total pages including nested (for sections)
}

export interface ImportResult {
  notebookId: string;
  sectionsCreated: number;
  pagesCreated: number;
}

// ============================================================
// Create / Update inputs (for storage layer)
// ============================================================

export interface CreateNotebookInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  tagIds?: string[];
}

export interface UpdateNotebookInput {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  tagIds?: string[];
}

export interface CreateSectionInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateSectionInput {
  name?: string;
  parentId?: string | null;
  order?: number;
}

export interface CreatePageInput {
  title?: string;
  content?: string;
  blockNoteContent?: unknown;
  sectionId?: string | null;
  frontmatter?: Record<string, unknown> | null;
}

export interface UpdatePageInput {
  title?: string;
  content?: string;
  blockNoteContent?: unknown;
  sectionId?: string | null;
  frontmatter?: Record<string, unknown> | null;
  order?: number;
}

export interface ReorderInput {
  id: string;
  order: number;
  parentId?: string | null; // for sections only
}

// ============================================================
// Bulk operations
// ============================================================

export interface NotebookFullData {
  notebook: Notebook;
  sections: NotebookSection[];
  pages: NotebookPage[];
}

export interface AllNotebookData {
  notebooks: Notebook[];
  sections: NotebookSection[];
  pages: NotebookPage[];
  tags: NotebookTag[];
  settings: NotebookSettings;
}
