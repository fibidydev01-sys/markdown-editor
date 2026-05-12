"use client";

/**
 * Page card — alternative grid view of a page (vs sidebar list view).
 *
 * Used in:
 *   - Notebook empty state (when no page is selected)
 *   - Future "browse all pages" view
 *
 * Shows: title, content preview, section name, last updated.
 */

import { FileText, FolderClosed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { NotebookPage, NotebookSection } from "@/types/notebook";
import { cn } from "@/lib/utils";

interface PageCardProps {
  page: NotebookPage;
  /** Optional — show parent section name. */
  section?: NotebookSection | null;
  /** Is this page currently active in the editor? */
  isActive?: boolean;
  onClick?: (page: NotebookPage) => void;
  className?: string;
}

function relativeTime(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function stripMarkdown(md: string, maxLen = 120): string {
  const cleaned = md
    .replace(/^---[\s\S]*?---/m, "") // strip frontmatter
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/[*_~`>[\]()!|\\-]/g, "") // markdown chars
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxLen
    ? cleaned.slice(0, maxLen).trim() + "…"
    : cleaned;
}

export function PageCard({
  page,
  section,
  isActive,
  onClick,
  className,
}: PageCardProps) {
  const preview = stripMarkdown(page.content);

  return (
    <Card
      onClick={() => onClick?.(page)}
      className={cn(
        "h-full transition-all cursor-pointer",
        isActive
          ? "border-primary shadow-md ring-1 ring-primary"
          : "hover:shadow-md hover:border-foreground/20",
        className
      )}
    >
      <CardContent className="pt-5 space-y-3">
        {/* Title */}
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1 min-w-0">
            {page.title || "Untitled"}
          </h3>
        </div>

        {/* Preview */}
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {preview || (
            <span className="italic opacity-60">No content yet</span>
          )}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1 min-w-0">
            {section ? (
              <>
                <FolderClosed className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{section.name}</span>
              </>
            ) : (
              <span className="italic opacity-60">Root</span>
            )}
          </span>
          <span className="flex-shrink-0">{relativeTime(page.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
