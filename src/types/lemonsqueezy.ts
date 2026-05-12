/**
 * Lemon Squeezy webhook & subscription types.
 * Based on LS API v1 webhook payload structure.
 */

// ============================================================
// Webhook Payload
// ============================================================

export interface LSWebhookPayload {
  meta: {
    event_name: LSWebhookEventName;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: LSSubscriptionAttributes;
  };
}

export type LSWebhookEventName =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed";

// ============================================================
// Subscription Attributes (from LS API)
// ============================================================

export interface LSSubscriptionAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: LSSubscriptionStatus;
  status_formatted: string;
  card_brand: string | null;
  card_last_four: string | null;
  pause: unknown | null;
  cancelled: boolean;
  trial_ends_at: string | null;
  billing_anchor: number;
  first_subscription_item: {
    id: number;
    subscription_id: number;
    price_id: number;
    quantity: number;
    is_usage_based: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  urls: {
    update_payment_method: string;
    customer_portal: string;
    customer_portal_update_subscription: string;
  };
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

export type LSSubscriptionStatus =
  | "active"
  | "on_trial"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

// ============================================================
// App-side subscription (from Supabase)
// ============================================================

export interface AppSubscription {
  id: string;
  user_id: string;
  ls_subscription_id: string | null;
  ls_customer_id: string | null;
  ls_order_id: string | null;
  ls_product_id: string | null;
  ls_variant_id: string | null;
  ls_variant_name: string | null;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  price: string | null;
  card_brand: string | null;
  card_last_four: string | null;
  is_paused: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
