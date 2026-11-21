import { MongoClient } from "mongodb";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { dropTestDatabase, setupTestDatabase } from "./support/test-env";

const request = vi.hoisted(() => ({ ip: "203.0.113.1", afterTasks: [] as Promise<unknown>[] }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": request.ip, "user-agent": "vitest-browser" }),
}));
vi.mock("next/server", () => ({
  // Run `after()` callbacks immediately but let tests await them.
  after: (task: () => Promise<unknown>) => {
    request.afterTasks.push(Promise.resolve().then(task));
  },
}));

const { uri, dbName } = setupTestDatabase();

const { submitInquiry } = await import("@/lib/actions/inquiry");
const { notifyNewLead } = await import("@/lib/server/lead-notifications");
const { closeMongo } = await import("@/lib/server/mongodb");

let raw: MongoClient;
const leadsCol = () => raw.db(dbName).collection("leads");

beforeAll(async () => {
  raw = await new MongoClient(uri).connect();
});
afterAll(async () => {
  await closeMongo();
  await raw.close();
  await dropTestDatabase(uri, dbName);
});
afterEach(async () => {
  // Let background notification jobs finish before the next test changes the environment.
  await Promise.allSettled(request.afterTasks.splice(0));
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.LEADS_NOTIFY_EMAIL;
});

let ipCounter = 10;
/** Each test uses its own IP so the per-IP limit doesn't leak between tests. */
function freshIp() {
  request.ip = `203.0.113.${ipCounter++}`;
}

function inquiry(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const fields: Record<string, string> = {
    kind: "service",
    fullName: "  Jane   Doe ",
    email: "Jane.Doe@Example.COM",
    company: "Acme Ltd",
    website: "acme.example",
    category: "crm-automation",
    budget: "199-399",
    description: "When a lead fills in our website form, add it to HubSpot and notify sales in Slack.​",
    contactMethod: "email",
    phone: "",
    sourcePath: "/services",
    startedAt: String(Date.now() - 10_000),
    hp_extra_info: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

async function settleAfterTasks() {
  await Promise.all(request.afterTasks.splice(0));
}

describe("inquiry form submission", () => {
  it("stores a valid inquiry with normalised, sanitised fields", async () => {
    freshIp();
    const result = await submitInquiry({ status: "idle" }, inquiry());
    expect(result).toMatchObject({ status: "success" });
    const reference = (result as { reference: string }).reference;
    expect(reference).toMatch(/^WAA-[A-Z2-9]{6}$/);

    await settleAfterTasks();
    const doc = await leadsCol().findOne({ reference });
    expect(doc).toMatchObject({
      kind: "service",
      status: "new",
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      website: "https://acme.example/",
      category: "crm-automation",
      contactMethod: "email",
      sourcePath: "/services",
      userAgent: "vitest-browser",
      notificationStatus: "not_configured",
    });
    expect(doc?.description).not.toContain("​");
    expect(doc?.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(doc)).not.toContain(request.ip);
  });

  it("silently drops honeypot and too-fast submissions", async () => {
    freshIp();
    const before = await leadsCol().countDocuments();
    expect(await submitInquiry({ status: "idle" }, inquiry({ hp_extra_info: "http://spam.example" }))).toMatchObject({ status: "success", reference: "received" });
    expect(await submitInquiry({ status: "idle" }, inquiry({ startedAt: String(Date.now() - 500) }))).toMatchObject({ status: "success", reference: "received" });
    expect(await submitInquiry({ status: "idle" }, inquiry({ startedAt: "" }))).toMatchObject({ status: "success", reference: "received" });
    expect(await submitInquiry({ status: "idle" }, inquiry({ startedAt: "0" }))).toMatchObject({ status: "success", reference: "received" });
    expect(await submitInquiry({ status: "idle" }, inquiry({ startedAt: String(Date.now() + 60_000) }))).toMatchObject({ status: "success", reference: "received" });
    const missing = inquiry();
    missing.delete("startedAt");
    expect(await submitInquiry({ status: "idle" }, missing)).toMatchObject({ status: "success", reference: "received" });
    expect(await leadsCol().countDocuments()).toBe(before);
  });

  it("returns field errors for invalid input and stores nothing", async () => {
    freshIp();
    const before = await leadsCol().countDocuments();
    const result = await submitInquiry(
      { status: "idle" },
      inquiry({ fullName: "", email: "nope", category: "{\"$ne\":null}", budget: "free", description: "short", contactMethod: "whatsapp", website: "javascript:alert(1)" }),
    );
    expect(result.status).toBe("error");
    const errors = (result as { fieldErrors: Record<string, string> }).fieldErrors;
    expect(Object.keys(errors).sort()).toEqual(["budget", "category", "description", "email", "fullName", "phone", "website"]);
    expect(await leadsCol().countDocuments()).toBe(before);
  });

  it("stores sponsor inquiries with a sponsorship option", async () => {
    freshIp();
    const result = await submitInquiry({ status: "idle" }, inquiry({ kind: "sponsor", category: "sponsored-guide", sourcePath: "/advertise" }));
    expect(result.status).toBe("success");
    const doc = await leadsCol().findOne({ reference: (result as { reference: string }).reference });
    expect(doc).toMatchObject({ kind: "sponsor", category: "sponsored-guide", sourcePath: "/advertise" });
    // A service category is not accepted for sponsor inquiries.
    expect((await submitInquiry({ status: "idle" }, inquiry({ kind: "sponsor", category: "crm-automation" }))).status).toBe("error");
  });

  it("limits each IP to 5 inquiries per hour", async () => {
    freshIp();
    const statuses: string[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await submitInquiry({ status: "idle" }, inquiry({ email: `ip-limit-${i}@example.com` }))).status);
    expect(statuses).toEqual(["success", "success", "success", "success", "success", "error"]);
  });

  it("limits each email address to 3 inquiries per hour, across IPs", async () => {
    const statuses: string[] = [];
    for (let i = 0; i < 4; i++) {
      freshIp();
      statuses.push((await submitInquiry({ status: "idle" }, inquiry({ email: "same.person@example.com" }))).status);
    }
    expect(statuses).toEqual(["success", "success", "success", "error"]);
  });

  it("handles concurrent submissions with unique references", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const fd = inquiry({ email: `concurrent-${i}@example.com` });
        return (async () => {
          request.ip = `198.18.0.${i}`;
          return submitInquiry({ status: "idle" }, fd);
        })();
      }),
    );
    const refs = results.map((r) => (r as { reference?: string }).reference);
    expect(results.every((r) => r.status === "success")).toBe(true);
    expect(new Set(refs).size).toBe(5);
  });

  it("answers with a friendly error when the database is unavailable", async () => {
    freshIp();
    await closeMongo();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?directConnection=true";
    await Promise.allSettled(request.afterTasks.splice(0));
    const result = await submitInquiry({ status: "idle" }, inquiry({ email: "db-down@example.com" }));
    expect(result).toMatchObject({ status: "error" });
    expect((result as { message: string }).message).toMatch(/wasn't saved/);
    expect((result as { message: string }).message).not.toMatch(/mongodb|127\.0\.0\.1/i);

    delete process.env.MONGODB_URI;
    expect((await submitInquiry({ status: "idle" }, inquiry({ email: "no-db@example.com" }))).status).toBe("error");
    process.env.MONGODB_URI = uri;
    await closeMongo();
  }, 20_000);
});

describe("Resend notifications", () => {
  function configureEmail() {
    process.env.RESEND_API_KEY = "re_test_not_a_real_key_123456";
    process.env.EMAIL_FROM = "WebAIAutomation <leads@example.com>";
    process.env.LEADS_NOTIFY_EMAIL = "owner@example.com";
  }

  async function submitOne(email: string) {
    freshIp();
    const result = await submitInquiry({ status: "idle" }, inquiry({ email }));
    expect(result.status).toBe("success");
    await settleAfterTasks();
    return (await leadsCol().findOne({ reference: (result as { reference: string }).reference }))!;
  }

  it("sends one well-formed email server-side and marks the lead as sent", async () => {
    configureEmail();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const doc = await submitOne("notify@example.com");
    expect(doc.notificationStatus).toBe("sent");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_not_a_real_key_123456");
    expect(headers["Idempotency-Key"]).toBe(`lead-${doc._id.toHexString()}`);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ from: "WebAIAutomation <leads@example.com>", to: ["owner@example.com"], reply_to: "notify@example.com" });
    expect(body.subject).toContain(doc.reference);

    // Calling the notifier again (e.g. a retry) must not send a second email.
    await notifyNewLead(doc._id.toHexString(), doc.reference, doc as never);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("escapes visitor input in the email HTML", async () => {
    configureEmail();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    freshIp();
    await submitInquiry({ status: "idle" }, inquiry({ email: "xss@example.com", company: "<img src=x onerror=alert(1)>" }));
    await settleAfterTasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.reply_to).toBe("xss@example.com");
    expect(body.html).not.toContain("<img src=x");
    expect(body.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("keeps the lead when Resend fails, and marks the notification failed", async () => {
    configureEmail();
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"message":"invalid key"}', { status: 401 })));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const doc = await submitOne("fail@example.com");
    expect(doc.notificationStatus).toBe("failed");
    expect(errors.mock.calls.flat().join(" ")).not.toContain("re_test_not_a_real_key_123456");
    errors.mockRestore();
  });

  it("does not call Resend when the sender address is invalid", async () => {
    configureEmail();
    process.env.EMAIL_FROM = "not an address";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const doc = await submitOne("bad-from@example.com");
    expect(doc.notificationStatus).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
