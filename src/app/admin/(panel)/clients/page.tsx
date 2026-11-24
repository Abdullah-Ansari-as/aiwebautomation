import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ClientStatusBadge, EmptyBlock, LinkTabs, NoDatabaseNotice, StatTile, linkButton } from "@/components/admin/admin-kit";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { CLIENT_STATUSES } from "@/lib/billing-options";
import { isOneOf } from "@/lib/inquiry-options";
import { formatMoney, formatTotals } from "@/lib/money";
import { countClientsByStatus, getMrr, listClients } from "@/lib/server/clients";
import { getReceivables } from "@/lib/server/invoices";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";
import { formatDay } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const requested = typeof params.status === "string" ? params.status : "";
  const status = isOneOf(CLIENT_STATUSES, requested) ? requested : undefined;
  const [clients, counts, mrr, receivables, settings] = await Promise.all([listClients(status), countClientsByStatus(), getMrr(), getReceivables(), getBusinessSettings()]);
  const canWrite = hasRole(session.role, "admin");
  const all = counts.active + counts.paused + counts.cancelled;

  return (
    <>
      <AdminPageHeader
        title="Clients"
        description="Paying clients, their plans and monthly fees. Active clients' fees add up to your MRR."
        action={
          canWrite && (
            <Link href="/admin/clients/new" className={linkButton}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New client
            </Link>
          )
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Monthly recurring revenue" value={formatTotals(mrr, settings.defaultCurrency)} hint="Active clients only" />
        <StatTile label="Active clients" value={counts.active} hint={`${counts.paused} paused · ${counts.cancelled} cancelled`} />
        <StatTile label="Unpaid invoices" value={formatTotals(receivables.outstanding, settings.defaultCurrency)} href="/admin/invoices?status=sent" />
      </div>

      <LinkTabs
        label="Filter clients by status"
        active={status ?? ""}
        tabs={[{ value: "", label: "All", href: "/admin/clients", count: all }, ...CLIENT_STATUSES.map((s) => ({ value: s.value, label: s.label, href: `/admin/clients?status=${s.value}`, count: counts[s.value] }))]}
      />

      {clients.length === 0 ? (
        <EmptyBlock
          title={status ? `No ${status} clients` : "No clients yet"}
          action={
            canWrite && (
              <Link href="/admin/clients/new" className={linkButton}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add your first client
              </Link>
            )
          }
        >
          Add a client when a deal is won — or open a lead and click “Convert to client”.
        </EmptyBlock>
      ) : (
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">
          {clients.map((client) => (
            <li key={client.id} className="border-b border-border last:border-b-0">
              <Link href={`/admin/clients/${client.id}`} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_7rem_1rem] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground group-hover:text-primary">{client.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {client.contactName} · {client.email}
                  </p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="truncate text-foreground">{client.plan}</p>
                  <p className="text-muted-foreground">Since {formatDay(client.startDate)}</p>
                </div>
                <p className="text-sm font-medium tabular-nums text-foreground">{client.monthlyFee > 0 ? `${formatMoney(client.monthlyFee, client.currency)}/mo` : "One-off"}</p>
                <div>
                  <ClientStatusBadge status={client.status} />
                </div>
                <ChevronRight className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
