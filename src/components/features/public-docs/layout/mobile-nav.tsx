"use client";

/**
 * Mobile nav — hamburger trigger that opens the docs sidebar in a Sheet.
 *
 * The sidebar content (DocsSidebar) is the same component shown on
 * desktop; we just wrap it in a Sheet for mobile.
 */

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DocsSidebar } from "../sidebar";
import type { DocsTreeNode } from "@/lib/public-docs";

interface MobileNavProps {
  tree: DocsTreeNode[];
  notebookBaseUrl: string;
  notebookName: string;
  notebookIcon: string | null;
}

export function MobileNav({
  tree,
  notebookBaseUrl,
  notebookName,
  notebookIcon,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation"
        className="h-8 w-8"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="p-0 w-[85vw] sm:w-80">
        <VisuallyHidden>
          <SheetTitle>Documentation navigation</SheetTitle>
        </VisuallyHidden>
        <div
          className="overflow-y-auto h-full"
          onClick={(e) => {
            // Close sheet when a link is clicked
            const target = e.target as HTMLElement;
            if (target.closest("a")) {
              setIsOpen(false);
            }
          }}
        >
          <DocsSidebar
            tree={tree}
            notebookBaseUrl={notebookBaseUrl}
            notebookName={notebookName}
            notebookIcon={notebookIcon}
            className="px-3"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
