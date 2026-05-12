import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Reserved top-level path prefixes that must NEVER be treated as a
 * workspace username.
 *
 * Order matters? No — we just check with .some(). But keep this list
 * IN SYNC with:
 *   - top-level folders in src/app/(...) route groups
 *   - the reserved usernames list in src/types/workspace.ts (RESERVED_USERNAMES)
 *
 * Adding a new top-level route? Add its prefix here.
 */
const RESERVED_PREFIXES = [
  // Framework / static
  "/_next",
  "/api",
  "/favicon",
  "/icon",
  "/manifest",
  "/robots",
  "/sitemap",
  "/sw",
  "/workbox",

  // Auth
  "/login",
  "/register",
  "/logout",

  // Dashboard routes (matches folders inside (dashboard)/)
  "/dashboard",
  "/admin",
  "/profile",
  "/settings",
  "/notebooks",
  "/overview",
  "/pay",

  // Misc reserved (future routes; safe to keep)
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/help",
  "/support",
  "/docs",
  "/blog",
  "/pricing",
];

/**
 * Public routes (auth not required).
 *
 * NOTE: this list is checked AFTER the @-rewrite has happened. So an
 * incoming `/@andre` request is rewritten to `/andre` and then matched
 * against this list — which has `/` prefix matching via .startsWith,
 * but `/` alone would match everything. So we match `/` as exact only.
 *
 * Public docs routes (anything that's NOT a reserved prefix) are
 * detected separately below and always allowed without auth.
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/api/auth/callback",
  "/api/lemonsqueezy/webhook",
  "/api/docs", // public docs JSON endpoints
];

/**
 * Check if a pathname matches one of the reserved prefixes.
 * Exact match OR prefix match with trailing slash boundary.
 */
function isReservedPath(pathname: string): boolean {
  return RESERVED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

/**
 * Check if a pathname is a known public route.
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      (route !== "/" && pathname.startsWith(route + "/"))
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ─────────────────────────────────────────────────────────
  // 1. Rewrite `/@username/...` → `/username/...`
  //
  // The folder on disk is `src/app/[username]/` (without `@`) because
  // App Router treats `@folder` as a parallel route slot. But we WANT
  // the public URL to display `@username` (Twitter/Medium style).
  //
  // So we silently rewrite: the browser keeps showing `/@andre/intro`,
  // but Next.js routes it to the `[username]` page with params.username
  // = "andre".
  // ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/@")) {
    const rewrittenPath = "/" + pathname.slice(2); // "/@andre/x" → "/andre/x"
    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = rewrittenPath;

    // Public docs are anonymous-friendly; we still refresh the session
    // cookie so logged-in viewers see the auth-aware header without flash.
    const { supabaseResponse } = await updateSession(request);

    // Build a new response that preserves the rewrite + the refreshed
    // Supabase cookies. NextResponse.rewrite() doesn't accept a base
    // response, so we copy cookies onto the rewrite response.
    const rewriteResponse = NextResponse.rewrite(rewrittenUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie);
    });

    return rewriteResponse;
  }

  // ─────────────────────────────────────────────────────────
  // 2. Reserved paths → run normal auth flow
  //
  // /login, /register, /dashboard, /api/*, /_next/*, etc. all go
  // through the standard public-or-protected check below.
  // ─────────────────────────────────────────────────────────
  if (isReservedPath(pathname)) {
    // Public routes inside reserved (e.g. /login, /api/auth/callback)
    if (isPublicRoute(pathname)) {
      const { supabaseResponse } = await updateSession(request);
      return supabaseResponse;
    }

    // Webhook bypass — no session check
    if (pathname.startsWith("/api/lemonsqueezy/webhook")) {
      return NextResponse.next();
    }

    // Protected — require auth
    const { supabaseResponse, user } = await updateSession(request);
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // ─────────────────────────────────────────────────────────
  // 3. Root `/` → marketing page (public)
  // ─────────────────────────────────────────────────────────
  if (pathname === "/") {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // ─────────────────────────────────────────────────────────
  // 4. Anything else = a bare top-level path like `/something`
  //
  // After step 1 we know it doesn't start with `/@`, and after step 2
  // we know it's not a reserved route. So we're left with paths that
  // could be:
  //
  //   (a) A user typed `/andre` directly (no `@`) — we want this to
  //       still work and resolve to the same workspace page.
  //   (b) A typo / dead link — let Next.js handle it (will hit the
  //       `[username]` dynamic segment and the page's own fetch will
  //       return notFound() if no workspace matches).
  //
  // Either way, treat as public docs — no auth required. We still
  // refresh the session cookie so logged-in viewers get auth-aware UI.
  // ─────────────────────────────────────────────────────────
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Static files (_next/static, _next/image)
     * - Image/icon files at any path
     * - The favicon family
     *
     * IMPORTANT: we DO match `/@...` paths so the rewrite in step 1
     * can run. The negative lookahead below only excludes static assets.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff|woff2|ttf|otf)$).*)",
  ],
};