import { ArrowLeft, Mail, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { ClientStatusBadge, EmptyBlock, NoDatabaseNotice, Row, StatTile, linkButton } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { ClientForm } from "@/components/admin/client-form";
import { ActionButton } from "@/components/admin/controls";
import { InvoiceTable } from "@/components/admin/invoice-table";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import { deleteClientAction, setClientStatusAction } from "@/lib/actions/billing";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { CLIENT_STATUSES } from "@/lib/billing-options";
import { formatMoney, formatTotals, moneyToInput } from "@/lib/money";
import { getClient } from "@/lib/server/clients";
import { getClientBillingSummary, listInvoices } from "@/lib/server/invoices";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { formatDay, toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Client" };

export default async function ClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [invoices, billing] = await Promise.all([listInvoices({ clientId: client.id }), getClientBillingSummary(client.id)]);
  const canWrite = hasRole(session.role, "admin");

  return (
    <>
      <Link href="/admin/clients" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All clients
      </Link>
      <AdminPageHeader
        title={client.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {client.plan} <ClientStatusBadge status={client.status} />
          </span>
        }
        action={
          canWrite && (
            <Link href={`/admin/invoices/new?client=${client.id}`} className={linkButton}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New invoice
            </Link>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Monthly fee" value={client.monthlyFee > 0 ? formatMoney(client.monthlyFee, client.currency) : "—"} hint={client.monthlyFee > 0 ? `Billed on day ${client.billingDay} of each month` : "One-off client"} />
        <StatTile label="Total paid" value={formatTotals(billing.paid, client.currency)} hint={`${billing.paid.reduce((s, p) => s + p.count, 0)} paid invoice(s)`} tone="success" />
        <StatTile label="Outstanding" value={formatTotals(billing.outstanding, client.currency)} hint={`${billing.outstanding.reduce((s, p) => s + p.count, 0)} unpaid invoice(s)`} tone={billing.outstanding.length > 0 ? "danger" : "default"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="client-invoices">
            <h2 id="client-invoices" className="mb-3 font-semibold text-foreground">
              Invoices
            </h2>
            {invoices.length === 0 ? (
              <EmptyBlock title="No invoices yet">
                {client.monthlyFee > 0 ? "Use “Generate monthly invoices” on the Invoices page, or create one manually." : "Create an invoice for this client's project."}
              </EmptyBlock>
            ) : (
              <InvoiceTable invoices={invoices} showClient={false} />
            )}
          </section>

          <Card title={canWrite ? "Edit client" : "Client details"}>
            <div className="p-5 sm:p-6">
              <ClientForm
                clientId={client.id}
                readOnly={!canWrite}
                values={{
                  name: client.name,
                  contactName: client.contactName,
                  email: client.email,
                  phone: client.phone ?? "",
                  country: client.country ?? "",
                  website: client.website ?? "",
                  address: client.address ?? "",
                  plan: client.plan,
                  currency: client.currency,
                  monthlyFee: moneyToInput(client.monthlyFee),
                  setupFee: moneyToInput(client.setupFee),
                  billingDay: String(client.billingDay),
                  status: client.status,
                  startDate: toDateInput(client.startDate),
                  paymentLink: client.paymentLink ?? "",
                  notes: client.notes ?? "",
                }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-4 p-5">
              <Row label="Contact person">{client.contactName}</Row>
              <Row label="Email">
                <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {client.email}
                </a>
              </Row>
              <Row label="Phone">{client.phone ?? "—"}</Row>
              <Row label="Country">{client.country ?? "—"}</Row>
              <Row label="Client since">{formatDay(client.startDate)}</Row>
              {client.leadId && (
                <Row label="Original lead">
                  <Link href={`/admin/leads/${client.leadId}`} className="text-primary hover:underline">
                    View lead
                  </Link>
                </Row>
              )}
            </dl>
          </Card>
          {canWrite && (
            <Card title="Status">
              <div className="space-y-5 p-5">
                <StatusSelectForm action={setClientStatusAction.bind(null, client.id)} options={CLIENT_STATUSES} current={client.status} label="Client status" />
                <p className="text-xs text-muted-foreground">Only active clients get monthly invoices and count towards MRR.</p>
                {invoices.length === 0 && (
                  <ActionButton action={deleteClientAction.bind(null, client.id)} variant="danger" confirm={`Delete ${client.name}? This can't be undone.`}>
                    Delete client
                  </ActionButton>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
