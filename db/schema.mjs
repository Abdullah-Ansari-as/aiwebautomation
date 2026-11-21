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
});

export const LEAD_KINDS = ["service", "sponsor"];
export const LEAD_STATUS_VALUES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"];
export const CONTACT_METHOD_VALUES = ["email", "whatsapp", "phone"];
export const NOTIFICATION_STATUS_VALUES = ["pending", "sending", "sent", "failed", "not_configured"];

const string = (maxLength, extra = {}) => ({ bsonType: "string", maxLength, ...extra });
const nullableString = (maxLength) => ({ bsonType: ["string", "null"], maxLength });

/** @type {{ name: string; validator: Record<string, unknown>; indexes: { key: Record<string, 1 | -1>; name: string; unique?: boolean; expireAfterSeconds?: number }[] }[]} */
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
];

/** Creates any missing indexes. Safe to run repeatedly; needs only the `readWrite` role. */
export async function ensureIndexes(db) {
  for (const spec of COLLECTION_SPECS) {
    await db.collection(spec.name).createIndexes(spec.indexes);
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
    const names = await db.collection(spec.name).createIndexes(spec.indexes);
    log.push(`indexes on ${spec.name}: ${names.join(", ")}`);
  }
  return log;
}
