"use client";

/**
 * Search trigger — the ⌘K button in the header.
 *
 * Also installs the global ⌘K / Ctrl+K keyboard shortcut listener.
 * Renders the SearchPalette inline (parent doesn't need to manage state).
 */

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { DocsTreeNode } from "@/lib/public-docs";
import { SearchPalette } from "./search-palette";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  tree: DocsTreeNode[];
  notebookBaseUrl: string;
  className?: string;
}

export function SearchTrigger({
  tree,
  notebookBaseUrl,
  className,
}: SearchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Detect platform for keyboard shortcut display
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Search docs"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border bg-card pl-2.5 pr-2 py-1.5 text-xs text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "min-w-[180px] md:min-w-[240px]",
          className
        )}
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search docs…</span>
        <kbd className="hidden sm:inline-flex items-center rounded border bg-muted/50 px-1 py-0.5 text-[10px] font-mono">
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </button>

      <SearchPalette
        open={isOpen}
        onOpenChange={setIsOpen}
        tree={tree}
        notebookBaseUrl={notebookBaseUrl}
      />
    </>
  );
}
