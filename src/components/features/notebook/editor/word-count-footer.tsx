"use client";

/**
 * Word count footer — sticky footer at the bottom of the editor.
 *
 * Shows word + character count. Toggle visibility via eye icon.
 * Visibility preference persisted via NotebookSettings.showWordCount.
 */

import { useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordCountFooterProps {
  markdown: string;
  visible: boolean;
  onToggleVisible: () => void;
  className?: string;
}

export function WordCountFooter({
  markdown,
  visible,
  onToggleVisible,
  className,
}: WordCountFooterProps) {
  const { wordCount, charCount } = useMemo(() => {
    const words = markdown.split(/\s+/).filter(Boolean).length;
    const chars = markdown.length;
    return { wordCount: words, charCount: chars };
  }, [markdown]);

  return (
    <div
      className={cn(
        "flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-t bg-card text-[10px] text-muted-foreground",
        className
      )}
    >
      {visible ? (
        <span>
          {wordCount.toLocaleString()}{" "}
          {wordCount === 1 ? "word" : "words"}
          <span className="mx-1.5 opacity-40">·</span>
          {charCount.toLocaleString()}{" "}
          {charCount === 1 ? "char" : "chars"}
        </span>
      ) : (
        <span />
      )}

      <button
        type="button"
        onClick={onToggleVisible}
        className="p-0.5 rounded hover:bg-muted transition-colors opacity-60 hover:opacity-100"
        aria-label={visible ? "Hide word count" : "Show word count"}
        title={visible ? "Hide word count" : "Show word count"}
      >
        {visible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
