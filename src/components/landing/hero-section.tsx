"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypewriterEffect } from "@/components/shared/typewriter-effect";
import { VideoModal } from "@/components/shared/video-modal";
import { ROUTES } from "@/constants";

export function HeroSection() {
  const router = useRouter();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur-sm px-4 py-1.5 text-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Production-ready SaaS template
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Build your SaaS{" "}
            <span className="text-primary">in days, not months</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Next.js + Supabase + Lemon Squeezy. Authentication, payments, and
            dashboard — all wired up and ready to ship.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push(ROUTES.DASHBOARD)}
              className="text-base px-8"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsVideoOpen(true)}
              className="text-base px-8"
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-zinc-500 ml-2 font-mono">
                app.tsx
              </span>
            </div>
            <div className="p-6">
              <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
                <code>
                  <TypewriterEffect
                    text={`// Ship faster with everything built-in
import { useAuth } from '@/hooks';
import { useSubscription } from '@/hooks';

export default function App() {
  const { user } = useAuth();
  const { subscription } = useSubscription();

  return (
    <Dashboard>
      {subscription?.status === 'active'
        ? <ProFeatures />
        : <UpgradePrompt />}
    </Dashboard>
  );
}`}
                    delay={30}
                  />
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoId="S1cnQG0-LP4"
      />
    </section>
  );
}
