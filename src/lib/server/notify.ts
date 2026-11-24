import "server-only";
import type { ObjectId } from "mongodb";
import { getAppUrl } from "./app-url";
import { escapeHtml, getEmailConfig, sendEmail } from "./email";
import { logServerError } from "./log";
import { getCollection, type CollectionName, type NotificationStatus } from "./mongodb";

/**
 * Emails the team about a new record (contact message, tool submission).
 * The record is already saved, so an email failure only marks its
 * `notificationStatus` as "failed". The atomic pending → sending claim
 * guarantees at most one email per record. Never throws (runs in `after()`).
 */
export async function notifyTeamOnce(
  collectionName: CollectionName,
  id: ObjectId,
  email: { subject: string; heading: string; rows: [string, string][]; body?: string; replyTo?: string; adminPath: string },
): Promise<void> {
  try {
    const collection = await getCollection<{ _id: ObjectId; notificationStatus: NotificationStatus }>(collectionName);
    const claimed = await collection.updateOne({ _id: id, notificationStatus: "pending" }, { $set: { notificationStatus: "sending" } });
    if (claimed.modifiedCount !== 1) return;

    const setStatus = (status: NotificationStatus) => collection.updateOne({ _id: id }, { $set: { notificationStatus: status } });
    const config = getEmailConfig();
    if (!config.ok) {
      if (config.reason !== "missing") console.warn(`[notify] Email skipped: ${config.reason}`);
      await setStatus("not_configured");
      return;
    }

    const adminUrl = `${getAppUrl()}${email.adminPath}`;
    const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111">
<h2 style="margin:0 0 12px">${escapeHtml(email.heading)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${email.rows
      .map(([k, v]) => `<tr><td style="color:#666;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
      .join("")}</table>
${email.body ? `<p style="white-space:pre-wrap;margin:16px 0 0">${escapeHtml(email.body)}</p>` : ""}
<p style="margin-top:20px"><a href="${escapeHtml(adminUrl)}">Open in admin</a></p>
</div>`;
    const text = `${email.heading}\n\n${email.rows.map(([k, v]) => `${k}: ${v}`).join("\n")}${email.body ? `\n\n${email.body}` : ""}\n\nOpen in admin: ${adminUrl}`;
    try {
      await sendEmail(config, { to: config.to, subject: email.subject, html, text, replyTo: email.replyTo, idempotencyKey: `${collectionName}-${id.toHexString()}` });
      await setStatus("sent");
    } catch (error) {
      logServerError(`[notify] ${collectionName} notification failed`, error);
      await setStatus("failed").catch(() => {});
    }
  } catch (error) {
    logServerError(`[notify] ${collectionName} notification could not be processed`, error);
  }
}
