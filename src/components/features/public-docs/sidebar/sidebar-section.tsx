"use client";

/**
 * Sidebar section — recursive section row.
 *
 * Click to expand/collapse. Auto-expanded if any descendant is active.
 * Sections themselves don't link to anything (sections aren't pages).
 */

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import type { DocsSectionNode, DocsTreeNode } from "@/lib/public-docs";
import { SidebarPageLink } from "./sidebar-page-link";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  section: DocsSectionNode;
  /** Base URL for the notebook (without trailing slash). */
  notebookBaseUrl: string;
  /** Depth from notebook root. */
  depth: number;
}

export function SidebarSection({
  section,
  notebookBaseUrl,
  depth,
}: SidebarSectionProps) {
  const pathname = usePathname();

  // Check if any descendant page is the currently active path
  const containsActive = useMemo(() => {
    const sectionUrl = `${notebookBaseUrl}/${section.pathSegments.join("/")}`;
    return pathname.startsWith(sectionUrl + "/");
  }, [pathname, section.pathSegments, notebookBaseUrl]);

  // Default to expanded if section is on the active path
  const [isExpanded, setIsExpanded] = useState(containsActive);

  // Re-expand if active path changes and this section now contains it
  // (Avoids the section being collapsed when user navigates from elsewhere)
  useMemo(() => {
    if (containsActive && !isExpanded) {
      setIsExpanded(true);
    }
    // We intentionally only react to containsActive flipping to true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containsActive]);

  const hasChildren = section.children.length > 0;

  return (
    <div role="treeitem" aria-expanded={isExpanded}>
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-1 rounded-md py-1 pr-2 text-sm font-medium transition-colors",
          "text-foreground hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        )}
        <span className="truncate min-w-0 text-left">{section.name}</span>
      </button>

      {isExpanded && hasChildren && (
        <div role="group">
          {section.children.map((child) =>
            renderChild(child, notebookBaseUrl, depth + 1)
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Render helper (handles both section + page children)
// ============================================================

function renderChild(
  node: DocsTreeNode,
  notebookBaseUrl: string,
  depth: number
) {
  if (node.type === "section") {
    return (
      <SidebarSection
        key={node.id}
        section={node}
        notebookBaseUrl={notebookBaseUrl}
        depth={depth}
      />
    );
  }

  return (
    <SidebarPageLink
      key={node.id}
      title={node.title}
      href={`${notebookBaseUrl}/${node.pathSegments.join("/")}`}
      depth={depth}
    />
  );
}
