"use client";

/**
 * Hook for page operations within a notebook.
 *
 * Like use-sections, this exposes action callbacks but doesn't load data.
 * Pair with `useNotebook` for the data, then trigger refresh after mutations.
 */

import { useCallback } from "react";
import * as storage from "@/lib/notebook/storage";
import type {
  CreatePageInput,
  NotebookPage,
  UpdatePageInput,
} from "@/types/notebook";

interface UsePagesReturn {
  createPage: (
    notebookId: string,
    input?: CreatePageInput
  ) => Promise<NotebookPage>;
  updatePage: (id: string, updates: UpdatePageInput) => Promise<NotebookPage>;
  movePages: (
    pageIds: string[],
    targetSectionId: string | null
  ) => Promise<void>;
  reorderPages: (
    updates: { id: string; order: number }[]
  ) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  deletePages: (ids: string[]) => Promise<void>;
  duplicatePage: (id: string) => Promise<NotebookPage>;
  searchPages: (
    notebookId: string,
    query: string
  ) => Promise<NotebookPage[]>;
}

export function usePages(
  onMutate?: () => void | Promise<void>
): UsePagesReturn {
  const triggerRefresh = useCallback(async () => {
    if (onMutate) await onMutate();
  }, [onMutate]);

  const createPage = useCallback(
    async (notebookId: string, input?: CreatePageInput) => {
      const page = await storage.createPage(notebookId, input);
      await triggerRefresh();
      return page;
    },
    [triggerRefresh]
  );

  const updatePage = useCallback(
    async (id: string, updates: UpdatePageInput) => {
      const page = await storage.updatePage(id, updates);
      await triggerRefresh();
      return page;
    },
    [triggerRefresh]
  );

  const movePages = useCallback(
    async (pageIds: string[], targetSectionId: string | null) => {
      await storage.movePages(pageIds, targetSectionId);
      await triggerRefresh();
    },
    [triggerRefresh]
  );

  const reorderPages = useCallback(
    async (updates: { id: string; order: number }[]) => {
      await storage.reorderPages(updates);
      await triggerRefresh();
    },
    [triggerRefresh]
  );

  const deletePage = useCallback(
    async (id: string) => {
      await storage.deletePage(id);
      await triggerRefresh();
    },
    [triggerRefresh]
  );

  const deletePages = useCallback(
    async (ids: string[]) => {
      await storage.deletePages(ids);
      await triggerRefresh();
    },
    [triggerRefresh]
  );

  const duplicatePage = useCallback(
    async (id: string) => {
      const page = await storage.duplicatePage(id);
      await triggerRefresh();
      return page;
    },
    [triggerRefresh]
  );

  const searchPages = useCallback(
    async (notebookId: string, query: string) => {
      return storage.searchPages(notebookId, query);
    },
    []
  );

  return {
    createPage,
    updatePage,
    movePages,
    reorderPages,
    deletePage,
    deletePages,
    duplicatePage,
    searchPages,
  };
}
