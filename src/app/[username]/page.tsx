/**
 * /@[username] — workspace landing page.
 *
 * Server component. Renders:
 *   - Workspace header (display name + username)
 *   - Grid of published notebook cards (each linking to /@user/slug)
 *   - "No published notebooks yet" empty state if applicable
 *   - Auth-aware header (no notebook context, so no search)
 *
 * ───────────────────────────────────────────────────────────
 * CACHING (Phase Fix):
 * ───────────────────────────────────────────────────────────
 * `force-dynamic` ensures every request fetches fresh data from
 * Supabase. This prevents the "unpublished notebook still accessible"
 * + hydration mismatch bug.
 *
 * For published notebooks, revalidatePath() in the API routes is
 * still our primary mechanism — this is defense-in-depth.
 *
 * Performance impact: minimal. Supabase queries are fast (<100ms),
 * and the workspace landing only fetches summary fields.
 *
 * If you need to scale to 1000s of req/s, switch to ISR with
 * revalidate=60 + revalidatePath() on publish/unpublish.
 */

export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, BookOpen, FileText, Clock } from "lucide-react";
import type { Metadata } from "next";
import {
  fetchWorkspaceWithPublishedList,
  getViewerInfo,
} from "@/lib/public-docs/server";
import { PublicDocsHeader } from "@/components/features/public-docs/layout";

// ============================================================
// Metadata
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchWorkspaceWithPublishedList(username);
  if (!data) return { title: "Not found" };

  const displayName = data.workspace.display_name || `@${username}`;
  return {
    title: `${displayName} · Docs`,
    description: `Documentation by ${displayName}`,
    openGraph: {
      title: `${displayName} · Docs`,
      description: `Documentation by ${displayName}`,
      type: "profile",
    },
  };
}

// ============================================================
// Page
// ============================================================

export default async function WorkspaceLandingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const data = await fetchWorkspaceWithPublishedList(username);
  if (!data) notFound();

  const { workspace, publishedNotebooks } = data;
  const viewer = await getViewerInfo(workspace.user_id);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicDocsHeader
        workspaceUsername={workspace.username}
        workspaceDisplayName={workspace.display_name}
        isAuthenticated={viewer.isAuthenticated}
        isOwner={viewer.isOwner}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {/* Workspace header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight truncate">
                {workspace.display_name || `@${workspace.username}`}
              </h1>
              {workspace.display_name && (
                <p className="text-sm text-muted-foreground font-mono">
                  @{workspace.username}
                </p>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            {publishedNotebooks.length}{" "}
            {publishedNotebooks.length === 1
              ? "published notebook"
              : "published notebooks"}
          </p>
        </header>

        {/* Notebooks list */}
        {publishedNotebooks.length === 0 ? (
          <EmptyState
            isOwner={viewer.isOwner}
            username={workspace.username}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {publishedNotebooks.map((nb) => (
              <Link
                key={nb.id}
                href={`/@${workspace.username}/${nb.notebook_slug}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 transition-all hover:shadow-md hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none select-none flex-shrink-0">
                    {nb.notebook_icon || "📓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-base group-hover:text-primary transition-colors">
                      {nb.notebook_name}
                    </h2>
                    {nb.notebook_description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {nb.notebook_description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {nb.pageCount}{" "}
                    {nb.pageCount === 1 ? "page" : "pages"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {formatDate(nb.updated_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Powered by VibesDoc
      </footer>
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================

function EmptyState({
  isOwner,
  username,
}: {
  isOwner: boolean;
  username: string;
}) {
  return (
    <div className="rounded-xl border border-dashed py-16 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-3">
        <BookOpen className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="font-semibold mb-1">No published notebooks yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {isOwner ? (
          <>
            Publish a notebook from your dashboard to make it appear here at{" "}
            <code className="text-xs font-mono bg-background border rounded px-1 py-0.5">
              @{username}
            </code>
            .
          </>
        ) : (
          <>This workspace hasn't published any notebooks yet.</>
        )}
      </p>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}