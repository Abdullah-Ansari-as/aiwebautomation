/** Option lists for clients and invoices, shared by forms and server validation. */

export const CLIENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
] as const;

/** How clients typically pay a Pakistan-based freelancer/agency. */
export const PAYMENT_METHODS = [
  { value: "Payoneer", label: "Payoneer" },
  { value: "Wise", label: "Wise" },
  { value: "Bank transfer", label: "Bank transfer" },
  { value: "Upwork", label: "Upwork" },
  { value: "Fiverr", label: "Fiverr" },
  { value: "Stripe", label: "Stripe" },
  { value: "PayPal", label: "PayPal" },
  { value: "Other", label: "Other" },
] as const;

/** Suggested plan names (free text is allowed too). Mirrors the monthly plans on /services. */
export const PLAN_SUGGESTIONS = ["Automation Care", "AI Lead Response", "Growth Partner", "Custom retainer", "One-time project"] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number]["value"];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]["value"];
/** Display status: a sent invoice past its due date is shown as overdue. */
export type InvoiceDisplayStatus = InvoiceStatus | "overdue";

export const BILLING_LIMITS = {
  clientName: 160,
  contactName: 120,
  plan: 80,
  address: 500,
  notes: 4000,
  invoiceNotes: 2000,
  itemDescription: 300,
  maxItems: 30,
  paymentReference: 120,
  url: 500,
} as const;

/** "2026-11" → "November 2026". */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function currentPeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isPeriod(value: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(value);
}
