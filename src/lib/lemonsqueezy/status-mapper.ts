/**
 * Map Lemon Squeezy subscription status to app convention.
 *
 * LS values:  active, on_trial, paused, past_due, unpaid, cancelled, expired
 * App values: active, trialing, paused, past_due, unpaid, cancelled, expired
 */

const STATUS_MAP: Record<string, string> = {
  active: "active",
  on_trial: "trialing",
  paused: "paused",
  past_due: "past_due",
  unpaid: "unpaid",
  cancelled: "cancelled",
  expired: "expired",
};

export function mapLSStatus(lsStatus: string): string {
  return STATUS_MAP[lsStatus] ?? lsStatus;
}

/**
 * Check if a mapped status grants access to the app.
 */
export function hasActiveAccess(status: string): boolean {
  return ["active", "trialing"].includes(status);
}

/**
 * Check if subscription is in a cancelled-but-still-active state
 * (user cancelled but hasn't reached ends_at yet).
 */
export function isCancelledButActive(
  status: string,
  endsAt: string | null
): boolean {
  if (status !== "cancelled" || !endsAt) return false;
  return new Date(endsAt) > new Date();
}
