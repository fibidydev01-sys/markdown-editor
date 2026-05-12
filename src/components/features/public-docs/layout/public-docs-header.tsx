"use client";

/**
 * Public docs header — sticky top bar.
 *
 * Contents:
 *   - Logo (links to workspace landing `/@username`)
 *   - Search trigger (⌘K)
 *   - Auth-aware button (Dashboard / Edit / nothing)
 *
 * On mobile: also includes a hamburger to open the sidebar sheet.
 * The hamburger is rendered by MobileNav; this component only shows
 * the controls.
 */

import Link from "next/link";
import { Globe } from "lucide-react";
import { SearchTrigger } from "../search";
import { AuthAwareButton } from "../auth-button";
import type { DocsTreeNode } from "@/lib/public-docs";
import { cn } from "@/lib/utils";

interface PublicDocsHeaderProps {
  workspaceUsername: string;
  workspaceDisplayName: string | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  notebookLocalId?: string;
  /** Tree for search palette. Optional — null when on workspace landing page (no notebook context). */
  tree?: DocsTreeNode[];
  /** Notebook base URL for search nav. Optional. */
  notebookBaseUrl?: string;
  /** Slot for mobile sidebar trigger (rendered by parent layout). */
  mobileNavTrigger?: React.ReactNode;
  className?: string;
}

export function PublicDocsHeader({
  workspaceUsername,
  workspaceDisplayName,
  isAuthenticated,
  isOwner,
  notebookLocalId,
  tree,
  notebookBaseUrl,
  mobileNavTrigger,
  className,
}: PublicDocsHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Mobile sidebar trigger */}
        {mobileNavTrigger && (
          <div className="lg:hidden">{mobileNavTrigger}</div>
        )}

        {/* Logo / workspace name */}
        <Link
          href={`/@${workspaceUsername}`}
          className="flex items-center gap-2 font-semibold text-sm hover:text-primary transition-colors min-w-0"
        >
          <Globe className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="truncate">
            {workspaceDisplayName || `@${workspaceUsername}`}
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search — only when we have a notebook tree to search */}
        {tree && notebookBaseUrl && (
          <SearchTrigger
            tree={tree}
            notebookBaseUrl={notebookBaseUrl}
            className="hidden sm:inline-flex"
          />
        )}

        {/* Auth button */}
        <AuthAwareButton
          isAuthenticated={isAuthenticated}
          isOwner={isOwner}
          notebookLocalId={notebookLocalId}
        />
      </div>
    </header>
  );
}
