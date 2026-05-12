"use client";

/**
 * Source editor — plain textarea for raw markdown editing.
 *
 * Used as a fallback / power-user mode when the user wants to edit
 * the raw markdown directly. Toggle via editor toolbar.
 *
 * Features:
 *   - Monospace font for code-like feel
 *   - No spell check (markdown syntax tokens trip it up)
 *   - Tab key inserts 2 spaces (not focus shift)
 *   - Auto-resize? NO — fixed scroll within container for stability
 */

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface SourceEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SourceEditor({
  markdown,
  onChange,
  className,
  placeholder = "Write markdown here...",
  autoFocus,
}: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Tab → 2 spaces (no focus shift)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const value = el.value;
        const newValue = value.slice(0, start) + "  " + value.slice(end);
        onChange(newValue);
        // Restore cursor position after React rerender
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
        });
      }
    },
    [onChange]
  );

  return (
    <textarea
      ref={textareaRef}
      value={markdown}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={cn(
        "w-full h-full resize-none p-6 font-mono text-sm leading-relaxed",
        "bg-transparent text-foreground border-none outline-none",
        "placeholder:text-muted-foreground/50",
        className
      )}
    />
  );
}
