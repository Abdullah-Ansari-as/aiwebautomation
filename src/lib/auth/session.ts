import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPassword, getAuthSecret, safeEqual } from "@/lib/server/secrets";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, sessionSigningKey, verifySessionToken } from "./session-token";

/**
 * Single-administrator authentication for /admin. The password and signing
 * secret come from environment variables; if either is missing or too short,
 * admin access stays closed rather than falling back to an open dashboard.
 */

export function isAdminAuthConfigured(): boolean {
  return Boolean(getAuthSecret() && getAdminPassword());
}

export function checkAdminPassword(candidate: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  return safeEqual(candidate, password);
}

function signingKey(): string | null {
  return sessionSigningKey(getAuthSecret() ?? undefined, getAdminPassword() ?? undefined);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const key = signingKey();
  if (!key) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, key);
}

/**
 * Data Access Layer guard: call at the top of every admin data read and
 * Server Action. Redirects to the login page when there is no valid session.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

export async function startAdminSession(): Promise<void> {
  const key = signingKey();
  if (!key) throw new Error("Admin authentication is not configured");
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 0 });
}
