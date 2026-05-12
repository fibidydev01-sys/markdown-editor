"use client";

/**
 * NotebookDndContext — Notion-style EAGER SWAP edition.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHAT CHANGED (Stage 2 polish):
 * ──────────────────────────────────────────────────────────────────
 * BEFORE: position classification (before/after/inside) + reorder
 *         on drag END. User had to bidik posisi presisi.
 *
 * NOW:    `closestCenter` collision detection (forgiving) + reorder
 *         on drag OVER (live). Item literally geser saat di-drag.
 *         User just releases when satisfied — no precision needed.
 *
 * Architecture:
 *   - Parent (notebook page) owns OPTIMISTIC state (pages + sections)
 *   - On dragStart: snapshot original state (for diff later)
 *   - On dragOver: call onLiveSwap callback with the new computed
 *     ordering. Parent updates optimistic state — UI animates.
 *   - On dragEnd: call onCommit with original + final state. Parent
 *     diffs and persists to storage in the background.
 *   - On dragCancel: parent restores from snapshot.
 *
 * Collision detection:
 *   - `closestCenter` ONLY. No `pointerWithin`. The center-distance
 *     algorithm is forgiving: dragged item's center crosses a
 *     neighbor's center → that neighbor becomes `over`. This is the
 *     same algorithm Notion uses.
 *
 * Auto-expand-on-hover (section nesting):
 *   - Hover over a collapsed section for 600ms → parent expands it.
 *   - After expansion, that section's children become valid drop targets.
 *   - This is how you nest sections without a separate gesture.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import type { NotebookPage, NotebookSection } from "@/types/notebook";
import {
  computeLiveSwap,
  computeFinalCommit,
  isDescendantSection,
  type DragItem,
  type OverTarget,
} from "@/lib/notebook/dnd/drop-resolver";
import { DragOverlayCard } from "./drag-overlay-card";

// ============================================================
// Shared context — children consume to know drag state
// ============================================================

interface DndStateContext {
  /** The item currently being dragged (null when idle). */
  activeItem: DragItem | null;
  /** The id of the item the cursor is currently over (null when idle). */
  overId: string | null;
}

const DndStateCtx = createContext<DndStateContext>({
  activeItem: null,
  overId: null,
});

export function useDndState() {
  return useContext(DndStateCtx);
}

// ============================================================
// Provider
// ============================================================

export interface NotebookDndContextProps {
  /** Current optimistic pages — parent passes its `pages` state. */
  pages: NotebookPage[];
  /** Current optimistic sections — parent passes its `sections` state. */
  sections: NotebookSection[];
  /** Page IDs currently selected (for multi-drag). */
  selectedPageIds: string[];

  /**
   * Called on every live swap during dragover. Parent should update
   * its optimistic state to reflect the new ordering. No storage call.
   */
  onLiveSwap: (next: {
    pages: NotebookPage[];
    sections: NotebookSection[];
  }) => void;

  /**
   * Called after the user releases the mouse. Receives the diff
   * between original snapshot and final state. Parent persists.
   */
  onCommit: (updates: {
    pageUpdates: Array<{
      id: string;
      order: number;
      sectionId: string | null;
    }>;
    sectionUpdates: Array<{
      id: string;
      order: number;
      parentId: string | null;
    }>;
  }) => void | Promise<void>;

  /**
   * Called when drag is cancelled (ESC, error). Parent should restore
   * its optimistic state from snapshot.
   */
  onCancel: (snapshot: {
    pages: NotebookPage[];
    sections: NotebookSection[];
  }) => void;

  /**
   * Called when user hovers over a collapsed section for 600ms+.
   * Parent should auto-expand that section so its children become
   * droppable.
   */
  onRequestExpand?: (sectionId: string) => void;

  children: ReactNode;
}

export function NotebookDndContext({
  pages,
  sections,
  selectedPageIds,
  onLiveSwap,
  onCommit,
  onCancel,
  onRequestExpand,
  children,
}: NotebookDndContextProps) {
  // ── Sensors ──────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 5px activation distance prevents accidental drag on click.
      // Lower than that = jittery. Higher = feels sluggish.
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      // Touch: small delay so tap-to-select still works
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Active item state ────────────────────────────────────
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // ── Snapshot for diff/cancel ────────────────────────────
  // Captured on drag start, used on drag end (diff) or cancel (restore).
  const snapshotRef = useRef<{
    pages: NotebookPage[];
    sections: NotebookSection[];
  } | null>(null);

  // Latest pages/sections via ref (always fresh inside event handlers)
  const pagesRef = useRef(pages);
  const sectionsRef = useRef(sections);
  useEffect(() => {
    pagesRef.current = pages;
    sectionsRef.current = sections;
  }, [pages, sections]);

  // ── Auto-expand-on-hover timer ──────────────────────────
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const lastAutoExpandedRef = useRef<string | null>(null);

  // ── Handlers ────────────────────────────────────────────

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as
        | { kind: "page" | "section" }
        | undefined;
      if (!data) return;

      const activeId = String(event.active.id);

      // Multi-page drag: include selected IDs (but only if active is in selection)
      let additionalIds: string[] | undefined;
      if (data.kind === "page" && selectedPageIds.includes(activeId)) {
        additionalIds = selectedPageIds.filter((id) => id !== activeId);
      }

      setActiveItem({
        kind: data.kind,
        id: activeId,
        additionalIds,
      });

      // Snapshot for diff later
      snapshotRef.current = {
        pages: pagesRef.current,
        sections: sectionsRef.current,
      };
    },
    [selectedPageIds]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const newOverId = event.over ? String(event.over.id) : null;
      setOverId(newOverId);

      // ── Auto-expand timer management ──
      if (autoExpandTimerRef.current) {
        clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = null;
      }

      if (
        newOverId &&
        onRequestExpand &&
        newOverId !== lastAutoExpandedRef.current &&
        sectionsRef.current.some((s) => s.id === newOverId)
      ) {
        autoExpandTimerRef.current = setTimeout(() => {
          lastAutoExpandedRef.current = newOverId;
          onRequestExpand(newOverId);
        }, 600);
      }

      // ── Live swap ──
      if (!activeItem || !event.over) return;

      const overData = event.over.data.current as
        | { kind: "page" | "section" | "root" }
        | undefined;
      if (!overData) return;

      // Build typed OverTarget
      const overTarget: OverTarget =
        overData.kind === "root"
          ? { kind: "root" }
          : overData.kind === "section"
            ? { kind: "section", id: newOverId! }
            : { kind: "page", id: newOverId! };

      // Block cycle: section dropping into its own descendant
      if (
        activeItem.kind === "section" &&
        (overTarget.kind === "page" || overTarget.kind === "section") &&
        isDescendantSection(
          activeItem.id,
          overTarget.id,
          sectionsRef.current
        )
      ) {
        return;
      }

      // Compute the new ordering
      const result = computeLiveSwap({
        active: activeItem,
        over: overTarget,
        pages: pagesRef.current,
        sections: sectionsRef.current,
      });

      if (result) {
        onLiveSwap(result);
      }
    },
    [activeItem, onLiveSwap, onRequestExpand]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      // Cleanup timers
      if (autoExpandTimerRef.current) {
        clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = null;
      }
      lastAutoExpandedRef.current = null;

      const snapshot = snapshotRef.current;
      snapshotRef.current = null;

      setActiveItem(null);
      setOverId(null);

      if (!snapshot) return;

      // If no `over` at all (dropped outside any target), the optimistic
      // state still has the last swap applied — but user clearly didn't
      // want to commit. Restore.
      if (!event.over) {
        onCancel(snapshot);
        return;
      }

      // Diff snapshot vs current optimistic state, persist deltas
      const { pageUpdates, sectionUpdates } = computeFinalCommit({
        originalPages: snapshot.pages,
        originalSections: snapshot.sections,
        finalPages: pagesRef.current,
        finalSections: sectionsRef.current,
      });

      if (pageUpdates.length === 0 && sectionUpdates.length === 0) {
        // No-op drop (released at original position)
        return;
      }

      try {
        await onCommit({ pageUpdates, sectionUpdates });
      } catch (err) {
        console.error("[NotebookDndContext] commit error:", err);
        toast.error("Failed to save changes — restoring");
        onCancel(snapshot);
      }
    },
    [onCommit, onCancel]
  );

  const handleDragCancel = useCallback(() => {
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
    lastAutoExpandedRef.current = null;

    const snapshot = snapshotRef.current;
    snapshotRef.current = null;

    setActiveItem(null);
    setOverId(null);

    if (snapshot) {
      onCancel(snapshot);
    }
  }, [onCancel]);

  // ── Active item details for overlay ─────────────────────
  const activeItemDetails = useMemo(() => {
    if (!activeItem) return null;
    if (activeItem.kind === "page") {
      const page = pages.find((p) => p.id === activeItem.id);
      if (!page) return null;
      const count = 1 + (activeItem.additionalIds?.length ?? 0);
      return {
        kind: "page" as const,
        title: page.title || "Untitled",
        count,
      };
    }
    const section = sections.find((s) => s.id === activeItem.id);
    if (!section) return null;
    return {
      kind: "section" as const,
      title: section.name,
    };
  }, [activeItem, pages, sections]);

  // ── Cleanup on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoExpandTimerRef.current) {
        clearTimeout(autoExpandTimerRef.current);
      }
    };
  }, []);

  // ── Context value ───────────────────────────────────────
  const ctxValue: DndStateContext = useMemo(
    () => ({ activeItem, overId }),
    [activeItem, overId]
  );

  return (
    <DndStateCtx.Provider value={ctxValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeItemDetails ? (
            <DragOverlayCard
              kind={activeItemDetails.kind}
              title={activeItemDetails.title}
              count={
                activeItemDetails.kind === "page"
                  ? activeItemDetails.count
                  : undefined
              }
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </DndStateCtx.Provider>
  );
}
