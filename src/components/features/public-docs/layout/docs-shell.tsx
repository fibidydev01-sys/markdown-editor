/**
 * Docs shell — the 3-column layout used by notebook pages.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Header (sticky)                                              │
 *   ├──────────────┬────────────────────────────────┬──────────────┤
 *   │              │                                │              │
 *   │  Left TOC    │   Content (max-w-3xl, ~800px) │  Right TOC   │
 *   │  (260px)     │                                │  (240px)     │
 *   │  hidden lg-  │                                │  hidden lg-  │
 *   │              │                                │              │
 *   └──────────────┴────────────────────────────────┴──────────────┘
 *
 * This is a server component — just structural wrapping.
 */

import { cn } from "@/lib/utils";

interface DocsShellProps {
  /** Header rendered above the 3 columns. */
  header: React.ReactNode;
  /** Left sidebar — typically <DocsSidebar />. */
  sidebar: React.ReactNode;
  /** Right TOC — typically <OnPageToc />. Optional (workspace landing has no TOC). */
  rightToc?: React.ReactNode;
  /** Main content (markdown). */
  children: React.ReactNode;
}

export function DocsShell({
  header,
  sidebar,
  rightToc,
  children,
}: DocsShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {header}

      <div className="flex-1 w-full">
        <div className="mx-auto flex w-full max-w-screen-2xl gap-6 px-4 sm:px-6">
          {/* Left sidebar — desktop only */}
          <aside
            className={cn(
              "hidden lg:block",
              "w-[260px] flex-shrink-0",
              "sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto"
            )}
          >
            {sidebar}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 py-8 max-w-3xl">
            {children}
          </main>

          {/* Right TOC — desktop only */}
          {rightToc && (
            <aside className="hidden xl:block w-[240px] flex-shrink-0">
              {rightToc}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
