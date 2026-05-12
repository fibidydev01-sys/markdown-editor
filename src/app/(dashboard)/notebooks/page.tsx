"use client";

/**
 * Notebooks dashboard — list all notebooks with grid layout.
 *
 * UPDATED in Phase Fix (HARD DELETE):
 *   - handleDelete simplified — just delegates to storage.deleteNotebook()
 *   - Cascade unpublish is handled INSIDE NotebookCard (it has the
 *     publishStatus context already loaded). This page just does local.
 *   - Toast moved into NotebookCard (it knows if cascade happened)
 */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotebooks } from "@/hooks/notebook/use-notebooks";
import { getTags } from "@/lib/notebook/storage";
import { NotebookGrid } from "@/components/features/notebook/notebooks/notebook-grid";
import { NewNotebookModal } from "@/components/features/notebook/notebooks/new-notebook-modal";
import { ROUTES } from "@/constants";
import type { NotebookTag } from "@/types/notebook";

export default function NotebooksPage() {
  const { notebooks, isLoading, removeNotebook } = useNotebooks();
  const [tags, setTags] = useState<NotebookTag[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load tags once
  useEffect(() => {
    getTags()
      .then(setTags)
      .catch((err) => console.error("[NotebooksPage] load tags error:", err));
  }, []);

  // Filtered list
  const filteredNotebooks = useMemo(() => {
    if (!search.trim()) return notebooks;
    const q = search.toLowerCase();
    return notebooks.filter(
      (nb) =>
        nb.name.toLowerCase().includes(q) ||
        nb.description?.toLowerCase().includes(q)
    );
  }, [notebooks, search]);

  // ═══════════════════════════════════════════════════════════
  // Local delete only — cascade unpublish handled by NotebookCard
  // before this callback runs. By the time we get here, remote is
  // already clean.
  // ═══════════════════════════════════════════════════════════
  const handleDelete = async (id: string) => {
    await removeNotebook(id);
    // Toast handled by NotebookCard (it knows if cascade was needed)
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Notebooks
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your docs workspaces. Each notebook holds sections and pages.
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Notebook
          </Button>
        </div>

        {/* Search */}
        {notebooks.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notebooks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* No search results */}
        {search && filteredNotebooks.length === 0 && notebooks.length > 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No notebooks match "<strong>{search}</strong>"
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Grid */}
        {(!search || filteredNotebooks.length > 0) && (
          <NotebookGrid
            notebooks={filteredNotebooks}
            tags={tags}
            isLoading={isLoading}
            onDelete={handleDelete}
            emptyAction={
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Notebook
                </Button>
                <Button variant="outline" asChild>
                  <Link href={ROUTES.NOTEBOOKS_NEW}>Or import from ZIP</Link>
                </Button>
              </div>
            }
          />
        )}
      </div>

      {/* Create modal */}
      <NewNotebookModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}