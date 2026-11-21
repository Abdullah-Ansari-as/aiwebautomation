import "server-only";
import { MongoClient, type Collection, type Db, type ObjectId } from "mongodb";
import { COLLECTIONS, ensureIndexes } from "../../../db/schema.mjs";
import type { BudgetValue, ContactMethodValue, InquiryKind, LeadStatus } from "@/lib/inquiry-options";
import { logServerError } from "./log";

/**
 * Shared MongoDB connection (official `mongodb` driver).
 *
 * - One MongoClient (with its own connection pool) per server process, cached
 *   on `globalThis` so it survives Next.js dev hot reloads and is reused by
 *   every request.
 * - Concurrent first requests share one in-flight `connect()`; a failed
 *   connect is not cached, so the next request retries.
 * - Indexes are ensured once per process (idempotent, needs only `readWrite`).
 * - Server-only: credentials come from MONGODB_URI and never reach the client.
 */

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

export type NotificationStatus = "pending" | "sending" | "sent" | "failed" | "not_configured";

export interface LeadDocument {
  _id: ObjectId;
  reference: string;
  kind: InquiryKind;
  status: LeadStatus;
  fullName: string;
  email: string;
  company: string;
  website: string | null;
  category: string;
  budget: BudgetValue;
  description: string;
  contactMethod: ContactMethodValue;
  phone: string | null;
  sourcePath: string | null;
  ipHash: string | null;
  userAgent: string | null;
  notificationStatus: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadNoteDocument {
  _id: ObjectId;
  leadId: ObjectId;
  leadReference: string;
  body: string;
  author: string;
  createdAt: Date;
}

export interface RateLimitDocument {
  /** Counter key, e.g. "inquiry:ip:<hash>". */
  _id: string;
  count: number;
  expiresAt: Date;
}

interface MongoCache {
  client?: MongoClient;
  connecting?: Promise<MongoClient>;
  indexes?: Promise<void>;
}

const globalForMongo = globalThis as unknown as { __waaMongo?: MongoCache };
const cache: MongoCache = (globalForMongo.__waaMongo ??= {});

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export function getDatabaseName(): string {
  return process.env.MONGODB_DB_NAME || "webaiautomation";
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseNotConfiguredError();
  if (cache.client) return cache.client;

  cache.connecting ??= new MongoClient(uri, {
    appName: "webaiautomation",
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
  })
    .connect()
    .then((client) => {
      cache.client = client;
      return client;
    })
    .catch((error: unknown) => {
      // Don't cache the failure: the next request gets a fresh attempt.
      cache.connecting = undefined;
      throw error;
    });

  return cache.connecting;
}

export async function getDb(): Promise<Db> {
  const db = (await getMongoClient()).db(getDatabaseName());
  cache.indexes ??= ensureIndexes(db).catch((error: unknown) => {
    cache.indexes = undefined;
    logServerError("[mongodb] ensuring indexes failed", error);
  });
  await cache.indexes;
  return db;
}

export async function leadsCollection(): Promise<Collection<LeadDocument>> {
  return (await getDb()).collection<LeadDocument>(COLLECTIONS.leads);
}

export async function leadNotesCollection(): Promise<Collection<LeadNoteDocument>> {
  return (await getDb()).collection<LeadNoteDocument>(COLLECTIONS.leadNotes);
}

export async function rateLimitsCollection(): Promise<Collection<RateLimitDocument>> {
  return (await getDb()).collection<RateLimitDocument>(COLLECTIONS.rateLimits);
}

/** Closes the shared client (tests and scripts). The next call reconnects. */
export async function closeMongo(): Promise<void> {
  const client = cache.client ?? (await cache.connecting?.catch(() => undefined));
  cache.client = undefined;
  cache.connecting = undefined;
  cache.indexes = undefined;
  await client?.close();
}

/** MongoDB duplicate-key error (E11000). */
export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
}
