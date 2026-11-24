/**
 * Option lists shared by the inquiry forms (client) and the server-side
 * validation. Server validation only accepts values from these lists, so the
 * form and the database can never drift apart.
 */

export const INQUIRY_KINDS = ["service", "sponsor"] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

/** Service categories a client can request a quote for. Values are stable ids. */
export const SERVICE_OPTIONS = [
  { value: "ai-lead-response", label: "AI Lead Response plan (monthly)" },
  { value: "automation-care", label: "Automation Care plan (monthly)" },
  { value: "growth-partner", label: "Growth Partner plan (monthly)" },
  { value: "ai-automation", label: "AI Automation Services" },
  { value: "n8n-workflows", label: "n8n Workflow Development" },
  { value: "make-zapier", label: "Make.com & Zapier Integrations" },
  { value: "crm-automation", label: "CRM Automation" },
  { value: "ai-chatbot", label: "AI Chatbot Development" },
  { value: "lead-generation", label: "Lead Generation Automation" },
  { value: "email-automation", label: "Email Automation" },
  { value: "custom-ai", label: "Custom AI Business Solutions" },
  { value: "not-sure", label: "Not sure yet — help me decide" },
] as const;

/** Sponsorship options, matching the Advertise page. */
export const SPONSOR_OPTIONS = [
  { value: "newsletter-sponsorship", label: "Newsletter sponsorship" },
  { value: "sponsored-guide", label: "Sponsored guide" },
  { value: "display-placement", label: "Display placement" },
  { value: "sponsor-other", label: "Something else" },
] as const;

/** Budget ranges are aligned with the monthly plans and one-time project packages. */
export const BUDGET_OPTIONS = [
  { value: "monthly-under-300", label: "Monthly plan: under $300/mo" },
  { value: "monthly-300-600", label: "Monthly plan: $300 – $600/mo" },
  { value: "monthly-600-plus", label: "Monthly plan: $600+/mo" },
  { value: "75-199", label: "$75 – $199" },
  { value: "199-399", label: "$199 – $399" },
  { value: "399-1000", label: "$399 – $1,000" },
  { value: "1000-plus", label: "$1,000+" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const CONTACT_METHOD_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone call" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export type ServiceValue = (typeof SERVICE_OPTIONS)[number]["value"];
export type SponsorValue = (typeof SPONSOR_OPTIONS)[number]["value"];
export type BudgetValue = (typeof BUDGET_OPTIONS)[number]["value"];
export type ContactMethodValue = (typeof CONTACT_METHOD_OPTIONS)[number]["value"];
export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

/** Field length limits enforced on the server (and mirrored as maxLength in the form). */
export const LIMITS = {
  fullName: 120,
  email: 254,
  company: 160,
  website: 300,
  phone: 32,
  description: 4000,
  descriptionMin: 30,
  note: 4000,
} as const;

type Option = { readonly value: string; readonly label: string };

export function optionLabel(options: readonly Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Label for a stored lead "category", which is either a service or a sponsorship option. */
export function categoryLabel(value: string): string {
  return optionLabel([...SERVICE_OPTIONS, ...SPONSOR_OPTIONS], value);
}

export function isOneOf<T extends string>(options: readonly { readonly value: T }[], value: string): value is T {
  return options.some((o) => o.value === value);
}

/** Field-level errors returned to the form, keyed by input name. */
export type InquiryFieldErrors = Partial<Record<"fullName" | "email" | "company" | "website" | "category" | "budget" | "description" | "contactMethod" | "phone", string>>;

export type InquiryState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string; fieldErrors?: InquiryFieldErrors };
