"use client";

/**
 * Sidebar page link — single page row in the left TOC.
 * Active highlighting based on current pathname match.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarPageLinkProps {
  title: string;
  href: string;
  /** Depth from notebook root (for indentation). */
  depth: number;
}

export function SidebarPageLink({
  title,
  href,
  depth,
}: SidebarPageLinkProps) {
  const pathname = usePathname();
  // Match: exact path OR path with trailing /
  const isActive = pathname === href || pathname === href + "/";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md py-1 pr-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <FileText className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
      <span className="truncate min-w-0">{title}</span>
    </Link>
  );
}
