"use client";

/**
 * Hook for loading and managing a single page being edited.
 *
 * Includes debounced auto-save.
 * Used by the editor in Phase D.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as storage from "@/lib/notebook/storage";
import { AUTO_SAVE_DEBOUNCE_MS } from "@/constants/notebook";
import type { NotebookPage, UpdatePageInput } from "@/types/notebook";

interface UseCurrentPageReturn {
  page: NotebookPage | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  /** Optimistically update local state + auto-save with debounce. */
  scheduleSave: (updates: UpdatePageInput) => void;
  /** Flush pending changes immediately (e.g. on unmount or mode switch). */
  flushSave: () => Promise<void>;
  /** Refresh from storage. */
  refresh: () => Promise<void>;
}

export function useCurrentPage(pageId: string | null): UseCurrentPageReturn {
  const [page, setPage] = useState<NotebookPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Debounce + pending updates
  const pendingRef = useRef<UpdatePageInput>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageIdRef = useRef<string | null>(pageId);

  // Keep ref synced
  useEffect(() => {
    pageIdRef.current = pageId;
  }, [pageId]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!pageId) {
      setPage(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setNotFound(false);
      const p = await storage.getPage(pageId);

      if (!p) {
        setNotFound(true);
        setPage(null);
      } else {
        setPage(p);
      }
    } catch (err) {
      console.error("[useCurrentPage] refresh error:", err);
      setError("Failed to load page");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  // Load when pageId changes
  useEffect(() => {
    setIsLoading(true);
    refresh();
  }, [refresh]);

  // Flush function — commits pending changes immediately
  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const id = pageIdRef.current;
    const pending = pendingRef.current;

    if (!id || Object.keys(pending).length === 0) return;

    pendingRef.current = {};

    try {
      const updated = await storage.updatePage(id, pending);
      // Only update local state if pageId hasn't changed
      if (pageIdRef.current === id) {
        setPage(updated);
      }
    } catch (err) {
      console.error("[useCurrentPage] save error:", err);
      setError("Failed to save changes");
    }
  }, []);

  // Schedule save with debounce
  const scheduleSave = useCallback(
    (updates: UpdatePageInput) => {
      if (!pageIdRef.current) return;

      // Merge into pending
      pendingRef.current = { ...pendingRef.current, ...updates };

      // Optimistic local update
      setPage((prev) =>
        prev ? { ...prev, ...updates, updatedAt: Date.now() } : prev
      );

      // Reset debounce timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flushSave();
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    [flushSave]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Best-effort sync flush — but we can't await in cleanup,
        // so we fire and forget. If user navigates away mid-save,
        // changes are still committed.
        const id = pageIdRef.current;
        const pending = pendingRef.current;
        if (id && Object.keys(pending).length > 0) {
          storage.updatePage(id, pending).catch((err) => {
            console.error("[useCurrentPage] unmount flush error:", err);
          });
        }
      }
    };
  }, []);

  return {
    page,
    isLoading,
    error,
    notFound,
    scheduleSave,
    flushSave,
    refresh,
  };
}
