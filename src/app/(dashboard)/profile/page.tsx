"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useSubscription, useTrialStatus } from "@/hooks";
import { User, Mail, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInitials } from "@/lib/utils";
import { AccountManagement } from "@/components/billing";
import { toast } from "sonner";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { subscription } = useSubscription();
  const { isInTrial, trialEndTime } = useTrialStatus();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  // Show payment success toast
  useEffect(() => {
    if (paymentStatus === "success") {
      toast.success("Payment successful! Thank you for subscribing.");
      // Clean up URL
      window.history.replaceState({}, "", "/profile");
    }
  }, [paymentStatus]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Account information and subscription management
        </p>
      </div>

      {/* Trial Banner */}
      {isInTrial && trialEndTime && (
        <Alert className="border-blue-200 bg-blue-50/50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You're on a free trial until{" "}
            <strong>
              {new Date(trialEndTime).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
            . Subscribe to keep access after the trial ends.
          </AlertDescription>
        </Alert>
      )}

      {/* Expired Trial Banner */}
      {!isInTrial && trialEndTime && !subscription && (
        <Alert className="border-red-200 bg-red-50/50">
          <Clock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Your trial ended on{" "}
            <strong>{new Date(trialEndTime).toLocaleDateString()}</strong>.
            Subscribe to regain access.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center py-8 gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-bold text-lg">{user.full_name}</p>
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium mt-1">
                {user.role === "super_admin" ? "Super Admin" : "User"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{user.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">
                  {user.role === "super_admin" ? "Super Admin" : "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Status</p>
                <p className="text-sm font-medium">
                  {user.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <AccountManagement />
    </div>
  );
}
