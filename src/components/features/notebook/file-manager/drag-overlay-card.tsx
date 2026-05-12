"use client";

/**
 * DragOverlayCard — the floating preview that follows the cursor during drag.
 *
 * Rendered inside dnd-kit's `<DragOverlay>` (which handles positioning).
 * This component just renders the visual.
 *
 * Variants:
 *   - Single page    → one card with file icon + title
 *   - Multi-select   → stacked cards (Notion-style: 3 stacked, slight offset)
 *   - Section        → folder icon + name
 *
 * Uses dark shadow + slight rotation/scale to give it "lifted" feel.
 */

import { FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragOverlayCardProps {
  kind: "page" | "section";
  title: string;
  /** For multi-page drag. */
  count?: number;
}

export function DragOverlayCard({
  kind,
  title,
  count = 1,
}: DragOverlayCardProps) {
  const isMulti = kind === "page" && count > 1;

  return (
    <div className="relative pointer-events-none">
      {/* Stacked cards for multi-select (rendered behind) */}
      {isMulti && (
        <>
          <div
            className={cn(
              "absolute inset-0 rounded-md border bg-card shadow-md",
              "translate-x-1.5 translate-y-1.5"
            )}
            style={{ transform: "translate(6px, 6px) rotate(2deg)" }}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-md border bg-card shadow-md"
            )}
            style={{ transform: "translate(3px, 3px) rotate(1deg)" }}
          />
        </>
      )}

      {/* Front card */}
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm",
          "shadow-xl ring-1 ring-primary/30",
          // Slight rotation = "picked up" feel
          "rotate-[-1deg]",
          // Min width so single short titles don't look tiny
          "min-w-[180px] max-w-[280px]"
        )}
      >
        {kind === "section" ? (
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium truncate flex-1 min-w-0">{title}</span>
        {isMulti && (
          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}
