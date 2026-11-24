import "server-only";
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { logServerError } from "./log";
import { getCollection, isDatabaseConfigured } from "./mongodb";

/**
 * Audit trail shown on the admin Overview ("Recent activity"). Writing an
 * entry must never break the action that caused it, so failures are logged
 * and swallowed. Entries expire after a year (TTL index).
 */

export interface ActivityDocument {
  _id: ObjectId;
  at: Date;
  actor: string;
  action: string;
  summary: string;
  href: string | null;
}

export interface ActivityItem {
  id: string;
  at: string;
  actor: string;
  action: string;
  summary: string;
  href: string | null;
}

export async function logActivity(actor: string, action: string, summary: string, href: string | null = null): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const collection = await getCollection<ActivityDocument>(COLLECTIONS.activity);
    await collection.insertOne({ _id: new ObjectId(), at: new Date(), actor: actor.slice(0, 254), action: action.slice(0, 60), summary: summary.slice(0, 300), href: href?.slice(0, 200) ?? null });
  } catch (error) {
    logServerError("[activity] could not record activity", error);
  }
}

/** Caller must have checked the admin session. */
export async function recentActivity(limit = 12): Promise<ActivityItem[]> {
  const collection = await getCollection<ActivityDocument>(COLLECTIONS.activity);
  const docs = await collection.find({}).sort({ at: -1 }).limit(limit).toArray();
  return docs.map((d) => ({ id: d._id.toHexString(), at: d.at.toISOString(), actor: d.actor, action: d.action, summary: d.summary, href: d.href }));
}
