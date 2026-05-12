"use client";

/**
 * Auth-aware header button — per roadmap D3.
 *
 * Visitor type             | Renders
 * -------------------------|------------------------------------------
 * Anonymous (no session)   | Nothing
 * Logged in (any user)     | "Dashboard" link
 * Owner of these docs      | "Dashboard" + "Edit this notebook"
 *
 * The owner check is done server-side and passed via props to avoid
 * client-side flash of unstyled state.
 */

import Link from "next/link";
import { LayoutDashboard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

interface AuthAwareButtonProps {
  /** True if a user session exists (any user). */
  isAuthenticated: boolean;
  /** True if the authenticated user owns this workspace. */
  isOwner: boolean;
  /** Local IndexedDB notebook id — used for the Edit link target. Optional. */
  notebookLocalId?: string;
}

export function AuthAwareButton({
  isAuthenticated,
  isOwner,
  notebookLocalId,
}: AuthAwareButtonProps) {
  if (!isAuthenticated) {
    // Anonymous: nothing (per D3 — login lives at /login, not in docs header)
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isOwner && notebookLocalId && (
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.NOTEBOOK_DETAIL(notebookLocalId)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
      )}
      <Button asChild variant="default" size="sm">
        <Link href={ROUTES.DASHBOARD}>
          <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </Button>
    </div>
  );
}
