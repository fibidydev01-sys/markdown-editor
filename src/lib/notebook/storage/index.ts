/**
 * Notebook storage layer — barrel export.
 *
 * Usage:
 *   import { createNotebook, getPages } from "@/lib/notebook/storage";
 */

// DB
export { getDB, deleteDB, clearAllData, type NotebookDB } from "./db";

// Notebooks
export {
  getNotebooks,
  getNotebook,
  getNotebookBySlug,
  createNotebook,
  updateNotebook,
  touchNotebook,
  deleteNotebook,
  getNotebookPageCount,
  getNotebookSectionCount,
} from "./notebooks";

// Sections
export {
  getSections,
  getSection,
  getChildSections,
  createSection,
  updateSection,
  reorderSections,
  deleteSection,
} from "./sections";

// Pages
export {
  getPages,
  getPage,
  getPagesInSection,
  searchPages,
  createPage,
  updatePage,
  movePages,
  reorderPages,
  deletePage,
  deletePages,
  duplicatePage,
} from "./pages";

// Tags
export {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getNotebooksByTag,
} from "./tags";

// Settings
export { getSettings, updateSettings, resetSettings } from "./settings";

// Backup
export {
  getAllData,
  buildBackup,
  isValidBackup,
  restoreBackup,
  getBackupFilename,
  parseBackupJSON,
} from "./backup";
