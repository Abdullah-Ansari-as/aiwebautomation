/**
 * Creates the MongoDB collections with document validators and indexes.
 * Safe to run repeatedly; it never drops or modifies existing documents.
 *
 *   npm run db:setup
 *
 * Connection: MONGODB_SETUP_URI if set (e.g. an admin/dbOwner user), otherwise
 * MONGODB_URI. Applying validators to existing collections (collMod) needs the
 * dbAdmin or dbOwner role; the app's own readWrite user can still create
 * collections and indexes on a fresh database.
 * Reads .env.production.local / .env.local when present (see package.json).
 */
import { MongoClient } from "mongodb";
import { setupDatabase } from "../db/schema.mjs";

const uri = process.env.MONGODB_SETUP_URI || process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "webaiautomation";

if (!uri) {
  console.error("Set MONGODB_URI (or MONGODB_SETUP_URI) in the environment or .env.production.local, then run again.");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000, appName: "webaiautomation-setup" });
try {
  await client.connect();
  for (const line of await setupDatabase(client.db(dbName))) console.log(line);
  console.log(`Database "${dbName}" is ready.`);
} catch (error) {
  // Print only the message: never the URI (it contains the password).
  const message = String(error?.message ?? error)
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@/\s]+@/gi, "$1***@")
    .replace(/ to execute command \{[\s\S]*$/, ""); // drop the echoed command (long schema dump)
  console.error(`Setup failed: ${message.slice(0, 300)}`);
  if (error?.codeName === "Unauthorized") {
    console.error("The user lacks permission. Run once with MONGODB_SETUP_URI set to a dbOwner/admin user (see docs/ORACLE-CLOUD-DEPLOYMENT.md).");
  }
  process.exitCode = 1;
} finally {
  await client.close();
}
