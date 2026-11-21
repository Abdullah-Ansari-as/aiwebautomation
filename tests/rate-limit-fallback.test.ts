import { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_ADMIN_PASSWORD, dropTestDatabase, setupTestDatabase } from "./support/test-env";

const request = vi.hoisted(() => ({
  cookies: new Map<string, { value: string }>(),
  ip: "192.0.2.1",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (request.cookies.has(name) ? { name, value: request.cookies.get(name)!.value } : undefined),
    set: (name: string, value: string) => request.cookies.set(name, { value }),
  }),
  headers: async () => new Headers({ "x-real-ip": request.ip }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT ${url}`), { url });
  },
}));

const { uri, dbName } = setupTestDatabase();

const rateLimit = await import("@/lib/server/rate-limit");
const { login } = await import("@/lib/actions/admin-auth");
const { closeMongo } = await import("@/lib/server/mongodb");
const { setupDatabase } = await import("../db/schema.mjs");

// Unreachable server, with credentials in the URI so we can check they are never logged.
const UNREACHABLE_URI = "mongodb://app_user:NeverLogThisPassword9@127.0.0.1:1/webaiautomation?directConnection=true";

let raw: MongoClient;
const rateLimitDocs = () => raw.db(dbName).collection<{ _id: string; count: number }>("rate_limits");

async function databaseGoesDown() {
  await closeMongo();
  process.env.MONGODB_URI = UNREACHABLE_URI;
}

async function databaseComesBack() {
  await closeMongo();
  process.env.MONGODB_URI = uri;
  rateLimit.rateLimitTestHooks.retryDatabaseNow();
}

const form = (password: string) => {
  const fd = new FormData();
  fd.set("password", password);
  return fd;
};

beforeAll(async () => {
  raw = await new MongoClient(uri).connect();
});

beforeEach(async () => {
  await closeMongo();
  process.env.MONGODB_URI = uri;
  rateLimit.rateLimitTestHooks.reset();
  request.cookies.clear();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await closeMongo();
  await raw.close();
  await dropTestDatabase(uri, dbName);
});

describe("rate limiting when MongoDB is unavailable", () => {
  it("uses the shared MongoDB counters during normal operation", async () => {
    const result = await rateLimit.consumeRateLimit("normal:key", 3, 60);
    expect(result).toMatchObject({ allowed: true, source: "database" });
    expect((await rateLimitDocs().findOne({ _id: "normal:key" }))?.count).toBe(1);
    expect(rateLimit.rateLimitTestHooks.memorySize()).toBe(0);
  });

  it("keeps enforcing the same limit from memory, logs once, and never logs credentials", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    await databaseGoesDown();

    const first = await rateLimit.consumeRateLimit("outage:key", 3, 60); // waits for the server-selection timeout once
    const started = Date.now();
    const rest = [];
    for (let i = 0; i < 3; i++) rest.push(await rateLimit.consumeRateLimit("outage:key", 3, 60));
    const elapsed = Date.now() - started;

    expect([first, ...rest].map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect([first, ...rest].every((r) => r.source === "memory")).toBe(true);
    expect(elapsed).toBeLessThan(500); // later calls skip the dead database instead of timing out again

    expect(errors).toHaveBeenCalledTimes(1);
    const logged = errors.mock.calls.flat().join(" ");
    expect(logged).toContain("MongoDB unavailable");
    expect(logged).not.toContain("NeverLogThisPassword9");
    expect(logged).not.toContain("outage:key");
  }, 20_000);

  it("keeps the admin login limit (8 attempts per 15 minutes) during an outage", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await databaseGoesDown();
    request.ip = "192.0.2.50";

    const answers: string[] = [];
    for (let i = 0; i < 9; i++) answers.push((await login({}, form(`wrong-guess-${i}-xxxx`))).error ?? "");
    expect(answers.slice(0, 8).every((a) => a === "Incorrect password.")).toBe(true);
    expect(answers[8]).toMatch(/Too many sign-in attempts/);

    // The correct password is refused too until the window ends, and no session is created.
    expect((await login({}, form(TEST_ADMIN_PASSWORD))).error).toMatch(/Too many/);
    expect(request.cookies.size).toBe(0);

    // Another IP is limited independently, as before.
    request.ip = "192.0.2.51";
    expect((await login({}, form("another-wrong-guess"))).error).toBe("Incorrect password.");
  }, 20_000);

  it("retries MongoDB after the fallback period and restores shared counters", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await databaseGoesDown();
    await rateLimit.consumeRateLimit("recovery:a", 5, 60);

    // Database is back, but within the fallback period memory is still used.
    await closeMongo();
    process.env.MONGODB_URI = uri;
    expect((await rateLimit.consumeRateLimit("recovery:b", 5, 60)).source).toBe("memory");
    expect(await rateLimitDocs().findOne({ _id: "recovery:b" })).toBeNull();

    // After the period, MongoDB is used again.
    rateLimit.rateLimitTestHooks.retryDatabaseNow();
    const back = await rateLimit.consumeRateLimit("recovery:c", 5, 60);
    expect(back).toMatchObject({ allowed: true, source: "database" });
    expect((await rateLimitDocs().findOne({ _id: "recovery:c" }))?.count).toBe(1);
    expect(info.mock.calls.flat().join(" ")).toContain("MongoDB reachable again");
  }, 20_000);

  it("does not let an outage or its end reset a counter", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    await databaseGoesDown();
    const duringOutage = [];
    for (let i = 0; i < 3; i++) duringOutage.push((await rateLimit.consumeRateLimit("carry:key", 2, 60)).allowed);
    expect(duringOutage).toEqual([true, true, false]);

    await databaseComesBack();
    // MongoDB has no record of this key yet, but the counter from the outage still applies.
    const afterRecovery = await rateLimit.consumeRateLimit("carry:key", 2, 60);
    expect(afterRecovery.allowed).toBe(false);
    expect(afterRecovery.retryAfterSeconds).toBeGreaterThan(0);

    // Keys untouched during the outage use MongoDB normally.
    expect(await rateLimit.consumeRateLimit("carry:fresh", 2, 60)).toMatchObject({ allowed: true, source: "database" });
  }, 20_000);

  it("refuses new keys when the memory store is full instead of evicting live counters", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await databaseGoesDown();
    expect((await rateLimit.consumeRateLimit("bounded:probe", 2, 60)).allowed).toBe(true);
    for (let i = 1; i < rateLimit.MAX_MEMORY_KEYS; i++) await rateLimit.consumeRateLimit(`bounded:filler:${i}`, 2, 60);
    expect(rateLimit.rateLimitTestHooks.memorySize()).toBe(rateLimit.MAX_MEMORY_KEYS);

    expect((await rateLimit.consumeRateLimit("bounded:new", 2, 60)).allowed).toBe(false);
    // The existing counter was not evicted: it continues from where it was.
    expect((await rateLimit.consumeRateLimit("bounded:probe", 2, 60)).allowed).toBe(true);
    expect((await rateLimit.consumeRateLimit("bounded:probe", 2, 60)).allowed).toBe(false);
  }, 20_000);

  it("throws (does not fall back) for database errors that are not outages", async () => {
    await setupDatabase(raw.db(dbName)); // applies the validator: _id is at most 200 characters
    await expect(rateLimit.consumeRateLimit("x".repeat(250), 3, 60)).rejects.toMatchObject({ code: 121 });
    expect(rateLimit.rateLimitTestHooks.memorySize()).toBe(0);
  });

  it("refuses sign-in when rate limiting fails unexpectedly", async () => {
    vi.resetModules();
    vi.doMock("@/lib/server/rate-limit", () => ({
      consumeRateLimit: async () => {
        throw new Error("unexpected failure");
      },
    }));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { login: loginWithBrokenLimiter } = await import("@/lib/actions/admin-auth");

    const result = await loginWithBrokenLimiter({}, form(TEST_ADMIN_PASSWORD));
    expect(result.error).toMatch(/temporarily unavailable/);
    expect(request.cookies.size).toBe(0);
    expect(errors.mock.calls.flat().join(" ")).toContain("sign-in refused");
    vi.doUnmock("@/lib/server/rate-limit");
  });
});
