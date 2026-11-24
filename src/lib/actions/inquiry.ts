"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { siteConfig } from "@/data/site";
import {
  BUDGET_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  LIMITS,
  SERVICE_OPTIONS,
  SPONSOR_OPTIONS,
  isOneOf,
  type InquiryFieldErrors,
  type InquiryState,
} from "@/lib/inquiry-options";
import { cleanText, countLinks, normalizeEmail, normalizePhone, normalizeWebsite } from "@/lib/sanitize";
import { notifyNewLead } from "@/lib/server/lead-notifications";
import { logActivity } from "@/lib/server/activity";
import { looksAutomated, safeSourcePath } from "@/lib/server/form-guard";
import { createLead, type NewLead } from "@/lib/server/leads";
import { logServerError } from "@/lib/server/log";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { hashIdentifier } from "@/lib/server/secrets";

const MAX_LINKS_IN_DESCRIPTION = 5;

const fallbackContact = `please email us at ${siteConfig.email}`;

/**
 * Handles both service quote requests and sponsor inquiries. Everything from
 * the client is treated as untrusted: values are normalised, checked against
 * the option lists and length limits, and only then stored.
 */
export async function submitInquiry(_previous: InquiryState, formData: FormData): Promise<InquiryState> {
  // 1. Bot traps. Bots get a believable success so they don't adapt; nothing is stored.
  if (looksAutomated(formData)) return { status: "success", reference: "received" };

  // 2. Normalise and validate.
  const kind = formData.get("kind") === "sponsor" ? "sponsor" : "service";
  const fullName = cleanText(formData.get("fullName"));
  const rawEmail = cleanText(formData.get("email"));
  const company = cleanText(formData.get("company"));
  const rawWebsite = cleanText(formData.get("website"));
  const category = cleanText(formData.get("category"));
  const budget = cleanText(formData.get("budget"));
  const description = cleanText(formData.get("description"), { multiline: true });
  const contactMethod = cleanText(formData.get("contactMethod"));
  const rawPhone = cleanText(formData.get("phone"));
  const rawSource = cleanText(formData.get("sourcePath"));

  const errors: InquiryFieldErrors = {};
  if (fullName.length < 2) errors.fullName = "Please enter your full name.";
  else if (fullName.length > LIMITS.fullName) errors.fullName = `Please keep your name under ${LIMITS.fullName} characters.`;

  const email = normalizeEmail(rawEmail);
  if (!rawEmail) errors.email = "Please enter your business email.";
  else if (!email) errors.email = "Please enter a valid email address.";

  if (company.length < 2) errors.company = "Please enter your company or project name.";
  else if (company.length > LIMITS.company) errors.company = `Please keep this under ${LIMITS.company} characters.`;

  const website = rawWebsite ? normalizeWebsite(rawWebsite) : null;
  if (rawWebsite && (!website || website.length > LIMITS.website)) errors.website = "Enter a valid website, e.g. https://example.com";

  const categoryOptions = kind === "sponsor" ? SPONSOR_OPTIONS : SERVICE_OPTIONS;
  if (!isOneOf(categoryOptions, category)) errors.category = kind === "sponsor" ? "Please choose a sponsorship option." : "Please choose a service.";

  if (!isOneOf(BUDGET_OPTIONS, budget)) errors.budget = "Please choose a budget range.";

  if (description.length < LIMITS.descriptionMin) errors.description = `Please describe your project in at least ${LIMITS.descriptionMin} characters.`;
  else if (description.length > LIMITS.description) errors.description = `Please keep this under ${LIMITS.description} characters.`;
  else if (countLinks(description) > MAX_LINKS_IN_DESCRIPTION) errors.description = "Please include fewer links — you can share more once we reply.";

  if (!isOneOf(CONTACT_METHOD_OPTIONS, contactMethod)) errors.contactMethod = "Please choose how we should contact you.";

  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) errors.phone = "Enter a valid phone number including the country code.";
  else if (!phone && (contactMethod === "whatsapp" || contactMethod === "phone")) errors.phone = "Add a phone number so we can reach you that way.";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: errors };
  }

  if (!isDatabaseConfigured()) {
    console.error("[inquiry] MONGODB_URI is not configured — inquiry was not stored.");
    return { status: "error", message: `Our inquiry system is temporarily unavailable — ${fallbackContact}.` };
  }

  try {
    // 3. Rate limits per visitor (hashed IP) and per email address.
    const requestHeaders = await headers();
    const ipHash = hashIdentifier(getClientIp(requestHeaders));
    const [byIp, byEmail] = await Promise.all([
      consumeRateLimit(`inquiry:ip:${ipHash}`, 5, 60 * 60),
      consumeRateLimit(`inquiry:email:${hashIdentifier(email!)}`, 3, 60 * 60),
    ]);
    if (!byIp.allowed || !byEmail.allowed) {
      const minutes = Math.max(1, Math.ceil(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) / 60));
      return { status: "error", message: `You've sent several requests recently. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or ${fallbackContact}.` };
    }

    // 4. Persist.
    const lead: NewLead = {
      kind,
      fullName,
      email: email!,
      company,
      website,
      category,
      budget: budget as NewLead["budget"],
      description,
      contactMethod: contactMethod as NewLead["contactMethod"],
      phone,
      sourcePath: safeSourcePath(rawSource),
      ipHash,
      userAgent: cleanText(requestHeaders.get("user-agent")).slice(0, 300) || null,
    };
    const { id, reference } = await createLead(lead);

    // 5. Notify after the response is sent, so email latency or outages never block the visitor.
    after(async () => {
      await notifyNewLead(id, reference, lead);
      await logActivity("website", "lead.created", `New ${kind === "sponsor" ? "sponsor" : "service"} inquiry from ${fullName} (${company})`, `/admin/leads/${id}`);
    });

    return { status: "success", reference };
  } catch (error) {
    logServerError("[inquiry] Failed to store inquiry", error);
    return { status: "error", message: `Something went wrong on our side and your request wasn't saved — please try again, or ${fallbackContact}.` };
  }
}
