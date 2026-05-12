"use client";

/**
 * TOC tree — renders the heading hierarchy in the right TOC.
 *
 * Active heading is highlighted (via scroll-spy state passed in).
 * Click → smooth-scroll to anchor + push hash to URL (no full reload).
 */

import type { TocNode } from "@/lib/public-docs";
import { cn } from "@/lib/utils";

interface TocTreeProps {
  nodes: TocNode[];
  activeId: string | null;
}

export function TocTree({ nodes, activeId }: TocTreeProps) {
  if (nodes.length === 0) return null;

  return (
    <ul className="space-y-1 text-xs">
      {nodes.map((node) => (
        <TocItem key={node.id} node={node} activeId={activeId} depth={0} />
      ))}
    </ul>
  );
}

interface TocItemProps {
  node: TocNode;
  activeId: string | null;
  depth: number;
}

function TocItem({ node, activeId, depth }: TocItemProps) {
  const isActive = node.id === activeId;
  const isAncestorActive =
    !isActive && node.children.some((c) => c.id === activeId);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(node.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL hash without forcing a re-scroll
      history.replaceState(null, "", `#${node.id}`);
    }
  };

  return (
    <li>
      <a
        href={`#${node.id}`}
        onClick={handleClick}
        className={cn(
          "block py-0.5 transition-colors leading-snug",
          isActive
            ? "text-foreground font-medium border-l-2 border-primary pl-2 -ml-[2px]"
            : isAncestorActive
            ? "text-foreground/80 hover:text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + (isActive ? 8 : 10)}px` }}
      >
        {node.text}
      </a>
      {node.children.length > 0 && (
        <ul className="mt-0.5">
          {node.children.map((child) => (
            <TocItem
              key={child.id}
              node={child}
              activeId={activeId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
