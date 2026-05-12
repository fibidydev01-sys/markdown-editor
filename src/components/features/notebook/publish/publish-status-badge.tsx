"use client";

/**
 * Publish status badge — small pill indicating a notebook is published.
 *
 * Variants:
 *   - "dot"     — minimal green dot + "Published" text (for cards)
 *   - "full"    — pill with icon + text + relative time (for editor)
 *   - "loading" — skeleton while status loads
 */

import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishStatusBadgeProps {
  isPublished: boolean;
  publishedAt?: string | null;
  variant?: "dot" | "full";
  isLoading?: boolean;
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

export function PublishStatusBadge({
  isPublished,
  publishedAt,
  variant = "dot",
  isLoading,
  className,
}: PublishStatusBadgeProps) {
  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      </span>
    );
  }

  if (!isPublished) return null;

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-500",
          className
        )}
        title={
          publishedAt
            ? `Published ${relativeTime(new Date(publishedAt).getTime())}`
            : "Published"
        }
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
        </span>
        Published
      </span>
    );
  }

  // Full variant
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/30 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-500 border border-green-200 dark:border-green-900/50",
        className
      )}
    >
      <Globe className="h-3 w-3" />
      Published
      {publishedAt && (
        <span className="text-green-600/70 dark:text-green-500/70 font-normal">
          · {relativeTime(new Date(publishedAt).getTime())}
        </span>
      )}
    </span>
  );
}
