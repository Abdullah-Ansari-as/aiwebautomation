import "server-only";
import { BUDGET_OPTIONS, CONTACT_METHOD_OPTIONS, categoryLabel, optionLabel } from "@/lib/inquiry-options";
import { getAppUrl } from "./app-url";
import { escapeHtml, getEmailConfig, sendEmail } from "./email";
import { claimLeadNotification, setLeadNotificationStatus, type NewLead } from "./leads";
import { logServerError } from "./log";

/**
 * Emails the team about a new lead. Runs after the visitor's response has
 * been sent; the lead is already saved, so an email failure only marks the
 * lead's notification as "failed" — nothing is lost. The atomic claim
 * guarantees at most one email per lead, even if this is called twice.
 */
export async function notifyNewLead(id: string, reference: string, lead: NewLead): Promise<void> {
  // Runs in `after()`, outside the request: never throw, always log.
  try {
    await sendLeadNotification(id, reference, lead);
  } catch (error) {
    logServerError(`[inquiry] Notification for ${reference} could not be processed`, error);
  }
}

async function sendLeadNotification(id: string, reference: string, lead: NewLead): Promise<void> {
  if (!(await claimLeadNotification(id))) return;

  const config = getEmailConfig();
  if (!config.ok) {
    if (config.reason !== "missing") console.warn(`[inquiry] Email notification skipped: ${config.reason}`);
    await setLeadNotificationStatus(id, "not_configured");
    return;
  }

  const kindLabel = lead.kind === "sponsor" ? "Sponsor inquiry" : "Service inquiry";
  const adminUrl = `${getAppUrl()}/admin/leads/${id}`;
  const rows: [string, string][] = [
    ["Reference", reference],
    ["Name", lead.fullName],
    ["Email", lead.email],
    ["Company", lead.company],
    ["Website", lead.website ?? "—"],
    [lead.kind === "sponsor" ? "Sponsorship" : "Service", categoryLabel(lead.category)],
    ["Budget", optionLabel(BUDGET_OPTIONS, lead.budget)],
    ["Preferred contact", optionLabel(CONTACT_METHOD_OPTIONS, lead.contactMethod)],
    ["Phone", lead.phone ?? "—"],
    ["Sent from", lead.sourcePath ?? "—"],
  ];

  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111">
<h2 style="margin:0 0 12px">${escapeHtml(kindLabel)} from ${escapeHtml(lead.fullName)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#666;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table>
<h3 style="margin:16px 0 6px">Project details</h3>
<p style="white-space:pre-wrap;margin:0">${escapeHtml(lead.description)}</p>
<p style="margin-top:20px"><a href="${escapeHtml(adminUrl)}">Open in admin</a> · Reply to this email to answer ${escapeHtml(lead.fullName)} directly.</p>
</div>`;
  const text = `${kindLabel} from ${lead.fullName}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nProject details:\n${lead.description}\n\nOpen in admin: ${adminUrl}`;

  try {
    await sendEmail(config, {
      to: config.to,
      subject: `${kindLabel} ${reference}: ${categoryLabel(lead.category)} — ${lead.company}`,
      html,
      text,
      replyTo: lead.email,
      idempotencyKey: `lead-${id}`,
    });
    await setLeadNotificationStatus(id, "sent");
  } catch (error) {
    logServerError(`[inquiry] Notification email for ${reference} failed`, error);
    await setLeadNotificationStatus(id, "failed").catch(() => {});
  }
}
