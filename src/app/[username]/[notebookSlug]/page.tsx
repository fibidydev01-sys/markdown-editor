/**
 * /@[username]/[notebookSlug] — notebook home.
 *
 * Per roadmap decision: redirects to the first page in the notebook.
 *
 * If the notebook has no pages, render an empty state instead.
 *
 * ───────────────────────────────────────────────────────────
 * CACHING (Phase Fix):
 * ───────────────────────────────────────────────────────────
 * force-dynamic to ensure fresh data on every request.
 * See workspace-landing /@[username]/page.tsx for rationale.
 */

export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { fetchPublishedNotebook } from "@/lib/public-docs/server";
import { buildDocsTree, findFirstPage } from "@/lib/public-docs";

export default async function NotebookHomePage({
  params,
}: {
  params: Promise<{ username: string; notebookSlug: string }>;
}) {
  const { username, notebookSlug } = await params;

  const notebook = await fetchPublishedNotebook(username, notebookSlug);
  if (!notebook) notFound();

  const tree = buildDocsTree(notebook.sections, notebook.pages);
  const firstPage = findFirstPage(tree);

  if (firstPage) {
    redirect(
      `/@${username}/${notebookSlug}/${firstPage.pathSegments.join("/")}`
    );
  }

  // Empty notebook — show a stub
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4 select-none">
          {notebook.notebook_icon || "📓"}
        </div>
        <h1 className="text-2xl font-bold mb-2">{notebook.notebook_name}</h1>
        {notebook.notebook_description && (
          <p className="text-muted-foreground mb-4">
            {notebook.notebook_description}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          This notebook has no pages yet.
        </p>
      </div>
    </div>
  );
}