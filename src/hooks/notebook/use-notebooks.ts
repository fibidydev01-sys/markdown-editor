"use client";

/**
 * Hook for listing and managing all notebooks.
 *
 * Returns:
 *   - notebooks: list of all notebooks (sorted by updatedAt desc)
 *   - isLoading
 *   - refresh, create, update, remove actions
 */

import { useCallback, useEffect, useState } from "react";
import * as storage from "@/lib/notebook/storage";
import type {
  CreateNotebookInput,
  Notebook,
  UpdateNotebookInput,
} from "@/types/notebook";

interface UseNotebooksReturn {
  notebooks: Notebook[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createNotebook: (input: CreateNotebookInput) => Promise<Notebook>;
  updateNotebook: (
    id: string,
    updates: UpdateNotebookInput
  ) => Promise<Notebook>;
  removeNotebook: (id: string) => Promise<void>;
}

export function useNotebooks(): UseNotebooksReturn {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await storage.getNotebooks();
      setNotebooks(list);
    } catch (err) {
      console.error("[useNotebooks] refresh error:", err);
      setError("Failed to load notebooks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNotebook = useCallback(
    async (input: CreateNotebookInput) => {
      const nb = await storage.createNotebook(input);
      await refresh();
      return nb;
    },
    [refresh]
  );

  const updateNotebook = useCallback(
    async (id: string, updates: UpdateNotebookInput) => {
      const nb = await storage.updateNotebook(id, updates);
      await refresh();
      return nb;
    },
    [refresh]
  );

  const removeNotebook = useCallback(
    async (id: string) => {
      await storage.deleteNotebook(id);
      await refresh();
    },
    [refresh]
  );

  return {
    notebooks,
    isLoading,
    error,
    refresh,
    createNotebook,
    updateNotebook,
    removeNotebook,
  };
}
