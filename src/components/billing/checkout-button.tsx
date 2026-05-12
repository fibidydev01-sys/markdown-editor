"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CheckoutButtonProps {
  variantId: string;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

/**
 * Checkout button that creates a Lemon Squeezy checkout session
 * and redirects the user to the LS-hosted checkout page.
 */
export function CheckoutButton({
  variantId,
  label = "Subscribe",
  className,
  variant = "default",
  size = "default",
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!variantId) {
      toast.error("Plan not available. Please try again later.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/lemonsqueezy/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout");
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error("No checkout URL received");
      }

      // Redirect to LS checkout
      window.location.href = url;
    } catch (err) {
      console.error("[Checkout] Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout"
      );
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading || !variantId}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          {label}
          <ExternalLink className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
