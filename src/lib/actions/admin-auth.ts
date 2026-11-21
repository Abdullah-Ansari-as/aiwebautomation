"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminPassword, endAdminSession, isAdminAuthConfigured, startAdminSession } from "@/lib/auth/session";
import { logServerError } from "@/lib/server/log";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { hashIdentifier } from "@/lib/server/secrets";

export type LoginState = { error?: string };

const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;

/** Only allow redirects back into the admin area (no open redirects). */
function safeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/admin";
  return /^\/admin(\/[A-Za-z0-9_-]+)*\/?$/.test(value) && !value.startsWith("/admin/login") ? value : "/admin";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminAuthConfigured()) {
    return { error: "Admin sign-in isn't configured on this server yet. Set AUTH_SECRET (32+ characters) and ADMIN_PASSWORD (12+ characters), then redeploy." };
  }

  const ip = getClientIp(await headers());
  // consumeRateLimit already falls back to in-memory limits when MongoDB is
  // unreachable. Anything else it throws is unexpected: fail closed rather
  // than allowing unlimited password attempts.
  let limit: Awaited<ReturnType<typeof consumeRateLimit>>;
  try {
    limit = await consumeRateLimit(`login:${hashIdentifier(ip)}`, MAX_ATTEMPTS, WINDOW_SECONDS);
  } catch (error) {
    logServerError("[admin-login] rate limiting failed; sign-in refused", error);
    return { error: "Sign-in is temporarily unavailable. Please try again in a few minutes." };
  }
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return { error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0 || password.length > 512 || !checkAdminPassword(password)) {
    return { error: "Incorrect password." };
  }

  await startAdminSession();
  redirect(safeNextPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
