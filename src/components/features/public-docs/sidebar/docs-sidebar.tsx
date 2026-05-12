"use client";

/**
 * Docs sidebar — left TOC container.
 *
 * Renders the full section tree. Server-built tree is passed in via props
 * (so the SSR-rendered HTML matches what client expects post-hydration).
 *
 * Mobile: hidden — the parent wraps this in a `<Sheet>` for mobile via
 * the MobileNav component.
 */

import type { DocsTreeNode } from "@/lib/public-docs";
import { SidebarSection } from "./sidebar-section";
import { SidebarPageLink } from "./sidebar-page-link";
import { cn } from "@/lib/utils";

interface DocsSidebarProps {
  tree: DocsTreeNode[];
  notebookBaseUrl: string;
  notebookName: string;
  notebookIcon: string | null;
  className?: string;
}

export function DocsSidebar({
  tree,
  notebookBaseUrl,
  notebookName,
  notebookIcon,
  className,
}: DocsSidebarProps) {
  return (
    <nav
      aria-label="Documentation"
      className={cn("flex flex-col gap-4 py-4 pr-2", className)}
    >
      {/* Notebook header */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-lg leading-none select-none">
          {notebookIcon || "📓"}
        </span>
        <span className="font-semibold text-sm truncate">{notebookName}</span>
      </div>

      {/* Tree */}
      <div className="flex flex-col gap-0.5" role="tree">
        {tree.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground italic">
            This notebook is empty.
          </p>
        ) : (
          tree.map((node) =>
            node.type === "section" ? (
              <SidebarSection
                key={node.id}
                section={node}
                notebookBaseUrl={notebookBaseUrl}
                depth={0}
              />
            ) : (
              <SidebarPageLink
                key={node.id}
                title={node.title}
                href={`${notebookBaseUrl}/${node.pathSegments.join("/")}`}
                depth={0}
              />
            )
          )
        )}
      </div>
    </nav>
  );
}
