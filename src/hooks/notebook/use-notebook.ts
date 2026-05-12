"use client";

/**
 * Hook for loading a single notebook with all its sections and pages.
 *
 * Returns:
 *   - notebook: the Notebook entity
 *   - sections, pages: all children
 *   - tree: built TreeNode structure for sidebar rendering
 *   - isLoading, error
 *   - refresh action
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import * as storage from "@/lib/notebook/storage";
import { buildTree, type TreeNode } from "@/lib/notebook/utils/sort";
import type {
  Notebook,
  NotebookPage,
  NotebookSection,
} from "@/types/notebook";

interface UseNotebookReturn {
  notebook: Notebook | null;
  sections: NotebookSection[];
  pages: NotebookPage[];
  tree: TreeNode[];
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  refresh: () => Promise<void>;
}

export function useNotebook(notebookId: string | null): UseNotebookReturn {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sections, setSections] = useState<NotebookSection[]>([]);
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    if (!notebookId) {
      setNotebook(null);
      setSections([]);
      setPages([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setNotFound(false);

      const [nb, secs, pgs] = await Promise.all([
        storage.getNotebook(notebookId),
        storage.getSections(notebookId),
        storage.getPages(notebookId),
      ]);

      if (!nb) {
        setNotFound(true);
        setNotebook(null);
        setSections([]);
        setPages([]);
        return;
      }

      setNotebook(nb);
      setSections(secs);
      setPages(pgs);
    } catch (err) {
      console.error("[useNotebook] refresh error:", err);
      setError("Failed to load notebook");
    } finally {
      setIsLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Build tree (memoized to avoid rebuilding on every render)
  const tree = useMemo(() => buildTree(sections, pages), [sections, pages]);

  return {
    notebook,
    sections,
    pages,
    tree,
    isLoading,
    error,
    notFound,
    refresh,
  };
}
