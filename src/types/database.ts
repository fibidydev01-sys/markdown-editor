/**
 * Supabase Database type definitions.
 *
 * Hand-maintained to match the actual DB schema. In a production setup
 * this file should be auto-generated via:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Tables covered:
 *   - user_profiles
 *   - workspaces
 *   - subscriptions
 *   - user_trials
 *   - notebook_publishes
 *   - webhook_events
 *
 * Views:
 *   - published_notebooks_with_workspace
 *
 * Functions (RPC):
 *   - is_username_available(candidate, exclude_user_id)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ────────────────────────────────────────────────────
      // user_profiles
      // ────────────────────────────────────────────────────
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: string;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          is_deleted: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ────────────────────────────────────────────────────
      // workspaces
      // ────────────────────────────────────────────────────
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string | null;
          username_last_changed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          display_name?: string | null;
          username_last_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          display_name?: string | null;
          username_last_changed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ────────────────────────────────────────────────────
      // subscriptions
      // ────────────────────────────────────────────────────
      subscriptions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          ls_subscription_id?: string | null;
          ls_customer_id?: string | null;
          ls_order_id?: string | null;
          ls_product_id?: string | null;
          ls_variant_id?: string | null;
          ls_variant_name?: string | null;
          status?: string;
          renews_at?: string | null;
          ends_at?: string | null;
          trial_ends_at?: string | null;
          price?: string | null;
          card_brand?: string | null;
          card_last_four?: string | null;
          is_paused?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ls_subscription_id?: string | null;
          ls_customer_id?: string | null;
          ls_order_id?: string | null;
          ls_product_id?: string | null;
          ls_variant_id?: string | null;
          ls_variant_name?: string | null;
          status?: string;
          renews_at?: string | null;
          ends_at?: string | null;
          trial_ends_at?: string | null;
          price?: string | null;
          card_brand?: string | null;
          card_last_four?: string | null;
          is_paused?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ────────────────────────────────────────────────────
      // user_trials
      // ────────────────────────────────────────────────────
      user_trials: {
        Row: {
          id: string;
          user_id: string;
          trial_end_time: string;
          is_trial_used: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trial_end_time: string;
          is_trial_used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trial_end_time?: string;
          is_trial_used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ────────────────────────────────────────────────────
      // notebook_publishes
      // ────────────────────────────────────────────────────
      notebook_publishes: {
        Row: {
          id: string;
          workspace_id: string;
          notebook_local_id: string;
          notebook_slug: string;
          notebook_name: string;
          notebook_icon: string | null;
          notebook_description: string | null;
          sections: Json;
          pages: Json;
          tags: Json;
          published_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          notebook_local_id: string;
          notebook_slug: string;
          notebook_name: string;
          notebook_icon?: string | null;
          notebook_description?: string | null;
          sections: Json;
          pages: Json;
          tags: Json;
          published_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          notebook_local_id?: string;
          notebook_slug?: string;
          notebook_name?: string;
          notebook_icon?: string | null;
          notebook_description?: string | null;
          sections?: Json;
          pages?: Json;
          tags?: Json;
          published_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ────────────────────────────────────────────────────
      // webhook_events
      // ────────────────────────────────────────────────────
      webhook_events: {
        Row: {
          id: string;
          event_name: string;
          body: Json;
          processed: boolean;
          processing_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          body: Json;
          processed?: boolean;
          processing_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          body?: Json;
          processed?: boolean;
          processing_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      // ────────────────────────────────────────────────────
      // published_notebooks_with_workspace
      // ────────────────────────────────────────────────────
      // Joined view used by public docs renderer.
      // Combines notebook_publishes with workspace info.
      published_notebooks_with_workspace: {
        Row: {
          id: string;
          workspace_id: string;
          notebook_local_id: string;
          notebook_slug: string;
          notebook_name: string;
          notebook_icon: string | null;
          notebook_description: string | null;
          sections: Json;
          pages: Json;
          tags: Json;
          published_at: string;
          updated_at: string;
          username: string;
          workspace_display_name: string | null;
        };
        Relationships: [];
      };
    };

    Functions: {
      // ────────────────────────────────────────────────────
      // is_username_available
      // ────────────────────────────────────────────────────
      // Check format + reserved list + uniqueness in one server-side call.
      is_username_available: {
        Args: {
          candidate: string;
          exclude_user_id: string | null;
        };
        Returns: boolean;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================
// Helper types for using the schema
// ============================================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type FunctionArgs<
  T extends keyof Database["public"]["Functions"]
> = Database["public"]["Functions"][T]["Args"];

export type FunctionReturns<
  T extends keyof Database["public"]["Functions"]
> = Database["public"]["Functions"][T]["Returns"];