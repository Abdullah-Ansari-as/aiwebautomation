import { requireAdmin } from "@/lib/auth/session";
import { csvResponse, toCsv } from "@/lib/server/csv";
import { listSubscribers } from "@/lib/server/subscribers";

/** CSV of active subscribers, e.g. to import into an email tool. */
export async function GET(): Promise<Response> {
  await requireAdmin();
  const subscribers = await listSubscribers("subscribed");
  const csv = toCsv(["email", "subscribed_at", "source"], subscribers.map((s) => [s.email, s.createdAt, s.source ?? ""]));
  return csvResponse(`subscribers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
