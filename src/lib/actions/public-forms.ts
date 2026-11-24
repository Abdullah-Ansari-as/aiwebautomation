"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { toolCategories } from "@/data/categories";
import { siteConfig } from "@/data/site";
import { CONTACT_TOPICS, FORM_LIMITS, SUBMISSION_PRICING, SUBMISSION_RELATIONSHIPS } from "@/lib/form-options";
import { isOneOf, optionLabel } from "@/lib/inquiry-options";
import { cleanText, countLinks, normalizeEmail, normalizeWebsite } from "@/lib/sanitize";
import { logActivity } from "@/lib/server/activity";
import { escapeHtml, getEmailConfig, sendEmail } from "@/lib/server/email";
import { looksAutomated, safeSourcePath } from "@/lib/server/form-guard";
import { logServerError } from "@/lib/server/log";
import { createMessage } from "@/lib/server/messages";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { notifyTeamOnce } from "@/lib/server/notify";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { hashIdentifier } from "@/lib/server/secrets";
import { createSubmission } from "@/lib/server/submissions";
import { subscribe } from "@/lib/server/subscribers";
import type { PublicFormState } from "./types";
import { COLLECTIONS } from "../../../db/schema.mjs";

/**
 * Server Actions behind the public contact, newsletter and tool-submission
 * forms. Everything from the browser is untrusted: values are normalised,
 * validated against fixed option lists and limits, rate-limited per visitor,
 * and only then stored. Team emails are sent after the response.
 */

const fallback = `please email us at ${siteConfig.email}`;
const UNAVAILABLE: PublicFormState = { status: "error", message: `This form is temporarily unavailable — ${fallback}.` };
const FAILED: PublicFormState = { status: "error", message: `Something went wrong on our side and your message wasn't saved — please try again, or ${fallback}.` };

async function visitor() {
  const h = await headers();
  return { ipHash: hashIdentifier(getClientIp(h)), userAgent: cleanText(h.get("user-agent")).slice(0, 300) || null };
}

function tooMany(retryAfterSeconds: number): PublicFormState {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return { status: "error", message: `You've sent several requests recently. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
}

/* ------------------------------------------------------------------ */
/* Contact form                                                        */
/* ------------------------------------------------------------------ */

export async function submitContactMessage(_previous: PublicFormState, formData: FormData): Promise<PublicFormState> {
  if (looksAutomated(formData)) return { status: "success", reference: "received" };

  const name = cleanText(formData.get("name"));
  const rawEmail = cleanText(formData.get("email"));
  const topic = cleanText(formData.get("topic"));
  const message = cleanText(formData.get("message"), { multiline: true });

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > FORM_LIMITS.name) fieldErrors.name = "Please enter your name.";
  const email = normalizeEmail(rawEmail);
  if (!email) fieldErrors.email = "Please enter a valid email address.";
  if (!isOneOf(CONTACT_TOPICS, topic)) fieldErrors.topic = "Please choose a topic.";
  if (message.length < FORM_LIMITS.messageMin) fieldErrors.message = `Please write at least ${FORM_LIMITS.messageMin} characters.`;
  else if (message.length > FORM_LIMITS.message) fieldErrors.message = `Please keep your message under ${FORM_LIMITS.message} characters.`;
  else if (countLinks(message) > 5) fieldErrors.message = "Please include fewer links.";
  if (Object.keys(fieldErrors).length > 0 || !email || !isOneOf(CONTACT_TOPICS, topic)) return { status: "error", message: "Please check the highlighted fields.", fieldErrors };

  if (!isDatabaseConfigured()) return UNAVAILABLE;
  try {
    const { ipHash, userAgent } = await visitor();
    const [byIp, byEmail] = await Promise.all([consumeRateLimit(`contact:ip:${ipHash}`, 5, 3600), consumeRateLimit(`contact:email:${hashIdentifier(email)}`, 3, 3600)]);
    if (!byIp.allowed || !byEmail.allowed) return tooMany(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds));

    const sourcePath = safeSourcePath(cleanText(formData.get("sourcePath")));
    const { id, reference } = await createMessage({ name, email, topic, message, sourcePath, ipHash, userAgent });
    after(async () => {
      await notifyTeamOnce(COLLECTIONS.messages, id, {
        subject: `Contact ${reference}: ${optionLabel(CONTACT_TOPICS, topic)} — ${name}`,
        heading: `New message from ${name}`,
        rows: [
          ["Reference", reference],
          ["Name", name],
          ["Email", email],
          ["Topic", optionLabel(CONTACT_TOPICS, topic)],
        ],
        body: message,
        replyTo: email,
        adminPath: `/admin/messages/${id.toHexString()}`,
      });
      await logActivity("website", "message.created", `New contact message from ${name}`, `/admin/messages/${id.toHexString()}`);
    });
    return { status: "success", reference };
  } catch (error) {
    logServerError("[contact] failed to store message", error);
    return FAILED;
  }
}

/* ------------------------------------------------------------------ */
/* Newsletter                                                          */
/* ------------------------------------------------------------------ */

export async function subscribeNewsletter(_previous: PublicFormState, formData: FormData): Promise<PublicFormState> {
  if (looksAutomated(formData, 1_000)) return { status: "success", message: "subscribed" };
  const email = normalizeEmail(cleanText(formData.get("email")));
  if (!email) return { status: "error", message: "Please enter a valid email address.", fieldErrors: { email: "Please enter a valid email address." } };
  if (formData.get("consent") !== "yes") return { status: "error", message: "Please confirm you'd like to receive the newsletter.", fieldErrors: { consent: "Required" } };
  if (!isDatabaseConfigured()) return UNAVAILABLE;

  try {
    const { ipHash } = await visitor();
    const limit = await consumeRateLimit(`newsletter:ip:${ipHash}`, 10, 3600);
    if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

    const source = safeSourcePath(cleanText(formData.get("sourcePath")));
    const result = await subscribe(email, source, ipHash);
    if (result.outcome !== "already") {
      after(async () => {
        await sendWelcomeEmail(email, result.token);
        await logActivity("website", "subscriber.created", `New newsletter subscriber`, "/admin/subscribers");
      });
    }
    // Same answer either way, so the form can't be used to discover who is subscribed.
    return { status: "success", message: "subscribed" };
  } catch (error) {
    logServerError("[newsletter] subscribe failed", error);
    return FAILED;
  }
}

async function sendWelcomeEmail(to: string, token: string): Promise<void> {
  const config = getEmailConfig();
  if (!config.ok) return;
  const unsubscribeUrl = `${siteConfig.url}/newsletter/unsubscribe?token=${token}`;
  try {
    await sendEmail(config, {
      to,
      subject: `You're subscribed to the ${siteConfig.name} brief`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111;line-height:1.6">
<p>Thanks for subscribing to the ${escapeHtml(siteConfig.name)} weekly brief — new AI tools, practical automation workflows and guides, once a week.</p>
<p>Didn't sign up, or changed your mind? <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe here</a>.</p>
</div>`,
      text: `Thanks for subscribing to the ${siteConfig.name} weekly brief.\n\nUnsubscribe: ${unsubscribeUrl}`,
      idempotencyKey: `welcome-${token}`,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });
  } catch (error) {
    logServerError("[newsletter] welcome email failed", error);
  }
}

/* ------------------------------------------------------------------ */
/* Tool submissions                                                    */
/* ------------------------------------------------------------------ */

export async function submitToolSuggestion(_previous: PublicFormState, formData: FormData): Promise<PublicFormState> {
  if (looksAutomated(formData)) return { status: "success", reference: "received" };

  const toolName = cleanText(formData.get("toolName"));
  const rawWebsite = cleanText(formData.get("website"));
  const category = cleanText(formData.get("category"));
  const pricing = cleanText(formData.get("pricing"));
  const description = cleanText(formData.get("description"), { multiline: true });
  const email = normalizeEmail(cleanText(formData.get("email")));
  const relationship = cleanText(formData.get("relationship"));

  const fieldErrors: Record<string, string> = {};
  if (toolName.length < 2 || toolName.length > FORM_LIMITS.toolName) fieldErrors.toolName = "Please enter the tool's name.";
  const website = normalizeWebsite(rawWebsite);
  if (!website || website.length > FORM_LIMITS.website) fieldErrors.website = "Enter the tool's website, e.g. https://example.com";
  if (!toolCategories.some((c) => c.slug === category)) fieldErrors.category = "Please choose a category.";
  if (!isOneOf(SUBMISSION_PRICING, pricing)) fieldErrors.pricing = "Please choose a pricing model.";
  if (description.length < FORM_LIMITS.submissionDescriptionMin) fieldErrors.description = `Please write at least ${FORM_LIMITS.submissionDescriptionMin} characters.`;
  else if (description.length > FORM_LIMITS.submissionDescription) fieldErrors.description = `Please keep this under ${FORM_LIMITS.submissionDescription} characters.`;
  if (!email) fieldErrors.email = "Please enter a valid email address.";
  if (relationship && !isOneOf(SUBMISSION_RELATIONSHIPS, relationship)) fieldErrors.relationship = "Please choose an option.";
  if (Object.keys(fieldErrors).length > 0 || !website || !email || !isOneOf(SUBMISSION_PRICING, pricing)) return { status: "error", message: "Please check the highlighted fields.", fieldErrors };

  if (!isDatabaseConfigured()) return UNAVAILABLE;
  try {
    const { ipHash, userAgent } = await visitor();
    const limit = await consumeRateLimit(`submission:ip:${ipHash}`, 5, 3600);
    if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

    const { id, reference } = await createSubmission({ toolName, website, category, pricing, description, email, relationship: relationship || null, ipHash, userAgent });
    after(async () => {
      await notifyTeamOnce(COLLECTIONS.toolSubmissions, id, {
        subject: `Tool submission ${reference}: ${toolName}`,
        heading: `New tool suggested: ${toolName}`,
        rows: [
          ["Reference", reference],
          ["Tool", toolName],
          ["Website", website],
          ["Category", toolCategories.find((c) => c.slug === category)?.name ?? category],
          ["Pricing", pricing],
          ["Submitted by", email],
        ],
        body: description,
        replyTo: email,
        adminPath: "/admin/submissions",
      });
      await logActivity("website", "submission.created", `New tool suggested: ${toolName}`, "/admin/submissions");
    });
    return { status: "success", reference };
  } catch (error) {
    logServerError("[submission] failed to store", error);
    return FAILED;
  }
}
