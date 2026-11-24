import "server-only";
import { COLLECTIONS } from "../../../db/schema.mjs";
import { requireAdmin } from "@/lib/auth/session";
import { logServerError } from "./log";
import { getCollection, isDatabaseConfigured } from "./mongodb";

/** Small counts for the sidebar badges. Never throws: badges just disappear if the DB is down. */
export async function getNavBadges(): Promise<Record<string, number>> {
  await requireAdmin();
  if (!isDatabaseConfigured()) return {};
  try {
    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
    const [leads, messages, submissions, overdue] = await Promise.all([
      (await getCollection(COLLECTIONS.leads)).countDocuments({ status: "new" }),
      (await getCollection(COLLECTIONS.messages)).countDocuments({ status: "new" }),
      (await getCollection(COLLECTIONS.toolSubmissions)).countDocuments({ status: "pending" }),
      (await getCollection(COLLECTIONS.invoices)).countDocuments({ status: "sent", dueDate: { $lt: today } }),
    ]);
    return { "/admin/leads": leads, "/admin/messages": messages, "/admin/submissions": submissions, "/admin/invoices": overdue };
  } catch (error) {
    logServerError("[dashboard] nav badges unavailable", error);
    return {};
  }
}

export async function countNewLeadsSince(since: Date): Promise<number> {
  await requireAdmin();
  return (await getCollection(COLLECTIONS.leads)).countDocuments({ createdAt: { $gte: since } });
}
