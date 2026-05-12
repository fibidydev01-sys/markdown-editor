import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapLSStatus } from "./status-mapper";
import type { LSWebhookPayload } from "@/types/lemonsqueezy";

/**
 * Route webhook event to the correct handler.
 */
export async function routeToHandler(
  eventName: string,
  payload: LSWebhookPayload
): Promise<void> {
  switch (eventName) {
    case "subscription_created":
      return handleSubscriptionCreated(payload);
    case "subscription_updated":
      return handleSubscriptionUpdated(payload);
    case "subscription_cancelled":
      return handleSubscriptionCancelled(payload);
    case "subscription_resumed":
      return handleSubscriptionResumed(payload);
    case "subscription_expired":
      return handleSubscriptionExpired(payload);
    case "subscription_paused":
      return handleSubscriptionPaused(payload);
    case "subscription_unpaused":
      return handleSubscriptionResumed(payload); // same logic as resumed
    case "subscription_payment_success":
      return handleSubscriptionPaymentSuccess(payload);
    case "subscription_payment_failed":
      return handleSubscriptionPaymentFailed(payload);
    default:
      console.warn(`[Webhook] Unhandled event: ${eventName}`);
  }
}

// ============================================================
// Helpers
// ============================================================

function getUserId(payload: LSWebhookPayload): string | null {
  return payload.meta.custom_data?.user_id ?? null;
}

function getSubscriptionData(payload: LSWebhookPayload) {
  const attrs = payload.data.attributes;
  return {
    ls_subscription_id: payload.data.id,
    ls_customer_id: String(attrs.customer_id),
    ls_order_id: String(attrs.order_id),
    ls_product_id: String(attrs.product_id),
    ls_variant_id: String(attrs.variant_id),
    ls_variant_name: attrs.variant_name,
    status: mapLSStatus(attrs.status),
    renews_at: attrs.renews_at,
    ends_at: attrs.ends_at,
    trial_ends_at: attrs.trial_ends_at,
    card_brand: attrs.card_brand,
    card_last_four: attrs.card_last_four,
    is_paused: attrs.status === "paused",
  };
}

// ============================================================
// Handlers
// ============================================================

async function handleSubscriptionCreated(
  payload: LSWebhookPayload
): Promise<void> {
  const userId = getUserId(payload);
  if (!userId) {
    console.error("[Webhook] subscription_created: missing user_id in custom_data");
    return;
  }

  const data = getSubscriptionData(payload);

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      ...data,
    },
    { onConflict: "ls_subscription_id" }
  );

  if (error) {
    console.error("[Webhook] subscription_created insert error:", error);
    throw error;
  }

  console.log(`[Webhook] subscription_created for user ${userId}`);
}

async function handleSubscriptionUpdated(
  payload: LSWebhookPayload
): Promise<void> {
  const data = getSubscriptionData(payload);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update(data)
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] subscription_updated error:", error);
    throw error;
  }

  console.log(`[Webhook] subscription_updated: ${payload.data.id}`);
}

async function handleSubscriptionCancelled(
  payload: LSWebhookPayload
): Promise<void> {
  const attrs = payload.data.attributes;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "cancelled",
      ends_at: attrs.ends_at,
    })
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] subscription_cancelled error:", error);
    throw error;
  }

  console.log(`[Webhook] subscription_cancelled: ${payload.data.id}, ends_at: ${attrs.ends_at}`);
}

async function handleSubscriptionResumed(
  payload: LSWebhookPayload
): Promise<void> {
  const attrs = payload.data.attributes;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mapLSStatus(attrs.status),
      ends_at: null,
      is_paused: false,
    })
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] subscription_resumed error:", error);
    throw error;
  }

  console.log(`[Webhook] subscription_resumed: ${payload.data.id}`);
}

async function handleSubscriptionExpired(
  payload: LSWebhookPayload
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "expired",
    })
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] subscription_expired error:", error);
    throw error;
  }

  console.log(`[Webhook] subscription_expired: ${payload.data.id}`);
}

async function handleSubscriptionPaused(
  payload: LSWebhookPayload
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "paused",
      is_paused: true,
    })
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] subscription_paused error:", error);
    throw error;
  }

  console.log(`[Webhook] subscription_paused: ${payload.data.id}`);
}

async function handleSubscriptionPaymentSuccess(
  payload: LSWebhookPayload
): Promise<void> {
  const attrs = payload.data.attributes;

  // Update card info + ensure status is active
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mapLSStatus(attrs.status),
      card_brand: attrs.card_brand,
      card_last_four: attrs.card_last_four,
      renews_at: attrs.renews_at,
    })
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] payment_success error:", error);
    throw error;
  }

  console.log(`[Webhook] payment_success: ${payload.data.id}`);
}

async function handleSubscriptionPaymentFailed(
  payload: LSWebhookPayload
): Promise<void> {
  const attrs = payload.data.attributes;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mapLSStatus(attrs.status), // will be past_due or unpaid
    })
    .eq("ls_subscription_id", payload.data.id);

  if (error) {
    console.error("[Webhook] payment_failed error:", error);
    throw error;
  }

  console.log(`[Webhook] payment_failed: ${payload.data.id}, status: ${attrs.status}`);
}
