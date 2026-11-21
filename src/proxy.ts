import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSigningKey, verifySessionToken } from "@/lib/auth/session-token";

/**
 * Gate for the admin area: every /admin request (pages and client
 * navigations) needs a valid signed session cookie, otherwise it is sent to
 * the login page. Admin data reads and Server Actions re-check the session
 * themselves (see `requireAdmin`), so this is the first of two layers.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return withNoIndex(NextResponse.next());

  const key = sessionSigningKey(process.env.AUTH_SECRET, process.env.ADMIN_PASSWORD);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (key && (await verifySessionToken(token, key))) {
    return withNoIndex(NextResponse.next());
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname);
  return withNoIndex(NextResponse.redirect(loginUrl));
}

function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
