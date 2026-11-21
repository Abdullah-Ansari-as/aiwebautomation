import type { TestProject } from "vitest/node";

/**
 * Provides an isolated MongoDB for the test run.
 *
 * - MONGODB_TEST_URI set → use that server (each test file still creates and
 *   drops its own uniquely named `waa_test_*` database).
 * - Otherwise → start a throwaway mongod with mongodb-memory-server (downloads
 *   the binary on first run) and stop it afterwards.
 *
 * MONGODB_URI is deliberately ignored, so tests can never touch the real database.
 */
export default async function setup(project: TestProject) {
  if (process.env.MONGODB_TEST_URI) {
    project.provide("mongoUri", process.env.MONGODB_TEST_URI);
    return;
  }
  const { MongoMemoryServer } = await import("mongodb-memory-server-core");
  const server = await MongoMemoryServer.create({ binary: { version: process.env.MONGOMS_VERSION ?? "8.0.4" } });
  project.provide("mongoUri", server.getUri());
  return async () => {
    await server.stop();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}
