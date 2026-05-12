"use client";

/**
 * useScrollSpy — track which heading is currently in view.
 *
 * Uses IntersectionObserver to watch a list of heading ids. Returns the
 * id of the heading closest to the top of the viewport that's "active"
 * (entered the observable region).
 *
 * Strategy:
 *   - Observe all headings with the given ids
 *   - Track which are currently intersecting
 *   - Active = topmost intersecting heading
 *   - If nothing intersects (e.g. between sections), keep last active
 *
 * The rootMargin is tuned to fire active just before the heading hits
 * the sticky header (top -10%) and stay active until ~70% scrolled past.
 */

import { useEffect, useRef, useState } from "react";

interface UseScrollSpyOptions {
  /** All heading ids to observe (in document order). */
  ids: string[];
  /**
   * Element selector to observe within. Default: `document` (whole page).
   * Pass a CSS selector if your content scrolls in a container.
   */
  rootSelector?: string;
  /** rootMargin for the IntersectionObserver. */
  rootMargin?: string;
}

export function useScrollSpy({
  ids,
  rootSelector,
  rootMargin = "-80px 0px -70% 0px",
}: UseScrollSpyOptions): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const intersectingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (ids.length === 0) {
      setActiveId(null);
      return;
    }

    const root = rootSelector
      ? document.querySelector(rootSelector)
      : null;

    const observer = new IntersectionObserver(
      (entries) => {
        // Update the set of currently intersecting ids
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            intersectingRef.current.add(id);
          } else {
            intersectingRef.current.delete(id);
          }
        }

        if (intersectingRef.current.size === 0) {
          // Nothing intersecting — keep last active (or null if first load)
          return;
        }

        // Find the topmost intersecting heading by document order
        const topmost = ids.find((id) => intersectingRef.current.has(id));
        if (topmost) {
          setActiveId(topmost);
        }
      },
      {
        root,
        rootMargin,
        threshold: [0, 1],
      }
    );

    // Observe each heading
    const elements: HTMLElement[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    }

    // Initialize active = first heading on mount (so something is always lit)
    if (ids.length > 0) {
      setActiveId((prev) => prev ?? ids[0]);
    }

    return () => {
      for (const el of elements) observer.unobserve(el);
      observer.disconnect();
      intersectingRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|"), rootSelector, rootMargin]);

  return activeId;
}
