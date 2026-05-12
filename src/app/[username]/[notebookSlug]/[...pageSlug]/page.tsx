/**
 * /@[username]/[notebookSlug]/[...pageSlug] — the main page renderer.
 *
 * Server component. Renders:
 *   - 3-column shell (header / left sidebar / content / right TOC)
 *   - Breadcrumbs
 *   - Page title (h1)
 *   - Markdown content (via MarkdownRenderer)
 *   - Prev/next nav footer
 *
 * URL examples:
 *   /@andre/saas-boilerplate/intro                 → ["intro"]
 *   /@andre/saas-boilerplate/setup/install         → ["setup", "install"]
 *   /@andre/saas-boilerplate/guides/basics/advanced → ["guides", "basics", "advanced"]
 *
 * ───────────────────────────────────────────────────────────
 * CACHING (Phase Fix):
 * ───────────────────────────────────────────────────────────
 * force-dynamic disables Next.js Full Route Cache. Every request hits
 * the server, fetches fresh data from Supabase, and re-renders.
 *
 * Why? Because IndexedDB is the source of truth (offline-first), and
 * the user can publish/unpublish anytime. Stale cache → hydration
 * mismatch when content changes between request and client navigation.
 *
 * If you want to optimize later:
 *   - Switch to `revalidate = 60` (ISR) + ensure revalidatePath() is
 *     called from publish/unpublish routes (already done)
 *   - Use `unstable_cache()` for the Supabase fetch with tag-based
 *     revalidation
 *
 * For MVP, force-dynamic is the safest. Page render takes ~100-200ms
 * even on cold start — acceptable.
 */

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchPublishedNotebook,
  getViewerInfo,
} from "@/lib/public-docs/server";
import {
  buildDocsTree,
  findPageByPath,
  findPrevNextPage,
  extractHeadings,
  buildTocTree,
} from "@/lib/public-docs";
import {
  DocsShell,
  PublicDocsHeader,
  MobileNav,
} from "@/components/features/public-docs/layout";
import { DocsSidebar } from "@/components/features/public-docs/sidebar";
import { OnPageToc } from "@/components/features/public-docs/right-toc";
import {
  MarkdownRenderer,
  Breadcrumbs,
  PageNavFooter,
} from "@/components/features/public-docs/content";

// ============================================================
// Metadata
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    username: string;
    notebookSlug: string;
    pageSlug: string[];
  }>;
}): Promise<Metadata> {
  const { username, notebookSlug, pageSlug } = await params;

  const notebook = await fetchPublishedNotebook(username, notebookSlug);
  if (!notebook) return { title: "Not found" };

  const tree = buildDocsTree(notebook.sections, notebook.pages);
  const page = findPageByPath(tree, pageSlug);
  if (!page) return { title: notebook.notebook_name };

  const displayName =
    notebook.workspace_display_name || `@${notebook.username}`;

  const description =
    notebook.notebook_description ??
    `${page.title} — documentation by ${displayName}`;

  return {
    title: `${page.title} · ${notebook.notebook_name}`,
    description,
    openGraph: {
      title: page.title,
      description,
      type: "article",
      siteName: notebook.notebook_name,
    },
    twitter: {
      card: "summary",
      title: page.title,
      description,
    },
  };
}

// ============================================================
// Page
// ============================================================

export default async function NotebookPagePage({
  params,
}: {
  params: Promise<{
    username: string;
    notebookSlug: string;
    pageSlug: string[];
  }>;
}) {
  const { username, notebookSlug, pageSlug } = await params;

  // Fetch + build tree
  const notebook = await fetchPublishedNotebook(username, notebookSlug);
  if (!notebook) notFound();

  const tree = buildDocsTree(notebook.sections, notebook.pages);

  // Resolve URL to a page
  const page = findPageByPath(tree, pageSlug);
  if (!page) notFound();

  // Build right TOC from page content
  const headings = extractHeadings(page.content);
  const tocTree = buildTocTree(headings);

  // Find prev/next for footer nav
  const { prev, next } = findPrevNextPage(tree, page.id);

  // Viewer info for auth-aware header
  const viewer = await getViewerInfo(notebook.workspace_id);

  // URL helpers
  const notebookBaseUrl = `/@${username}/${notebookSlug}`;

  // Breadcrumbs: Notebook / Section / Page
  const breadcrumbs = [
    { label: notebook.notebook_name, href: notebookBaseUrl },
    ...(page.parentSectionName
      ? [{ label: page.parentSectionName }]
      : []),
    { label: page.title },
  ];

  return (
    <DocsShell
      header={
        <PublicDocsHeader
          workspaceUsername={notebook.username}
          workspaceDisplayName={notebook.workspace_display_name}
          isAuthenticated={viewer.isAuthenticated}
          isOwner={viewer.isOwner}
          notebookLocalId={notebook.notebook_local_id}
          tree={tree}
          notebookBaseUrl={notebookBaseUrl}
          mobileNavTrigger={
            <MobileNav
              tree={tree}
              notebookBaseUrl={notebookBaseUrl}
              notebookName={notebook.notebook_name}
              notebookIcon={notebook.notebook_icon}
            />
          }
        />
      }
      sidebar={
        <DocsSidebar
          tree={tree}
          notebookBaseUrl={notebookBaseUrl}
          notebookName={notebook.notebook_name}
          notebookIcon={notebook.notebook_icon}
        />
      }
      rightToc={
        tocTree.length > 0 ? <OnPageToc tocTree={tocTree} /> : undefined
      }
    >
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} className="mb-4" />

      {/* Page title — rendered separately from markdown to ensure
          it's always present even if the content doesn't start with H1 */}
      <h1 className="text-3xl font-bold tracking-tight leading-tight mb-6">
        {page.title}
      </h1>

      {/* Markdown content */}
      <MarkdownRenderer markdown={page.content} />

      {/* Prev/next */}
      <PageNavFooter
        prev={
          prev
            ? {
              title: prev.title,
              href: `${notebookBaseUrl}/${prev.pathSegments.join("/")}`,
            }
            : null
        }
        next={
          next
            ? {
              title: next.title,
              href: `${notebookBaseUrl}/${next.pathSegments.join("/")}`,
            }
            : null
        }
      />
    </DocsShell>
  );
}