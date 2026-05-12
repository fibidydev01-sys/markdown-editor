"use client";

/**
 * Single search result row — title, section context, content snippet.
 */

import { FileText, FolderClosed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchablePage } from "./use-search-index";

interface SearchResultItemProps {
  page: SearchablePage;
  isActive: boolean;
  /** Optional: highlighted matches from fuse to render in title/snippet. */
  matchIndices?: ReadonlyArray<readonly [number, number]>;
  matchKey?: string;
  onClick: () => void;
}

export function SearchResultItem({
  page,
  isActive,
  matchIndices,
  matchKey,
  onClick,
}: SearchResultItemProps) {
  const titleHighlights =
    matchKey === "title" && matchIndices ? matchIndices : undefined;
  const contentHighlights =
    matchKey === "content" && matchIndices ? matchIndices : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={isActive}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-muted"
      )}
    >
      <FileText
        className={cn(
          "h-4 w-4 flex-shrink-0 mt-0.5",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-foreground" : "text-foreground/90"
            )}
          >
            {renderWithHighlights(page.title, titleHighlights)}
          </span>
          {page.sectionName && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
              <FolderClosed className="h-2.5 w-2.5" />
              {page.sectionName}
            </span>
          )}
        </div>
        {page.content && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {renderWithHighlights(page.content, contentHighlights, 120)}
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * Render text with optional Fuse match indices highlighted via <mark>.
 * If `truncateAround` is set and matches exist, slice around first match.
 */
function renderWithHighlights(
  text: string,
  indices?: ReadonlyArray<readonly [number, number]>,
  truncateAround?: number
): React.ReactNode {
  if (!indices || indices.length === 0) {
    if (truncateAround && text.length > truncateAround) {
      return text.slice(0, truncateAround) + "…";
    }
    return text;
  }

  // For long content snippets, slice around the first match
  let displayText = text;
  let offset = 0;
  if (truncateAround && text.length > truncateAround) {
    const firstMatch = indices[0];
    const start = Math.max(0, firstMatch[0] - 40);
    const end = Math.min(text.length, start + truncateAround);
    displayText = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    offset = start > 0 ? start - 1 : 0; // -1 for "…" character
  }

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  for (let i = 0; i < indices.length; i++) {
    const [origStart, origEnd] = indices[i];
    const start = origStart - offset;
    const end = origEnd - offset;

    if (start < 0 || start >= displayText.length) continue;
    if (start < lastEnd) continue; // skip overlapping

    if (start > lastEnd) {
      parts.push(displayText.slice(lastEnd, start));
    }
    parts.push(
      <mark
        key={i}
        className="bg-primary/20 text-foreground rounded px-0.5"
      >
        {displayText.slice(start, Math.min(end + 1, displayText.length))}
      </mark>
    );
    lastEnd = end + 1;
  }

  if (lastEnd < displayText.length) {
    parts.push(displayText.slice(lastEnd));
  }

  return <>{parts}</>;
}
