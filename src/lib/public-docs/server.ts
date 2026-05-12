/**
 * Public docs library — SERVER-ONLY barrel export.
 *
 * These modules use `next/headers` or other server-only APIs.
 * Import this barrel only from server components, route handlers, or
 * server actions.
 *
 * If you accidentally import this from a client component, Next.js will
 * throw a build error: "You're importing a component that needs next/headers".
 *
 * Usage in server components:
 *   import {
 *     fetchPublishedNotebook,
 *     fetchWorkspaceWithPublishedList,
 *     getViewerInfo,
 *   } from "@/lib/public-docs/server";
 *
 * Client components: use "@/lib/public-docs" instead (universal barrel).
 */

export {
  fetchWorkspaceByUsername,
  fetchWorkspaceWithPublishedList,
} from "./fetch-workspace";

export { fetchPublishedNotebook } from "./fetch-notebook";

export { getViewerInfo, type ViewerInfo } from "./get-viewer-info";
