import "server-only";
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { requireAdmin } from "@/lib/auth/session";
import type { ClientStatus } from "@/lib/billing-options";
import type { Currency } from "@/lib/money";
import { toObjectId } from "./ids";
import { leadsCollection } from "./mongodb";
import { getCollection } from "./mongodb";

/**
 * Paying clients (monthly retainers and one-off projects). Monthly fees of
 * active clients add up to MRR (monthly recurring revenue) on the dashboard.
 */

export interface ClientDocument {
  _id: ObjectId;
  name: string;
  contactName: string;
  email: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  address: string | null;
  plan: string;
  currency: Currency;
  monthlyFee: number;
  setupFee: number;
  billingDay: number;
  status: ClientStatus;
  startDate: Date;
  paymentLink: string | null;
  notes: string | null;
  leadId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientInput = Omit<ClientDocument, "_id" | "createdAt" | "updatedAt" | "leadId">;

export interface ClientItem extends Omit<ClientDocument, "_id" | "startDate" | "createdAt" | "updatedAt" | "leadId"> {
  id: string;
  startDate: string;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const clientsCollection = () => getCollection<ClientDocument>(COLLECTIONS.clients);

export function toClientItem(d: ClientDocument): ClientItem {
  const { _id, startDate, createdAt, updatedAt, leadId, ...rest } = d;
  return { ...rest, id: _id.toHexString(), startDate: startDate.toISOString(), leadId: leadId?.toHexString() ?? null, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
}

export async function listClients(status?: ClientStatus): Promise<ClientItem[]> {
  await requireAdmin();
  const docs = await (await clientsCollection()).find(status ? { status } : {}).sort({ status: 1, name: 1 }).limit(1000).toArray();
  return docs.map(toClientItem);
}

export async function countClientsByStatus(): Promise<Record<ClientStatus, number>> {
  await requireAdmin();
  const rows = await (await clientsCollection()).aggregate<{ _id: ClientStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray();
  const counts: Record<ClientStatus, number> = { active: 0, paused: 0, cancelled: 0 };
  for (const row of rows) if (row._id in counts) counts[row._id] = row.count;
  return counts;
}

export async function getClient(id: string): Promise<ClientItem | null> {
  await requireAdmin();
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await clientsCollection()).findOne({ _id });
  return doc ? toClientItem(doc) : null;
}

export async function createClient(input: ClientInput, leadId: string | null = null): Promise<string> {
  await requireAdmin("admin");
  const now = new Date();
  const doc: ClientDocument = { _id: new ObjectId(), ...input, leadId: toObjectId(leadId), createdAt: now, updatedAt: now };
  await (await clientsCollection()).insertOne(doc);
  if (doc.leadId) {
    // Converting a lead into a client means the deal was won.
    await (await leadsCollection()).updateOne({ _id: doc.leadId }, { $set: { status: "won", updatedAt: now } });
  }
  return doc._id.toHexString();
}

export async function updateClient(id: string, input: ClientInput): Promise<boolean> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return false;
  const result = await (await clientsCollection()).updateOne({ _id }, { $set: { ...input, updatedAt: new Date() } });
  return result.matchedCount === 1;
}

export async function setClientStatus(id: string, status: ClientStatus): Promise<ClientItem | null> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await clientsCollection()).findOneAndUpdate({ _id }, { $set: { status, updatedAt: new Date() } }, { returnDocument: "after" });
  return doc ? toClientItem(doc) : null;
}

export type DeleteClientResult = { ok: true; name: string } | { ok: false; error: string };

/** Clients with invoices can't be deleted (financial records must be kept) — cancel them instead. */
export async function deleteClient(id: string): Promise<DeleteClientResult> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return { ok: false, error: "Invalid client." };
  const invoices = await (await getCollection(COLLECTIONS.invoices)).countDocuments({ clientId: _id }, { limit: 1 });
  if (invoices > 0) return { ok: false, error: "This client has invoices, so it can't be deleted. Set its status to Cancelled instead." };
  const doc = await (await clientsCollection()).findOneAndDelete({ _id });
  return doc ? { ok: true, name: doc.name } : { ok: false, error: "This client no longer exists." };
}

/** Monthly recurring revenue: the monthly fees of all active clients, per currency. */
export async function getMrr(): Promise<{ currency: Currency; amount: number; clients: number }[]> {
  await requireAdmin();
  const rows = await (await clientsCollection())
    .aggregate<{ _id: Currency; amount: number; clients: number }>([
      { $match: { status: "active", monthlyFee: { $gt: 0 } } },
      { $group: { _id: "$currency", amount: { $sum: "$monthlyFee" }, clients: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ])
    .toArray();
  return rows.map((r) => ({ currency: r._id, amount: r.amount, clients: r.clients }));
}

/** Prefill for "Convert lead to client". */
export async function getLeadPrefill(leadId: string): Promise<Partial<ClientInput> & { leadId: string } | null> {
  await requireAdmin();
  const _id = toObjectId(leadId);
  if (!_id) return null;
  const lead = await (await leadsCollection()).findOne({ _id });
  if (!lead) return null;
  return { leadId, name: lead.company, contactName: lead.fullName, email: lead.email, phone: lead.phone, website: lead.website };
}

/** The client created from a lead, if any (so the lead page can link to it). */
export async function findClientByLead(leadId: string): Promise<{ id: string; name: string } | null> {
  await requireAdmin();
  const _id = toObjectId(leadId);
  if (!_id) return null;
  const doc = await (await clientsCollection()).findOne({ leadId: _id }, { projection: { name: 1 } });
  return doc ? { id: doc._id.toHexString(), name: doc.name } : null;
}
