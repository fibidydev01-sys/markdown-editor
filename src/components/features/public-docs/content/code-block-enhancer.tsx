"use client";

/**
 * CodeBlockEnhancer — client-side hydration helper.
 *
 * The MarkdownRenderer outputs pre-rendered HTML (string) via
 * dangerouslySetInnerHTML. That means no React event handlers attached
 * to the rendered <pre> elements. This component runs once on mount
 * and walks the DOM to:
 *
 *   1. Add a "Copy" button to every <pre> in the docs prose
 *   2. Make external <a> links open in new tab + safe rel attrs
 *
 * The button is injected as a real DOM element with a click listener
 * (not React-managed). Cleanup happens on unmount.
 *
 * Why this approach?
 *   - Server-rendered HTML is the source of truth (SEO, no flash)
 *   - Client enhancement is progressive (works even if JS fails)
 *   - No React reconciliation cost per markdown render
 */

import { useEffect } from "react";

export function CodeBlockEnhancer() {
  useEffect(() => {
    const proseEl = document.querySelector(".docs-prose");
    if (!proseEl) return;

    const cleanups: Array<() => void> = [];

    // ── 1. Add copy buttons to all <pre> blocks ──
    const preElements = proseEl.querySelectorAll<HTMLPreElement>("pre");
    preElements.forEach((pre) => {
      // Skip if already enhanced (handles re-render)
      if (pre.dataset.copyEnhanced === "true") return;
      pre.dataset.copyEnhanced = "true";

      // Wrap pre in a positioned div if not already
      const parent = pre.parentElement;
      let wrapper: HTMLElement;

      if (parent?.classList.contains("docs-code-wrapper")) {
        wrapper = parent;
      } else {
        wrapper = document.createElement("div");
        wrapper.className = "docs-code-wrapper group relative";
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }

      // Create copy button
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "Copy code");
      button.className = "docs-code-copy";
      button.innerHTML = COPY_ICON_SVG;

      const handleClick = async () => {
        const text = pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          button.innerHTML = CHECK_ICON_SVG;
          button.setAttribute("data-copied", "true");
          setTimeout(() => {
            button.innerHTML = COPY_ICON_SVG;
            button.removeAttribute("data-copied");
          }, 2000);
        } catch (err) {
          console.error("[CodeBlockEnhancer] copy failed:", err);
        }
      };

      button.addEventListener("click", handleClick);
      wrapper.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener("click", handleClick);
      });
    });

    // ── 2. Mark external links to open in new tab ──
    const links = proseEl.querySelectorAll<HTMLAnchorElement>("a[href]");
    links.forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      const isExternal =
        href.startsWith("http://") || href.startsWith("https://");
      if (isExternal && !a.target) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}

// ============================================================
// Inline SVG icons (avoid loading lucide on the public docs critical path)
// ============================================================

const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;