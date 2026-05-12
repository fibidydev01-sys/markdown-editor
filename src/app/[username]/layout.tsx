/**
 * Layout for all /@[username] routes.
 *
 * Imports the docs CSS once here so it's only loaded on public docs pages
 * (not in the dashboard).
 */

import "@/styles/docs.css";

export default function PublicDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
