import { MongoClient } from "mongodb";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dropTestDatabase, setupTestDatabase } from "./support/test-env";

/**
 * Integration tests for the business features: public forms (contact,
 * newsletter, tool submissions), clients, invoices, MRR reporting,
 * analytics and permissions — against a real (throwaway) MongoDB with the
 * production validators applied.
 */

const ctx = vi.hoisted(() => ({
  role: "superadmin" as "superadmin" | "admin" | "viewer" | null,
  ip: "203.0.113.50",
  afterTasks: [] as Promise<unknown>[],
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: async (minimum: "superadmin" | "admin" | "viewer" = "viewer") => {
    const rank = { viewer: 1, admin: 2, superadmin: 3 };
    if (!ctx.role) throw Object.assign(new Error("NEXT_REDIRECT /admin/login"), { url: "/admin/login" });
    if (rank[ctx.role] < rank[minimum]) throw Object.assign(new Error("NEXT_REDIRECT forbidden"), { url: "/admin?notice=forbidden" });
    return { userId: "superadmin", role: ctx.role, email: "owner@example.com", name: "Test Owner" };
  },
  actorLabel: (s: { name: string; email: string }) => `${s.name} (${s.email})`,
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": ctx.ip, "user-agent": "Mozilla/5.0 vitest" }),
}));
vi.mock("next/server", () => ({
  after: (task: () => Promise<unknown>) => {
    ctx.afterTasks.push(Promise.resolve().then(task));
  },
}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const { uri, dbName } = setupTestDatabase();

const { setupDatabase, COLLECTIONS } = await import("../db/schema.mjs");
const publicForms = await import("@/lib/actions/public-forms");
const { unsubscribeAction } = await import("@/lib/actions/newsletter");
const billing = await import("@/lib/actions/billing");
const inbox = await import("@/lib/actions/inbox");
const clients = await import("@/lib/server/clients");
const invoices = await import("@/lib/server/invoices");
const subscribers = await import("@/lib/server/subscribers");
const analytics = await import("@/lib/server/analytics");
const { toCsv } = await import("@/lib/server/csv");
const { parseMoney, formatMoney } = await import("@/lib/money");
const { closeMongo } = await import("@/lib/server/mongodb");

let raw: MongoClient;
const col = (name: string) => raw.db(dbName).collection(name);

beforeAll(async () => {
  raw = await new MongoClient(uri).connect();
  // Apply the production validators, so every insert below is checked against them.
  await setupDatabase(raw.db(dbName));
});
afterAll(async () => {
  await closeMongo();
  await raw.close();
  await dropTestDatabase(uri, dbName);
});
let ipCounter = 50;
beforeEach(() => {
  ctx.role = "superadmin";
  ctx.ip = `203.0.113.${ipCounter++}`;
});
afterEach(async () => {
  await Promise.allSettled(ctx.afterTasks.splice(0));
});

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};
/** A form that looks human: rendered 10 seconds ago, honeypot empty. */
const humanForm = (entries: Record<string, string>) => form({ startedAt: String(Date.now() - 10_000), ...entries });

describe("money helpers", () => {
  it("parses and formats amounts in minor units", () => {
    expect(parseMoney("1,299.50")).toBe(129950);
    expect(parseMoney("$299")).toBe(29900);
    expect(parseMoney("0")).toBe(0);
    expect(parseMoney("-5")).toBeNull();
    expect(parseMoney("12.345")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(formatMoney(29900, "USD")).toBe("$299.00");
    expect(formatMoney(14900, "GBP")).toBe("£149.00");
  });
});

describe("contact form", () => {
  it("stores a valid message and logs activity", async () => {
    const result = await publicForms.submitContactMessage({ status: "idle" }, humanForm({ name: "Jane Client", email: "Jane@Example.com", topic: "services", message: "Hi, I'd like to automate our lead follow-up emails.", sourcePath: "/contact" }));
    expect(result).toMatchObject({ status: "success", reference: expect.stringMatching(/^MSG-[A-Z2-9]{6}$/) });
    await Promise.allSettled(ctx.afterTasks.splice(0));
    const doc = await col(COLLECTIONS.messages).findOne({ email: "jane@example.com" });
    expect(doc).toMatchObject({ name: "Jane Client", topic: "services", status: "new", notificationStatus: "not_configured", sourcePath: "/contact" });
    expect(doc!.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(await col(COLLECTIONS.activity).countDocuments({ action: "message.created" })).toBe(1);
  });

  it("returns field errors for invalid input and stores nothing", async () => {
    const before = await col(COLLECTIONS.messages).countDocuments();
    const result = await publicForms.submitContactMessage({ status: "idle" }, humanForm({ name: "J", email: "nope", topic: "hacking", message: "short" }));
    expect(result.status).toBe("error");
    if (result.status === "error") expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(["email", "message", "name", "topic"]);
    expect(await col(COLLECTIONS.messages).countDocuments()).toBe(before);
  });

  it("silently drops bots (honeypot or instant submit)", async () => {
    const before = await col(COLLECTIONS.messages).countDocuments();
    const valid = { name: "Bot Person", email: "bot@example.com", topic: "general", message: "This is a long enough message from a bot." };
    expect(await publicForms.submitContactMessage({ status: "idle" }, humanForm({ ...valid, hp_extra_info: "spam" }))).toMatchObject({ status: "success" });
    expect(await publicForms.submitContactMessage({ status: "idle" }, form({ ...valid, startedAt: String(Date.now()) }))).toMatchObject({ status: "success" });
    expect(await col(COLLECTIONS.messages).countDocuments()).toBe(before);
  });

  it("rate-limits one visitor to 5 messages per hour", async () => {
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(await publicForms.submitContactMessage({ status: "idle" }, humanForm({ name: "Busy Person", email: `busy${i}@example.com`, topic: "general", message: `Message number ${i} with enough characters.` })));
    }
    expect(results.slice(0, 5).every((r) => r.status === "success")).toBe(true);
    expect(results[5]).toMatchObject({ status: "error", message: expect.stringMatching(/several requests/) });
  });

  it("admins can mark messages replied, archive and delete them; viewers can't", async () => {
    const doc = await col(COLLECTIONS.messages).findOne({ email: "jane@example.com" });
    const id = doc!._id.toHexString();
    ctx.role = "viewer";
    await expect(inbox.setMessageStatusAction(id, "replied")).rejects.toMatchObject({ url: "/admin?notice=forbidden" });
    ctx.role = "admin";
    expect(await inbox.setMessageStatusAction(id, "replied")).toMatchObject({ ok: true });
    expect(await inbox.setMessageStatusAction(id, "bogus")).toMatchObject({ error: "Invalid request." });
    expect((await col(COLLECTIONS.messages).findOne({ _id: doc!._id }))!.status).toBe("replied");
    expect(await inbox.deleteMessageAction(id)).toMatchObject({ ok: true, redirectTo: "/admin/messages" });
    expect(await col(COLLECTIONS.messages).countDocuments({ _id: doc!._id })).toBe(0);
  });
});

describe("newsletter", () => {
  it("requires consent, subscribes once, and unsubscribes with the token", async () => {
    expect(await publicForms.subscribeNewsletter({ status: "idle" }, humanForm({ email: "reader@example.com" }))).toMatchObject({ status: "error" });
    expect(await publicForms.subscribeNewsletter({ status: "idle" }, humanForm({ email: "Reader@Example.com", consent: "yes", sourcePath: "/blog" }))).toMatchObject({ status: "success" });
    // Same answer the second time (no way to probe who is subscribed), still one document.
    expect(await publicForms.subscribeNewsletter({ status: "idle" }, humanForm({ email: "reader@example.com", consent: "yes" }))).toMatchObject({ status: "success" });
    expect(await col(COLLECTIONS.subscribers).countDocuments({ email: "reader@example.com" })).toBe(1);

    const doc = await col(COLLECTIONS.subscribers).findOne({ email: "reader@example.com" });
    expect(await subscribers.findByToken(doc!.token)).toEqual({ maskedEmail: "re****@example.com", status: "subscribed" });
    expect(await unsubscribeAction({ status: "idle" }, form({ token: "not-a-token" }))).toMatchObject({ status: "error" });
    expect(await unsubscribeAction({ status: "idle" }, form({ token: doc!.token }))).toMatchObject({ status: "success" });
    expect((await col(COLLECTIONS.subscribers).findOne({ _id: doc!._id }))).toMatchObject({ status: "unsubscribed", unsubscribedAt: expect.any(Date) });
    expect(await subscribers.countSubscribers()).toMatchObject({ subscribed: 0, unsubscribed: 1 });

    // Signing up again re-activates the same record.
    await publicForms.subscribeNewsletter({ status: "idle" }, humanForm({ email: "reader@example.com", consent: "yes" }));
    expect(await subscribers.countSubscribers()).toMatchObject({ subscribed: 1, unsubscribed: 0 });
  });
});

describe("tool submissions", () => {
  it("stores a valid suggestion and lets an admin review it", async () => {
    const result = await publicForms.submitToolSuggestion(
      { status: "idle" },
      humanForm({ toolName: "Acme Writer", website: "acme-writer.example", category: "ai-writing", pricing: "Freemium", description: "An AI writing assistant that drafts blog posts and emails for small teams.", email: "founder@acme.example", relationship: "founder" }),
    );
    expect(result).toMatchObject({ status: "success", reference: expect.stringMatching(/^SUB-/) });
    const doc = await col(COLLECTIONS.toolSubmissions).findOne({ toolName: "Acme Writer" });
    expect(doc).toMatchObject({ website: "https://acme-writer.example/", status: "pending", relationship: "founder" });

    expect(await inbox.reviewSubmissionAction(doc!._id.toHexString(), {}, form({ status: "approved", note: "Great fit" }))).toMatchObject({ ok: true });
    expect(await col(COLLECTIONS.toolSubmissions).findOne({ _id: doc!._id })).toMatchObject({ status: "approved", reviewNote: "Great fit", reviewedBy: "Test Owner" });
  });

  it("rejects unknown categories and pricing", async () => {
    const result = await publicForms.submitToolSuggestion({ status: "idle" }, humanForm({ toolName: "X Tool", website: "x.example", category: "made-up", pricing: "Cheap", description: "A description that is certainly longer than forty characters.", email: "a@b.example" }));
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.fieldErrors).toMatchObject({ category: expect.any(String), pricing: expect.any(String) });
  });
});

const clientForm = (overrides: Record<string, string> = {}) =>
  form({
    name: "Bright Plumbing LLC",
    contactName: "Mike Bright",
    email: "mike@brightplumbing.example",
    phone: "+1 555 010 2030",
    country: "United States",
    website: "brightplumbing.example",
    address: "12 Main St\nAustin, TX",
    plan: "AI Lead Response",
    currency: "USD",
    monthlyFee: "299",
    setupFee: "499",
    billingDay: "1",
    status: "active",
    startDate: "2026-01-01",
    paymentLink: "https://payoneer.example/pay/abc",
    notes: "",
    ...overrides,
  });

describe("clients and invoices", () => {
  let clientId = "";

  it("validates and creates clients; viewers can't", async () => {
    expect(await billing.saveClientAction(null, {}, clientForm({ email: "bad", monthlyFee: "abc", billingDay: "31" }))).toMatchObject({ fieldErrors: { email: expect.any(String), monthlyFee: expect.any(String), billingDay: expect.any(String) } });
    ctx.role = "viewer";
    await expect(billing.saveClientAction(null, {}, clientForm())).rejects.toMatchObject({ url: "/admin?notice=forbidden" });
    ctx.role = "admin";
    const result = await billing.saveClientAction(null, {}, clientForm());
    expect(result).toMatchObject({ ok: true, redirectTo: expect.stringMatching(/^\/admin\/clients\/[0-9a-f]{24}$/) });
    clientId = result.redirectTo!.split("/").pop()!;
    expect(await col(COLLECTIONS.clients).findOne({})).toMatchObject({ monthlyFee: 29900, setupFee: 49900, website: "https://brightplumbing.example/", currency: "USD" });
  });

  it("adds up MRR per currency for active clients only", async () => {
    await billing.saveClientAction(null, {}, clientForm({ name: "London Dental", email: "hello@londondental.example", currency: "GBP", monthlyFee: "149", setupFee: "0", plan: "Automation Care" }));
    await billing.saveClientAction(null, {}, clientForm({ name: "Paused Co", email: "p@paused.example", status: "paused", monthlyFee: "999" }));
    await billing.saveClientAction(null, {}, clientForm({ name: "One Off Ltd", email: "o@oneoff.example", monthlyFee: "0", setupFee: "0", plan: "One-time project" }));
    const mrr = await clients.getMrr();
    expect(mrr).toEqual(
      expect.arrayContaining([
        { currency: "USD", amount: 29900, clients: 1 },
        { currency: "GBP", amount: 14900, clients: 1 },
      ]),
    );
    expect(mrr).toHaveLength(2);
  });

  it("generates one draft retainer invoice per active client per month (setup fee on the first)", async () => {
    const first = await billing.generateMonthlyInvoicesAction({}, form({ period: "2026-11" }));
    expect(first).toMatchObject({ ok: true, message: expect.stringMatching(/Created 2 draft invoices/) });
    const nov = await col(COLLECTIONS.invoices).find({ period: "2026-11" }).sort({ total: -1 }).toArray();
    expect(nov).toHaveLength(2);
    expect(nov[0]).toMatchObject({ status: "draft", currency: "USD", total: 29900 + 49900, number: expect.stringMatching(/^INV-2026-\d{4}$/) });
    expect(nov[0].items.map((i: { description: string }) => i.description)).toEqual(["AI Lead Response — one-time setup", "AI Lead Response — monthly retainer (November 2026)"]);
    expect(nov[0].publicToken).toMatch(/^[0-9a-f]{40}$/);
    expect(nov[1]).toMatchObject({ currency: "GBP", total: 14900 });

    // Running it again creates nothing new.
    expect(await billing.generateMonthlyInvoicesAction({}, form({ period: "2026-11" }))).toMatchObject({ ok: true, message: expect.stringMatching(/Nothing new/) });
    expect(await col(COLLECTIONS.invoices).countDocuments({ period: "2026-11" })).toBe(2);

    // Next month: no setup fee any more.
    await billing.generateMonthlyInvoicesAction({}, form({ period: "2026-12" }));
    const dec = await col(COLLECTIONS.invoices).findOne({ period: "2026-12", currency: "USD" });
    expect(dec).toMatchObject({ total: 29900 });
    expect(dec!.items).toHaveLength(1);
  });

  it("refuses a manual invoice for an already-billed month", async () => {
    const result = await billing.saveInvoiceAction(null, {}, form({ clientId, currency: "USD", issueDate: "2026-11-05", dueDate: "2026-11-12", period: "2026-11", items: JSON.stringify([{ description: "Extra", quantity: 1, unitAmount: "10" }]) }));
    expect(result).toMatchObject({ error: expect.stringMatching(/already has an invoice for November 2026/) });
  });

  it("creates a one-off invoice with line items and validates them", async () => {
    expect(await billing.saveInvoiceAction(null, {}, form({ clientId, currency: "USD", issueDate: "2026-11-05", dueDate: "2026-11-01", items: "[]" }))).toMatchObject({ fieldErrors: { items: expect.any(String), dueDate: expect.any(String) } });
    const result = await billing.saveInvoiceAction(
      null,
      {},
      form({ clientId, currency: "USD", issueDate: "2026-11-05", dueDate: "2026-11-12", notes: "Thanks!", items: JSON.stringify([{ description: "Chatbot training session", quantity: 1.5, unitAmount: "100" }, { description: "Zapier setup", quantity: 2, unitAmount: "49.99" }]) }),
    );
    expect(result).toMatchObject({ ok: true, redirectTo: expect.stringMatching(/^\/admin\/invoices\//) });
    const id = result.redirectTo!.split("/").pop()!;
    const invoice = await invoices.getInvoice(id);
    expect(invoice).toMatchObject({ total: 15000 + 9998, status: "draft", period: null, paymentLink: "https://payoneer.example/pay/abc", client: { name: "Bright Plumbing LLC" } });
  });

  it("walks an invoice through sent → paid → unpaid, and keeps drafts private", async () => {
    const draft = await col(COLLECTIONS.invoices).findOne({ period: "2026-11", currency: "USD" });
    const id = draft!._id.toHexString();
    expect(await invoices.getInvoiceByToken(draft!.publicToken)).toBeNull(); // drafts aren't visible to clients

    expect(await billing.sendInvoiceEmailAction(id)).toMatchObject({ error: expect.stringMatching(/isn't configured/) });
    expect(await billing.markInvoiceSentAction(id)).toMatchObject({ ok: true });
    const shared = await invoices.getInvoiceByToken(draft!.publicToken);
    expect(shared).toMatchObject({ number: draft!.number, status: "sent" });

    expect(await billing.markInvoicePaidAction(id, {}, form({ method: "Bitcoin" }))).toMatchObject({ error: expect.any(String) });
    expect(await billing.markInvoicePaidAction(id, {}, form({ method: "Payoneer", reference: "PAY-123", paidAt: new Date().toISOString().slice(0, 10) }))).toMatchObject({ ok: true });
    expect(await col(COLLECTIONS.invoices).findOne({ _id: draft!._id })).toMatchObject({ status: "paid", paymentMethod: "Payoneer", paymentReference: "PAY-123" });

    // Paid invoices can't be voided or deleted.
    expect(await billing.voidInvoiceAction(id)).toMatchObject({ error: expect.stringMatching(/can't be voided/) });
    expect(await billing.deleteInvoiceAction(id)).toMatchObject({ error: expect.stringMatching(/Only draft/) });

    const now = new Date();
    const collected = await invoices.getCollected(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)));
    expect(collected).toEqual([{ currency: "USD", amount: 29900 + 49900, count: 1 }]);
    const revenue = await invoices.getMonthlyRevenue("USD", 6);
    expect(revenue).toHaveLength(6);
    expect(revenue[5].amount).toBe(29900 + 49900);

    expect(await billing.markInvoiceUnpaidAction(id)).toMatchObject({ ok: true });
    expect(await col(COLLECTIONS.invoices).findOne({ _id: draft!._id })).toMatchObject({ status: "sent", paidAt: null });
  });

  it("reports overdue invoices and deletes only drafts", async () => {
    const gbp = await col(COLLECTIONS.invoices).findOne({ period: "2026-11", currency: "GBP" });
    await col(COLLECTIONS.invoices).updateOne({ _id: gbp!._id }, { $set: { status: "sent", dueDate: new Date("2026-01-15T00:00:00Z") } });
    const receivables = await invoices.getReceivables();
    expect(receivables.overdue).toEqual([{ currency: "GBP", amount: 14900, count: 1 }]);
    expect((await invoices.listInvoices({ status: "overdue" })).map((i) => i.displayStatus)).toEqual(["overdue"]);

    const decDraft = await col(COLLECTIONS.invoices).findOne({ period: "2026-12", currency: "USD" });
    expect(await billing.deleteInvoiceAction(decDraft!._id.toHexString())).toMatchObject({ ok: true });
    expect(await billing.voidInvoiceAction(gbp!._id.toHexString())).toMatchObject({ ok: true });
  });

  it("won't delete a client that has invoices", async () => {
    expect(await billing.deleteClientAction(clientId)).toMatchObject({ error: expect.stringMatching(/has invoices/) });
    const oneOff = await col(COLLECTIONS.clients).findOne({ name: "One Off Ltd" });
    expect(await billing.deleteClientAction(oneOff!._id.toHexString())).toMatchObject({ ok: true });
  });

  it("converting a lead to a client marks the lead as won", async () => {
    const { createLead } = await import("@/lib/server/leads");
    const { id: leadId } = await createLead({
      kind: "service",
      fullName: "Lead Person",
      email: "lead@example.com",
      company: "Lead Co",
      website: null,
      category: "ai-lead-response",
      budget: "monthly-300-600",
      description: "We want an AI assistant that answers website enquiries for us.",
      contactMethod: "email",
      phone: null,
      sourcePath: "/services",
      ipHash: null,
      userAgent: null,
    });
    const result = await billing.saveClientAction(null, {}, clientForm({ name: "Lead Co", email: "lead@example.com", leadId }));
    expect(result).toMatchObject({ ok: true });
    expect(await col(COLLECTIONS.leads).findOne({ email: "lead@example.com" })).toMatchObject({ status: "won" });
    expect(await clients.findClientByLead(leadId)).toMatchObject({ name: "Lead Co" });
  });
});

describe("business settings", () => {
  it("validates and saves invoice settings", async () => {
    const base = { businessName: "WebAIAutomation", email: "billing@example.com", address: "Lahore, Pakistan", website: "webaiautomation.com", paymentInstructions: "Pay via Payoneer.", defaultPaymentLink: "", bookingUrl: "", invoicePrefix: "waa", dueDays: "10", defaultCurrency: "USD", invoiceFooter: "Thanks" };
    expect(await billing.saveSettingsAction({}, form({ ...base, dueDays: "500", invoicePrefix: "too-long-prefix" }))).toMatchObject({ fieldErrors: { dueDays: expect.any(String), invoicePrefix: expect.any(String) } });
    expect(await billing.saveSettingsAction({}, form(base))).toMatchObject({ ok: true });
    const { getBusinessSettings } = await import("@/lib/server/settings");
    expect(await getBusinessSettings()).toMatchObject({ invoicePrefix: "WAA", dueDays: 10, website: "https://webaiautomation.com/" });
  });
});

describe("analytics", () => {
  it("normalises paths and ignores admin/API/invoice pages and bots", () => {
    expect(analytics.normalizePath("/tools/claude?ref=x")).toBe("/tools/claude");
    expect(analytics.normalizePath("/blog/")).toBe("/blog");
    expect(analytics.normalizePath("/admin/leads")).toBeNull();
    expect(analytics.normalizePath("/invoice/abc")).toBeNull();
    expect(analytics.normalizePath("javascript:alert(1)")).toBeNull();
    expect(analytics.isLikelyBot("Googlebot/2.1")).toBe(true);
    expect(analytics.isLikelyBot("Mozilla/5.0 (Windows NT 10.0)")).toBe(false);
    expect(analytics.referrerHost("https://www.google.com/search?q=x", "webaiautomation.com")).toBe("google.com");
    expect(analytics.referrerHost("https://webaiautomation.com/blog", "webaiautomation.com")).toBeNull();
  });

  it("counts page views, unique visitors (once per day) and events", async () => {
    await analytics.recordPageView({ path: "/tools/claude", referrer: "google.com", ip: "198.51.100.1", userAgent: "UA-1" });
    await analytics.recordPageView({ path: "/services", referrer: null, ip: "198.51.100.1", userAgent: "UA-1" });
    await analytics.recordPageView({ path: "/tools/claude", referrer: null, ip: "198.51.100.2", userAgent: "UA-2" });
    await analytics.recordEvent("inquiry_submit");
    const report = await analytics.getAnalyticsReport(7);
    expect(report.totals).toMatchObject({ views: 3, visitors: 2 });
    expect(report.topPages[0]).toEqual({ key: "/tools/claude", count: 2 });
    expect(report.referrers).toEqual([{ key: "google.com", count: 1 }]);
    expect(report.events).toEqual([{ key: "inquiry_submit", count: 1 }]);
    expect(report.days).toHaveLength(7);
    expect((await analytics.getViewsByPrefix("/tools/")).get("/tools/claude")).toBe(2);
    // No raw IPs are stored anywhere.
    const stored = JSON.stringify(await col(COLLECTIONS.analyticsVisitors).find().toArray());
    expect(stored).not.toContain("198.51.100");
  });
});

describe("CSV export", () => {
  it("quotes cells and neutralises spreadsheet formulas", () => {
    expect(toCsv(["a", "b"], [["=HYPERLINK(\"x\")", 'He said "hi"'], ["+1", null]])).toBe('"a","b"\r\n"\'=HYPERLINK(""x"")","He said ""hi"""\r\n"\'+1",""\r\n');
  });
});
