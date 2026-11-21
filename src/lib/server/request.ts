import "server-only";

/**
 * Best-effort client IP for rate limiting.
 *
 * Prefers `X-Real-IP`, which the bundled nginx config sets from the TCP peer
 * address (clients can't forge it). Falls back to the first `X-Forwarded-For`
 * entry for hosts that only set that header. Behind nginx, the config also
 * overwrites X-Forwarded-For, so a client-supplied value is never trusted.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length <= 64) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded && forwarded.length <= 64) return forwarded;
  return "unknown";
}
