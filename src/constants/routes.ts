/**
 * Application routes.
 *
 * UPDATED in Phase H: added WORKSPACE_SETTINGS + PUBLIC_WORKSPACE.
 */

export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  // Dashboard
  DASHBOARD: "/dashboard",
  OVERVIEW: "/overview",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
  PAY: "/pay",

  // Notebooks (Phase A)
  NOTEBOOKS: "/notebooks",
  NOTEBOOKS_NEW: "/notebooks/new",
  NOTEBOOK_DETAIL: (id: string) => `/notebooks/${id}`,
  NOTEBOOK_SETTINGS: (id: string) => `/notebooks/${id}/settings`,

  // Workspace (Phase H — NEW)
  WORKSPACE_SETTINGS: "/settings/workspace",

  // Public docs (Phase J — pre-declared for /lib/workspace use)
  PUBLIC_WORKSPACE: (username: string) => `/@${username}`,
  PUBLIC_NOTEBOOK: (username: string, slug: string) =>
    `/@${username}/${slug}`,

  // Legacy alias (kept for compat if used anywhere)
  PUBLIC_DOCS: (slug: string) => `/docs/${slug}`,
} as const;
