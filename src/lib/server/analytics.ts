import "server-only";
import { createHmac } from "node:crypto";
import type { AnyBulkWriteOperation } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection, isDuplicateKeyError } from "./mongodb";
import { getAuthSecret } from "./secrets";

/**
 * First-party, cookieless analytics stored in MongoDB.
 *
 * - Page views and whitelisted conversion events are counted per day
 *   (`analytics_daily`, one small document per day + page/event).
 * - Unique visitors are estimated with a daily-rotating keyed hash of
 *   IP + user agent (`analytics_visitors`, deleted after 2 days). No raw IP,
 *   cookie or personal data is stored, and the hash can't be linked across days.
 * - Counters are kept for ~13 months (TTL index).
 */

export const TRACKED_EVENTS = FIRST_PARTY_EVENTS;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

interface DailyDocument {
  _id: string;
  date: string;
  kind: "pv" | "uv" | "ev" | "ref";
  key: string;
  count: number;
  expiresAt: Date;
}

const RETENTION_MS = 400 * 24 * 60 * 60 * 1000;
const BOT_UA = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http|java\//i;

export function isLikelyBot(userAgent: string): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

export function utcDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Normalises a page path: lowercase-safe chars only, no query string, max 200 chars. */
export function normalizePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/)[0];
  if (!/^\/[A-Za-z0-9\-._~/]{0,199}$/.test(path)) return null;
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/invoice")) return null;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Referrer host (e.g. "google.com"), ignoring our own domain. */
export function referrerHost(value: unknown, ownHost: string | null): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || host.length > 100 || (ownHost && host === ownHost.replace(/^www\./, "").toLowerCase())) return null;
    return host;
  } catch {
    return null;
  }
}

function dailyOp(date: string, kind: DailyDocument["kind"], key: string, expiresAt: Date): AnyBulkWriteOperation<DailyDocument> {
  return {
    updateOne: {
      filter: { _id: `${date}|${kind}|${key}` },
      update: { $inc: { count: 1 }, $setOnInsert: { date, kind, key, expiresAt } },
      upsert: true,
    },
  };
}

export async function recordPageView(input: { path: string; referrer: string | null; ip: string; userAgent: string }): Promise<void> {
  const now = new Date();
  const date = utcDate(now);
  const expiresAt = new Date(now.getTime() + RETENTION_MS);
  const ops: AnyBulkWriteOperation<DailyDocument>[] = [dailyOp(date, "pv", input.path, expiresAt), dailyOp(date, "pv", "*", expiresAt)];
  if (input.referrer) ops.push(dailyOp(date, "ref", input.referrer, expiresAt));

  // Unique visitor: first time today for this daily hash → count once.
  const secret = getAuthSecret() ?? "waa-analytics";
  const visitorHash = createHmac("sha256", `${secret}|${date}`).update(`${input.ip}|${input.userAgent}`).digest("hex").slice(0, 32);
  try {
    const visitors = await getCollection<{ _id: string; expiresAt: Date }>(COLLECTIONS.analyticsVisitors);
    await visitors.insertOne({ _id: `${date}|${visitorHash}`, expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) });
    ops.push(dailyOp(date, "uv", "*", expiresAt));
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
  await (await getCollection<DailyDocument>(COLLECTIONS.analyticsDaily)).bulkWrite(ops, { ordered: false });
}

export async function recordEvent(event: TrackedEvent): Promise<void> {
  const now = new Date();
  await (await getCollection<DailyDocument>(COLLECTIONS.analyticsDaily)).bulkWrite([dailyOp(utcDate(now), "ev", event, new Date(now.getTime() + RETENTION_MS))]);
}

/* ------------------------------------------------------------------ */
/* Reporting (admin only)                                              */
/* ------------------------------------------------------------------ */

export interface AnalyticsReport {
  days: { date: string; views: number; visitors: number }[];
  totals: { views: number; visitors: number; previousViews: number; previousVisitors: number };
  topPages: { key: string; count: number }[];
  referrers: { key: string; count: number }[];
  events: { key: string; count: number }[];
}

function dateDaysAgo(days: number): string {
  return utcDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

export async function getAnalyticsReport(rangeDays = 30): Promise<AnalyticsReport> {
  await requireAdmin();
  const collection = await getCollection<DailyDocument>(COLLECTIONS.analyticsDaily);
  const from = dateDaysAgo(rangeDays - 1);
  const previousFrom = dateDaysAgo(rangeDays * 2 - 1);

  const sumBy = (kind: DailyDocument["kind"], since: string, until?: string, limit = 15) =>
    collection
      .aggregate<{ _id: string; count: number }>([
        { $match: { kind, key: { $ne: "*" }, date: until ? { $gte: since, $lt: until } : { $gte: since } } },
        { $group: { _id: "$key", count: { $sum: "$count" } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ])
      .toArray()
      .then((rows) => rows.map((r) => ({ key: r._id, count: r.count })));

  const [dailyRows, previousRows, topPages, referrers, events] = await Promise.all([
    collection.find({ kind: { $in: ["pv", "uv"] }, key: "*", date: { $gte: from } }).toArray(),
    collection.find({ kind: { $in: ["pv", "uv"] }, key: "*", date: { $gte: previousFrom, $lt: from } }).toArray(),
    sumBy("pv", from),
    sumBy("ref", from, undefined, 10),
    sumBy("ev", from, undefined, 20),
  ]);

  const byDate = new Map<string, { views: number; visitors: number }>();
  for (const row of dailyRows) {
    const entry = byDate.get(row.date) ?? { views: 0, visitors: 0 };
    if (row.kind === "pv") entry.views += row.count;
    else entry.visitors += row.count;
    byDate.set(row.date, entry);
  }
  const days = Array.from({ length: rangeDays }, (_, i) => {
    const date = dateDaysAgo(rangeDays - 1 - i);
    return { date, ...(byDate.get(date) ?? { views: 0, visitors: 0 }) };
  });
  const sum = (rows: DailyDocument[], kind: "pv" | "uv") => rows.filter((r) => r.kind === kind).reduce((s, r) => s + r.count, 0);

  return {
    days,
    totals: { views: sum(dailyRows, "pv"), visitors: sum(dailyRows, "uv"), previousViews: sum(previousRows, "pv"), previousVisitors: sum(previousRows, "uv") },
    topPages,
    referrers,
    events,
  };
}

/** Views per path prefix (e.g. "/tools/") for the content library. */
export async function getViewsByPrefix(prefix: string, rangeDays = 30): Promise<Map<string, number>> {
  await requireAdmin();
  const collection = await getCollection<DailyDocument>(COLLECTIONS.analyticsDaily);
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rows = await collection
    .aggregate<{ _id: string; count: number }>([
      { $match: { kind: "pv", date: { $gte: dateDaysAgo(rangeDays - 1) }, key: { $regex: `^${escaped}` } } },
      { $group: { _id: "$key", count: { $sum: "$count" } } },
    ])
    .toArray();
  return new Map(rows.map((r) => [r._id, r.count]));
}
