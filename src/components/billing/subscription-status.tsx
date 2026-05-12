"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  PauseCircle,
  Timer,
} from "lucide-react";

interface SubscriptionStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
    className: string;
  }
> = {
  active: {
    label: "Active",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  trialing: {
    label: "Trial",
    variant: "secondary",
    icon: Timer,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  expired: {
    label: "Expired",
    variant: "outline",
    icon: Clock,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  paused: {
    label: "Paused",
    variant: "secondary",
    icon: PauseCircle,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  past_due: {
    label: "Past Due",
    variant: "destructive",
    icon: AlertTriangle,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  unpaid: {
    label: "Unpaid",
    variant: "destructive",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function SubscriptionStatusBadge({
  status,
  className,
}: SubscriptionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
    icon: Clock,
    className: "bg-gray-100 text-gray-600",
  };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className ?? ""}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
