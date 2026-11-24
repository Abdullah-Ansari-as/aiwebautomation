"use server";

import { refresh } from "next/cache";
import { actorLabel, requireAdmin } from "@/lib/auth/session";
import { BILLING_LIMITS, CLIENT_STATUSES, PAYMENT_METHODS, isPeriod, periodLabel } from "@/lib/billing-options";
import { isOneOf } from "@/lib/inquiry-options";
import { formatMoney, isCurrency, parseMoney } from "@/lib/money";
import { cleanText, normalizeEmail, normalizePhone, normalizeWebsite } from "@/lib/sanitize";
import { logActivity } from "@/lib/server/activity";
import { getAppUrl } from "@/lib/server/app-url";
import { createClient, deleteClient, setClientStatus, updateClient, type ClientInput } from "@/lib/server/clients";
import { escapeHtml, getEmailConfig, sendEmail } from "@/lib/server/email";
import { isObjectIdString } from "@/lib/server/ids";
import {
  createInvoice,
  deleteDraftInvoice,
  generateMonthlyInvoices,
  getInvoice,
  markInvoicePaid,
  markInvoiceSent,
  markInvoiceUnpaid,
  updateDraftInvoice,
  voidInvoice,
  type InvoiceInput,
  type InvoiceLine,
} from "@/lib/server/invoices";
import { logServerError } from "@/lib/server/log";
import { getBusinessSettings, saveBusinessSettings, type BusinessSettings } from "@/lib/server/settings";
import type { ActionState } from "./types";

const FAILED = "Something went wrong. Please try again.";
const CHECK = "Please check the highlighted fields.";

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function optionalUrl(value: string): string | null | false {
  if (!value) return null;
  const url = normalizeWebsite(value);
  return url && url.length <= BILLING_LIMITS.url ? url : false;
}

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

function parseClient(formData: FormData): { input?: ClientInput; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const name = cleanText(formData.get("name"));
  const contactName = cleanText(formData.get("contactName"));
  const email = normalizeEmail(cleanText(formData.get("email")));
  const rawPhone = cleanText(formData.get("phone"));
  const country = cleanText(formData.get("country")).slice(0, 60) || null;
  const website = optionalUrl(cleanText(formData.get("website")));
  const address = cleanText(formData.get("address"), { multiline: true }) || null;
  const plan = cleanText(formData.get("plan"));
  const currency = cleanText(formData.get("currency"));
  const monthlyFee = parseMoney(cleanText(formData.get("monthlyFee")) || "0");
  const setupFee = parseMoney(cleanText(formData.get("setupFee")) || "0");
  const billingDay = Number(cleanText(formData.get("billingDay")) || "1");
  const status = cleanText(formData.get("status")) || "active";
  const startDate = parseDate(formData.get("startDate"));
  const paymentLink = optionalUrl(cleanText(formData.get("paymentLink")));
  const notes = cleanText(formData.get("notes"), { multiline: true }) || null;

  if (name.length < 2 || name.length > BILLING_LIMITS.clientName) fieldErrors.name = "Enter the company or client name.";
  if (contactName.length < 2 || contactName.length > BILLING_LIMITS.contactName) fieldErrors.contactName = "Enter the contact person's name.";
  if (!email) fieldErrors.email = "Enter a valid billing email.";
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) fieldErrors.phone = "Enter a valid phone number with country code.";
  if (website === false) fieldErrors.website = "Enter a valid website.";
  if (address && address.length > BILLING_LIMITS.address) fieldErrors.address = `Keep the address under ${BILLING_LIMITS.address} characters.`;
  if (plan.length < 1 || plan.length > BILLING_LIMITS.plan) fieldErrors.plan = "Enter the plan or service name.";
  if (!isCurrency(currency)) fieldErrors.currency = "Choose a currency.";
  if (monthlyFee === null) fieldErrors.monthlyFee = "Enter an amount like 299 or 299.00 (0 for none).";
  if (setupFee === null) fieldErrors.setupFee = "Enter an amount like 499 or 0.";
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) fieldErrors.billingDay = "Choose a day between 1 and 28.";
  if (!isOneOf(CLIENT_STATUSES, status)) fieldErrors.status = "Choose a status.";
  if (!startDate) fieldErrors.startDate = "Choose the start date.";
  if (paymentLink === false) fieldErrors.paymentLink = "Enter a valid https:// link.";
  if (notes && notes.length > BILLING_LIMITS.notes) fieldErrors.notes = `Keep notes under ${BILLING_LIMITS.notes} characters.`;

  if (Object.keys(fieldErrors).length > 0 || !email || !isCurrency(currency) || monthlyFee === null || setupFee === null || !startDate || website === false || paymentLink === false || !isOneOf(CLIENT_STATUSES, status)) {
    return { fieldErrors };
  }
  return {
    fieldErrors,
    input: { name, contactName, email, phone, country, website, address, plan, currency, monthlyFee, setupFee, billingDay, status, startDate, paymentLink, notes },
  };
}

export async function saveClientAction(clientId: string | null, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("admin");
  const { input, fieldErrors } = parseClient(formData);
  if (!input) return { error: CHECK, fieldErrors };
  const leadId = cleanText(formData.get("leadId"));
  try {
    if (clientId) {
      if (!isObjectIdString(clientId) || !(await updateClient(clientId, input))) return { error: "This client no longer exists." };
      await logActivity(actorLabel(session), "client.updated", `Updated client ${input.name}`, `/admin/clients/${clientId}`);
      refresh();
      return { ok: true, message: "Client saved." };
    }
    const id = await createClient(input, isObjectIdString(leadId) ? leadId : null);
    await logActivity(actorLabel(session), "client.created", `New client ${input.name} — ${input.plan}${input.monthlyFee > 0 ? ` (${formatMoney(input.monthlyFee, input.currency)}/mo)` : ""}`, `/admin/clients/${id}`);
    return { ok: true, message: "Client created.", redirectTo: `/admin/clients/${id}` };
  } catch (error) {
    logServerError("[clients] save failed", error);
    return { error: FAILED };
  }
}

export async function setClientStatusAction(clientId: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("admin");
  const status = cleanText(formData.get("status"));
  if (!isObjectIdString(clientId) || !isOneOf(CLIENT_STATUSES, status)) return { error: "Invalid status." };
  try {
    const client = await setClientStatus(clientId, status);
    if (!client) return { error: "This client no longer exists." };
    await logActivity(actorLabel(session), "client.status", `${client.name} is now ${status}`, `/admin/clients/${clientId}`);
  } catch (error) {
    logServerError("[clients] status failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Status updated." };
}

export async function deleteClientAction(clientId: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(clientId)) return { error: "Invalid client." };
  try {
    const result = await deleteClient(clientId);
    if (!result.ok) return { error: result.error };
    await logActivity(actorLabel(session), "client.deleted", `Deleted client ${result.name}`, "/admin/clients");
  } catch (error) {
    logServerError("[clients] delete failed", error);
    return { error: FAILED };
  }
  return { ok: true, message: "Client deleted.", redirectTo: "/admin/clients" };
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

function parseInvoice(formData: FormData): { input?: InvoiceInput; clientId: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  const clientId = cleanText(formData.get("clientId"));
  const currency = cleanText(formData.get("currency"));
  const issueDate = parseDate(formData.get("issueDate"));
  const dueDate = parseDate(formData.get("dueDate"));
  const period = cleanText(formData.get("period")) || null;
  const notes = cleanText(formData.get("notes"), { multiline: true }) || null;
  const paymentLink = optionalUrl(cleanText(formData.get("paymentLink")));

  let items: InvoiceLine[] = [];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]")) as unknown;
    if (!Array.isArray(raw)) throw new Error("items");
    items = raw.slice(0, BILLING_LIMITS.maxItems + 1).map((row) => {
      const r = row as Record<string, unknown>;
      const description = cleanText(r.description);
      const quantity = Number(r.quantity);
      const unitAmount = parseMoney(String(r.unitAmount ?? ""));
      if (!description || description.length > BILLING_LIMITS.itemDescription) throw new Error("Each line needs a description (up to 300 characters).");
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10_000) throw new Error("Quantities must be between 0 and 10,000.");
      if (unitAmount === null) throw new Error("Enter prices like 299 or 299.50.");
      return { description, quantity: Math.round(quantity * 100) / 100, unitAmount };
    });
    if (items.length === 0) throw new Error("Add at least one line item.");
    if (items.length > BILLING_LIMITS.maxItems) throw new Error(`Use at most ${BILLING_LIMITS.maxItems} line items.`);
  } catch (error) {
    fieldErrors.items = error instanceof Error && error.message !== "items" && !error.message.startsWith("Unexpected") ? error.message : "Add at least one valid line item.";
  }

  if (!isObjectIdString(clientId)) fieldErrors.clientId = "Choose a client.";
  if (!isCurrency(currency)) fieldErrors.currency = "Choose a currency.";
  if (!issueDate) fieldErrors.issueDate = "Choose the invoice date.";
  if (!dueDate) fieldErrors.dueDate = "Choose the due date.";
  if (issueDate && dueDate && dueDate < issueDate) fieldErrors.dueDate = "The due date can't be before the invoice date.";
  if (period && !isPeriod(period)) fieldErrors.period = "Use the month picker.";
  if (notes && notes.length > BILLING_LIMITS.invoiceNotes) fieldErrors.notes = `Keep notes under ${BILLING_LIMITS.invoiceNotes} characters.`;
  if (paymentLink === false) fieldErrors.paymentLink = "Enter a valid https:// link.";

  if (Object.keys(fieldErrors).length > 0 || !isCurrency(currency) || !issueDate || !dueDate || paymentLink === false) return { clientId, fieldErrors };
  return { clientId, fieldErrors, input: { items, currency, issueDate, dueDate, period, notes, paymentLink } };
}

export async function saveInvoiceAction(invoiceId: string | null, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("admin");
  const { input, clientId, fieldErrors } = parseInvoice(formData);
  if (!input) return { error: fieldErrors.items ?? CHECK, fieldErrors };
  try {
    if (invoiceId) {
      const result = await updateDraftInvoice(invoiceId, input);
      if (!result.ok) return { error: result.error };
      await logActivity(actorLabel(session), "invoice.updated", `Edited draft invoice ${result.invoice.number}`, `/admin/invoices/${invoiceId}`);
      return { ok: true, message: "Invoice saved.", redirectTo: `/admin/invoices/${invoiceId}` };
    }
    const result = await createInvoice(clientId, input, actorLabel(session));
    if (!result.ok) return { error: result.error };
    await logActivity(actorLabel(session), "invoice.created", `Created invoice ${result.number}`, `/admin/invoices/${result.id}`);
    return { ok: true, message: "Invoice created.", redirectTo: `/admin/invoices/${result.id}` };
  } catch (error) {
    logServerError("[invoices] save failed", error);
    return { error: FAILED };
  }
}

export async function generateMonthlyInvoicesAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("admin");
  const period = cleanText(formData.get("period"));
  if (!isPeriod(period)) return { error: "Choose a month." };
  try {
    const result = await generateMonthlyInvoices(period, actorLabel(session));
    if (result.created.length > 0) {
      await logActivity(actorLabel(session), "invoice.generated", `Generated ${result.created.length} retainer invoice${result.created.length === 1 ? "" : "s"} for ${periodLabel(period)}`, "/admin/invoices?status=draft");
    }
    refresh();
    if (result.created.length === 0) {
      return { ok: true, message: result.skipped.length > 0 ? `Nothing new to create — all ${result.skipped.length} active client(s) already have an invoice for ${periodLabel(period)}.` : "No active clients with a monthly fee yet. Add a client first." };
    }
    return { ok: true, message: `Created ${result.created.length} draft invoice${result.created.length === 1 ? "" : "s"} for ${periodLabel(period)}: ${result.created.map((c) => `${c.number} (${c.client})`).join(", ")}. Review and send them below.` };
  } catch (error) {
    logServerError("[invoices] generate failed", error);
    return { error: FAILED };
  }
}

async function simpleTransition(label: string, id: string, run: () => Promise<{ ok: true; invoice: { number: string } } | { ok: false; error: string }>, success: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(id)) return { error: "Invalid invoice." };
  try {
    const result = await run();
    if (!result.ok) return { error: result.error };
    await logActivity(actorLabel(session), `invoice.${label}`, `${success.replace(".", "")}: ${result.invoice.number}`, `/admin/invoices/${id}`);
  } catch (error) {
    logServerError(`[invoices] ${label} failed`, error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: success };
}

export async function markInvoiceSentAction(id: string): Promise<ActionState> {
  return simpleTransition("sent", id, () => markInvoiceSent(id), "Marked as sent.");
}

export async function markInvoiceUnpaidAction(id: string): Promise<ActionState> {
  return simpleTransition("unpaid", id, () => markInvoiceUnpaid(id), "Marked as unpaid.");
}

export async function voidInvoiceAction(id: string): Promise<ActionState> {
  return simpleTransition("void", id, () => voidInvoice(id), "Invoice voided.");
}

export async function deleteInvoiceAction(id: string): Promise<ActionState> {
  const result = await simpleTransition("deleted", id, () => deleteDraftInvoice(id), "Draft deleted.");
  return result.ok ? { ...result, redirectTo: "/admin/invoices" } : result;
}

export async function markInvoicePaidAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const method = cleanText(formData.get("method"));
  const reference = cleanText(formData.get("reference")).slice(0, BILLING_LIMITS.paymentReference) || null;
  const paidAt = parseDate(formData.get("paidAt")) ?? new Date();
  if (!isOneOf(PAYMENT_METHODS, method)) {
    await requireAdmin("admin");
    return { error: "Choose how the client paid.", fieldErrors: { method: "Required" } };
  }
  return simpleTransition("paid", id, () => markInvoicePaid(id, { method, reference, paidAt }), "Payment recorded.");
}

/** Emails the invoice link to the client (via Resend) and marks it as sent. */
export async function sendInvoiceEmailAction(id: string): Promise<ActionState> {
  const session = await requireAdmin("admin");
  if (!isObjectIdString(id)) return { error: "Invalid invoice." };
  const config = getEmailConfig();
  if (!config.ok) return { error: "Email isn't configured (RESEND_API_KEY and EMAIL_FROM). Copy the invoice link and send it yourself, then click “Mark as sent”." };
  try {
    const invoice = await getInvoice(id);
    if (!invoice) return { error: "This invoice no longer exists." };
    if (invoice.status !== "draft" && invoice.status !== "sent") return { error: "Only draft or unpaid invoices can be emailed." };
    const settings = await getBusinessSettings();
    const link = `${getAppUrl()}/invoice/${invoice.publicToken}`;
    const amount = formatMoney(invoice.total, invoice.currency);
    const due = new Date(invoice.dueDate).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
    const first = invoice.client.contactName.split(" ")[0];
    await sendEmail(config, {
      to: invoice.client.email,
      subject: `Invoice ${invoice.number} from ${settings.businessName} — ${amount} due ${due}`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111;line-height:1.6">
<p>Hi ${escapeHtml(first)},</p>
<p>Here is invoice <strong>${escapeHtml(invoice.number)}</strong> for <strong>${escapeHtml(amount)}</strong>, due on ${escapeHtml(due)}.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#6d4aff;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">View and pay invoice</a></p>
<p style="color:#555">${escapeHtml(settings.paymentInstructions)}</p>
<p>Thank you,<br>${escapeHtml(settings.businessName)}</p>
</div>`,
      text: `Hi ${first},\n\nHere is invoice ${invoice.number} for ${amount}, due on ${due}.\n\nView and pay: ${link}\n\n${settings.paymentInstructions}\n\nThank you,\n${settings.businessName}`,
      replyTo: settings.email,
      idempotencyKey: `invoice-${invoice.id}-${invoice.sentAt ?? "first"}`,
    });
    const marked = await markInvoiceSent(id);
    if (!marked.ok) return { error: marked.error };
    await logActivity(actorLabel(session), "invoice.emailed", `Emailed invoice ${invoice.number} to ${invoice.client.email}`, `/admin/invoices/${id}`);
  } catch (error) {
    logServerError("[invoices] email failed", error);
    return { error: "The email couldn't be sent. Check the email settings, or copy the link and send it yourself." };
  }
  refresh();
  return { ok: true, message: "Invoice emailed to the client and marked as sent." };
}

/* ------------------------------------------------------------------ */
/* Business settings                                                   */
/* ------------------------------------------------------------------ */

export async function saveSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin("admin");
  const fieldErrors: Record<string, string> = {};
  const text = (name: string, max: number, multiline = false) => {
    const value = cleanText(formData.get(name), { multiline });
    if (value.length > max) fieldErrors[name] = `Keep this under ${max} characters.`;
    return value;
  };
  const businessName = text("businessName", 120);
  const email = normalizeEmail(cleanText(formData.get("email")));
  const address = text("address", 500, true);
  const websiteRaw = cleanText(formData.get("website"));
  const website = websiteRaw ? normalizeWebsite(websiteRaw) : "";
  const paymentInstructions = text("paymentInstructions", 1500, true);
  const paymentLinkRaw = cleanText(formData.get("defaultPaymentLink"));
  const defaultPaymentLink = paymentLinkRaw ? normalizeWebsite(paymentLinkRaw) : "";
  const bookingRaw = cleanText(formData.get("bookingUrl"));
  const bookingUrl = bookingRaw ? normalizeWebsite(bookingRaw) : "";
  const invoicePrefix = cleanText(formData.get("invoicePrefix")).toUpperCase();
  const dueDays = Number(cleanText(formData.get("dueDays")));
  const defaultCurrency = cleanText(formData.get("defaultCurrency"));
  const invoiceFooter = text("invoiceFooter", 300, true);

  if (businessName.length < 2) fieldErrors.businessName = "Enter your business name.";
  if (!email) fieldErrors.email = "Enter a valid email.";
  if (website === null) fieldErrors.website = "Enter a valid website.";
  if (defaultPaymentLink === null) fieldErrors.defaultPaymentLink = "Enter a valid https:// link.";
  if (bookingUrl === null) fieldErrors.bookingUrl = "Enter a valid https:// link.";
  if (!/^[A-Z0-9]{1,8}$/.test(invoicePrefix)) fieldErrors.invoicePrefix = "Use 1–8 letters or numbers, e.g. INV.";
  if (!Number.isInteger(dueDays) || dueDays < 0 || dueDays > 90) fieldErrors.dueDays = "Use a number of days between 0 and 90.";
  if (!isCurrency(defaultCurrency)) fieldErrors.defaultCurrency = "Choose a currency.";
  if (Object.keys(fieldErrors).length > 0 || !email || !isCurrency(defaultCurrency) || website === null || defaultPaymentLink === null || bookingUrl === null) return { error: CHECK, fieldErrors };

  const settings: BusinessSettings = { businessName, email, address, website, paymentInstructions, defaultPaymentLink, bookingUrl, invoicePrefix, dueDays, defaultCurrency, invoiceFooter };
  try {
    await saveBusinessSettings(settings, actorLabel(session));
    await logActivity(actorLabel(session), "settings.updated", "Updated business & invoice settings", "/admin/settings");
  } catch (error) {
    logServerError("[settings] save failed", error);
    return { error: FAILED };
  }
  refresh();
  return { ok: true, message: "Settings saved." };
}
