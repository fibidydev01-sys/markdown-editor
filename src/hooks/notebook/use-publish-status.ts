"use client";

/**
 * usePublishStatus — track publish state for a single notebook.
 *
 * Auto-refreshes when workspace becomes available (e.g. on initial auth load).
 *
 * Usage:
 *   const { status, isLoading, refresh } = usePublishStatus(notebookId);
 *
 *   if (status?.isPublished) {
 *     return <Badge>Published at {status.publicUrl}</Badge>;
 *   }
 */

import { useCallback, useEffect, useState } from "react";
import { getPublishStatus } from "@/lib/notebook/publish";
import { useAuthStore } from "@/stores/auth-store";
import type { PublishStatus } from "@/types/publish";

interface UsePublishStatusReturn {
  status: PublishStatus | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function usePublishStatus(
  notebookLocalId: string | null
): UsePublishStatusReturn {
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const workspace = useAuthStore((s) => s.workspace);
  const hasFetchedAuth = useAuthStore((s) => s.hasFetched);

  const refresh = useCallback(async () => {
    if (!notebookLocalId || !workspace) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getPublishStatus(notebookLocalId);
      setStatus(result);
    } catch (err) {
      console.error("[usePublishStatus] error:", err);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [notebookLocalId, workspace]);

  useEffect(() => {
    // Wait until auth has resolved before first fetch
    if (!hasFetchedAuth) return;
    refresh();
  }, [refresh, hasFetchedAuth]);

  return { status, isLoading, refresh };
}
