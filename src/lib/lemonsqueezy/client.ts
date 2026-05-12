import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let isConfigured = false;

/**
 * Initialize the Lemon Squeezy SDK.
 * Safe to call multiple times — only runs once.
 */
export function configureLS() {
  if (isConfigured) return;

  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error("[LemonSqueezy] SDK Error:", error),
  });

  isConfigured = true;
}
