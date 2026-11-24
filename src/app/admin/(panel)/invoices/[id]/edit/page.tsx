import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { NoDatabaseNotice } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { requireAdmin } from "@/lib/auth/session";
import { moneyToInput } from "@/lib/money";
import { getInvoice } from "@/lib/server/invoices";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({ params }: PageProps<"/admin/invoices/[id]/edit">) {
  await requireAdmin("admin");
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/admin/invoices/${invoice.id}`);

  return (
    <>
      <Link href={`/admin/invoices/${invoice.id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to invoice
      </Link>
      <AdminPageHeader title={`Edit ${invoice.number}`} description={invoice.client.name} />
      <Card>
        <div className="p-5 sm:p-6">
          <InvoiceForm
            invoiceId={invoice.id}
            clients={[{ id: invoice.clientId, name: invoice.client.name, currency: invoice.currency, plan: "", monthlyFee: 0 }]}
            values={{
              clientId: invoice.clientId,
              currency: invoice.currency,
              issueDate: toDateInput(invoice.issueDate),
              dueDate: toDateInput(invoice.dueDate),
              period: invoice.period ?? "",
              notes: invoice.notes ?? "",
              paymentLink: invoice.paymentLink ?? "",
              items: invoice.items.map((i) => ({ description: i.description, quantity: String(i.quantity), unitAmount: moneyToInput(i.unitAmount) })),
            }}
          />
        </div>
      </Card>
    </>
  );
}
