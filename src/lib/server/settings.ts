import "server-only";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { siteConfig } from "@/data/site";
import { requireAdmin } from "@/lib/auth/session";
import type { Currency } from "@/lib/money";
import { logServerError } from "./log";
import { getCollection, isDatabaseConfigured } from "./mongodb";

/**
 * Business profile used on invoices and in the admin (stored as one document
 * in `settings`). Defaults come from src/data/site.ts until saved.
 */

export interface BusinessSettings {
  businessName: string;
  email: string;
  address: string;
  website: string;
  /** Shown on every invoice, e.g. Payoneer / bank details. */
  paymentInstructions: string;
  /** Default "Pay now" link on invoices (e.g. a Payoneer payment request link). */
  defaultPaymentLink: string;
  /** Calendly / Cal.com link for consultations. */
  bookingUrl: string;
  invoicePrefix: string;
  dueDays: number;
  defaultCurrency: Currency;
  invoiceFooter: string;
}

interface SettingsDocument extends Partial<BusinessSettings> {
  _id: string;
  updatedAt: Date;
  updatedBy?: string;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: siteConfig.name,
  email: siteConfig.email,
  address: "",
  website: siteConfig.url,
  paymentInstructions: "Pay securely using the “Pay now” link, or by bank transfer using the details we sent you. Please include the invoice number as the payment reference.",
  defaultPaymentLink: "",
  bookingUrl: "",
  invoicePrefix: "INV",
  dueDays: 7,
  defaultCurrency: "USD",
  invoiceFooter: "Thank you for your business!",
};

const SETTINGS_ID = "business";

/** Readable without a session: it only contains what's printed on invoices. */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  if (!isDatabaseConfigured()) return DEFAULT_SETTINGS;
  try {
    const doc = await (await getCollection<SettingsDocument>(COLLECTIONS.settings)).findOne({ _id: SETTINGS_ID });
    if (!doc) return DEFAULT_SETTINGS;
    const { _id, updatedAt, updatedBy, ...saved } = doc;
    void _id;
    void updatedAt;
    void updatedBy;
    return { ...DEFAULT_SETTINGS, ...Object.fromEntries(Object.entries(saved).filter(([, v]) => v !== undefined && v !== null)) };
  } catch (error) {
    logServerError("[settings] could not load business settings", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveBusinessSettings(settings: BusinessSettings, actor: string): Promise<void> {
  await requireAdmin("admin");
  await (await getCollection<SettingsDocument>(COLLECTIONS.settings)).updateOne(
    { _id: SETTINGS_ID },
    { $set: { ...settings, updatedAt: new Date(), updatedBy: actor } },
    { upsert: true },
  );
}
