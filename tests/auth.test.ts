import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_AUTH_SECRET, dropTestDatabase, setupTestDatabase } from "./support/test-env";

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
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const { uri, dbName } = setupTestDatabase();

const token = await import("@/lib/auth/session-token");
const session = await import("@/lib/auth/session");
const passwords = await import("@/lib/auth/passwords");
const { login, logout } = await import("@/lib/actions/admin-auth");
const team = await import("@/lib/actions/team");
const { closeMongo } = await import("@/lib/server/mongodb");

afterAll(async () => {
  await closeMongo();
  await dropTestDatabase(uri, dbName);
});

let ipCounter = 20;
beforeEach(() => {
  request.cookies.clear();
  // A fresh IP per test so the per-IP sign-in limit doesn't leak between tests.
  request.ip = `198.51.100.${ipCounter++}`;
  process.env.AUTH_SECRET = TEST_AUTH_SECRET;
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
  process.env.ADMIN_EMAIL = TEST_ADMIN_EMAIL;
});

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

async function signInAsOwner() {
  await expect(login({}, form({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }))).rejects.toMatchObject({ url: "/admin" });
}

describe("passwords", () => {
  it("hashes with scrypt and verifies only the right password", async () => {
    const hash = await passwords.hashPassword("correct horse battery");
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await passwords.verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await passwords.verifyPassword("wrong horse battery", hash)).toBe(false);
    expect(await passwords.verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(passwords.generatePassword()).toMatch(/^[A-Za-z2-9]{16}$/);
    expect(passwords.passwordProblem("short")).toMatch(/at least/);
  });
});

describe("session tokens", () => {
  const key = token.sessionSigningKey(TEST_AUTH_SECRET, TEST_ADMIN_PASSWORD)!;

  it("requires a long enough secret and password", () => {
    expect(token.sessionSigningKey("short", TEST_ADMIN_PASSWORD)).toBeNull();
    expect(token.sessionSigningKey(TEST_AUTH_SECRET, "short")).toBeNull();
    expect(token.sessionSigningKey(undefined, undefined)).toBeNull();
  });

  it("verifies a fresh token and rejects tampered, foreign or expired ones", async () => {
    const t = await token.createSessionToken(key, { sub: "superadmin", role: "superadmin", sv: 1 });
    expect(await token.verifySessionToken(t, key)).toMatchObject({ sub: "superadmin", role: "superadmin" });

    const [body, sig] = t.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ v: 2, sub: "superadmin", role: "superadmin", sv: 1, iat: 1, exp: 9_999_999_999 })).toString("base64url");
    expect(await token.verifySessionToken(`${forgedBody}.${sig}`, key)).toBeNull();
    expect(await token.verifySessionToken(`${body}.${sig}x`, key)).toBeNull();
    expect(await token.verifySessionToken("garbage", key)).toBeNull();
    expect(await token.verifySessionToken(undefined, key)).toBeNull();

    const old = await token.createSessionToken(key, { sub: "superadmin", role: "superadmin", sv: 1 }, Date.now() - (token.SESSION_MAX_AGE_SECONDS + 60) * 1000);
    expect(await token.verifySessionToken(old, key)).toBeNull();
  });

  it("only the owner subject may carry the superadmin role", async () => {
    const escalated = await token.createSessionToken(key, { sub: "0123456789abcdef01234567", role: "superadmin", sv: 1 });
    expect(await token.verifySessionToken(escalated, key)).toBeNull();
  });

  it("invalidates existing sessions when the admin password changes", async () => {
    const t = await token.createSessionToken(key);
    const newKey = token.sessionSigningKey(TEST_AUTH_SECRET, "a-brand-new-admin-password")!;
    expect(await token.verifySessionToken(t, newKey)).toBeNull();
  });
});

describe("super admin login", () => {
  it("rejects a wrong password or unknown email without setting a cookie", async () => {
    expect(await login({}, form({ email: TEST_ADMIN_EMAIL, password: "wrong-password!" }))).toEqual({ error: "Incorrect email or password." });
    expect(await login({}, form({ email: "stranger@example.com", password: TEST_ADMIN_PASSWORD }))).toEqual({ error: "Incorrect email or password." });
    expect(request.cookies.size).toBe(0);
  });

  it("signs in with ADMIN_EMAIL (any case) + ADMIN_PASSWORD and sets a hardened cookie", async () => {
    await expect(login({}, form({ email: "  Owner@Example.COM ", password: TEST_ADMIN_PASSWORD, next: "/admin/leads" }))).rejects.toMatchObject({ url: "/admin/leads" });
    const cookie = request.cookies.get(token.SESSION_COOKIE)!;
    expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/admin", maxAge: token.SESSION_MAX_AGE_SECONDS });
    expect(await session.isAdminAuthenticated()).toBe(true);
    await expect(session.requireAdmin("superadmin")).resolves.toMatchObject({ role: "superadmin", email: TEST_ADMIN_EMAIL });
  });

  it("never redirects outside the admin area", async () => {
    for (const next of ["//evil.example", "https://evil.example", "/admin/../etc", "/admin/login"]) {
      request.cookies.clear();
      await expect(login({}, form({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD, next }))).rejects.toMatchObject({ url: "/admin" });
    }
  });

  it("requireAdmin redirects without a valid session, and logout clears it", async () => {
    await expect(session.requireAdmin()).rejects.toMatchObject({ url: "/admin/login" });
    await signInAsOwner();
    await expect(logout()).rejects.toMatchObject({ url: "/admin/login" });
    expect(request.cookies.get(token.SESSION_COOKIE)?.value).toBe("");
    expect(await session.isAdminAuthenticated()).toBe(false);
  });

  it("stays closed when admin auth is not configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(session.isAdminAuthConfigured()).toBe(false);
    expect((await login({}, form({ email: TEST_ADMIN_EMAIL, password: "anything-at-all" }))).error).toMatch(/isn't configured/);
    await expect(session.requireAdmin()).rejects.toMatchObject({ url: "/admin/login" });
  });

  it("rate-limits repeated attempts from one IP (stored in MongoDB)", async () => {
    const errors: string[] = [];
    for (let i = 0; i < 9; i++) errors.push((await login({}, form({ email: `guess${i}@example.com`, password: `guess-${i}-xxxxxxxx` }))).error ?? "");
    expect(errors.slice(0, 8).every((e) => e === "Incorrect email or password.")).toBe(true);
    expect(errors[8]).toMatch(/Too many sign-in attempts/);
    // Even the correct password is refused until the window ends.
    expect((await login({}, form({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }))).error).toMatch(/Too many/);
  });
});

describe("team members", () => {
  async function addMember(name: string, email: string, role: "admin" | "viewer") {
    await signInAsOwner();
    const result = await team.createTeamMemberAction({}, form({ name, email, role }));
    expect(result).toMatchObject({ ok: true });
    request.cookies.clear();
    return result.secret!;
  }

  it("only the super admin can add members; a member signs in with the generated password", async () => {
    const password = await addMember("Sara Khan", "sara@example.com", "admin");
    await expect(login({}, form({ email: "sara@example.com", password }))).rejects.toMatchObject({ url: "/admin" });
    await expect(session.requireAdmin("admin")).resolves.toMatchObject({ role: "admin", name: "Sara Khan" });
    // An admin is not the super admin: team management is refused.
    await expect(session.requireAdmin("superadmin")).rejects.toMatchObject({ url: "/admin?notice=forbidden" });
    await expect(team.createTeamMemberAction({}, form({ name: "X", email: "x@example.com", role: "admin" }))).rejects.toMatchObject({ url: "/admin?notice=forbidden" });
  });

  it("rejects duplicate emails and the super admin's own email", async () => {
    await signInAsOwner();
    expect(await team.createTeamMemberAction({}, form({ name: "Dup One", email: "dup@example.com", role: "viewer" }))).toMatchObject({ ok: true });
    expect(await team.createTeamMemberAction({}, form({ name: "Dup Two", email: "DUP@example.com", role: "viewer" }))).toMatchObject({ error: expect.stringMatching(/already exists/) });
    expect(await team.createTeamMemberAction({}, form({ name: "Owner Copy", email: TEST_ADMIN_EMAIL, role: "admin" }))).toMatchObject({ error: expect.stringMatching(/super admin/) });
  });

  it("viewers get read access but no write access", async () => {
    const password = await addMember("Read Only", "viewer@example.com", "viewer");
    await expect(login({}, form({ email: "viewer@example.com", password }))).rejects.toMatchObject({ url: "/admin" });
    await expect(session.requireAdmin()).resolves.toMatchObject({ role: "viewer" });
    await expect(session.requireAdmin("admin")).rejects.toMatchObject({ url: "/admin?notice=forbidden" });
  });

  it("deactivating, resetting a password or changing a role signs the member out immediately", async () => {
    const password = await addMember("Temp Person", "temp@example.com", "admin");
    await expect(login({}, form({ email: "temp@example.com", password }))).rejects.toMatchObject({ url: "/admin" });
    const memberCookie = request.cookies.get(token.SESSION_COOKIE)!.value;
    const me = await session.requireAdmin();

    // Owner deactivates the member.
    request.cookies.clear();
    await signInAsOwner();
    expect(await team.updateTeamMemberAction(me.userId, {}, form({ active: "false" }))).toMatchObject({ ok: true });

    // The member's existing cookie no longer works, and they can't sign in again.
    request.cookies.set(token.SESSION_COOKIE, { value: memberCookie });
    expect(await session.getAdminSession()).toBeNull();
    request.cookies.clear();
    expect(await login({}, form({ email: "temp@example.com", password }))).toEqual({ error: "Incorrect email or password." });

    // Reactivate + reset password: the old password stops working, the new one works.
    await signInAsOwner();
    expect(await team.updateTeamMemberAction(me.userId, {}, form({ active: "true" }))).toMatchObject({ ok: true });
    const reset = await team.resetTeamPasswordAction(me.userId);
    expect(reset.secret).toMatch(/^[A-Za-z2-9]{16}$/);
    request.cookies.clear();
    expect(await login({}, form({ email: "temp@example.com", password }))).toEqual({ error: "Incorrect email or password." });
    await expect(login({}, form({ email: "temp@example.com", password: reset.secret! }))).rejects.toMatchObject({ url: "/admin" });
  });

  it("members can change their own password", async () => {
    const password = await addMember("Self Service", "self@example.com", "viewer");
    await expect(login({}, form({ email: "self@example.com", password }))).rejects.toMatchObject({ url: "/admin" });
    expect(await team.changeOwnPasswordAction({}, form({ current: "wrong-current", next: "a-new-password-123", confirm: "a-new-password-123" }))).toMatchObject({ error: expect.stringMatching(/incorrect/) });
    expect(await team.changeOwnPasswordAction({}, form({ current: password, next: "a-new-password-123", confirm: "mismatch-password" }))).toMatchObject({ error: expect.stringMatching(/match/) });
    expect(await team.changeOwnPasswordAction({}, form({ current: password, next: "a-new-password-123", confirm: "a-new-password-123" }))).toMatchObject({ ok: true });
    // This browser stays signed in with the new session version.
    await expect(session.requireAdmin()).resolves.toMatchObject({ name: "Self Service" });
    request.cookies.clear();
    await expect(login({}, form({ email: "self@example.com", password: "a-new-password-123" }))).rejects.toMatchObject({ url: "/admin" });
  });
});
