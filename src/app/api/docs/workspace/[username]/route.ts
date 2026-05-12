import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchWorkspaceWithPublishedList } from "@/lib/public-docs/server";

/**
 * GET /api/docs/workspace/[username]
 *
 * Returns a workspace + the list of its published notebooks.
 * Public — no auth required.
 *
 * Useful for client-side refresh or external integrations.
 * The SSR pages don't use this endpoint (they call the server lib directly).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const data = await fetchWorkspaceWithPublishedList(username);

  if (!data) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
