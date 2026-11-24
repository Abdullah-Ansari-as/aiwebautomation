import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { inject } from "vitest";

export const TEST_AUTH_SECRET = "test-only-secret-0123456789abcdefghijklmnop";
export const TEST_ADMIN_PASSWORD = "test-only-admin-password";
export const TEST_ADMIN_EMAIL = "owner@example.com";

/**
 * Points the app at a fresh, uniquely named test database. Call at the top of
 * a test file (before importing app modules that read the environment).
 */
export function setupTestDatabase(): { uri: string; dbName: string } {
  const uri = inject("mongoUri");
  const dbName = `waa_test_${randomBytes(4).toString("hex")}`;
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB_NAME = dbName;
  process.env.AUTH_SECRET = TEST_AUTH_SECRET;
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
  process.env.ADMIN_EMAIL = TEST_ADMIN_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.LEADS_NOTIFY_EMAIL;
  return { uri, dbName };
}

/** Drops a test database. Refuses anything not created by setupTestDatabase. */
export async function dropTestDatabase(uri: string, dbName: string): Promise<void> {
  if (!dbName.startsWith("waa_test_")) throw new Error(`Refusing to drop non-test database ${dbName}`);
  const client = await new MongoClient(uri).connect();
  try {
    await client.db(dbName).dropDatabase();
  } finally {
    await client.close();
  }
}

export function validLead(overrides: Record<string, unknown> = {}) {
  return {
    kind: "service" as const,
    fullName: "Test Person",
    email: "test@example.com",
    company: "Example Co",
    website: "https://example.com/",
    category: "crm-automation",
    budget: "199-399" as const,
    description: "Push new website leads into HubSpot and alert the team in Slack.",
    contactMethod: "email" as const,
    phone: null,
    sourcePath: "/services",
    ipHash: "0123456789abcdef0123456789abcdef",
    userAgent: "vitest",
    ...overrides,
  };
}
