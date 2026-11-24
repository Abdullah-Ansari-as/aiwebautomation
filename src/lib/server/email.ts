import "server-only";
import { siteConfig } from "@/data/site";
import { normalizeEmail } from "@/lib/sanitize";

/**
 * Transactional email through Resend's REST API (https://resend.com/docs/api-reference/emails/send-email).
 * Called with plain `fetch`, so no SDK dependency. Server-only: the API key
 * is read from RESEND_API_KEY and never sent to the browser.
 */

export type EmailConfig =
  | { ok: true; apiKey: string; from: string; to: string }
  | { ok: false; reason: "missing" | string };

/**
 * Reads and validates the email settings. EMAIL_FROM may be a bare address
 * or `Name <address>`; LEADS_NOTIFY_EMAIL defaults to the site email.
 */
export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { ok: false, reason: "missing" };

  const fromAddress = from.match(/<([^<>]+)>\s*$/)?.[1] ?? from;
  if (!normalizeEmail(fromAddress) || /[\r\n]/.test(from)) return { ok: false, reason: "EMAIL_FROM is not a valid address (use you@domain or Name <you@domain>)" };

  const to = normalizeEmail(process.env.LEADS_NOTIFY_EMAIL?.trim() || siteConfig.email);
  if (!to) return { ok: false, reason: "LEADS_NOTIFY_EMAIL is not a valid email address" };

  return { ok: true, apiKey, from, to };
}

export function isEmailConfigured(): boolean {
  return getEmailConfig().ok;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Resend de-duplicates sends with the same key for 24 hours. */
  idempotencyKey?: string;
  /** Extra email headers, e.g. List-Unsubscribe. */
  headers?: Record<string, string>;
}

export async function sendEmail(config: Extract<EmailConfig, { ok: true }>, { to, subject, html, text, replyTo, idempotencyKey, headers }: SendEmailInput): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject: subject.replace(/[\r\n]+/g, " ").slice(0, 200),
      html,
      text,
      ...(replyTo && normalizeEmail(replyTo) && { reply_to: replyTo }),
      ...(headers && { headers }),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Resend error bodies contain a message, never the API key; keep it short.
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
  }
}

const htmlEscapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => htmlEscapes[c]);
}
