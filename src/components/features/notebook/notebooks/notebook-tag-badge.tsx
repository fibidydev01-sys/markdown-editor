"use client";

/**
 * Notebook tag badge — small pill showing tag name with its color.
 */

import type { NotebookTag } from "@/types/notebook";
import { cn } from "@/lib/utils";

interface NotebookTagBadgeProps {
  tag: NotebookTag;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}

export function NotebookTagBadge({
  tag,
  size = "sm",
  onClick,
  className,
}: NotebookTagBadgeProps) {
  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium leading-none transition-colors",
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        isClickable && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{
        backgroundColor: `${tag.color}1a`, // 10% opacity bg
        color: tag.color,
      }}
    >
      <span
        className={cn(
          "rounded-full",
          size === "sm" && "h-1.5 w-1.5",
          size === "md" && "h-2 w-2"
        )}
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  );
}
