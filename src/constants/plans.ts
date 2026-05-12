/**
 * Subscription plan metadata.
 * Map LS variant IDs from env to plan tiers.
 */

export interface PlanTier {
  id: string;
  name: string;
  description: string;
  price: string;
  interval: string;
  variantId: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: PlanTier[] = [
  {
    id: "pro",
    name: "Pro",
    description: "Perfect for small teams and startups",
    price: "$19",
    interval: "/month",
    variantId: process.env.NEXT_PUBLIC_LS_VARIANT_ID_PRO ?? "",
    features: [
      "All template features",
      "Priority support",
      "Custom branding",
      "Analytics dashboard",
      "Team collaboration",
    ],
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For larger organizations",
    price: "$49",
    interval: "/month",
    variantId: process.env.NEXT_PUBLIC_LS_VARIANT_ID_ENTERPRISE ?? "",
    features: [
      "Everything in Pro",
      "Advanced security",
      "Custom integrations",
      "24/7 support",
      "SLA guarantee",
    ],
    popular: true,
  },
];
