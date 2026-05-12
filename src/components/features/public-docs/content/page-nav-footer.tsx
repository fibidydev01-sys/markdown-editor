"use client";

/**
 * Page navigation footer — Prev / Next buttons at the bottom of content.
 *
 * Both buttons are full-width cards that show:
 *   - Direction label ("Previous" / "Next")
 *   - Page title
 *   - Arrow icon (left for prev, right for next)
 *
 * If only one direction exists (e.g. first or last page), the missing
 * side gets a spacer so the present side aligns right or left.
 */

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavPage {
  title: string;
  href: string;
}

interface PageNavFooterProps {
  prev: NavPage | null;
  next: NavPage | null;
  className?: string;
}

export function PageNavFooter({ prev, next, className }: PageNavFooterProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Page navigation"
      className={cn(
        "mt-10 pt-6 border-t border-border",
        "grid grid-cols-1 sm:grid-cols-2 gap-3",
        className
      )}
    >
      {prev ? (
        <Link
          href={prev.href}
          className={cn(
            "group flex flex-col gap-1 rounded-lg border bg-card px-4 py-3",
            "transition-colors hover:border-primary/40 hover:bg-muted/30",
            "min-w-0"
          )}
        >
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider">
            <ChevronLeft className="h-3 w-3" />
            Previous
          </span>
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={next.href}
          className={cn(
            "group flex flex-col gap-1 rounded-lg border bg-card px-4 py-3 text-right",
            "transition-colors hover:border-primary/40 hover:bg-muted/30",
            "min-w-0"
          )}
        >
          <span className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground uppercase tracking-wider">
            Next
            <ChevronRight className="h-3 w-3" />
          </span>
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </nav>
  );
}
