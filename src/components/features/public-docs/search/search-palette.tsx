"use client";

/**
 * Search palette — ⌘K modal.
 *
 * Keyboard shortcuts:
 *   - ⌘K / Ctrl+K  → open
 *   - Esc          → close
 *   - ↑ / ↓        → navigate results
 *   - Enter        → open selected result
 *
 * Internal state:
 *   - query: current input
 *   - results: filtered + ranked via Fuse.js
 *   - selectedIdx: keyboard nav cursor
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { DocsTreeNode } from "@/lib/public-docs";
import { useSearchIndex, type SearchablePage } from "./use-search-index";
import { SearchResultItem } from "./search-result-item";
import { cn } from "@/lib/utils";

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: DocsTreeNode[];
  notebookBaseUrl: string;
}

const MAX_RESULTS = 12;

export function SearchPalette({
  open,
  onOpenChange,
  tree,
  notebookBaseUrl,
}: SearchPaletteProps) {
  const router = useRouter();
  const fuse = useSearchIndex(tree, notebookBaseUrl);

  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  // ── Compute results ────────────────────────────────────
  const results = useMemo(() => {
    if (!query.trim()) {
      return [] as Array<{
        item: SearchablePage;
        matches?: ReadonlyArray<{
          indices: ReadonlyArray<readonly [number, number]>;
          key?: string;
        }>;
      }>;
    }
    return fuse.search(query, { limit: MAX_RESULTS });
  }, [fuse, query]);

  // ── Reset selectedIdx when results change ──────────────
  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  // ── Reset query when palette closes ────────────────────
  useEffect(() => {
    if (!open) {
      // Defer to avoid flicker during close animation
      const t = setTimeout(() => {
        setQuery("");
        setSelectedIdx(0);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Open result ────────────────────────────────────────
  const openResult = useCallback(
    (page: SearchablePage) => {
      router.push(page.path);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  // ── Keyboard handler ───────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[selectedIdx];
        if (selected) openResult(selected.item);
      }
    },
    [results, selectedIdx, openResult]
  );

  // ── Scroll selected item into view ─────────────────────
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-result-idx="${selectedIdx}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-xl overflow-hidden top-[20%] translate-y-0"
        onKeyDown={handleKeyDown}
      >
        <VisuallyHidden>
          <DialogTitle>Search documentation</DialogTitle>
        </VisuallyHidden>

        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this notebook…"
            autoFocus
            className="border-0 focus-visible:ring-0 px-0 text-sm flex-1"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={resultsContainerRef}
          className="max-h-[60vh] overflow-y-auto p-2"
          role="listbox"
        >
          {query.trim() === "" ? (
            <EmptyState message="Start typing to search…" />
          ) : results.length === 0 ? (
            <EmptyState
              message={
                <>
                  No results for "<strong>{query}</strong>"
                </>
              }
            />
          ) : (
            <div className="space-y-0.5">
              {results.map((r, i) => {
                // Pick primary match (title preferred, else content)
                const titleMatch = r.matches?.find((m) => m.key === "title");
                const contentMatch = r.matches?.find((m) => m.key === "content");
                const primary = titleMatch ?? contentMatch;
                return (
                  <div key={r.item.id} data-result-idx={i}>
                    <SearchResultItem
                      page={r.item}
                      isActive={i === selectedIdx}
                      matchIndices={primary?.indices}
                      matchKey={primary?.key}
                      onClick={() => openResult(r.item)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center rounded border bg-background px-1 py-0.5 font-mono">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center rounded border bg-background px-1 py-0.5 font-mono">
                  ↵
                </kbd>
                Open
              </span>
            </span>
            <span>
              {results.length} {results.length === 1 ? "result" : "results"}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Empty state
// ============================================================

function EmptyState({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <Search className="h-6 w-6 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
}
