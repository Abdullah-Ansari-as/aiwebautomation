import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { MIN_ADMIN_PASSWORD_LENGTH, MIN_AUTH_SECRET_LENGTH } from "@/lib/auth/session-token";

/** `AUTH_SECRET` signs admin sessions and keys the IP hashes. */
export function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= MIN_AUTH_SECRET_LENGTH ? secret : null;
}

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length >= MIN_ADMIN_PASSWORD_LENGTH ? password : null;
}

/**
 * One-way, keyed hash for identifiers such as IP addresses, so raw IPs are
 * never stored. Falls back to an unkeyed hash only if AUTH_SECRET is missing.
 */
export function hashIdentifier(value: string): string {
  const secret = getAuthSecret();
  const digest = secret ? createHmac("sha256", secret).update(value).digest("hex") : createHash("sha256").update(value).digest("hex");
  return digest.slice(0, 32);
}

/** Constant-time string comparison (compares fixed-length digests). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
