import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Boilerplate",
  description: "Create a new account",
};

export default async function RegisterPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}