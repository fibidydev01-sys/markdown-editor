"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, RefreshCw, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionStatusBadge } from "./subscription-status";
import { isCancelledButActive } from "@/lib/lemonsqueezy/status-mapper";

/**
 * Account management section for the profile page.
 * Shows subscription info + cancel/resume/delete actions.
 */
export function AccountManagement() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { subscription, isLoading, refetch } = useSubscription();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derived state
  const canCancel =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    !isCancelledButActive(subscription.status, subscription.ends_at);

  const canResume =
    subscription &&
    isCancelledButActive(subscription.status, subscription.ends_at);

  // ── Cancel ──────────────────────────────────────────────

  const handleCancel = async () => {
    if (!subscription?.ls_subscription_id) return;

    setIsCancelling(true);
    try {
      const response = await fetch("/api/lemonsqueezy/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.ls_subscription_id,
        }),
      });

      if (!response.ok) throw new Error("Failed to cancel subscription");

      toast.success("Subscription cancelled. You'll retain access until the end of the billing period.");
      setShowCancelDialog(false);
      await refetch();
    } catch (err) {
      console.error("[Cancel] Error:", err);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Resume ──────────────────────────────────────────────

  const handleResume = async () => {
    if (!subscription?.ls_subscription_id) return;

    setIsResuming(true);
    try {
      const response = await fetch("/api/lemonsqueezy/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.ls_subscription_id,
        }),
      });

      if (!response.ok) throw new Error("Failed to resume subscription");

      toast.success("Subscription resumed successfully!");
      await refetch();
    } catch (err) {
      console.error("[Resume] Error:", err);
      toast.error("Failed to resume subscription. Please try again.");
    } finally {
      setIsResuming(false);
    }
  };

  // ── Delete Account ─────────────────────────────────────

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      toast.success("Account deleted.");
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("[Delete] Error:", err);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </div>
            {subscription && (
              <SubscriptionStatusBadge status={subscription.status} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading subscription details...
              </span>
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              {/* Plan Info */}
              <div className="grid gap-3 sm:grid-cols-2">
                {subscription.ls_variant_name && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="text-sm font-medium">
                      {subscription.ls_variant_name}
                    </p>
                  </div>
                )}

                {subscription.renews_at && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Renews</p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.renews_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {subscription.ends_at && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Access Until</p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.ends_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {subscription.card_brand && subscription.card_last_four && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="text-sm font-medium capitalize">
                      {subscription.card_brand} ····{" "}
                      {subscription.card_last_four}
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm font-medium">
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Cancelled but still active notice */}
              {canResume && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    Your subscription has been cancelled and will end on{" "}
                    <strong>
                      {new Date(subscription.ends_at!).toLocaleDateString()}
                    </strong>
                    . You can resume it anytime before then.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {canResume && (
                  <Button
                    onClick={handleResume}
                    disabled={isResuming}
                    variant="default"
                  >
                    {isResuming ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Resume Subscription
                  </Button>
                )}

                {canCancel && (
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    variant="destructive"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                You don't have an active subscription.
              </p>
              <Button onClick={() => router.push("/pay")} variant="default">
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll continue to have access until the end of your current
              billing period
              {subscription?.renews_at &&
                ` (${new Date(subscription.renews_at).toLocaleDateString()})`}
              . No refunds are provided for cancellations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Subscription
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate your account and cancel any active
              subscriptions. Your data will be retained for 30 days before
              permanent deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
