import { ChevronRight, Download, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { linkButtonOutline } from "@/components/admin/admin-kit";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { DatabaseSetupNotice, LeadStatusBadge } from "@/components/admin/lead-ui";
import { Skeleton } from "@/components/shared/skeleton";
import { BUDGET_OPTIONS, LEAD_STATUSES, categoryLabel, isOneOf, optionLabel, type LeadStatus } from "@/lib/inquiry-options";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { countLeadsByStatus, listLeads } from "@/lib/server/leads";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Service quote requests and sponsor inquiries sent from the website."
        action={
          <a href="/admin/leads/export" className={linkButtonOutline} download>
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </a>
        }
      />
      <Suspense fallback={<LeadsFallback />}>
        <LeadsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function LeadsFallback() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading leads">
      <Skeleton className="h-11 w-full max-w-2xl" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

async function LeadsList({ searchParams }: { searchParams: PageProps<"/admin/leads">["searchParams"] }) {
  // Request-time only: env vars may be injected at runtime, and lead data must never be prerendered.
  await connection();
  if (!isDatabaseConfigured()) return <DatabaseSetupNotice />;

  const params = await searchParams;
  const requested = typeof params.status === "string" ? params.status : "";
  const status: LeadStatus | undefined = isOneOf(LEAD_STATUSES, requested) ? requested : undefined;
  const [leads, counts] = await Promise.all([listLeads(status), countLeadsByStatus()]);
  const tabs = [{ value: "", label: "All", count: counts.all }, ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] }))];

  return (
    <>
      <nav aria-label="Filter leads by status" className="mb-6 overflow-x-auto">
        <ul className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
          {tabs.map((tab) => {
            const active = (status ?? "") === tab.value;
            return (
              <li key={tab.value || "all"}>
                <Link
                  href={tab.value ? `/admin/leads?status=${tab.value}` : "/admin/leads"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary text-white dark:text-primary-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  {tab.label} <span className="opacity-75">({tab.count})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {leads.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border p-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium text-foreground">{status ? `No ${optionLabel(LEAD_STATUSES, status).toLowerCase()} leads` : "No inquiries yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">New requests from the Services and Advertise pages will appear here.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">
          {leads.map((lead) => (
            <li key={lead.id} className="border-b border-border last:border-b-0">
              <Link href={`/admin/leads/${lead.id}`} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_8rem_10rem_1rem] md:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-foreground group-hover:text-primary">{lead.fullName}</span>
                    <span className="text-sm text-muted-foreground">· {lead.company}</span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{lead.email}</p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="truncate text-foreground">{categoryLabel(lead.category)}</p>
                  <p className="text-muted-foreground">
                    {lead.kind === "sponsor" ? "Sponsor" : "Service"} · {optionLabel(BUDGET_OPTIONS, lead.budget)}
                  </p>
                </div>
                <div>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  <time dateTime={lead.createdAt}>{formatDateTime(lead.createdAt)}</time>
                </p>
                <ChevronRight className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
