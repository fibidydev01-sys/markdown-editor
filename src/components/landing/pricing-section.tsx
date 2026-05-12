"use client";

import { PricingSection as PricingCards } from "@/components/billing/pricing-section";

export function LandingPricingSection() {
  return (
    <section id="pricing" className="py-24 bg-muted/30 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PricingCards />
      </div>
    </section>
  );
}
