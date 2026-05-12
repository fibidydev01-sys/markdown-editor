"use client";

import {
  Lock,
  CreditCard,
  Database,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Authentication",
    description:
      "Supabase Auth with email/password and OAuth. SSR-based session management with proxy.ts.",
    icon: Lock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Payments",
    description:
      "Lemon Squeezy integration with webhook handling, subscription management, and trial support.",
    icon: CreditCard,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Database",
    description:
      "Supabase PostgreSQL with Row Level Security, realtime subscriptions, and typed queries.",
    icon: Database,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Performance",
    description:
      "Next.js 16 with Turbopack, React 19, and optimized server components for fast page loads.",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    title: "Security",
    description:
      "Server-side auth guards via proxy.ts, HMAC webhook verification, and environment validation.",
    icon: Shield,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Global Payments",
    description:
      "Lemon Squeezy as Merchant of Record handles tax, VAT, and compliance in 100+ countries.",
    icon: Globe,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to ship
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete foundation so you can focus on what makes your product unique.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
