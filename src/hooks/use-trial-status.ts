"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores";
import { createClient } from "@/lib/supabase/client";

interface TrialStatus {
  isInTrial: boolean;
  trialEndTime: string | null;
  isLoading: boolean;
}

const TRIAL_DURATION_HOURS = 48;

/**
 * Hook to check and manage the user's trial status.
 * Creates a trial automatically if user has no subscription and no existing trial.
 */
export function useTrialStatus(): TrialStatus {
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<{
    isInTrial: boolean;
    trialEndTime: string | null;
  }>({ isInTrial: false, trialEndTime: null });

  useEffect(() => {
    async function checkTrialStatus() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        // First check if user has an active subscription
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .maybeSingle();

        // If user has an active subscription, no trial needed
        if (subscription) {
          setTrialStatus({ isInTrial: false, trialEndTime: null });
          setIsLoading(false);
          return;
        }

        // Check if user has an existing trial
        const { data: trial, error: trialError } = await supabase
          .from("user_trials")
          .select("trial_end_time, is_trial_used")
          .eq("user_id", user.id)
          .maybeSingle();

        if (trialError && trialError.code !== "PGRST116") {
          throw trialError;
        }

        if (trial) {
          // Check if trial is still valid
          const now = new Date();
          const endTime = new Date(trial.trial_end_time);
          const isInTrial = !trial.is_trial_used && now < endTime;

          setTrialStatus({
            isInTrial,
            trialEndTime: trial.trial_end_time,
          });
        } else {
          // Create new trial for user
          const trialEndTime = new Date();
          trialEndTime.setHours(
            trialEndTime.getHours() + TRIAL_DURATION_HOURS
          );

          const { data: newTrial, error: insertError } = await supabase
            .from("user_trials")
            .upsert(
              {
                user_id: user.id,
                trial_end_time: trialEndTime.toISOString(),
                is_trial_used: false,
              },
              { onConflict: "user_id" }
            )
            .select("trial_end_time")
            .single();

          if (insertError) throw insertError;

          setTrialStatus({
            isInTrial: true,
            trialEndTime: newTrial.trial_end_time,
          });
        }
      } catch (error) {
        console.error("[useTrialStatus] Error:", error);
        setTrialStatus({ isInTrial: false, trialEndTime: null });
      } finally {
        setIsLoading(false);
      }
    }

    checkTrialStatus();
  }, [user?.id]);

  return { ...trialStatus, isLoading };
}
