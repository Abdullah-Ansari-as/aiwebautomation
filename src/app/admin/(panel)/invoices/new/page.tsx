import { ArrowLeft, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { EmptyBlock, NoDatabaseNotice, linkButton } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { requireAdmin } from "@/lib/auth/session";
import { addDays } from "@/lib/server/invoices";
import { listClients } from "@/lib/server/clients";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";
import { toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: PageProps<"/admin/invoices/new">) {
  await requireAdmin("admin");
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const params = await searchParams;
  const [clients, settings] = await Promise.all([listClients(), getBusinessSettings()]);
  const selected = clients.find((c) => c.id === params.client);
  const today = new Date();

  return (
    <>
      <Link href={selected ? `/admin/clients/${selected.id}` : "/admin/invoices"} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </Link>
      <AdminPageHeader title="New invoice" description="Saved as a draft first. You can review it, then email it or copy the link for the client." />
      {clients.length === 0 ? (
        <EmptyBlock
          title="Add a client first"
          action={
            <Link href="/admin/clients/new" className={linkButton}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New client
            </Link>
          }
        >
          Invoices are always linked to a client.
        </EmptyBlock>
      ) : (
        <Card>
          <div className="p-5 sm:p-6">
            <InvoiceForm
              invoiceId={null}
              clients={clients.filter((c) => c.status !== "cancelled" || c.id === selected?.id).map((c) => ({ id: c.id, name: c.name, currency: c.currency, plan: c.plan, monthlyFee: c.monthlyFee }))}
              values={{
                clientId: selected?.id ?? "",
                currency: selected?.currency ?? settings.defaultCurrency,
                issueDate: toDateInput(today),
                dueDate: toDateInput(addDays(today, settings.dueDays)),
                period: "",
                notes: "",
                paymentLink: "",
                items: [],
              }}
            />
          </div>
        </Card>
      )}
    </>
  );
}
