/**
 * Starts a local MongoDB for development — no installation or Atlas account
 * needed. Data is kept in ./.data/mongo between runs (git-ignored).
 *
 *   npm run db:local        (leave it running in its own terminal)
 *
 * Then use MONGODB_URI=mongodb://127.0.0.1:27017/webaiautomation in .env.local.
 * Uses the MongoDB binary from mongodb-memory-server-core (downloaded once,
 * ~100 MB, cached in ~/.cache/mongodb-binaries). For production use MongoDB
 * Atlas or a real MongoDB server instead.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server-core";

const dbPath = resolve(".data/mongo");
const port = Number(process.env.LOCAL_MONGO_PORT) || 27017;
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  binary: { version: process.env.MONGOMS_VERSION ?? "8.0.4" },
  instance: { dbPath, port, ip: "127.0.0.1", storageEngine: "wiredTiger" },
});

console.log(`Local MongoDB running at mongodb://127.0.0.1:${port}  (data: ${dbPath})`);
console.log("Press Ctrl+C to stop.");

const stop = async () => {
  // doCleanup: false keeps the data folder.
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
