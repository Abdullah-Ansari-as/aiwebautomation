import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_ADMIN_PASSWORD, TEST_AUTH_SECRET, dropTestDatabase, setupTestDatabase } from "./support/test-env";

// Minimal stand-ins for the Next.js request APIs used by the auth code.
const request = vi.hoisted(() => ({
  cookies: new Map<string, { value: string; options?: Record<string, unknown> }>(),
  ip: "198.51.100.10",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (request.cookies.has(name) ? { name, value: request.cookies.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => request.cookies.set(name, { value, options }),
  }),
  headers: async () => new Headers({ "x-real-ip": request.ip }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT ${url}`), { url });
  },
}));

const { uri, dbName } = setupTestDatabase();

const token = await import("@/lib/auth/session-token");
const session = await import("@/lib/auth/session");
const { login, logout } = await import("@/lib/actions/admin-auth");
const { closeMongo } = await import("@/lib/server/mongodb");

afterAll(async () => {
  await closeMongo();
  await dropTestDatabase(uri, dbName);
});

beforeEach(() => {
  request.cookies.clear();
  process.env.AUTH_SECRET = TEST_AUTH_SECRET;
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
});

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

describe("session tokens", () => {
  const key = token.sessionSigningKey(TEST_AUTH_SECRET, TEST_ADMIN_PASSWORD)!;

  it("requires a long enough secret and password", () => {
    expect(token.sessionSigningKey("short", TEST_ADMIN_PASSWORD)).toBeNull();
    expect(token.sessionSigningKey(TEST_AUTH_SECRET, "short")).toBeNull();
    expect(token.sessionSigningKey(undefined, undefined)).toBeNull();
  });

  it("verifies a fresh token and rejects tampered, foreign or expired ones", async () => {
    const t = await token.createSessionToken(key);
    expect(await token.verifySessionToken(t, key)).toBe(true);

    const [body, sig] = t.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ v: 1, iat: 1, exp: 9_999_999_999 })).toString("base64url");
    expect(await token.verifySessionToken(`${forgedBody}.${sig}`, key)).toBe(false);
    expect(await token.verifySessionToken(`${body}.${sig}x`, key)).toBe(false);
    expect(await token.verifySessionToken("garbage", key)).toBe(false);
    expect(await token.verifySessionToken(undefined, key)).toBe(false);

    const old = await token.createSessionToken(key, Date.now() - (token.SESSION_MAX_AGE_SECONDS + 60) * 1000);
    expect(await token.verifySessionToken(old, key)).toBe(false);
  });

  it("invalidates existing sessions when the admin password changes", async () => {
    const t = await token.createSessionToken(key);
    const newKey = token.sessionSigningKey(TEST_AUTH_SECRET, "a-brand-new-admin-password")!;
    expect(await token.verifySessionToken(t, newKey)).toBe(false);
  });
});

describe("admin login", () => {
  it("rejects a wrong password without setting a cookie", async () => {
    expect(await login({}, form({ password: "wrong-password!" }))).toEqual({ error: "Incorrect password." });
    expect(request.cookies.size).toBe(0);
  });

  it("signs in with the right password and sets a hardened cookie", async () => {
    await expect(login({}, form({ password: TEST_ADMIN_PASSWORD, next: "/admin/leads" }))).rejects.toMatchObject({ url: "/admin/leads" });
    const cookie = request.cookies.get(token.SESSION_COOKIE)!;
    expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/admin", maxAge: token.SESSION_MAX_AGE_SECONDS });
    expect(await session.isAdminAuthenticated()).toBe(true);
    await expect(session.requireAdmin()).resolves.toBeUndefined();
  });

  it("never redirects outside the admin area", async () => {
    for (const next of ["//evil.example", "https://evil.example", "/admin/../etc", "/admin/login"]) {
      request.cookies.clear();
      await expect(login({}, form({ password: TEST_ADMIN_PASSWORD, next }))).rejects.toMatchObject({ url: "/admin" });
    }
  });

  it("requireAdmin redirects without a valid session, and logout clears it", async () => {
    await expect(session.requireAdmin()).rejects.toMatchObject({ url: "/admin/login" });
    await expect(login({}, form({ password: TEST_ADMIN_PASSWORD }))).rejects.toMatchObject({ url: "/admin" });
    await expect(logout()).rejects.toMatchObject({ url: "/admin/login" });
    expect(request.cookies.get(token.SESSION_COOKIE)?.value).toBe("");
    expect(await session.isAdminAuthenticated()).toBe(false);
  });

  it("stays closed when admin auth is not configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(session.isAdminAuthConfigured()).toBe(false);
    expect((await login({}, form({ password: "anything-at-all" }))).error).toMatch(/isn't configured/);
    await expect(session.requireAdmin()).rejects.toMatchObject({ url: "/admin/login" });
  });

  it("rate-limits repeated attempts from one IP (stored in MongoDB)", async () => {
    request.ip = "198.51.100.77";
    const errors: string[] = [];
    for (let i = 0; i < 9; i++) errors.push((await login({}, form({ password: `guess-${i}-xxxxxxxx` }))).error ?? "");
    expect(errors.slice(0, 8).every((e) => e === "Incorrect password.")).toBe(true);
    expect(errors[8]).toMatch(/Too many sign-in attempts/);
    // Even the correct password is refused until the window ends.
    expect((await login({}, form({ password: TEST_ADMIN_PASSWORD }))).error).toMatch(/Too many/);
  });
});
