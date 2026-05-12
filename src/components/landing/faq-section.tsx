"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's included in the boilerplate?",
    answer:
      "Authentication (email + OAuth), subscription payments via Lemon Squeezy, a dashboard with sidebar navigation, profile management, trial system, and a fully responsive landing page. All built with Next.js 16, Supabase, shadcn/ui, and Tailwind CSS v4.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "New users get a 48-hour free trial automatically upon signup. During the trial, you have full access to all features. After the trial ends, you'll need to subscribe to continue using the app.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. You can cancel at any time from your profile page. After cancelling, you'll retain access until the end of your current billing period. You can also resume a cancelled subscription before it expires.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Lemon Squeezy handles all payments and supports credit/debit cards, PayPal, and other local payment methods depending on your region. As Merchant of Record, they also handle tax and VAT compliance globally.",
  },
  {
    question: "Is this template production-ready?",
    answer:
      "Yes. It includes server-side authentication guards, HMAC webhook verification, Row Level Security on all database tables, environment variable validation, and proper error handling throughout. It's designed to be deployed as-is.",
  },
  {
    question: "What do I need to get started?",
    answer:
      "A Supabase project (free tier works), a Lemon Squeezy account with at least one subscription product, and Node.js 18+. The README covers the full setup process step by step.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about the template.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
