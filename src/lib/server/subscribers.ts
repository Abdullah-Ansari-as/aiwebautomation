import "server-only";
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { requireAdmin } from "@/lib/auth/session";
import { randomToken, toObjectId } from "./ids";
import { getCollection, isDuplicateKeyError } from "./mongodb";

/** Newsletter subscribers. The unsubscribe token is the only public way in. */

export interface SubscriberDocument {
  _id: ObjectId;
  email: string;
  status: "subscribed" | "unsubscribed";
  source: string | null;
  token: string;
  ipHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  unsubscribedAt: Date | null;
}

export interface SubscriberItem {
  id: string;
  email: string;
  status: SubscriberDocument["status"];
  source: string | null;
  createdAt: string;
  unsubscribedAt: string | null;
}

const subscribers = () => getCollection<SubscriberDocument>(COLLECTIONS.subscribers);

function toItem(d: SubscriberDocument): SubscriberItem {
  return { id: d._id.toHexString(), email: d.email, status: d.status, source: d.source, createdAt: d.createdAt.toISOString(), unsubscribedAt: d.unsubscribedAt?.toISOString() ?? null };
}

export type SubscribeOutcome = { outcome: "new" | "resubscribed" | "already"; token: string };

/** Adds (or re-activates) a subscriber. Idempotent per email thanks to the unique index. */
export async function subscribe(email: string, source: string | null, ipHash: string | null): Promise<SubscribeOutcome> {
  const collection = await subscribers();
  const existing = await collection.findOne({ email });
  if (existing) {
    if (existing.status === "subscribed") return { outcome: "already", token: existing.token };
    await collection.updateOne({ _id: existing._id }, { $set: { status: "subscribed", updatedAt: new Date(), unsubscribedAt: null, source } });
    return { outcome: "resubscribed", token: existing.token };
  }
  const now = new Date();
  const doc: SubscriberDocument = { _id: new ObjectId(), email, status: "subscribed", source, token: randomToken(16), ipHash, createdAt: now, updatedAt: now, unsubscribedAt: null };
  try {
    await collection.insertOne(doc);
    return { outcome: "new", token: doc.token };
  } catch (error) {
    // Two sign-ups for the same address at the same moment: the other one won.
    if (isDuplicateKeyError(error)) {
      const winner = await collection.findOne({ email });
      if (winner) return { outcome: "already", token: winner.token };
    }
    throw error;
  }
}

export function isSubscriberToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/.test(value);
}

/** Public: looks up a subscriber by unsubscribe token (masked email only). */
export async function findByToken(token: string): Promise<{ maskedEmail: string; status: SubscriberDocument["status"] } | null> {
  if (!isSubscriberToken(token)) return null;
  const doc = await (await subscribers()).findOne({ token }, { projection: { email: 1, status: 1 } });
  return doc ? { maskedEmail: maskEmail(doc.email), status: doc.status } : null;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!isSubscriberToken(token)) return false;
  const now = new Date();
  const result = await (await subscribers()).updateOne({ token }, { $set: { status: "unsubscribed", updatedAt: now, unsubscribedAt: now } });
  return result.matchedCount === 1;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(6, local.length - 2)))}@${domain}`;
}

export async function listSubscribers(status?: SubscriberDocument["status"]): Promise<SubscriberItem[]> {
  await requireAdmin();
  const docs = await (await subscribers())
    .find(status ? { status } : {}, { projection: { token: 0, ipHash: 0 } })
    .sort({ createdAt: -1 })
    .limit(5000)
    .toArray();
  return docs.map((d) => toItem(d as SubscriberDocument));
}

export async function countSubscribers(): Promise<{ subscribed: number; unsubscribed: number; last30Days: number }> {
  await requireAdmin();
  const collection = await subscribers();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [subscribed, unsubscribed, last30Days] = await Promise.all([
    collection.countDocuments({ status: "subscribed" }),
    collection.countDocuments({ status: "unsubscribed" }),
    collection.countDocuments({ status: "subscribed", createdAt: { $gte: since } }),
  ]);
  return { subscribed, unsubscribed, last30Days };
}

export async function deleteSubscriber(id: string): Promise<SubscriberItem | null> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await subscribers()).findOneAndDelete({ _id });
  return doc ? toItem(doc) : null;
}
