import "server-only";
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { requireAdmin } from "@/lib/auth/session";
import type { SubmissionPricing, SubmissionStatus } from "@/lib/form-options";
import { newPrefixedReference, toObjectId } from "./ids";
import { getCollection, isDuplicateKeyError, type NotificationStatus } from "./mongodb";

/** AI tools suggested through /submit-tool, reviewed by the team. */

export interface SubmissionDocument {
  _id: ObjectId;
  reference: string;
  toolName: string;
  website: string;
  category: string;
  pricing: SubmissionPricing;
  description: string;
  email: string;
  relationship: string | null;
  status: SubmissionStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  ipHash: string | null;
  userAgent: string | null;
  notificationStatus: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type NewSubmission = Pick<SubmissionDocument, "toolName" | "website" | "category" | "pricing" | "description" | "email" | "relationship" | "ipHash" | "userAgent">;

export interface SubmissionItem {
  id: string;
  reference: string;
  toolName: string;
  website: string;
  category: string;
  pricing: SubmissionPricing;
  description: string;
  email: string;
  relationship: string | null;
  status: SubmissionStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

const submissions = () => getCollection<SubmissionDocument>(COLLECTIONS.toolSubmissions);

function toItem(d: SubmissionDocument): SubmissionItem {
  return {
    id: d._id.toHexString(),
    reference: d.reference,
    toolName: d.toolName,
    website: d.website,
    category: d.category,
    pricing: d.pricing,
    description: d.description,
    email: d.email,
    relationship: d.relationship,
    status: d.status,
    reviewNote: d.reviewNote,
    reviewedBy: d.reviewedBy,
    createdAt: d.createdAt.toISOString(),
  };
}

export async function createSubmission(input: NewSubmission): Promise<{ id: ObjectId; reference: string }> {
  const collection = await submissions();
  for (let attempt = 0; ; attempt++) {
    const now = new Date();
    const doc: SubmissionDocument = {
      _id: new ObjectId(),
      reference: newPrefixedReference("SUB"),
      status: "pending",
      reviewNote: null,
      reviewedBy: null,
      notificationStatus: "pending",
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    try {
      await collection.insertOne(doc);
      return { id: doc._id, reference: doc.reference };
    } catch (error) {
      if (!isDuplicateKeyError(error) || attempt >= 4) throw error;
    }
  }
}

export async function listSubmissions(status: SubmissionStatus): Promise<SubmissionItem[]> {
  await requireAdmin();
  const docs = await (await submissions()).find({ status }, { projection: { ipHash: 0, userAgent: 0 } }).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map((d) => toItem(d as SubmissionDocument));
}

export async function countSubmissionsByStatus(): Promise<Record<SubmissionStatus, number>> {
  await requireAdmin();
  const rows = await (await submissions()).aggregate<{ _id: SubmissionStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray();
  const counts: Record<SubmissionStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) if (row._id in counts) counts[row._id] = row.count;
  return counts;
}

export async function reviewSubmission(id: string, status: SubmissionStatus, note: string | null, reviewer: string): Promise<SubmissionItem | null> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await submissions()).findOneAndUpdate(
    { _id },
    { $set: { status, reviewNote: note, reviewedBy: status === "pending" ? null : reviewer, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? toItem(doc) : null;
}

export async function deleteSubmission(id: string): Promise<SubmissionItem | null> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await submissions()).findOneAndDelete({ _id });
  return doc ? toItem(doc) : null;
}
