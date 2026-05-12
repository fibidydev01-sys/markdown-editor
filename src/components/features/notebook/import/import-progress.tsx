"use client";

/**
 * Import progress indicator — shown during ZIP/MD import operations.
 *
 * Displays:
 *   - Current phase (preparing, creating notebook, sections, pages, done)
 *   - Progress bar (current / total)
 *   - Optional message
 */

import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ImportProgress as ImportProgressData } from "@/lib/notebook/import/importer";
import { cn } from "@/lib/utils";

interface ImportProgressProps {
  progress: ImportProgressData;
  className?: string;
}

const PHASE_LABELS: Record<ImportProgressData["phase"], string> = {
  preparing: "Preparing",
  "creating-notebook": "Creating notebook",
  "creating-sections": "Creating sections",
  "creating-pages": "Creating pages",
  cleaning: "Clearing existing content",
  done: "Done",
};

export function ImportProgress({
  progress,
  className,
}: ImportProgressProps) {
  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  const isDone = progress.phase === "done";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm">
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
        )}
        <span className="font-medium">
          {progress.message ?? PHASE_LABELS[progress.phase]}
        </span>
      </div>

      <Progress value={percent} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{PHASE_LABELS[progress.phase]}</span>
        <span>
          {progress.current} / {progress.total} ({percent}%)
        </span>
      </div>
    </div>
  );
}
