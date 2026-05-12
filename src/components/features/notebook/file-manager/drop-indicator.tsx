"use client";

/**
 * DropIndicator — DEPRECATED in Stage 2 polish.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHY THIS IS NOW A NO-OP:
 * ──────────────────────────────────────────────────────────────────
 * In the Notion-style eager-swap implementation, items literally
 * shift in real-time as you drag — the gap that opens up IS the
 * drop indicator. There's no separate "line between items" to
 * draw, because the items themselves are moving.
 *
 * This file is kept as an exported stub so existing imports
 * (in index.ts) don't break. Safe to delete entirely once you've
 * confirmed nothing else references it.
 */

export interface DropIndicatorProps {
  position?: "before" | "after" | "inside";
  indentPx?: number;
  className?: string;
}

/**
 * No-op component. Returns null. Kept only for backward-compat
 * with the barrel export in `index.ts`.
 */
export function DropIndicator(_props: DropIndicatorProps): null {
  return null;
}
