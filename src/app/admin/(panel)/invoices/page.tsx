import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { EmptyBlock, LinkTabs, NoDatabaseNotice, StatTile, linkButton } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { GenerateInvoicesForm } from "@/components/admin/generate-invoices-form";
import { InvoiceTable } from "@/components/admin/invoice-table";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { currentPeriod, type InvoiceDisplayStatus } from "@/lib/billing-options";
import { formatTotals } from "@/lib/money";
import { getCollected, getReceivables, listInvoices } from "@/lib/server/invoices";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Invoices" };

const TABS: { value: InvoiceDisplayStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export default async function InvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const requested = typeof params.status === "string" ? params.status : "";
  const status = TABS.find((t) => t.value === requested && t.value !== "")?.value as InvoiceDisplayStatus | undefined;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [invoices, receivables, collected, settings] = await Promise.all([listInvoices({ status }), getReceivables(), getCollected(monthStart, nextMonth), getBusinessSettings()]);
  const canWrite = hasRole(session.role, "admin");

  return (
    <>
      <AdminPageHeader
        title="Invoices"
        description="Create, send and track invoices. Clients open a secure link to view, pay and download them."
        action={
          canWrite && (
            <Link href="/admin/invoices/new" className={linkButton}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New invoice
            </Link>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Collected this month" value={formatTotals(collected, settings.defaultCurrency)} tone="success" />
        <StatTile label="Unpaid (sent)" value={formatTotals(receivables.outstanding, settings.defaultCurrency)} hint={`${receivables.drafts} draft(s) not sent yet`} />
        <StatTile label="Overdue" value={formatTotals(receivables.overdue, settings.defaultCurrency)} tone={receivables.overdue.length > 0 ? "danger" : "default"} hint="Send a friendly reminder with the invoice link" />
      </div>

      {canWrite && (
        <Card title="Monthly retainers" className="mb-6">
          <div className="p-5">
            <GenerateInvoicesForm defaultPeriod={currentPeriod(now)} />
          </div>
        </Card>
      )}

      <LinkTabs label="Filter invoices" active={status ?? ""} tabs={TABS.map((t) => ({ value: t.value, label: t.label, href: t.value ? `/admin/invoices?status=${t.value}` : "/admin/invoices" }))} />

      {invoices.length === 0 ? (
        <EmptyBlock title={status ? "No invoices here" : "No invoices yet"}>Add a client first, then generate their monthly invoice or create one manually.</EmptyBlock>
      ) : (
        <InvoiceTable invoices={invoices} />
      )}
    </>
  );
}
