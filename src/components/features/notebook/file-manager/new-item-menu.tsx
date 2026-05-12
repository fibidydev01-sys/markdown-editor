"use client";

/**
 * New-item menu — dropdown that lets user create a page or section.
 *
 * Triggered from:
 *   - Sidebar header ("+" button)
 *   - Section context menu (create child)
 *   - Empty state CTA
 *
 * Calls back to parent with the chosen action — parent handles
 * creation + opening the new item.
 */

import { FileText, FolderPlus, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewItemMenuProps {
  onCreatePage: () => void;
  onCreateSection: () => void;
  /** Visual variant: compact icon-only button or labeled button. */
  variant?: "icon" | "labeled";
  /** Optional label override when variant="labeled". */
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Optional align for the dropdown content. */
  align?: "start" | "center" | "end";
}

export function NewItemMenu({
  onCreatePage,
  onCreateSection,
  variant = "icon",
  label = "New",
  disabled,
  className,
  align = "end",
}: NewItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", className)}
            disabled={disabled}
            aria-label="Create new item"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={className}
            disabled={disabled}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel className="text-xs">Create new</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreatePage} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          Page
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCreateSection}
          className="cursor-pointer"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          Section
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
