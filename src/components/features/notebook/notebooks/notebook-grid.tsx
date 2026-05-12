"use client";

/**
 * Notebook grid — responsive layout for notebook cards.
 *
 * UPDATED in Phase I: batch-fetches publish status for all visible
 * notebooks in a single query (avoids N+1).
 *
 * Includes empty state and loading skeleton.
 */

import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Notebook, NotebookTag } from "@/types/notebook";
import type { PublishStatus } from "@/types/publish";
import { NotebookCard } from "./notebook-card";
import { getPublishStatusMap } from "@/lib/notebook/publish";
import { useAuthStore } from "@/stores/auth-store";

interface NotebookGridProps {
  notebooks: Notebook[];
  tags?: NotebookTag[];
  isLoading?: boolean;
  onDelete?: (id: string) => void | Promise<void>;
  emptyAction?: React.ReactNode;
}

export function NotebookGrid({
  notebooks,
  tags,
  isLoading,
  onDelete,
  emptyAction,
}: NotebookGridProps) {
  // ── Batch-load publish status ──
  // Single query keyed by notebook IDs. Refreshes when:
  //   - notebooks list changes (added/removed)
  //   - workspace becomes available (initial auth load)
  //   - any notebook's updatedAt changes (re-publish detection)
  const workspace = useAuthStore((s) => s.workspace);
  const hasFetchedAuth = useAuthStore((s) => s.hasFetched);
  const [statusMap, setStatusMap] = useState<Map<string, PublishStatus>>(
    new Map()
  );

  useEffect(() => {
    if (!hasFetchedAuth || !workspace) return;
    if (notebooks.length === 0) return;

    let cancelled = false;
    const ids = notebooks.map((nb) => nb.id);

    getPublishStatusMap(ids)
      .then((map) => {
        if (!cancelled) setStatusMap(map);
      })
      .catch((err) => {
        console.error("[NotebookGrid] publish status fetch error:", err);
      });

    return () => {
      cancelled = true;
    };
    // Re-fetch when the set of notebook IDs changes, or when any updates
    // (refresh after publish/unpublish trickles down via parent refresh).
    // We stringify IDs so we re-run on add/remove but not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasFetchedAuth,
    workspace?.id,
    notebooks.map((n) => `${n.id}:${n.updatedAt}`).join("|"),
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[160px]">
            <CardContent className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (notebooks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1 max-w-sm">
            <h3 className="font-semibold">No notebooks yet</h3>
            <p className="text-sm text-muted-foreground">
              Create your first notebook to start organizing your docs.
              Each notebook holds sections and pages — like an Obsidian vault.
            </p>
          </div>
          {emptyAction}
        </CardContent>
      </Card>
    );
  }

  // Grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notebooks.map((nb) => (
        <NotebookCard
          key={nb.id}
          notebook={nb}
          tags={tags}
          publishStatus={statusMap.get(nb.id) ?? null}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
