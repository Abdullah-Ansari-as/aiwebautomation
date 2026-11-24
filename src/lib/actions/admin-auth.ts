"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/passwords";
import { checkAdminPassword, endAdminSession, getAdminSession, getSuperadminEmail, isAdminAuthConfigured, startAdminSession } from "@/lib/auth/session";
import { SUPERADMIN_SUBJECT } from "@/lib/auth/session-token";
import { normalizeEmail } from "@/lib/sanitize";
import { logActivity } from "@/lib/server/activity";
import { findUserByEmail, recordLogin } from "@/lib/server/admin-users-store";
import { logServerError } from "@/lib/server/log";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { consumeRateLimit, isRateLimited } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { hashIdentifier } from "@/lib/server/secrets";

export type LoginState = { error?: string };

const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;
const WRONG = "Incorrect email or password.";

/** Only allow redirects back into the admin area (no open redirects). */
function safeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/admin";
  return /^\/admin(\/[A-Za-z0-9_-]+)*\/?$/.test(value) && !value.startsWith("/admin/login") ? value : "/admin";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminAuthConfigured()) {
    return { error: "Admin sign-in isn't configured on this server yet. Set AUTH_SECRET (32+ characters) and ADMIN_PASSWORD (12+ characters), then restart." };
  }

  const rawEmail = formData.get("email");
  const password = formData.get("password");
  const email = typeof rawEmail === "string" ? normalizeEmail(rawEmail) : null;

  const ip = getClientIp(await headers());
  // consumeRateLimit already falls back to in-memory limits when MongoDB is
  // unreachable. Anything else it throws is unexpected: fail closed rather
  // than allowing unlimited password attempts.
  // Two limits: every attempt per IP, and failed attempts per email (so a
  // brute-force against one account is stopped even across many IPs, while
  // normal sign-ins never lock anyone out).
  const emailKey = email ? `login:email:${hashIdentifier(email)}` : null;
  try {
    const [byIp, byEmail] = await Promise.all([
      consumeRateLimit(`login:${hashIdentifier(ip)}`, MAX_ATTEMPTS, WINDOW_SECONDS),
      emailKey ? isRateLimited(emailKey, MAX_ATTEMPTS) : Promise.resolve({ limited: false, retryAfterSeconds: 0 }),
    ]);
    if (!byIp.allowed || byEmail.limited) {
      const minutes = Math.max(1, Math.ceil(Math.max(byIp.allowed ? 0 : byIp.retryAfterSeconds, byEmail.retryAfterSeconds) / 60));
      return { error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
    }
  } catch (error) {
    logServerError("[admin-login] rate limiting failed; sign-in refused", error);
    return { error: "Sign-in is temporarily unavailable. Please try again in a few minutes." };
  }
  const failed = async (): Promise<LoginState> => {
    if (emailKey) await consumeRateLimit(emailKey, MAX_ATTEMPTS, WINDOW_SECONDS).catch((error: unknown) => logServerError("[admin-login] could not count failed attempt", error));
    return { error: WRONG };
  };

  if (!email || typeof password !== "string" || password.length === 0 || password.length > 512) {
    return { error: WRONG };
  }

  // 1. Owner account from the environment.
  if (email === getSuperadminEmail()) {
    if (!checkAdminPassword(password)) return failed();
    await startAdminSession({ sub: SUPERADMIN_SUBJECT, role: "superadmin", sv: 1 });
    await logActivity(email, "auth.login", "Super admin signed in", null);
    redirect(safeNextPath(formData.get("next")));
  }

  // 2. Team members stored in MongoDB.
  if (!isDatabaseConfigured()) return failed();
  let user: Awaited<ReturnType<typeof findUserByEmail>>;
  try {
    user = await findUserByEmail(email);
  } catch (error) {
    logServerError("[admin-login] user lookup failed", error);
    return { error: "Sign-in is temporarily unavailable. Please try again in a few minutes." };
  }
  if (!user || !user.active) {
    await burnPasswordCheck(password); // same timing as a real check
    return failed();
  }
  if (!(await verifyPassword(password, user.passwordHash))) return failed();

  await startAdminSession({ sub: user._id.toHexString(), role: user.role, sv: user.sessionVersion });
  await recordLogin(user._id).catch((error: unknown) => logServerError("[admin-login] could not record login time", error));
  await logActivity(user.email, "auth.login", `${user.name} signed in`, null);
  redirect(safeNextPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  const session = await getAdminSession();
  await endAdminSession();
  if (session) await logActivity(session.email, "auth.logout", `${session.name} signed out`, null);
  redirect("/admin/login");
}
