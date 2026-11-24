import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { requireAdmin } from "@/lib/auth/session";
import { periodLabel, type InvoiceDisplayStatus, type InvoiceStatus } from "@/lib/billing-options";
import type { Currency } from "@/lib/money";
import { clientsCollection, type ClientDocument } from "./clients";
import { randomToken, toObjectId } from "./ids";
import { getCollection, isDuplicateKeyError } from "./mongodb";
import { getBusinessSettings } from "./settings";

/**
 * Invoices for clients: one-off project invoices and monthly retainer
 * invoices (one per client per month, enforced by a unique index). Amounts
 * are integers in minor units. Each invoice has an unguessable public token
 * for the client-facing page /invoice/<token>.
 */

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitAmount: number;
}

export interface InvoiceDocument {
  _id: ObjectId;
  number: string;
  clientId: ObjectId;
  client: { name: string; contactName: string; email: string; address: string | null };
  period: string | null;
  items: InvoiceLine[];
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  sentAt: Date | null;
  paidAt: Date | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentLink: string | null;
  publicToken: string;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  number: string;
  clientId: string;
  client: InvoiceDocument["client"];
  period: string | null;
  items: InvoiceLine[];
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  displayStatus: InvoiceDisplayStatus;
  issueDate: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentLink: string | null;
  publicToken: string;
  notes: string | null;
  createdAt: string;
}

export interface InvoiceInput {
  items: InvoiceLine[];
  currency: Currency;
  issueDate: Date;
  dueDate: Date;
  period: string | null;
  notes: string | null;
  paymentLink: string | null;
}

export const invoicesCollection = () => getCollection<InvoiceDocument>(COLLECTIONS.invoices);

export function lineTotal(line: InvoiceLine): number {
  return Math.round(line.quantity * line.unitAmount);
}

export function invoiceTotal(items: InvoiceLine[]): number {
  return items.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function displayStatus(status: InvoiceStatus, dueDate: Date, now = new Date()): InvoiceDisplayStatus {
  return status === "sent" && dueDate.getTime() < startOfUtcDay(now).getTime() ? "overdue" : status;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function toInvoiceItem(d: InvoiceDocument): InvoiceItem {
  return {
    id: d._id.toHexString(),
    number: d.number,
    clientId: d.clientId.toHexString(),
    client: d.client,
    period: d.period,
    items: d.items,
    total: d.total,
    currency: d.currency,
    status: d.status,
    displayStatus: displayStatus(d.status, d.dueDate),
    issueDate: d.issueDate.toISOString(),
    dueDate: d.dueDate.toISOString(),
    sentAt: d.sentAt?.toISOString() ?? null,
    paidAt: d.paidAt?.toISOString() ?? null,
    paymentMethod: d.paymentMethod,
    paymentReference: d.paymentReference,
    paymentLink: d.paymentLink,
    publicToken: d.publicToken,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
  };
}

function snapshot(client: ClientDocument): InvoiceDocument["client"] {
  return { name: client.name, contactName: client.contactName, email: client.email, address: client.address };
}

/** Next number for the year, e.g. INV-2026-0007, from an atomic counter. */
async function nextInvoiceNumber(prefix: string, year: number): Promise<string> {
  const counters = await getCollection<{ _id: string; seq: number }>(COLLECTIONS.counters);
  const doc = await counters.findOneAndUpdate({ _id: `invoice:${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  return `${prefix}-${year}-${String(doc?.seq ?? 1).padStart(4, "0")}`;
}

function isPeriodConflict(error: unknown): boolean {
  if (!isDuplicateKeyError(error)) return false;
  const e = error as { keyPattern?: Record<string, unknown>; message?: string };
  return Boolean(e.keyPattern?.period) || String(e.message).includes("client_period_unique");
}

export type CreateInvoiceResult = { ok: true; id: string; number: string } | { ok: false; error: string };

async function insertInvoice(client: ClientDocument, input: InvoiceInput, actor: string): Promise<CreateInvoiceResult> {
  const settings = await getBusinessSettings();
  const collection = await invoicesCollection();
  for (let attempt = 0; ; attempt++) {
    const now = new Date();
    const doc: InvoiceDocument = {
      _id: new ObjectId(),
      number: await nextInvoiceNumber(settings.invoicePrefix || "INV", input.issueDate.getUTCFullYear()),
      clientId: client._id,
      client: snapshot(client),
      period: input.period,
      items: input.items,
      total: invoiceTotal(input.items),
      currency: input.currency,
      status: "draft",
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      sentAt: null,
      paidAt: null,
      paymentMethod: null,
      paymentReference: null,
      paymentLink: input.paymentLink ?? client.paymentLink ?? (settings.defaultPaymentLink || null),
      publicToken: randomToken(20),
      notes: input.notes,
      createdBy: actor.slice(0, 254),
      createdAt: now,
      updatedAt: now,
    };
    try {
      await collection.insertOne(doc);
      return { ok: true, id: doc._id.toHexString(), number: doc.number };
    } catch (error) {
      if (isPeriodConflict(error)) return { ok: false, error: `${client.name} already has an invoice for ${periodLabel(input.period ?? "")}.` };
      // A number collision (e.g. after changing the prefix back) just takes the next number.
      if (!isDuplicateKeyError(error) || attempt >= 4) throw error;
    }
  }
}

export async function createInvoice(clientId: string, input: InvoiceInput, actor: string): Promise<CreateInvoiceResult> {
  await requireAdmin("admin");
  const _id = toObjectId(clientId);
  const client = _id ? await (await clientsCollection()).findOne({ _id }) : null;
  if (!client) return { ok: false, error: "Choose a valid client." };
  return insertInvoice(client, input, actor);
}

export interface GenerateResult {
  created: { id: string; number: string; client: string }[];
  skipped: { client: string; reason: string }[];
}

/**
 * Creates draft retainer invoices for every active client with a monthly fee
 * for the given month ("YYYY-MM"). Safe to run repeatedly: clients that
 * already have an invoice for that month are skipped. A client's first-ever
 * invoice also includes their setup fee.
 */
export async function generateMonthlyInvoices(period: string, actor: string): Promise<GenerateResult> {
  await requireAdmin("admin");
  const [year, month] = period.split("-").map(Number);
  const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const settings = await getBusinessSettings();
  const clients = await (await clientsCollection()).find({ status: "active", monthlyFee: { $gt: 0 }, startDate: { $lte: periodEnd } }).sort({ name: 1 }).toArray();
  const invoices = await invoicesCollection();
  const result: GenerateResult = { created: [], skipped: [] };
  const today = startOfUtcDay(new Date());

  for (const client of clients) {
    if (await invoices.findOne({ clientId: client._id, period }, { projection: { _id: 1 } })) {
      result.skipped.push({ client: client.name, reason: "already invoiced" });
      continue;
    }
    const billingDate = new Date(Date.UTC(year, month - 1, Math.min(client.billingDay, 28)));
    const issueDate = billingDate.getTime() > today.getTime() ? billingDate : today;
    const items: InvoiceLine[] = [{ description: `${client.plan} — monthly retainer (${periodLabel(period)})`, quantity: 1, unitAmount: client.monthlyFee }];
    const isFirst = (await invoices.countDocuments({ clientId: client._id, status: { $ne: "void" } }, { limit: 1 })) === 0;
    if (isFirst && client.setupFee > 0) items.unshift({ description: `${client.plan} — one-time setup`, quantity: 1, unitAmount: client.setupFee });

    const created = await insertInvoice(client, { items, currency: client.currency, issueDate, dueDate: addDays(issueDate, settings.dueDays), period, notes: null, paymentLink: null }, actor);
    if (created.ok) result.created.push({ id: created.id, number: created.number, client: client.name });
    else result.skipped.push({ client: client.name, reason: created.error });
  }
  return result;
}

export async function listInvoices({ status, clientId }: { status?: InvoiceDisplayStatus; clientId?: string } = {}): Promise<InvoiceItem[]> {
  await requireAdmin();
  const filter: Filter<InvoiceDocument> = {};
  if (status === "overdue") Object.assign(filter, { status: "sent", dueDate: { $lt: startOfUtcDay(new Date()) } });
  else if (status) filter.status = status;
  const clientObjectId = toObjectId(clientId);
  if (clientId) {
    if (!clientObjectId) return [];
    filter.clientId = clientObjectId;
  }
  const docs = await (await invoicesCollection()).find(filter).sort({ issueDate: -1, number: -1 }).limit(1000).toArray();
  return docs.map(toInvoiceItem);
}

export async function getInvoice(id: string): Promise<InvoiceItem | null> {
  await requireAdmin();
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await invoicesCollection()).findOne({ _id });
  return doc ? toInvoiceItem(doc) : null;
}

export function isPublicInvoiceToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
}

/** Public: the client-facing invoice page. Drafts are not visible to clients. */
export async function getInvoiceByToken(token: string): Promise<InvoiceItem | null> {
  if (!isPublicInvoiceToken(token)) return null;
  const doc = await (await invoicesCollection()).findOne({ publicToken: token, status: { $ne: "draft" } });
  return doc ? toInvoiceItem(doc) : null;
}

export type InvoiceChange = { ok: true; invoice: InvoiceItem } | { ok: false; error: string };

async function transition(id: string, from: InvoiceStatus[], set: Partial<InvoiceDocument>, notAllowed: string): Promise<InvoiceChange> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return { ok: false, error: "Invalid invoice." };
  const doc = await (await invoicesCollection()).findOneAndUpdate({ _id, status: { $in: from } }, { $set: { ...set, updatedAt: new Date() } }, { returnDocument: "after" });
  if (doc) return { ok: true, invoice: toInvoiceItem(doc) };
  const exists = await (await invoicesCollection()).countDocuments({ _id }, { limit: 1 });
  return { ok: false, error: exists ? notAllowed : "This invoice no longer exists." };
}

export function markInvoiceSent(id: string): Promise<InvoiceChange> {
  return transition(id, ["draft", "sent"], { status: "sent", sentAt: new Date() }, "Only draft or unpaid invoices can be sent.");
}

export function markInvoicePaid(id: string, payment: { method: string; reference: string | null; paidAt: Date }): Promise<InvoiceChange> {
  return transition(id, ["draft", "sent"], { status: "paid", paidAt: payment.paidAt, paymentMethod: payment.method, paymentReference: payment.reference }, "Only unpaid invoices can be marked as paid.");
}

export function markInvoiceUnpaid(id: string): Promise<InvoiceChange> {
  return transition(id, ["paid"], { status: "sent", paidAt: null, paymentMethod: null, paymentReference: null }, "Only paid invoices can be marked as unpaid.");
}

export function voidInvoice(id: string): Promise<InvoiceChange> {
  return transition(id, ["draft", "sent"], { status: "void" }, "Paid invoices can't be voided. Mark it unpaid first if the payment was a mistake.");
}

export async function deleteDraftInvoice(id: string): Promise<InvoiceChange> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return { ok: false, error: "Invalid invoice." };
  const doc = await (await invoicesCollection()).findOneAndDelete({ _id, status: "draft" });
  return doc ? { ok: true, invoice: toInvoiceItem(doc) } : { ok: false, error: "Only draft invoices can be deleted. Void a sent invoice instead." };
}

export async function updateDraftInvoice(id: string, input: InvoiceInput): Promise<InvoiceChange> {
  await requireAdmin("admin");
  const _id = toObjectId(id);
  if (!_id) return { ok: false, error: "Invalid invoice." };
  const collection = await invoicesCollection();
  const current = await collection.findOne({ _id });
  if (!current) return { ok: false, error: "This invoice no longer exists." };
  if (current.status !== "draft") return { ok: false, error: "Only draft invoices can be edited." };
  const client = await (await clientsCollection()).findOne({ _id: current.clientId });
  try {
    const doc = await collection.findOneAndUpdate(
      { _id, status: "draft" },
      { $set: { ...input, total: invoiceTotal(input.items), ...(client && { client: snapshot(client) }), updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    return doc ? { ok: true, invoice: toInvoiceItem(doc) } : { ok: false, error: "Only draft invoices can be edited." };
  } catch (error) {
    if (isPeriodConflict(error)) return { ok: false, error: `This client already has an invoice for ${periodLabel(input.period ?? "")}.` };
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Reporting                                                           */
/* ------------------------------------------------------------------ */

export interface MoneyByCurrency {
  currency: Currency;
  amount: number;
  count: number;
}

export async function getReceivables(): Promise<{ outstanding: MoneyByCurrency[]; overdue: MoneyByCurrency[]; drafts: number }> {
  await requireAdmin();
  const collection = await invoicesCollection();
  const today = startOfUtcDay(new Date());
  const group = (match: Filter<InvoiceDocument>) =>
    collection
      .aggregate<{ _id: Currency; amount: number; count: number }>([{ $match: match }, { $group: { _id: "$currency", amount: { $sum: "$total" }, count: { $sum: 1 } } }, { $sort: { amount: -1 } }])
      .toArray()
      .then((rows) => rows.map((r) => ({ currency: r._id, amount: r.amount, count: r.count })));
  const [outstanding, overdue, drafts] = await Promise.all([group({ status: "sent" }), group({ status: "sent", dueDate: { $lt: today } }), collection.countDocuments({ status: "draft" })]);
  return { outstanding, overdue, drafts };
}

export async function getCollected(from: Date, to: Date): Promise<MoneyByCurrency[]> {
  await requireAdmin();
  const rows = await (await invoicesCollection())
    .aggregate<{ _id: Currency; amount: number; count: number }>([
      { $match: { status: "paid", paidAt: { $gte: from, $lt: to } } },
      { $group: { _id: "$currency", amount: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ])
    .toArray();
  return rows.map((r) => ({ currency: r._id, amount: r.amount, count: r.count }));
}

/** Paid revenue per month (by payment date) for one currency, oldest first, gaps filled with 0. */
export async function getMonthlyRevenue(currency: Currency, months = 6): Promise<{ period: string; amount: number }[]> {
  await requireAdmin();
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const rows = await (await invoicesCollection())
    .aggregate<{ _id: string; amount: number }>([
      { $match: { status: "paid", currency, paidAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, amount: { $sum: "$total" } } },
    ])
    .toArray();
  const byPeriod = new Map(rows.map((r) => [r._id, r.amount]));
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { period, amount: byPeriod.get(period) ?? 0 };
  });
}

/** Totals for one client's detail page. */
export async function getClientBillingSummary(clientId: string): Promise<{ paid: MoneyByCurrency[]; outstanding: MoneyByCurrency[] }> {
  await requireAdmin();
  const _id = toObjectId(clientId);
  if (!_id) return { paid: [], outstanding: [] };
  const collection = await invoicesCollection();
  const group = (status: InvoiceStatus) =>
    collection
      .aggregate<{ _id: Currency; amount: number; count: number }>([{ $match: { clientId: _id, status } }, { $group: { _id: "$currency", amount: { $sum: "$total" }, count: { $sum: 1 } } }])
      .toArray()
      .then((rows) => rows.map((r) => ({ currency: r._id, amount: r.amount, count: r.count })));
  const [paid, outstanding] = await Promise.all([group("paid"), group("sent")]);
  return { paid, outstanding };
}
