"use client";

/**
 * Hook for section operations within a notebook.
 *
 * Note: this hook does NOT load sections (use `useNotebook` for that).
 * It exposes action callbacks that wrap storage operations.
 *
 * Use this hook alongside `useNotebook` — call its `refresh` after mutations.
 */

import { useCallback } from "react";
import * as storage from "@/lib/notebook/storage";
import type {
  CreateSectionInput,
  NotebookSection,
  ReorderInput,
  UpdateSectionInput,
} from "@/types/notebook";

interface UseSectionsReturn {
  createSection: (
    notebookId: string,
    input: CreateSectionInput
  ) => Promise<NotebookSection>;
  updateSection: (
    id: string,
    updates: UpdateSectionInput
  ) => Promise<NotebookSection>;
  reorderSections: (updates: ReorderInput[]) => Promise<void>;
  deleteSection: (
    id: string,
    pageStrategy?: "orphan" | "delete"
  ) => Promise<void>;
}

export function useSections(
  onMutate?: () => void | Promise<void>
): UseSectionsReturn {
  const triggerRefresh = useCallback(async () => {
    if (onMutate) await onMutate();
  }, [onMutate]);

  const createSection = useCallback(
    async (notebookId: string, input: CreateSectionInput) => {
      const section = await storage.createSection(notebookId, input);
      await triggerRefresh();
      return section;
    },
    [triggerRefresh]
  );

  const updateSection = useCallback(
    async (id: string, updates: UpdateSectionInput) => {
      const section = await storage.updateSection(id, updates);
      await triggerRefresh();
      return section;
    },
    [triggerRefresh]
  );

  const reorderSections = useCallback(
    async (updates: ReorderInput[]) => {
      await storage.reorderSections(updates);
      await triggerRefresh();
    },
    [triggerRefresh]
  );

  const deleteSection = useCallback(
    async (id: string, pageStrategy: "orphan" | "delete" = "orphan") => {
      await storage.deleteSection(id, pageStrategy);
      await triggerRefresh();
    },
    [triggerRefresh]
  );

  return {
    createSection,
    updateSection,
    reorderSections,
    deleteSection,
  };
}
