"use client";

/**
 * Editor toolbar — sits at the top of the editor.
 *
 * Contains:
 *   - Title input (separate from content)
 *   - Save status indicator (Saving... / Saved)
 *   - Mode toggle (Visual ↔ Source)
 *
 * The title is a controlled input. Parent owns the value & save scheduling.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Eye, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type EditorMode = "visual" | "source";

interface EditorToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  /** Save indicator state. */
  isSaving?: boolean;
  /** Show "saved X ago" relative time. */
  lastSavedAt?: number;
  /** Hide entire toolbar (e.g. for printing). */
  hidden?: boolean;
  className?: string;
}

export function EditorToolbar({
  title,
  onTitleChange,
  mode,
  onModeChange,
  isSaving,
  lastSavedAt,
  hidden,
  className,
}: EditorToolbarProps) {
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const lastSavedAtRef = useRef(lastSavedAt);

  // Show "Saved" indicator briefly when lastSavedAt changes
  useEffect(() => {
    if (lastSavedAt && lastSavedAt !== lastSavedAtRef.current) {
      lastSavedAtRef.current = lastSavedAt;
      setShowSavedIndicator(true);
      const timer = setTimeout(() => setShowSavedIndicator(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastSavedAt]);

  if (hidden) return null;

  return (
    <div
      className={cn(
        "flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 border-b bg-card",
        className
      )}
    >
      {/* Title input — flex-1, truncates on mobile */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled"
        className={cn(
          "flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-medium",
          "text-foreground placeholder:text-muted-foreground/60",
          "focus:outline-none"
        )}
        aria-label="Page title"
      />

      {/* Save status */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-[60px] justify-end">
        {isSaving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Saving…</span>
          </>
        ) : showSavedIndicator ? (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span className="hidden sm:inline">Saved</span>
          </>
        ) : null}
      </div>

      {/* Mode toggle — segmented control */}
      <div className="flex items-center rounded-md border overflow-hidden flex-shrink-0">
        <button
          type="button"
          onClick={() => onModeChange("visual")}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors",
            mode === "visual"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-pressed={mode === "visual"}
          aria-label="Visual editor"
          title="Visual editor"
        >
          <Eye className="h-3 w-3" />
          <span className="hidden sm:inline">Visual</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("source")}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors",
            mode === "source"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-pressed={mode === "source"}
          aria-label="Source editor"
          title="Raw markdown source"
        >
          <Code2 className="h-3 w-3" />
          <span className="hidden sm:inline">Source</span>
        </button>
      </div>
    </div>
  );
}
