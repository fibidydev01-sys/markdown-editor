import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Get CORS headers based on request origin.
 */
function getCorsHeaders(request: NextRequest) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ];

  const origin = request.headers.get("origin") || "";

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Signature, x-client-info",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Wrap an API route handler with CORS support.
 *
 * Usage:
 * ```ts
 * export const POST = withCors(async (request) => {
 *   // your handler
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async function corsHandler(request: NextRequest) {
    // Handle preflight
    if (request.method === "OPTIONS") {
      return NextResponse.json({}, { headers: getCorsHeaders(request) });
    }

    // Call handler
    const response = await handler(request);

    // Add CORS headers
    const headers = getCorsHeaders(request);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
