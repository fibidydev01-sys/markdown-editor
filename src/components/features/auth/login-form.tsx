"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores";
import { loginSchema, type LoginFormData } from "@/lib/validators";
import { ROUTES } from "@/constants";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ── Google OAuth ────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsGoogleLoading(false);
      }
      // If no error, browser will redirect to Google
    } catch (err) {
      console.error("Google OAuth error:", err);
      setError("Failed to start Google sign-in");
      setIsGoogleLoading(false);
    }
  };

  // ── Email/Password Login ────────────────────────────────

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        setError(
          authError.message.includes("Invalid login")
            ? "Invalid email or password"
            : authError.message
        );
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Verify profile exists & active
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, role, is_active, is_deleted")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError("Account not found. Contact administrator.");
        setIsLoading(false);
        return;
      }

      // Reactivate soft-deleted accounts
      if (profile.is_deleted) {
        const { error: reactivateError } = await supabase
          .from("user_profiles")
          .update({
            is_deleted: false,
            deleted_at: null,
            is_active: true,
          })
          .eq("id", authData.user.id);

        if (reactivateError) {
          console.error("Reactivation error:", reactivateError);
        }
      } else if (!profile.is_active) {
        await supabase.auth.signOut();
        setError("Your account has been deactivated. Contact administrator.");
        setIsLoading(false);
        return;
      }

      // Reset store → trigger fresh fetch in dashboard layout
      useAuthStore.setState({
        hasFetched: false,
        isLoading: false,
        fetchPromise: null,
      });

      router.push(ROUTES.DASHBOARD);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-4 pb-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-base mt-1">
            Sign in to your account
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={anyLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FcGoogle className="mr-2 h-5 w-5" />
          )}
          Sign in with Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={anyLoading}
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={anyLoading}
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={anyLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={anyLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Don&apos;t have an account?{" "}
              <Link
                href={ROUTES.REGISTER}
                className="font-medium text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
