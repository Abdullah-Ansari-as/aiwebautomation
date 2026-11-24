import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/admin/invoice-document";
import { PrintButton } from "@/components/shared/print-button";
import { formatMoney } from "@/lib/money";
import { getInvoiceByToken } from "@/lib/server/invoices";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
  // The URL contains the invoice's secret token: never send it to other sites.
  referrer: "no-referrer",
};

/** Client-facing invoice, reached through the unguessable link in the invoice email. */
export const instant = false;

export default async function PublicInvoicePage({ params }: PageProps<"/invoice/[token]">) {
  const { token } = await params;
  if (!isDatabaseConfigured()) notFound();
  const [invoice, business] = await Promise.all([getInvoiceByToken(token), getBusinessSettings()]);
  if (!invoice) notFound();
  const payable = invoice.status === "sent" && invoice.paymentLink;

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Invoice <span className="font-mono text-foreground">{invoice.number}</span> from {business.businessName}
          </p>
          <div className="flex flex-wrap gap-2">
            <PrintButton />
            {payable && (
              <a
                href={invoice.paymentLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover dark:text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" /> Pay {formatMoney(invoice.total, invoice.currency)} now
              </a>
            )}
          </div>
        </div>
        {invoice.status === "paid" && <p className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground print:hidden">This invoice has been paid — thank you!</p>}
        {invoice.status === "void" && <p className="mb-6 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground print:hidden">This invoice has been cancelled and doesn&apos;t need to be paid.</p>}
        <InvoiceDocument invoice={invoice} business={business} />
        <p className="mt-6 text-center text-xs text-muted-foreground print:hidden">
          Questions about this invoice? Email <a href={`mailto:${business.email}?subject=${encodeURIComponent(`Invoice ${invoice.number}`)}`} className="text-primary hover:underline">{business.email}</a>.
        </p>
      </div>
    </main>
  );
}
