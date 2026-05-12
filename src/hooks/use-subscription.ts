"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { createClient } from "@/lib/supabase/client";
import type { AppSubscription } from "@/types/lemonsqueezy";

interface UseSubscriptionReturn {
  subscription: AppSubscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and track the current user's subscription.
 * Also subscribes to Supabase Realtime for live updates.
 */
export function useSubscription(): UseSubscriptionReturn {
  const user = useAuthStore((state) => state.user);
  const [subscription, setSubscription] = useState<AppSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (fetchError) throw fetchError;

      setSubscription(data);
    } catch (err) {
      console.error("[useSubscription] Fetch error:", err);
      setError("Failed to load subscription");
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Realtime subscription updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`sub-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch on any change instead of manually parsing payload
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
  };
}
