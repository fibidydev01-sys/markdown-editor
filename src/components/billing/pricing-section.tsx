"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLANS, type PlanTier } from "@/constants";
import { CheckoutButton } from "./checkout-button";

interface PricingSectionProps {
  className?: string;
}

/**
 * Pricing section with plan cards.
 * Each card triggers a Lemon Squeezy checkout.
 */
export function PricingSection({ className }: PricingSectionProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Choose the plan that fits your needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PricingCard({ plan }: { plan: PlanTier }) {
  return (
    <Card
      className={cn(
        "relative flex flex-col transition-shadow hover:shadow-lg",
        plan.popular && "border-primary shadow-md"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <Sparkles className="h-3 w-3" />
            Popular
          </span>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
          <span className="text-muted-foreground ml-1">{plan.interval}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <CheckoutButton
          variantId={plan.variantId}
          label={plan.popular ? "Get Started" : "Subscribe"}
          variant={plan.popular ? "default" : "outline"}
          className="w-full"
        />
      </CardFooter>
    </Card>
  );
}
