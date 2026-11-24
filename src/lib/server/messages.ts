import "server-only";
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { requireAdmin } from "@/lib/auth/session";
import type { ContactTopic, MessageStatus } from "@/lib/form-options";
import { newPrefixedReference, toObjectId } from "./ids";
import { getCollection, isDuplicateKeyError, type NotificationStatus } from "./mongodb";

/** Contact-form messages ("Inbox" in the admin). Reads and changes are admin-only. */

export interface MessageDocument {
  _id: ObjectId;
  reference: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: MessageStatus;
  sourcePath: string | null;
  ipHash: string | null;
  userAgent: string | null;
  notificationStatus: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type NewMessage = Pick<MessageDocument, "name" | "email" | "topic" | "message" | "sourcePath" | "ipHash" | "userAgent">;

export interface MessageItem {
  id: string;
  reference: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: MessageStatus;
  sourcePath: string | null;
  notificationStatus: NotificationStatus;
  createdAt: string;
}

const messages = () => getCollection<MessageDocument>(COLLECTIONS.messages);

function toItem(d: MessageDocument): MessageItem {
  return {
    id: d._id.toHexString(),
    reference: d.reference,
    name: d.name,
    email: d.email,
    topic: d.topic,
    message: d.message,
    status: d.status,
    sourcePath: d.sourcePath,
    notificationStatus: d.notificationStatus,
    createdAt: d.createdAt.toISOString(),
  };
}

export async function createMessage(input: NewMessage): Promise<{ id: ObjectId; reference: string }> {
  const collection = await messages();
  for (let attempt = 0; ; attempt++) {
    const now = new Date();
    const doc: MessageDocument = { _id: new ObjectId(), reference: newPrefixedReference("MSG"), status: "new", notificationStatus: "pending", createdAt: now, updatedAt: now, ...input };
    try {
      await collection.insertOne(doc);
      return { id: doc._id, reference: doc.reference };
    } catch (error) {
      if (!isDuplicateKeyError(error) || attempt >= 4) throw error;
    }
  }
}

export async function listMessages(status?: MessageStatus): Promise<MessageItem[]> {
  await requireAdmin();
  const filter = status ? { status } : { status: { $ne: "archived" as const } };
  const docs = await (await messages()).find(filter, { projection: { ipHash: 0, userAgent: 0 } }).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map((d) => toItem(d as MessageDocument));
}

export async function countMessagesByStatus(): Promise<Record<MessageStatus, number>> {
  await requireAdmin();
  const rows = await (await messages()).aggregate<{ _id: MessageStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray();
  const counts: Record<MessageStatus, number> = { new: 0, read: 0, replied: 0, archived: 0 };
  for (const row of rows) if (row._id in counts) counts[row._id] = row.count;
  return counts;
}

export async function getMessage(id: string): Promise<MessageItem | null> {
  await requireAdmin();
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await messages()).findOne({ _id });
  return doc ? toItem(doc) : null;
}

/** Marks a new message as read when an admin opens it (viewers included — it's not a business change). */
export async function markMessageRead(id: string): Promise<void> {
  await requireAdmin();
  const _id = toObjectId(id);
  if (!_id) return;
  await (await messages()).updateOne({ _id, status: "new" }, { $set: { status: "read", updatedAt: new Date() } });
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<MessageItem | null> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await messages()).findOneAndUpdate({ _id }, { $set: { status, updatedAt: new Date() } }, { returnDocument: "after" });
  return doc ? toItem(doc) : null;
}

export async function deleteMessage(id: string): Promise<MessageItem | null> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await messages()).findOneAndDelete({ _id });
  return doc ? toItem(doc) : null;
}
