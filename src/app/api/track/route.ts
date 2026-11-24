import { createHash } from "node:crypto";
import { TRACKED_EVENTS, isLikelyBot, normalizePath, recordEvent, recordPageView, referrerHost, type TrackedEvent } from "@/lib/server/analytics";
import { logServerError } from "@/lib/server/log";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getClientIp } from "@/lib/server/request";

/**
 * Cookieless page-view / event beacon for the first-party analytics
 * (see src/lib/server/analytics.ts). Accepts small same-origin JSON bodies
 * only, ignores bots, and always answers 204 so it never affects the page.
 */

const MAX_BODY = 2048;
const PER_MINUTE = 120;
const hits = new Map<string, { count: number; resetAt: number }>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 20_000) hits.clear();
    hits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= PER_MINUTE;
}

function sameOrigin(request: Request): boolean {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!host || !source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  if (!isDatabaseConfigured() || !sameOrigin(request)) return noContent();
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isLikelyBot(userAgent)) return noContent();
  const ip = getClientIp(request.headers);
  if (!allowed(ip)) return noContent();

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return noContent();
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return noContent();
  }

  try {
    if (body.type === "pageview") {
      const path = normalizePath(body.path);
      if (!path) return noContent();
      const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
      await recordPageView({ path, referrer: referrerHost(body.referrer, host?.split(":")[0] ?? null), ip, userAgent });
    } else if (body.type === "event" && typeof body.name === "string" && (TRACKED_EVENTS as readonly string[]).includes(body.name)) {
      await recordEvent(body.name as TrackedEvent);
    }
  } catch (error) {
    logServerError("[analytics] could not record hit", error);
  }
  return noContent();
}
