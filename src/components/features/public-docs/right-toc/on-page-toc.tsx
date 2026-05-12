"use client";

/**
 * On-page TOC — the right sidebar showing "On this page" with scroll-spy.
 *
 * Hidden on mobile/tablet, shown on `lg:` breakpoint (1024px+).
 * Sticky positioned so it stays visible while scrolling content.
 */

import { useMemo } from "react";
import type { TocNode } from "@/lib/public-docs";
import { TocTree } from "./toc-tree";
import { useScrollSpy } from "./use-scroll-spy";
import { cn } from "@/lib/utils";

interface OnPageTocProps {
  tocTree: TocNode[];
  className?: string;
}

export function OnPageToc({ tocTree, className }: OnPageTocProps) {
  // Flatten all heading ids in document order for scroll-spy
  const allIds = useMemo(() => {
    const ids: string[] = [];
    function walk(nodes: TocNode[]) {
      for (const n of nodes) {
        ids.push(n.id);
        walk(n.children);
      }
    }
    walk(tocTree);
    return ids;
  }, [tocTree]);

  const activeId = useScrollSpy({ ids: allIds });

  if (tocTree.length === 0) return null;

  return (
    <aside
      aria-label="On this page"
      className={cn(
        "sticky top-16 pt-4",
        "max-h-[calc(100vh-4rem)] overflow-y-auto",
        className
      )}
    >
      <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-3 px-2">
        On this page
      </p>
      <TocTree nodes={tocTree} activeId={activeId} />
    </aside>
  );
}
