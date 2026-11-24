import { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dropTestDatabase, setupTestDatabase, validLead } from "./support/test-env";

// Admin session check, toggled per test (the real one reads request cookies).
const auth = vi.hoisted(() => ({ allowed: true }));
vi.mock("@/lib/auth/session", () => ({
  requireAdmin: async () => {
    if (!auth.allowed) throw Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/admin/login;307;" });
    return { userId: "superadmin", role: "superadmin", email: "owner@example.com", name: "Test Admin" };
  },
  actorLabel: (s: { name: string; email: string }) => `${s.name} (${s.email})`,
}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const { uri, dbName } = setupTestDatabase();

const { COLLECTIONS, setupDatabase } = await import("../db/schema.mjs");
const mongo = await import("@/lib/server/mongodb");
const leads = await import("@/lib/server/leads");
const { consumeRateLimit } = await import("@/lib/server/rate-limit");
const leadActions = await import("@/lib/actions/leads");

let raw: MongoClient;

beforeAll(async () => {
  raw = await new MongoClient(uri).connect();
});

afterAll(async () => {
  await mongo.closeMongo();
  await raw.close();
  await dropTestDatabase(uri, dbName);
});

beforeEach(() => {
  auth.allowed = true;
});

describe("connection", () => {
  it("connects and reuses one client across calls", async () => {
    const first = await mongo.getMongoClient();
    const second = await mongo.getMongoClient();
    expect(second).toBe(first);
    expect(await (await mongo.getDb()).command({ ping: 1 })).toMatchObject({ ok: 1 });
  });

  it("shares a single connect() between concurrent first requests", async () => {
    await mongo.closeMongo();
    const clients = await Promise.all(Array.from({ length: 5 }, () => mongo.getMongoClient()));
    expect(new Set(clients).size).toBe(1);
  });

  it("does not cache a failed connection and recovers on the next call", async () => {
    await mongo.closeMongo();
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?directConnection=true";
    await expect(mongo.getMongoClient()).rejects.toThrow();
    process.env.MONGODB_URI = uri;
    await expect(mongo.getMongoClient()).resolves.toBeInstanceOf(MongoClient);
  }, 20_000);

  it("reports a missing MONGODB_URI clearly", async () => {
    await mongo.closeMongo();
    delete process.env.MONGODB_URI;
    expect(mongo.isDatabaseConfigured()).toBe(false);
    await expect(mongo.getDb()).rejects.toBeInstanceOf(mongo.DatabaseNotConfiguredError);
    process.env.MONGODB_URI = uri;
  });
});

describe("schema and indexes", () => {
  it("creates collections, validators and the required indexes (idempotently)", async () => {
    await mongo.getDb(); // app-side ensureIndexes
    const db = raw.db(dbName);
    await setupDatabase(db);
    await setupDatabase(db); // second run must not fail

    const leadIndexes = await db.collection(COLLECTIONS.leads).indexes();
    expect(leadIndexes.find((i) => i.name === "reference_unique")).toMatchObject({ key: { reference: 1 }, unique: true });
    expect(leadIndexes.map((i) => i.name)).toEqual(expect.arrayContaining(["created_desc", "status_created", "email_created"]));

    const noteIndexes = await db.collection(COLLECTIONS.leadNotes).indexes();
    expect(noteIndexes.find((i) => i.name === "lead_created")?.key).toEqual({ leadId: 1, createdAt: -1 });

    const ttl = (await db.collection(COLLECTIONS.rateLimits).indexes()).find((i) => i.name === "expires_ttl");
    expect(ttl).toMatchObject({ key: { expiresAt: 1 }, expireAfterSeconds: 0 });
  });

  it("rejects documents that break the validator", async () => {
    const db = raw.db(dbName);
    const bad = { ...validLead(), reference: "WAA-ZZZZZZ", status: "bogus", notificationStatus: "pending", createdAt: new Date(), updatedAt: new Date() };
    await expect(db.collection(COLLECTIONS.leads).insertOne(bad)).rejects.toMatchObject({ code: 121 });
    await expect(db.collection(COLLECTIONS.leads).insertOne({ ...bad, status: "new", ipHash: "203.0.113.7" })).rejects.toMatchObject({ code: 121 });
    await expect(db.collection(COLLECTIONS.rateLimits).insertOne({ _id: "x" as never, count: 1 })).rejects.toMatchObject({ code: 121 });
  });
});

describe("leads", () => {
  it("creates and retrieves a lead", async () => {
    const { id, reference } = await leads.createLead(validLead());
    expect(reference).toMatch(/^WAA-[A-Z2-9]{6}$/);
    expect(leads.isLeadId(id)).toBe(true);

    const lead = await leads.getLead(id);
    expect(lead).toMatchObject({ id, reference, status: "new", email: "test@example.com", notificationStatus: "pending" });
    expect(lead).not.toHaveProperty("ipHash");
    expect(Date.parse(lead!.createdAt)).not.toBeNaN();

    const stored = await raw.db(dbName).collection(COLLECTIONS.leads).findOne({ reference });
    expect(stored?.ipHash).toBe("0123456789abcdef0123456789abcdef");
  });

  it("prevents duplicate references and retries with a new one", async () => {
    await leads.createLead(validLead(), () => "WAA-AAAAAA");
    const sequence = ["WAA-AAAAAA", "WAA-BBBBBB"];
    const second = await leads.createLead(validLead(), () => sequence.shift()!);
    expect(second.reference).toBe("WAA-BBBBBB");

    const docs = await raw.db(dbName).collection(COLLECTIONS.leads).countDocuments({ reference: "WAA-AAAAAA" });
    expect(docs).toBe(1);
    // Direct duplicate insert is refused by the unique index.
    await expect(raw.db(dbName).collection(COLLECTIONS.leads).insertOne({ ...validLead(), reference: "WAA-AAAAAA", status: "new", notificationStatus: "pending", createdAt: new Date(), updatedAt: new Date() })).rejects.toMatchObject({ code: 11000 });
  });

  it("lists newest first, filters by status and counts by status", async () => {
    const { id } = await leads.createLead(validLead({ email: "filter@example.com" }));
    expect(await leads.updateLeadStatus(id, "qualified")).toBe(true);

    const all = await leads.listLeads();
    expect(all.length).toBeGreaterThanOrEqual(4);
    expect(all.map((l) => l.createdAt)).toEqual([...all.map((l) => l.createdAt)].sort().reverse());

    const qualified = await leads.listLeads("qualified");
    expect(qualified.map((l) => l.id)).toEqual([id]);

    const counts = await leads.countLeadsByStatus();
    expect(counts.qualified).toBe(1);
    expect(counts.all).toBe(all.length);
  });

  it("updates status and touches updatedAt; unknown or malformed ids are rejected", async () => {
    const { id } = await leads.createLead(validLead());
    const before = (await leads.getLead(id))!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    expect(await leads.updateLeadStatus(id, "won")).toBe(true);
    const after = (await leads.getLead(id))!;
    expect(after.status).toBe("won");
    expect(after.updatedAt > before).toBe(true);

    expect(await leads.updateLeadStatus("0123456789abcdef01234567", "won")).toBe(false);
    expect(await leads.updateLeadStatus("not-an-id", "won")).toBe(false);
    expect(await leads.getLead('{"$ne":null}')).toBeNull();
  });

  it("adds internal notes, newest first, with author and lead reference", async () => {
    const { id, reference } = await leads.createLead(validLead());
    expect(await leads.addLeadNote(id, "First call done")).toBe(true);
    expect(await leads.addLeadNote(id, "Quote sent")).toBe(true);
    const notes = await leads.getLeadNotes(id);
    expect(notes.map((n) => n.body)).toEqual(["Quote sent", "First call done"]);
    expect(notes[0].author).toBe("admin");

    const stored = await raw.db(dbName).collection(COLLECTIONS.leadNotes).findOne({ body: "Quote sent" });
    expect(stored?.leadReference).toBe(reference);

    expect(await leads.addLeadNote("0123456789abcdef01234567", "orphan")).toBe(false);
    expect(await raw.db(dbName).collection(COLLECTIONS.leadNotes).countDocuments({ body: "orphan" })).toBe(0);
  });

  it("claims a notification for exactly one caller", async () => {
    const { id } = await leads.createLead(validLead());
    const results = await Promise.all(Array.from({ length: 10 }, () => leads.claimLeadNotification(id)));
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await leads.getLead(id))!.notificationStatus).toBe("sending");
  });

  it("refuses every admin read and write without a session", async () => {
    const { id } = await leads.createLead(validLead());
    auth.allowed = false;
    await expect(leads.listLeads()).rejects.toThrow("NEXT_REDIRECT");
    await expect(leads.getLead(id)).rejects.toThrow("NEXT_REDIRECT");
    await expect(leads.updateLeadStatus(id, "lost")).rejects.toThrow("NEXT_REDIRECT");
    await expect(leads.addLeadNote(id, "x")).rejects.toThrow("NEXT_REDIRECT");
    auth.allowed = true;
    expect((await leads.getLead(id))!.status).toBe("new");
  });
});

describe("admin lead actions", () => {
  const form = (entries: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.set(k, v);
    return fd;
  };

  it("updates status and adds notes through the Server Actions", async () => {
    const { id } = await leads.createLead(validLead());
    expect(await leadActions.updateLeadStatusAction(id, {}, form({ status: "contacted" }))).toMatchObject({ ok: true });
    expect(await leadActions.updateLeadStatusAction(id, {}, form({ status: "hacked" }))).toMatchObject({ error: "Invalid status." });
    expect(await leadActions.addLeadNoteAction(id, {}, form({ note: "  Called ​today  " }))).toMatchObject({ ok: true });
    expect(await leadActions.addLeadNoteAction(id, {}, form({ note: "   " }))).toMatchObject({ error: "Write a note first." });
    expect((await leads.getLeadNotes(id))[0].body).toBe("Called today");
    expect((await leads.getLead(id))!.status).toBe("contacted");
  });
});

describe("rate limiting", () => {
  it("allows up to the limit, then blocks", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await consumeRateLimit("test:sequential", 3, 60)).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("stays exact under concurrent requests", async () => {
    const results = await Promise.all(Array.from({ length: 30 }, () => consumeRateLimit("test:concurrent", 10, 60)));
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    const doc = await raw.db(dbName).collection(COLLECTIONS.rateLimits).findOne({ _id: "test:concurrent" as never });
    expect(doc?.count).toBe(30);
    expect(doc?.expiresAt).toBeInstanceOf(Date);
    expect(doc!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("starts a fresh window after expiry, and keys are independent", async () => {
    expect((await consumeRateLimit("test:window", 1, 1)).allowed).toBe(true);
    expect((await consumeRateLimit("test:window", 1, 1)).allowed).toBe(false);
    expect((await consumeRateLimit("test:other", 1, 1)).allowed).toBe(true);
    await new Promise((r) => setTimeout(r, 1_200));
    const fresh = await consumeRateLimit("test:window", 1, 1);
    expect(fresh.allowed).toBe(true);
    const doc = await raw.db(dbName).collection(COLLECTIONS.rateLimits).findOne({ _id: "test:window" as never });
    expect(doc?.count).toBe(1);
  });

  it("reports how long to wait", async () => {
    await consumeRateLimit("test:retry", 1, 120);
    const blocked = await consumeRateLimit("test:retry", 1, 120);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(100);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(120);
  });
});
