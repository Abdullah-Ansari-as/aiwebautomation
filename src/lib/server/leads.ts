import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth/session";
import type { BudgetValue, ContactMethodValue, InquiryKind, LeadStatus } from "@/lib/inquiry-options";
import { isDuplicateKeyError, leadNotesCollection, leadsCollection, type LeadDocument, type NotificationStatus } from "./mongodb";

/**
 * Data Access Layer for leads. Public code may only call `createLead` and the
 * notification helpers; every read and admin mutation verifies the admin
 * session itself, so a mistake in a page can't leak lead data.
 *
 * Query safety: every value used in a filter is either an ObjectId parsed
 * from a validated 24-hex string or a value already checked against a fixed
 * option list, so client input can never inject query operators.
 */

export interface NewLead {
  kind: InquiryKind;
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
}

/** Shape sent to admin pages: dates as ISO strings, no IP hash or user agent. */
export interface LeadSummary {
  id: string;
  reference: string;
  kind: InquiryKind;
  status: LeadStatus;
  fullName: string;
  email: string;
  company: string;
  category: string;
  budget: string;
  createdAt: string;
}

export interface LeadDetail extends LeadSummary {
  website: string | null;
  description: string;
  contactMethod: ContactMethodValue;
  phone: string | null;
  sourcePath: string | null;
  notificationStatus: NotificationStatus;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newReference(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  return `WAA-${code}`;
}

/** Lead ids are MongoDB ObjectIds rendered as 24 hex characters. */
export function isLeadId(value: string): boolean {
  return /^[0-9a-f]{24}$/i.test(value);
}

function toObjectId(id: string): ObjectId | null {
  return isLeadId(id) ? new ObjectId(id) : null;
}

const summaryProjection = { reference: 1, kind: 1, status: 1, fullName: 1, email: 1, company: 1, category: 1, budget: 1, createdAt: 1 } as const;

function toSummary(doc: Pick<LeadDocument, keyof typeof summaryProjection | "_id">): LeadSummary {
  return {
    id: doc._id.toHexString(),
    reference: doc.reference,
    kind: doc.kind,
    status: doc.status,
    fullName: doc.fullName,
    email: doc.email,
    company: doc.company,
    category: doc.category,
    budget: doc.budget,
    createdAt: doc.createdAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Public write path                                                   */
/* ------------------------------------------------------------------ */

/**
 * Stores a new lead with a unique reference. The unique index on
 * `reference` makes duplicates impossible; on the (very unlikely) collision
 * a new reference is generated and the insert retried.
 */
export async function createLead(lead: NewLead, generateReference: () => string = newReference): Promise<{ id: string; reference: string }> {
  const collection = await leadsCollection();
  for (let attempt = 0; ; attempt++) {
    const now = new Date();
    const doc: LeadDocument = {
      _id: new ObjectId(),
      reference: generateReference(),
      status: "new",
      notificationStatus: "pending",
      createdAt: now,
      updatedAt: now,
      ...lead,
    };
    try {
      await collection.insertOne(doc);
      return { id: doc._id.toHexString(), reference: doc.reference };
    } catch (error) {
      if (!isDuplicateKeyError(error) || attempt >= 4) throw error;
    }
  }
}

/**
 * Atomically moves a lead's notification from "pending" to "sending".
 * Returns true for exactly one caller, so each lead is emailed at most once.
 */
export async function claimLeadNotification(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const collection = await leadsCollection();
  const result = await collection.updateOne({ _id, notificationStatus: "pending" }, { $set: { notificationStatus: "sending" } });
  return result.modifiedCount === 1;
}

export async function setLeadNotificationStatus(id: string, status: NotificationStatus): Promise<void> {
  const _id = toObjectId(id);
  if (!_id) return;
  const collection = await leadsCollection();
  await collection.updateOne({ _id }, { $set: { notificationStatus: status } });
}

/* ------------------------------------------------------------------ */
/* Admin reads and mutations (session-checked)                         */
/* ------------------------------------------------------------------ */

export async function listLeads(status?: LeadStatus): Promise<LeadSummary[]> {
  await requireAdmin();
  const collection = await leadsCollection();
  const docs = await collection
    .find(status ? { status } : {}, { projection: summaryProjection })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  return docs.map(toSummary);
}

export async function countLeadsByStatus(): Promise<Record<LeadStatus, number> & { all: number }> {
  await requireAdmin();
  const collection = await leadsCollection();
  const rows = await collection.aggregate<{ _id: LeadStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray();
  const counts = { all: 0, new: 0, contacted: 0, qualified: 0, proposal_sent: 0, won: 0, lost: 0 };
  for (const row of rows) {
    if (row._id in counts) counts[row._id] = row.count;
    counts.all += row.count;
  }
  return counts;
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  await requireAdmin();
  const _id = toObjectId(id);
  if (!_id) return null;
  const collection = await leadsCollection();
  const doc = await collection.findOne({ _id }, { projection: { ipHash: 0, userAgent: 0 } });
  if (!doc) return null;
  return {
    ...toSummary(doc),
    website: doc.website,
    description: doc.description,
    contactMethod: doc.contactMethod,
    phone: doc.phone,
    sourcePath: doc.sourcePath,
    notificationStatus: doc.notificationStatus,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  await requireAdmin();
  const _id = toObjectId(leadId);
  if (!_id) return [];
  const collection = await leadNotesCollection();
  const docs = await collection.find({ leadId: _id }).sort({ createdAt: -1, _id: -1 }).toArray();
  return docs.map((d) => ({ id: d._id.toHexString(), body: d.body, author: d.author, createdAt: d.createdAt.toISOString() }));
}

/** Returns false when the lead doesn't exist. */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  await requireAdmin();
  const _id = toObjectId(id);
  if (!_id) return false;
  const collection = await leadsCollection();
  const result = await collection.updateOne({ _id }, { $set: { status, updatedAt: new Date() } });
  return result.matchedCount > 0;
}

/** Returns false when the lead doesn't exist. */
export async function addLeadNote(leadId: string, body: string, author = "admin"): Promise<boolean> {
  await requireAdmin();
  const _id = toObjectId(leadId);
  if (!_id) return false;
  const now = new Date();
  // Touch the lead first: this confirms it exists and records the activity.
  const lead = await (await leadsCollection()).findOneAndUpdate({ _id }, { $set: { updatedAt: now } }, { projection: { reference: 1 } });
  if (!lead) return false;
  await (await leadNotesCollection()).insertOne({ _id: new ObjectId(), leadId: _id, leadReference: lead.reference, body, author, createdAt: now });
  return true;
}
