import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLS } from "@/lib/lemonsqueezy/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/lemonsqueezy/resume
 *
 * Resumes a cancelled Lemon Squeezy subscription.
 * LS doesn't have a "reactivate" endpoint — use updateSubscription
 * with { cancelled: false } to resume.
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

    const { error } = await updateSubscription(subscriptionId, {
      cancelled: false,
    });

    if (error) {
      console.error("[Resume] LS error:", error);
      return NextResponse.json(
        { error: "Failed to resume subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("[Resume] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
