import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLS } from "@/lib/lemonsqueezy/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/lemonsqueezy/cancel
 *
 * Cancels a Lemon Squeezy subscription.
 * The actual status update happens via webhook callback.
 * Body: { subscriptionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to this user
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("ls_subscription_id")
      .eq("user_id", user.id)
      .eq("ls_subscription_id", subscriptionId)
      .single();

    if (!sub) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    configureLS();

    const { error } = await cancelSubscription(subscriptionId);

    if (error) {
      console.error("[Cancel] LS error:", error);
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("[Cancel] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
