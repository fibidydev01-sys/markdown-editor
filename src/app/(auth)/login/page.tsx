import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

/**
 * /login route.
 *
 * Server Component:
 *   - Redirects to /dashboard if already authenticated
 *   - Otherwise renders the LoginForm (client component)
 *
 * NOTE: Next.js requires every `page.tsx` to have a default export.
 * The actual form lives in `src/components/features/auth/login-form.tsx`.
 */
export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}