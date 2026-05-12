import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLS } from "@/lib/lemonsqueezy/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/user/delete
 *
 * Soft-deletes a user account:
 * 1. Cancel any active LS subscriptions
 * 2. Mark profile as deleted (soft delete)
 * 3. Mark subscriptions as cancelled
 */
export async function DELETE(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[DeleteAccount] Starting soft-deletion for user:", user.id);

    // 1. Cancel active LS subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("ls_subscription_id, status")
      .eq("user_id", user.id);

    if (subError) {
      console.error("[DeleteAccount] Subscription fetch error:", subError);
    } else if (subscriptions) {
      configureLS();

      for (const sub of subscriptions) {
        if (
          sub.ls_subscription_id &&
          ["active", "trialing"].includes(sub.status)
        ) {
          try {
            await cancelSubscription(sub.ls_subscription_id);
            console.log(
              "[DeleteAccount] LS subscription cancelled:",
              sub.ls_subscription_id
            );
          } catch (lsError) {
            console.error("[DeleteAccount] LS cancellation error:", lsError);
          }
        }
      }
    }

    // 2. Soft delete the profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[DeleteAccount] Profile update error:", profileError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // 3. Mark subscriptions as cancelled
    const { error: subUpdateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        deleted_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (subUpdateError) {
      console.error("[DeleteAccount] Subscription update error:", subUpdateError);
    }

    console.log("[DeleteAccount] Soft-deletion completed for user:", user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DeleteAccount] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
