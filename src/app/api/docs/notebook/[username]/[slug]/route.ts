import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchPublishedNotebook } from "@/lib/public-docs/server";

/**
 * GET /api/docs/notebook/[username]/[slug]
 *
 * Returns the full published notebook snapshot (sections + pages + tags).
 * Public — no auth required.
 *
 * Useful for client-side refresh or external integrations.
 * The SSR pages don't use this endpoint.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params;

  const notebook = await fetchPublishedNotebook(username, slug);

  if (!notebook) {
    return NextResponse.json(
      { error: "Notebook not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(notebook, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
