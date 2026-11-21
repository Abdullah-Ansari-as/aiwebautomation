import "server-only";
import {
  MongoClientClosedError,
  MongoNetworkError,
  MongoNotConnectedError,
  MongoOperationTimeoutError,
  MongoServerError,
  MongoServerSelectionError,
  MongoTopologyClosedError,
  type Collection,
} from "mongodb";
import { logServerError } from "./log";
import { isDatabaseConfigured, isDuplicateKeyError, rateLimitsCollection, type RateLimitDocument } from "./mongodb";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  /** Which store decided: the shared MongoDB counters, or this process's memory. */
  source: "database" | "memory";
}

/**
 * After MongoDB fails, skip it for this long and use memory directly, so an
 * outage doesn't add a database timeout to every request. Then retry.
 */
export const FALLBACK_RETRY_MS = 30_000;
/**
 * Upper bound on in-memory counters. When full (after pruning expired
 * windows), new keys are refused rather than evicting live counters — evicting
 * would let an attacker reset their own counter by flooding other keys.
 */
export const MAX_MEMORY_KEYS = 10_000;

/** MongoDB server error codes that mean "server not available right now". */
const UNAVAILABLE_SERVER_CODES = new Set([
  18, // AuthenticationFailed — the app can't use the database at all
  91, // ShutdownInProgress
  189, // PrimarySteppedDown
  10107, // NotWritablePrimary
  11600, // InterruptedAtShutdown
  11602, // InterruptedDueToReplStateChange
]);

/** True for errors meaning MongoDB can't be reached or used right now. */
export function isDatabaseUnavailableError(error: unknown): boolean {
  return (
    error instanceof MongoServerSelectionError ||
    error instanceof MongoNetworkError ||
    error instanceof MongoNotConnectedError ||
    error instanceof MongoTopologyClosedError ||
    error instanceof MongoClientClosedError ||
    error instanceof MongoOperationTimeoutError ||
    (error instanceof MongoServerError && typeof error.code === "number" && UNAVAILABLE_SERVER_CODES.has(error.code))
  );
}

const memory = new Map<string, { count: number; resetAt: number }>();
const outage = { retryDatabaseAt: 0, active: false };

/**
 * Fixed-window rate limiter.
 *
 * Normal operation — MongoDB `rate_limits` collection, shared by every app
 * process and surviving restarts. Each call is one atomic `findOneAndUpdate`
 * upsert, so concurrent requests are counted exactly; a TTL index removes
 * finished windows.
 *
 * MongoDB unavailable — the same limits are enforced from this process's
 * memory (never "allow everything"). Limitations, by design:
 *  - counters are per process: with several app instances each enforces the
 *    limit separately, and a restart clears them;
 *  - counters started in memory keep applying after MongoDB recovers, until
 *    their window ends, so neither an outage nor its end resets a counter.
 *
 * Other database errors (e.g. a permissions problem) are thrown, and callers
 * must fail closed. With no database configured at all, memory is used.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  if (!isDatabaseConfigured()) return consumeInMemory(key, limit, windowSeconds);
  if (Date.now() < outage.retryDatabaseAt) return consumeInMemory(key, limit, windowSeconds);

  let collection: Collection<RateLimitDocument>;
  try {
    collection = await rateLimitsCollection();
  } catch (error) {
    // Any failure to connect (unreachable, bad credentials, bad URI) means the database is unavailable.
    return fallBackToMemory(error, key, limit, windowSeconds);
  }

  let result: RateLimitResult;
  try {
    result = await consumeInDatabase(collection, key, limit, windowSeconds);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    return fallBackToMemory(error, key, limit, windowSeconds);
  }

  if (outage.active) {
    outage.active = false;
    console.info("[rate-limit] MongoDB reachable again; shared rate limits restored.");
  }

  // A counter started in memory during an outage still applies until its window ends.
  const carriedOver = memory.get(key);
  if (carriedOver && carriedOver.resetAt > Date.now()) {
    const fromMemory = consumeInMemory(key, limit, windowSeconds);
    if (!fromMemory.allowed) return { allowed: false, retryAfterSeconds: Math.max(result.retryAfterSeconds, fromMemory.retryAfterSeconds), source: "memory" };
  }
  return result;
}

async function consumeInDatabase(collection: Collection<RateLimitDocument>, key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const windowExpired = { $or: [{ $eq: [{ $type: "$expiresAt" }, "missing"] }, { $lte: ["$expiresAt", "$$NOW"] }] };
  const update = [
    {
      $set: {
        count: { $cond: [windowExpired, 1, { $add: ["$count", 1] }] },
        expiresAt: { $cond: [windowExpired, { $add: ["$$NOW", windowSeconds * 1000] }, "$expiresAt"] },
      },
    },
  ];

  for (let attempt = 0; ; attempt++) {
    try {
      const doc = await collection.findOneAndUpdate({ _id: key }, update, { upsert: true, returnDocument: "after" });
      if (!doc) throw new Error("rate limit upsert returned no document");
      const retryAfterSeconds = Math.max(0, Math.ceil((doc.expiresAt.getTime() - Date.now()) / 1000));
      return { allowed: doc.count <= limit, retryAfterSeconds, source: "database" };
    } catch (error) {
      // Two first-ever requests for the same key can race to insert; the loser retries as an update.
      if (!isDuplicateKeyError(error) || attempt >= 2) throw error;
    }
  }
}

function fallBackToMemory(error: unknown, key: string, limit: number, windowSeconds: number): RateLimitResult {
  outage.retryDatabaseAt = Date.now() + FALLBACK_RETRY_MS;
  if (!outage.active) {
    outage.active = true;
    // Logged once per outage; the key (it contains a hash) and credentials are never logged.
    logServerError("[rate-limit] MongoDB unavailable; enforcing limits from this process's memory until it recovers", error);
  }
  return consumeInMemory(key, limit, windowSeconds);
}

function consumeInMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  let entry = memory.get(key);
  if (entry && entry.resetAt <= now) {
    memory.delete(key);
    entry = undefined;
  }
  if (!entry) {
    if (memory.size >= MAX_MEMORY_KEYS) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    }
    if (memory.size >= MAX_MEMORY_KEYS) return { allowed: false, retryAfterSeconds: windowSeconds, source: "memory" };
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
    memory.set(key, entry);
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)), source: "memory" };
}

/** Test-only hooks. Not used by the application. */
export const rateLimitTestHooks = {
  reset(): void {
    memory.clear();
    outage.retryDatabaseAt = 0;
    outage.active = false;
  },
  /** Ends the "skip MongoDB" period so the next call tries the database again. */
  retryDatabaseNow(): void {
    outage.retryDatabaseAt = 0;
  },
  memorySize: (): number => memory.size,
};
