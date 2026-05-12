"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { PricingSection } from "@/components/billing";
import { Button } from "@/components/ui/button";

export default function PayPage() {
  const router = useRouter();
  const { subscription, isLoading, error } = useSubscription();

  // Redirect if already has active subscription
  useEffect(() => {
    if (
      subscription &&
      ["active", "trialing"].includes(subscription.status)
    ) {
      const timer = setTimeout(() => {
        router.push("/profile");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [subscription, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Checking subscription status...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-xl font-bold">Error Loading Subscription</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Unable to load subscription information. Please try again later.
        </p>
        <Button onClick={() => router.refresh()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  // Already subscribed — showing briefly before redirect
  if (
    subscription &&
    ["active", "trialing"].includes(subscription.status)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-green-800 font-medium">
            You already have an active subscription!
          </p>
          <p className="text-green-600 text-sm mt-1">
            Redirecting to your profile...
          </p>
        </div>
      </div>
    );
  }

  // Show pricing
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Choose a Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Subscribe to unlock all features
        </p>
      </div>

      <PricingSection />
    </div>
  );
}
