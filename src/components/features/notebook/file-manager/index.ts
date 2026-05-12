/**
 * Notebook file-manager components — barrel export.
 *
 * UPDATED in Stage 2 polish: DropIndicator is now a no-op stub (kept
 * for backward-compat). Eager swap doesn't need a separate indicator.
 */

export { NotebookSidebar } from "./notebook-sidebar";
export { SectionNode } from "./section-node";
export { PageListItem } from "./page-list-item";
export { PageCard } from "./page-card";
export { SearchBar } from "./search-bar";
export { NewItemMenu } from "./new-item-menu";

// DnD primitives (Stage 2)
export { NotebookDndContext, useDndState } from "./dnd-context";
export { DragOverlayCard } from "./drag-overlay-card";
export { DropIndicator } from "./drop-indicator"; // deprecated stub
