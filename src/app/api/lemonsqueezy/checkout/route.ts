import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLS } from "@/lib/lemonsqueezy/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/lemonsqueezy/checkout
 *
 * Creates a Lemon Squeezy checkout URL.
 * Body: { variantId: string }
 *
 * CRITICAL: passes user_id in custom_data so the webhook
 * can link the LS subscription to the Supabase user.
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

    const { variantId } = await request.json();

    if (!variantId) {
      return NextResponse.json(
        { error: "variantId is required" },
        { status: 400 }
      );
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) {
      console.error("[Checkout] Missing LEMONSQUEEZY_STORE_ID");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Init LS SDK
    configureLS();

    // Create checkout
    const { data: checkout, error } = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: user.email ?? undefined,
        custom: {
          user_id: user.id, // ← CRITICAL: links LS sub to Supabase user
        },
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=success`,
      },
    });

    if (error) {
      console.error("[Checkout] LS error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const checkoutUrl = checkout?.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error("[Checkout] No URL in response");
      return NextResponse.json(
        { error: "Failed to get checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("[Checkout] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
