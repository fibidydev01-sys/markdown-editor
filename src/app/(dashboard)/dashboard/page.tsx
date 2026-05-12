"use client";

import { useAuthStore } from "@/stores";
import { useSubscription, useTrialStatus } from "@/hooks";
import {
  BarChart3,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  PlusCircle,
  Settings,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubscriptionStatusBadge } from "@/components/billing";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";

const dashboardMetrics = [
  {
    title: "Total Users",
    value: "1,234",
    change: "+12.3%",
    icon: Users,
    trend: "up" as const,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Revenue",
    value: "$12.4k",
    change: "+8.2%",
    icon: CreditCard,
    trend: "up" as const,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Active Sessions",
    value: "432",
    change: "-3.1%",
    icon: Activity,
    trend: "down" as const,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Growth Rate",
    value: "18.2%",
    change: "+2.4%",
    icon: TrendingUp,
    trend: "up" as const,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const recentActivity = [
  { id: 1, action: "New user signup", timestamp: "2 minutes ago", icon: PlusCircle },
  { id: 2, action: "Payment processed", timestamp: "15 minutes ago", icon: CreditCard },
  { id: 3, action: "Settings updated", timestamp: "1 hour ago", icon: Settings },
  { id: 4, action: "Session completed", timestamp: "2 hours ago", icon: Clock },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { subscription } = useSubscription();
  const { isInTrial, trialEndTime } = useTrialStatus();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Good morning";
    if (hour < 15) return "Good afternoon";
    if (hour < 18) return "Good evening";
    return "Good night";
  };

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {isInTrial && trialEndTime && (
        <Alert className="border-blue-200 bg-blue-50/50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 flex items-center justify-between flex-wrap gap-2">
            <span>
              Free trial active until{" "}
              <strong>{new Date(trialEndTime).toLocaleDateString()}</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(ROUTES.PAY)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Subscribe Now
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-8 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-primary-foreground/70 text-sm font-medium">
              {greeting()},
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {user?.full_name ?? "User"}
            </h1>
            <p className="text-primary-foreground/70 text-sm mt-2">
              Welcome to your dashboard
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {subscription && (
              <SubscriptionStatusBadge status={subscription.status} />
            )}
            {isInTrial && !subscription && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                Trial Period
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center`}
                  >
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      metric.trend === "up"
                        ? "text-green-700 bg-green-50"
                        : "text-red-700 bg-red-50"
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metric.title}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Analytics Overview
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm">
                Chart placeholder — add your analytics here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
