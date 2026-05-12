/**
 * Layout for /@[username]/[notebookSlug]/... routes.
 *
 * This layout fetches the notebook ONCE and builds the docs tree, then
 * passes it down to the page via React.cache + a context-less pattern
 * (we just re-fetch in the page — it's cached at the request level).
 *
 * Actually: we keep this layout minimal and let each page fetch its
 * own data. Next.js will dedupe the supabase calls at the request
 * level since fetchPublishedNotebook is called from server components.
 *
 * The shell wrapping happens inside each page so it can pass the
 * correct active page context to the sidebar.
 */

import "@/styles/docs.css";

export default function NotebookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
