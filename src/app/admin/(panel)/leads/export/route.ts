import { requireAdmin } from "@/lib/auth/session";
import { BUDGET_OPTIONS, CONTACT_METHOD_OPTIONS, LEAD_STATUSES, categoryLabel, optionLabel } from "@/lib/inquiry-options";
import { csvResponse, toCsv } from "@/lib/server/csv";
import { getLead, listLeads } from "@/lib/server/leads";

/** CSV of all leads (up to 500 most recent) with full details. */
export async function GET(): Promise<Response> {
  await requireAdmin();
  const summaries = await listLeads();
  const leads = (await Promise.all(summaries.map((s) => getLead(s.id)))).filter((l) => l !== null);
  const csv = toCsv(
    ["reference", "received_at", "status", "type", "name", "email", "company", "website", "service", "budget", "preferred_contact", "phone", "description"],
    leads.map((l) => [
      l.reference,
      l.createdAt,
      optionLabel(LEAD_STATUSES, l.status),
      l.kind,
      l.fullName,
      l.email,
      l.company,
      l.website ?? "",
      categoryLabel(l.category),
      optionLabel(BUDGET_OPTIONS, l.budget),
      optionLabel(CONTACT_METHOD_OPTIONS, l.contactMethod),
      l.phone ?? "",
      l.description,
    ]),
  );
  return csvResponse(`leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
