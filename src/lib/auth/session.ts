import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { siteConfig } from "@/data/site";
import { normalizeEmail } from "@/lib/sanitize";
import { findUserById } from "@/lib/server/admin-users-store";
import { logServerError } from "@/lib/server/log";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getAdminPassword, getAuthSecret, safeEqual } from "@/lib/server/secrets";
import { hasRole, type AdminRole } from "./roles";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, SUPERADMIN_SUBJECT, createSessionToken, sessionSigningKey, verifySessionToken, type SessionClaims } from "./session-token";

/**
 * Admin authentication for /admin.
 *
 * - The owner ("super admin") signs in with ADMIN_EMAIL + ADMIN_PASSWORD from
 *   the environment. This works even when the database is unavailable.
 * - Team members are stored in MongoDB (`admin_users`) with a scrypt password
 *   hash and a role (admin or viewer). The super admin manages them in /admin/team.
 *
 * If AUTH_SECRET or ADMIN_PASSWORD is missing or too short, admin access stays
 * closed rather than falling back to an open dashboard.
 */

export interface AdminSession {
  /** "superadmin" or the team member's id. */
  userId: string;
  role: AdminRole;
  email: string;
  name: string;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getAuthSecret() && getAdminPassword());
}

/** Owner login email: ADMIN_EMAIL, or the site's public email when unset. */
export function getSuperadminEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL?.trim() || "") ?? siteConfig.email.toLowerCase();
}

export function checkAdminPassword(candidate: string): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  return safeEqual(candidate, password);
}

function signingKey(): string | null {
  return sessionSigningKey(getAuthSecret() ?? undefined, getAdminPassword() ?? undefined);
}

/**
 * The signed-in admin for this request, or null. Team-member sessions are
 * checked against the database on every request, so deactivating someone
 * (or resetting their password / changing their role) takes effect at once.
 * Deduplicated per request with React `cache`.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  // Read the cookie FIRST: it marks every admin page and export as request-time.
  // (Checking the env first would let `next build` — where secrets are usually
  // absent — prerender a permanent redirect to the login page.)
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const key = signingKey();
  if (!key) return null;
  const payload = await verifySessionToken(token, key);
  if (!payload) return null;

  if (payload.sub === SUPERADMIN_SUBJECT) {
    return { userId: SUPERADMIN_SUBJECT, role: "superadmin", email: getSuperadminEmail(), name: process.env.ADMIN_NAME?.trim().slice(0, 60) || "Super admin" };
  }

  if (!isDatabaseConfigured()) return null;
  try {
    const user = await findUserById(payload.sub);
    if (!user || !user.active || user.sessionVersion !== payload.sv) return null;
    return { userId: user._id.toHexString(), role: user.role, email: user.email, name: user.name };
  } catch (error) {
    // Fail closed: if the user can't be verified, there is no session.
    logServerError("[auth] could not verify team member session", error);
    return null;
  }
});

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/**
 * Data Access Layer guard: call at the top of every admin data read and
 * Server Action. Redirects to the login page without a valid session, and to
 * the dashboard with a notice when the role is insufficient.
 */
export async function requireAdmin(minimum: AdminRole = "viewer"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!hasRole(session.role, minimum)) redirect("/admin?notice=forbidden");
  return session;
}

/** Display name used for audit entries and notes. */
export function actorLabel(session: AdminSession): string {
  return `${session.name} (${session.email})`;
}

export async function startAdminSession(claims: SessionClaims): Promise<void> {
  const key = signingKey();
  if (!key) throw new Error("Admin authentication is not configured");
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(key, claims), {
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
