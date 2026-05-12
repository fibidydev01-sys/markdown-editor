import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyLSSignature } from "@/lib/lemonsqueezy/signature";
import { routeToHandler } from "@/lib/lemonsqueezy/webhook-handlers";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/lemonsqueezy/webhook
 *
 * Receives Lemon Squeezy webhook events.
 * 1. Verify HMAC signature
 * 2. Log event to webhook_events table (BEFORE processing)
 * 3. Route to handler
 * 4. Mark as processed
 * 5. Always return 200 to LS (even if handler fails)
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") ?? "";

  // 1. Verify signature
  if (!verifyLSSignature(rawBody, signature)) {
    console.error("[Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName: string = payload.meta?.event_name ?? "unknown";

  // 2. Log event FIRST (best practice — return 200 fast)
  const { data: logEntry, error: logError } = await supabaseAdmin
    .from("webhook_events")
    .insert({
      event_name: eventName,
      body: payload,
      processed: false,
    })
    .select("id")
    .single();

  if (logError) {
    console.error("[Webhook] Failed to log event:", logError);
    // Still try to process even if logging fails
  }

  // 3. Route to handler
  try {
    await routeToHandler(eventName, payload);

    // 4. Mark as processed
    if (logEntry?.id) {
      await supabaseAdmin
        .from("webhook_events")
        .update({ processed: true })
        .eq("id", logEntry.id);
    }
  } catch (err) {
    console.error("[Webhook] Handler failed:", err);

    // Log the error but still return 200 to LS
    if (logEntry?.id) {
      await supabaseAdmin
        .from("webhook_events")
        .update({
          processing_error:
            err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", logEntry.id);
    }
  }

  // 5. Always 200 to Lemon Squeezy
  return NextResponse.json({ received: true });
}
