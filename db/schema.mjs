/**
 * MongoDB collections, document validators and indexes for WebAIAutomation.
 *
 * Single source of truth, shared by:
 *  - `npm run db:setup` (scripts/db-setup.mjs) — creates collections, applies validators and indexes;
 *  - the app (src/lib/server/mongodb.ts) — ensures indexes exist once per server process.
 *
 * Plain JavaScript (not TypeScript) so the setup script can import it with plain Node.
 */

export const COLLECTIONS = Object.freeze({
  leads: "leads",
  leadNotes: "lead_notes",
  rateLimits: "rate_limits",
  adminUsers: "admin_users",
  messages: "messages",
  subscribers: "subscribers",
  toolSubmissions: "tool_submissions",
  clients: "clients",
  invoices: "invoices",
  counters: "counters",
  settings: "settings",
  activity: "activity",
  analyticsDaily: "analytics_daily",
  analyticsVisitors: "analytics_visitors",
});

export const LEAD_KINDS = ["service", "sponsor"];
export const LEAD_STATUS_VALUES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"];
export const CONTACT_METHOD_VALUES = ["email", "whatsapp", "phone"];
export const NOTIFICATION_STATUS_VALUES = ["pending", "sending", "sent", "failed", "not_configured"];
export const ADMIN_ROLE_VALUES = ["admin", "viewer"];
export const MESSAGE_STATUS_VALUES = ["new", "read", "replied", "archived"];
export const SUBSCRIBER_STATUS_VALUES = ["subscribed", "unsubscribed"];
export const SUBMISSION_STATUS_VALUES = ["pending", "approved", "rejected"];
export const CLIENT_STATUS_VALUES = ["active", "paused", "cancelled"];
export const INVOICE_STATUS_VALUES = ["draft", "sent", "paid", "void"];
export const CURRENCY_VALUES = ["USD", "GBP", "AUD", "EUR", "CAD"];
export const ANALYTICS_KIND_VALUES = ["pv", "uv", "ev", "ref"];

const string = (maxLength, extra = {}) => ({ bsonType: "string", maxLength, ...extra });
const nullableString = (maxLength) => ({ bsonType: ["string", "null"], maxLength });
const nullableDate = { bsonType: ["date", "null"] };
const ipHash = { bsonType: ["string", "null"], pattern: "^[0-9a-f]{32}$" };
const money = { bsonType: ["int", "long", "double"], minimum: 0 };
/** Builds a strict `$jsonSchema` validator where every listed property is required. */
const strictObject = (properties) => ({
  $jsonSchema: { bsonType: "object", additionalProperties: false, required: Object.keys(properties), properties },
});

/** @type {{ name: string; validator: Record<string, unknown>; indexes: { key: Record<string, 1 | -1>; name: string; unique?: boolean; expireAfterSeconds?: number; partialFilterExpression?: Record<string, unknown> }[] }[]} */
export const COLLECTION_SPECS = [
  {
    name: COLLECTIONS.leads,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        additionalProperties: false,
        required: [
          "_id",
          "reference",
          "kind",
          "status",
          "fullName",
          "email",
          "company",
          "website",
          "category",
          "budget",
          "description",
          "contactMethod",
          "phone",
          "sourcePath",
          "ipHash",
          "userAgent",
          "notificationStatus",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          _id: { bsonType: "objectId" },
          reference: string(20, { pattern: "^WAA-[A-Z2-9]{6}$" }),
          kind: { enum: LEAD_KINDS },
          status: { enum: LEAD_STATUS_VALUES },
          fullName: string(120, { minLength: 2 }),
          email: string(254, { minLength: 3 }),
          company: string(160, { minLength: 2 }),
          website: nullableString(300),
          category: string(60),
          budget: string(30),
          description: string(4000, { minLength: 30 }),
          contactMethod: { enum: CONTACT_METHOD_VALUES },
          phone: nullableString(32),
          sourcePath: nullableString(200),
          // Keyed hash of the visitor IP. Raw IPs are never stored.
          ipHash: { bsonType: ["string", "null"], pattern: "^[0-9a-f]{32}$" },
          userAgent: nullableString(300),
          notificationStatus: { enum: NOTIFICATION_STATUS_VALUES },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
        },
      },
    },
    indexes: [
      { key: { reference: 1 }, name: "reference_unique", unique: true },
      { key: { createdAt: -1 }, name: "created_desc" },
      { key: { status: 1, createdAt: -1 }, name: "status_created" },
      { key: { email: 1, createdAt: -1 }, name: "email_created" },
    ],
  },
  {
    name: COLLECTIONS.leadNotes,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        additionalProperties: false,
        required: ["_id", "leadId", "leadReference", "body", "author", "createdAt"],
        properties: {
          _id: { bsonType: "objectId" },
          leadId: { bsonType: "objectId" },
          leadReference: string(20),
          body: string(4000, { minLength: 1 }),
          author: string(60, { minLength: 1 }),
          createdAt: { bsonType: "date" },
        },
      },
    },
    indexes: [{ key: { leadId: 1, createdAt: -1 }, name: "lead_created" }],
  },
  {
    name: COLLECTIONS.rateLimits,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        additionalProperties: false,
        required: ["_id", "count", "expiresAt"],
        properties: {
          // e.g. "inquiry:ip:<hash>" — never contains a raw IP or email.
          _id: string(200),
          count: { bsonType: ["int", "long"], minimum: 1 },
          expiresAt: { bsonType: "date" },
        },
      },
    },
    // TTL: MongoDB deletes each counter shortly after its window ends.
    indexes: [{ key: { expiresAt: 1 }, name: "expires_ttl", expireAfterSeconds: 0 }],
  },
  {
    name: COLLECTIONS.adminUsers,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      email: string(254, { minLength: 3 }),
      name: string(80, { minLength: 1 }),
      role: { enum: ADMIN_ROLE_VALUES },
      // scrypt$N$r$p$salt$hash — never a plain password.
      passwordHash: string(300, { pattern: "^scrypt\\$" }),
      active: { bsonType: "bool" },
      // Bumped on password reset, role change or deactivation: invalidates existing sessions.
      sessionVersion: { bsonType: ["int", "long"], minimum: 1 },
      lastLoginAt: nullableDate,
      createdBy: string(254),
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }),
    indexes: [{ key: { email: 1 }, name: "email_unique", unique: true }],
  },
  {
    name: COLLECTIONS.messages,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      reference: string(20, { pattern: "^MSG-[A-Z2-9]{6}$" }),
      name: string(120, { minLength: 2 }),
      email: string(254, { minLength: 3 }),
      topic: string(40),
      message: string(4000, { minLength: 20 }),
      status: { enum: MESSAGE_STATUS_VALUES },
      sourcePath: nullableString(200),
      ipHash,
      userAgent: nullableString(300),
      notificationStatus: { enum: NOTIFICATION_STATUS_VALUES },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }),
    indexes: [
      { key: { reference: 1 }, name: "reference_unique", unique: true },
      { key: { status: 1, createdAt: -1 }, name: "status_created" },
      { key: { createdAt: -1 }, name: "created_desc" },
    ],
  },
  {
    name: COLLECTIONS.subscribers,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      email: string(254, { minLength: 3 }),
      status: { enum: SUBSCRIBER_STATUS_VALUES },
      source: nullableString(200),
      // Random token for the unsubscribe link in every email.
      token: string(64, { pattern: "^[0-9a-f]{32}$" }),
      ipHash,
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
      unsubscribedAt: nullableDate,
    }),
    indexes: [
      { key: { email: 1 }, name: "email_unique", unique: true },
      { key: { token: 1 }, name: "token_unique", unique: true },
      { key: { status: 1, createdAt: -1 }, name: "status_created" },
    ],
  },
  {
    name: COLLECTIONS.toolSubmissions,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      reference: string(20, { pattern: "^SUB-[A-Z2-9]{6}$" }),
      toolName: string(80, { minLength: 2 }),
      website: string(300),
      category: string(60),
      pricing: { enum: ["Free", "Freemium", "Paid"] },
      description: string(2000, { minLength: 40 }),
      email: string(254, { minLength: 3 }),
      relationship: nullableString(40),
      status: { enum: SUBMISSION_STATUS_VALUES },
      reviewNote: nullableString(1000),
      reviewedBy: nullableString(254),
      ipHash,
      userAgent: nullableString(300),
      notificationStatus: { enum: NOTIFICATION_STATUS_VALUES },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }),
    indexes: [
      { key: { reference: 1 }, name: "reference_unique", unique: true },
      { key: { status: 1, createdAt: -1 }, name: "status_created" },
    ],
  },
  {
    name: COLLECTIONS.clients,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      name: string(160, { minLength: 2 }),
      contactName: string(120, { minLength: 2 }),
      email: string(254, { minLength: 3 }),
      phone: nullableString(32),
      country: nullableString(60),
      website: nullableString(300),
      address: nullableString(500),
      plan: string(80, { minLength: 1 }),
      currency: { enum: CURRENCY_VALUES },
      // Amounts are stored in minor units (cents/pence) to avoid rounding errors.
      monthlyFee: money,
      setupFee: money,
      billingDay: { bsonType: ["int", "long"], minimum: 1, maximum: 28 },
      status: { enum: CLIENT_STATUS_VALUES },
      startDate: { bsonType: "date" },
      paymentLink: nullableString(500),
      notes: nullableString(4000),
      leadId: { bsonType: ["objectId", "null"] },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }),
    indexes: [
      { key: { status: 1, name: 1 }, name: "status_name" },
      { key: { leadId: 1 }, name: "lead" },
    ],
  },
  {
    name: COLLECTIONS.invoices,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      number: string(40, { minLength: 3 }),
      clientId: { bsonType: "objectId" },
      client: {
        bsonType: "object",
        additionalProperties: false,
        required: ["name", "contactName", "email", "address"],
        properties: { name: string(160), contactName: string(120), email: string(254), address: nullableString(500) },
      },
      // "YYYY-MM" for a monthly retainer invoice, null for a one-off invoice.
      period: { bsonType: ["string", "null"], pattern: "^[0-9]{4}-(0[1-9]|1[0-2])$" },
      items: {
        bsonType: "array",
        minItems: 1,
        maxItems: 30,
        items: {
          bsonType: "object",
          additionalProperties: false,
          required: ["description", "quantity", "unitAmount"],
          properties: {
            description: string(300, { minLength: 1 }),
            quantity: { bsonType: ["int", "long", "double"], minimum: 0 },
            unitAmount: money,
          },
        },
      },
      total: money,
      currency: { enum: CURRENCY_VALUES },
      status: { enum: INVOICE_STATUS_VALUES },
      issueDate: { bsonType: "date" },
      dueDate: { bsonType: "date" },
      sentAt: nullableDate,
      paidAt: nullableDate,
      paymentMethod: nullableString(40),
      paymentReference: nullableString(120),
      paymentLink: nullableString(500),
      // Unguessable token for the client-facing invoice link.
      publicToken: string(64, { pattern: "^[0-9a-f]{40}$" }),
      notes: nullableString(2000),
      createdBy: string(254),
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }),
    indexes: [
      { key: { number: 1 }, name: "number_unique", unique: true },
      { key: { publicToken: 1 }, name: "token_unique", unique: true },
      { key: { clientId: 1, issueDate: -1 }, name: "client_issued" },
      { key: { status: 1, dueDate: 1 }, name: "status_due" },
      { key: { paidAt: -1 }, name: "paid_desc" },
      // One retainer invoice per client per month, so "generate monthly invoices" is safe to repeat.
      { key: { clientId: 1, period: 1 }, name: "client_period_unique", unique: true, partialFilterExpression: { period: { $type: "string" } } },
    ],
  },
  {
    name: COLLECTIONS.counters,
    validator: strictObject({ _id: string(60), seq: { bsonType: ["int", "long"], minimum: 1 } }),
    indexes: [],
  },
  {
    name: COLLECTIONS.settings,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "updatedAt"],
        properties: { _id: string(40), updatedAt: { bsonType: "date" }, updatedBy: string(254) },
      },
    },
    indexes: [],
  },
  {
    name: COLLECTIONS.activity,
    validator: strictObject({
      _id: { bsonType: "objectId" },
      at: { bsonType: "date" },
      actor: string(254),
      action: string(60),
      summary: string(300),
      href: nullableString(200),
    }),
    // Keep one year of activity history.
    indexes: [{ key: { at: 1 }, name: "at_ttl", expireAfterSeconds: 365 * 24 * 60 * 60 }],
  },
  {
    name: COLLECTIONS.analyticsDaily,
    validator: strictObject({
      // "<date>|<kind>|<key>", e.g. "2026-11-25|pv|/tools/claude"
      _id: string(300),
      date: string(10, { pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" }),
      kind: { enum: ANALYTICS_KIND_VALUES },
      key: string(260),
      count: { bsonType: ["int", "long"], minimum: 1 },
      expiresAt: { bsonType: "date" },
    }),
    indexes: [
      { key: { kind: 1, date: 1 }, name: "kind_date" },
      // Keep roughly 13 months of daily counters.
      { key: { expiresAt: 1 }, name: "expires_ttl", expireAfterSeconds: 0 },
    ],
  },
  {
    name: COLLECTIONS.analyticsVisitors,
    validator: strictObject({
      // "<date>|<daily-rotating hash of IP + user agent>" — no raw IP is stored.
      _id: string(80),
      expiresAt: { bsonType: "date" },
    }),
    indexes: [{ key: { expiresAt: 1 }, name: "expires_ttl", expireAfterSeconds: 0 }],
  },
];
/** Creates any missing indexes. Safe to run repeatedly; needs only the `readWrite` role. */
export async function ensureIndexes(db) {
  for (const spec of COLLECTION_SPECS) {
    if (spec.indexes.length > 0) await db.collection(spec.name).createIndexes(spec.indexes);
  }
}

/**
 * Creates missing collections with their validators, updates validators on
 * existing collections, and creates indexes. Never drops or rewrites data.
 * Updating a validator (collMod) needs the `dbAdmin` or `dbOwner` role.
 * @returns {Promise<string[]>} log lines describing what was done
 */
export async function setupDatabase(db) {
  const log = [];
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
  for (const spec of COLLECTION_SPECS) {
    if (existing.has(spec.name)) {
      await db.command({ collMod: spec.name, validator: spec.validator, validationLevel: "strict", validationAction: "error" });
      log.push(`updated validator: ${spec.name}`);
    } else {
      await db.createCollection(spec.name, { validator: spec.validator, validationLevel: "strict", validationAction: "error" });
      log.push(`created collection: ${spec.name}`);
    }
    if (spec.indexes.length > 0) {
      const names = await db.collection(spec.name).createIndexes(spec.indexes);
      log.push(`indexes on ${spec.name}: ${names.join(", ")}`);
    }
  }
  return log;
}
