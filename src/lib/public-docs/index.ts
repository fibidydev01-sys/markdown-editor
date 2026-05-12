/**
 * Public docs library — UNIVERSAL barrel export.
 *
 * Only modules safe to use in BOTH client and server components.
 *
 * ⚠️ Server-only modules (those that import `next/headers` or use
 * Node-only APIs) are NOT exported here. Import them directly:
 *
 *   import { fetchPublishedNotebook } from "@/lib/public-docs/fetch-notebook";
 *   import { fetchWorkspaceByUsername } from "@/lib/public-docs/fetch-workspace";
 *   import { getViewerInfo } from "@/lib/public-docs/get-viewer-info";
 *
 * Or via the server-only barrel:
 *   import { fetchPublishedNotebook, getViewerInfo } from "@/lib/public-docs/server";
 */

// Types only — these are pure type re-exports, safe everywhere
export type {
  WorkspaceWithPublishedList,
  PublishedNotebookSummary,
} from "./fetch-workspace";

// Pure utilities — no Supabase / next/headers dependency
export {
  extractHeadings,
  buildTocTree,
  type Heading,
  type TocNode,
} from "./extract-headings";

export { slugifyHeading } from "./slugify-heading";

export {
  buildDocsTree,
  flattenPages,
  type DocsTreeNode,
  type DocsSectionNode,
  type DocsPageNode,
} from "./build-page-tree";

export { findPageByPath, findFirstPage } from "./find-page-by-path";

export {
  findPrevNextPage,
  type PrevNextResult,
} from "./find-prev-next-page";

export { remarkCallouts } from "./remark-callouts";
