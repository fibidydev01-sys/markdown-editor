/**
 * Drop action resolver — Notion-style EAGER SWAP edition.
 *
 * ──────────────────────────────────────────────────────────────────
 * WHY THIS WAS REWRITTEN (Stage 2 polish):
 * ──────────────────────────────────────────────────────────────────
 * Previous version classified pointer position into before/after/inside
 * (30/40/30 split for sections, 50/50 for pages) and applied the move
 * ONLY on `onDragEnd`. The cursor had to be presisi — meleset 1px →
 * drop di tempat salah.
 *
 * Notion / Linear / Google Drive pattern is different:
 *   - Cursor enters another item's center → list reorders IMMEDIATELY
 *   - On release → just commit final state
 *   - No "before/after" classification needed; arrayMove handles it
 *
 * So this module now exports two flavors:
 *
 *   1. `computeLiveSwap()` — called from onDragOver. Pure: given
 *      active id + over id + current ordered list, returns the new
 *      ordered list. UI updates instantly (optimistic).
 *
 *   2. `computeFinalCommit()` — called from onDragEnd. Diffs the
 *      optimistic snapshot vs original to produce storage updates
 *      (order + sectionId/parentId per moved item).
 *
 * Cross-container (page from Section A → Section B):
 *   - When `over` is a section's droppable body (not a page within),
 *     we move the dragged page to the END of that section's pages.
 *   - When `over` is a page in another section, we insert at that
 *     page's position (effectively swapping into the new section).
 *
 * Section nesting (page-list-item is page, section-node is section):
 *   - Dropping a SECTION onto another section's body (not a child) →
 *     handled by the SectionNode's auto-expand-on-hover (600ms). After
 *     expansion, the target section's children become valid drop zones.
 *   - Direct drop onto a section's row = sibling swap (eager).
 *
 * Cycle prevention:
 *   - Sections can't be moved into their own descendants. Checked here.
 */

import type { NotebookPage, NotebookSection } from "@/types/notebook";

// ============================================================
// Types
// ============================================================

/** What's currently being dragged. */
export interface DragItem {
  kind: "page" | "section";
  id: string;
  /** For multi-page drag (kind="page" only). */
  additionalIds?: string[];
}

/** What the cursor is currently hovering over. */
export type OverTarget =
  | { kind: "page"; id: string }
  | { kind: "section"; id: string }
  | { kind: "root" };

// ============================================================
// LIVE SWAP — pure function, called from onDragOver
// ============================================================

/**
 * Compute the new ordering after a live drag-over event.
 *
 * Returns null if no swap should happen (over is the active item itself,
 * cycle detected, etc.).
 *
 * Otherwise returns the new arrays of pages + sections with updated
 * `order` + `sectionId`/`parentId` fields. Caller swaps these into
 * its optimistic state — no storage write yet.
 */
export function computeLiveSwap(args: {
  active: DragItem;
  over: OverTarget;
  pages: NotebookPage[];
  sections: NotebookSection[];
}): { pages: NotebookPage[]; sections: NotebookSection[] } | null {
  const { active, over, pages, sections } = args;

  // No-op: hovering over yourself
  if (
    (over.kind === "page" || over.kind === "section") &&
    over.id === active.id
  ) {
    return null;
  }

  if (active.kind === "page") {
    return swapPage(active, over, pages, sections);
  }

  if (active.kind === "section") {
    return swapSection(active, over, pages, sections);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// PAGE swap
// ─────────────────────────────────────────────────────────────

function swapPage(
  active: DragItem,
  over: OverTarget,
  pages: NotebookPage[],
  sections: NotebookSection[]
): { pages: NotebookPage[]; sections: NotebookSection[] } | null {
  const draggedIds = [active.id, ...(active.additionalIds ?? [])];
  const draggedSet = new Set(draggedIds);

  // Resolve target sectionId + insertion index
  let targetSectionId: string | null;
  let insertIndex: number;

  if (over.kind === "root") {
    targetSectionId = null;
    // Append to end of root pages (excluding dragged ones)
    insertIndex = pages.filter(
      (p) => p.sectionId === null && !draggedSet.has(p.id)
    ).length;
  } else if (over.kind === "section") {
    // Page dropped onto a section row → enter that section, append
    targetSectionId = over.id;
    insertIndex = pages.filter(
      (p) => p.sectionId === over.id && !draggedSet.has(p.id)
    ).length;
  } else {
    // over.kind === "page"
    const overPage = pages.find((p) => p.id === over.id);
    if (!overPage) return null;
    targetSectionId = overPage.sectionId;

    // Insertion index = position of over-page among remaining siblings.
    const siblings = pages
      .filter(
        (p) => p.sectionId === overPage.sectionId && !draggedSet.has(p.id)
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const overIdx = siblings.findIndex((p) => p.id === over.id);
    if (overIdx === -1) return null;
    insertIndex = overIdx;
  }

  // Sanity check: active page must exist
  const activePage = pages.find((p) => p.id === active.id);
  if (!activePage) return null;

  // Build the new ordered list for the TARGET section
  const remaining = pages
    .filter(
      (p) => p.sectionId === targetSectionId && !draggedSet.has(p.id)
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Preserve the dragged pages' relative order
  const draggedPages = draggedIds
    .map((id) => pages.find((p) => p.id === id))
    .filter((p): p is NotebookPage => p !== undefined)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const clampedIdx = Math.max(0, Math.min(insertIndex, remaining.length));
  const reordered = [
    ...remaining.slice(0, clampedIdx),
    ...draggedPages,
    ...remaining.slice(clampedIdx),
  ];

  // Check if anything changed (quick equality on ids in target section)
  const before = pages
    .filter((p) => p.sectionId === targetSectionId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => p.id);
  const after = reordered.map((p) => p.id);
  const sourceSectionChanged = draggedPages.some(
    (p) => p.sectionId !== targetSectionId
  );

  if (!sourceSectionChanged && arrayShallowEqual(before, after)) {
    return null;
  }

  // Build the new pages array:
  //   - Pages in target section: reordered with new orders
  //   - Pages in source section(s) (if cross-section): shifted to fill gaps
  //   - Pages elsewhere: untouched
  const newPages: NotebookPage[] = [];
  const reorderedIds = new Set(reordered.map((p) => p.id));

  // Apply target section updates
  reordered.forEach((p, i) => {
    newPages.push({
      ...p,
      sectionId: targetSectionId,
      order: i + 1,
    });
  });

  // Pages NOT in target section: keep as-is, re-number per section to plug gaps
  const sourceSectionIds = new Set<string | null>(
    draggedPages.map((p) => p.sectionId)
  );

  // Group remaining pages by section
  const pagesBySection = new Map<string | null, NotebookPage[]>();
  for (const p of pages) {
    if (reorderedIds.has(p.id)) continue;
    if (p.sectionId === targetSectionId) continue; // already handled
    const key = p.sectionId;
    if (!pagesBySection.has(key)) pagesBySection.set(key, []);
    pagesBySection.get(key)!.push(p);
  }

  for (const [secId, list] of pagesBySection.entries()) {
    const sorted = list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (sourceSectionIds.has(secId)) {
      // Re-number to fill gaps left by departed pages
      sorted.forEach((p, i) => {
        newPages.push({ ...p, order: i + 1 });
      });
    } else {
      // Untouched
      for (const p of sorted) newPages.push(p);
    }
  }

  return { pages: newPages, sections };
}

// ─────────────────────────────────────────────────────────────
// SECTION swap
// ─────────────────────────────────────────────────────────────

function swapSection(
  active: DragItem,
  over: OverTarget,
  pages: NotebookPage[],
  sections: NotebookSection[]
): { pages: NotebookPage[]; sections: NotebookSection[] } | null {
  // Resolve target parentId + insertion index
  let targetParentId: string | null;
  let insertIndex: number;

  if (over.kind === "root") {
    targetParentId = null;
    insertIndex = sections.filter(
      (s) => s.parentId === null && s.id !== active.id
    ).length;
  } else if (over.kind === "page") {
    // Section dropped onto a page → become sibling at page's section level
    const overPage = pages.find((p) => p.id === over.id);
    if (!overPage) return null;
    targetParentId = overPage.sectionId;
    // Place at end of sibling sections at that level
    insertIndex = sections.filter(
      (s) => s.parentId === targetParentId && s.id !== active.id
    ).length;
  } else {
    // over.kind === "section"
    const overSection = sections.find((s) => s.id === over.id);
    if (!overSection) return null;

    // Cycle check: can't move section into its descendant
    if (isDescendantSection(active.id, over.id, sections)) {
      return null;
    }

    // Default behavior: become sibling of over-section (eager swap pattern).
    // Nesting (becoming a child) happens via the auto-expand-on-hover
    // mechanism in section-node.tsx — once a section is expanded, its
    // body becomes a separate droppable target.
    targetParentId = overSection.parentId;
    const siblings = sections
      .filter(
        (s) => s.parentId === overSection.parentId && s.id !== active.id
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const overIdx = siblings.findIndex((s) => s.id === over.id);
    if (overIdx === -1) return null;
    insertIndex = overIdx;
  }

  // Build the new ordered list for the TARGET parent
  const remaining = sections
    .filter((s) => s.parentId === targetParentId && s.id !== active.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const activeSection = sections.find((s) => s.id === active.id);
  if (!activeSection) return null;

  const clampedIdx = Math.max(0, Math.min(insertIndex, remaining.length));
  const reordered = [
    ...remaining.slice(0, clampedIdx),
    activeSection,
    ...remaining.slice(clampedIdx),
  ];

  // Early exit if no change
  const before = sections
    .filter((s) => s.parentId === targetParentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => s.id);
  const after = reordered.map((s) => s.id);
  const parentChanged = activeSection.parentId !== targetParentId;

  if (!parentChanged && arrayShallowEqual(before, after)) {
    return null;
  }

  // Build new sections array
  const newSections: NotebookSection[] = [];
  const reorderedIds = new Set(reordered.map((s) => s.id));

  // Apply target parent updates
  reordered.forEach((s, i) => {
    newSections.push({
      ...s,
      parentId: targetParentId,
      order: i + 1,
    });
  });

  // Sections at other levels: re-number per parent group if source changed
  const sourceParentId = activeSection.parentId;
  const sectionsByParent = new Map<string | null, NotebookSection[]>();
  for (const s of sections) {
    if (reorderedIds.has(s.id)) continue;
    if (s.parentId === targetParentId) continue;
    const key = s.parentId;
    if (!sectionsByParent.has(key)) sectionsByParent.set(key, []);
    sectionsByParent.get(key)!.push(s);
  }

  for (const [parentId, list] of sectionsByParent.entries()) {
    const sorted = list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (parentId === sourceParentId) {
      sorted.forEach((s, i) => {
        newSections.push({ ...s, order: i + 1 });
      });
    } else {
      for (const s of sorted) newSections.push(s);
    }
  }

  return { pages, sections: newSections };
}

// ─────────────────────────────────────────────────────────────
// SECTION nesting via hover-expand
// ─────────────────────────────────────────────────────────────

/**
 * Handle a drop into a section's BODY (after auto-expand-on-hover).
 *
 * When a section is expanded mid-drag (because user hovered over it
 * for 600ms+), its body becomes a droppable target with id
 * `section-body:${sectionId}`. Dropping there means:
 *   - For pages: move page INTO this section as a child
 *   - For sections: move section INTO this section as a child
 *
 * This is separate from `computeLiveSwap` because we don't want it
 * firing during normal drag-over (would cause unstable swapping
 * between "sibling" and "child" interpretations).
 */
export function computeNestInside(args: {
  active: DragItem;
  targetSectionId: string;
  pages: NotebookPage[];
  sections: NotebookSection[];
}): { pages: NotebookPage[]; sections: NotebookSection[] } | null {
  const { active, targetSectionId, pages, sections } = args;

  if (active.kind === "page") {
    return swapPage(
      active,
      { kind: "section", id: targetSectionId },
      pages,
      sections
    );
  }

  if (active.kind === "section") {
    // Cycle check
    if (
      active.id === targetSectionId ||
      isDescendantSection(active.id, targetSectionId, sections)
    ) {
      return null;
    }

    const activeSection = sections.find((s) => s.id === active.id);
    if (!activeSection) return null;

    // Move to end of target section's children
    const childSections = sections
      .filter((s) => s.parentId === targetSectionId && s.id !== active.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const newSections: NotebookSection[] = [];
    const moved: NotebookSection = {
      ...activeSection,
      parentId: targetSectionId,
      order: childSections.length + 1,
    };

    // Update children at target
    childSections.forEach((s, i) => {
      newSections.push({ ...s, order: i + 1 });
    });
    newSections.push(moved);

    // Rest, re-numbered if source parent
    const sourceParentId = activeSection.parentId;
    const sectionsByParent = new Map<string | null, NotebookSection[]>();
    const targetIds = new Set([...childSections.map((s) => s.id), active.id]);
    for (const s of sections) {
      if (targetIds.has(s.id)) continue;
      const key = s.parentId;
      if (!sectionsByParent.has(key)) sectionsByParent.set(key, []);
      sectionsByParent.get(key)!.push(s);
    }

    for (const [parentId, list] of sectionsByParent.entries()) {
      const sorted = list
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (parentId === sourceParentId) {
        sorted.forEach((s, i) => {
          newSections.push({ ...s, order: i + 1 });
        });
      } else {
        for (const s of sorted) newSections.push(s);
      }
    }

    return { pages, sections: newSections };
  }

  return null;
}

// ============================================================
// FINAL COMMIT — diff vs original to produce storage updates
// ============================================================

/**
 * After the user releases the mouse, diff the optimistic state vs
 * the original to figure out which records actually need to be
 * persisted to storage.
 *
 * Returns minimal updates (only rows whose order or parent/section
 * changed) so the storage layer doesn't do unnecessary writes.
 */
export function computeFinalCommit(args: {
  originalPages: NotebookPage[];
  originalSections: NotebookSection[];
  finalPages: NotebookPage[];
  finalSections: NotebookSection[];
}): {
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
} {
  const { originalPages, originalSections, finalPages, finalSections } = args;

  const origPageMap = new Map(originalPages.map((p) => [p.id, p]));
  const origSectionMap = new Map(
    originalSections.map((s) => [s.id, s])
  );

  const pageUpdates: Array<{
    id: string;
    order: number;
    sectionId: string | null;
  }> = [];

  for (const p of finalPages) {
    const orig = origPageMap.get(p.id);
    if (!orig) continue;
    if (
      orig.order !== p.order ||
      orig.sectionId !== p.sectionId
    ) {
      pageUpdates.push({
        id: p.id,
        order: p.order ?? 1,
        sectionId: p.sectionId,
      });
    }
  }

  const sectionUpdates: Array<{
    id: string;
    order: number;
    parentId: string | null;
  }> = [];

  for (const s of finalSections) {
    const orig = origSectionMap.get(s.id);
    if (!orig) continue;
    if (orig.order !== s.order || orig.parentId !== s.parentId) {
      sectionUpdates.push({
        id: s.id,
        order: s.order ?? 1,
        parentId: s.parentId,
      });
    }
  }

  return { pageUpdates, sectionUpdates };
}

// ============================================================
// Helpers
// ============================================================

/**
 * True if `candidate` equals `sectionId` or is a descendant of it.
 * Used to block cycle-creating drops.
 */
export function isDescendantSection(
  sectionId: string,
  candidate: string,
  allSections: NotebookSection[]
): boolean {
  if (sectionId === candidate) return true;

  const descendants = new Set<string>([sectionId]);
  let added = true;
  while (added) {
    added = false;
    for (const s of allSections) {
      if (
        s.parentId &&
        descendants.has(s.parentId) &&
        !descendants.has(s.id)
      ) {
        descendants.add(s.id);
        added = true;
      }
    }
  }
  return descendants.has(candidate);
}

function arrayShallowEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
