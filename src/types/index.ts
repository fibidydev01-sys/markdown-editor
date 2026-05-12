export type { Database, Tables, InsertDto, UpdateDto, Json } from "./database";

import type { Tables, InsertDto, UpdateDto } from "./database";

export type UserProfile = Tables<"user_profiles">;
export type UserProfileInsert = InsertDto<"user_profiles">;
export type UserProfileUpdate = UpdateDto<"user_profiles">;

export type UserRole = "super_admin" | "user";

// Lemon Squeezy types
export type {
  LSWebhookPayload,
  LSWebhookEventName,
  LSSubscriptionAttributes,
  LSSubscriptionStatus,
  AppSubscription,
} from "./lemonsqueezy";
