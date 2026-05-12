import crypto from "node:crypto";

/**
 * Verify Lemon Squeezy webhook signature using HMAC SHA256.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyLSSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signature) return false;

  try {
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
