/**
 * Notebook feature Zustand store.
 *
 * Manages volatile UI state:
 *   - active notebook + page IDs
 *   - multi-select state (selected pages/sections)
 *
 * Persisted state (last opened IDs, sidebar width, theme) goes through
 * NotebookSettings via use-notebook-settings hook instead.
 */

import { create } from "zustand";
import type { NotebookSelection } from "@/types/notebook";

interface NotebookStoreState extends NotebookSelection {
  // Notebook-level
  setActiveNotebookId: (id: string | null) => void;

  // Page-level
  setActivePageId: (id: string | null) => void;

  // Multi-select pages
  togglePageSelection: (id: string) => void;
  selectPages: (ids: string[]) => void;
  clearPageSelection: () => void;
  setSelectedPageIds: (ids: string[]) => void;

  // Multi-select sections
  toggleSectionSelection: (id: string) => void;
  selectSections: (ids: string[]) => void;
  clearSectionSelection: () => void;
  setSelectedSectionIds: (ids: string[]) => void;

  // Bulk reset
  reset: () => void;
}

const initialSelection: NotebookSelection = {
  activeNotebookId: null,
  activePageId: null,
  selectedPageIds: [],
  selectedSectionIds: [],
};

export const useNotebookStore = create<NotebookStoreState>((set) => ({
  ...initialSelection,

  setActiveNotebookId: (id) =>
    set({
      activeNotebookId: id,
      // Clear page selection when notebook changes
      activePageId: null,
      selectedPageIds: [],
      selectedSectionIds: [],
    }),

  setActivePageId: (id) => set({ activePageId: id }),

  togglePageSelection: (id) =>
    set((state) => {
      const exists = state.selectedPageIds.includes(id);
      return {
        selectedPageIds: exists
          ? state.selectedPageIds.filter((x) => x !== id)
          : [...state.selectedPageIds, id],
      };
    }),

  selectPages: (ids) =>
    set((state) => ({
      selectedPageIds: Array.from(new Set([...state.selectedPageIds, ...ids])),
    })),

  setSelectedPageIds: (ids) => set({ selectedPageIds: ids }),

  clearPageSelection: () => set({ selectedPageIds: [] }),

  toggleSectionSelection: (id) =>
    set((state) => {
      const exists = state.selectedSectionIds.includes(id);
      return {
        selectedSectionIds: exists
          ? state.selectedSectionIds.filter((x) => x !== id)
          : [...state.selectedSectionIds, id],
      };
    }),

  selectSections: (ids) =>
    set((state) => ({
      selectedSectionIds: Array.from(
        new Set([...state.selectedSectionIds, ...ids])
      ),
    })),

  setSelectedSectionIds: (ids) => set({ selectedSectionIds: ids }),

  clearSectionSelection: () => set({ selectedSectionIds: [] }),

  reset: () => set(initialSelection),
}));
