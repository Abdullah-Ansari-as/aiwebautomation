import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge, NoDatabaseNotice, Row, linkButtonOutline } from "@/components/admin/admin-kit";
import { Card } from "@/components/admin/admin-ui";
import { ActionButton, CopyButton } from "@/components/admin/controls";
import { InvoiceDocument } from "@/components/admin/invoice-document";
import { RecordPaymentForm } from "@/components/admin/record-payment-form";
import { deleteInvoiceAction, markInvoiceSentAction, markInvoiceUnpaidAction, sendInvoiceEmailAction, voidInvoiceAction } from "@/lib/actions/billing";
import { hasRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/server/app-url";
import { isEmailConfigured } from "@/lib/server/email";
import { getInvoice } from "@/lib/server/invoices";
import { isDatabaseConfigured } from "@/lib/server/mongodb";
import { getBusinessSettings } from "@/lib/server/settings";
import { formatDateTime, toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: PageProps<"/admin/invoices/[id]">) {
  const session = await requireAdmin();
  if (!isDatabaseConfigured()) return <NoDatabaseNotice />;
  const { id } = await params;
  const [invoice, business] = await Promise.all([getInvoice(id), getBusinessSettings()]);
  if (!invoice) notFound();
  const canWrite = hasRole(session.role, "admin");
  const publicUrl = `${getAppUrl()}/invoice/${invoice.publicToken}`;
  const emailReady = isEmailConfigured();
  const open = invoice.status === "draft" || invoice.status === "sent";

  return (
    <>
      <Link href="/admin/invoices" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All invoices
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">{invoice.number}</h1>
        <InvoiceStatusBadge status={invoice.displayStatus} />
        <Link href={`/admin/clients/${invoice.clientId}`} className="text-sm text-primary hover:underline">
          {invoice.client.name}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <InvoiceDocument invoice={invoice} business={business} />
        </div>

        <div className="space-y-6">
          {canWrite && invoice.status === "draft" && (
            <Card title="Send this invoice">
              <div className="space-y-3 p-5">
                <Link href={`/admin/invoices/${invoice.id}/edit`} className={`${linkButtonOutline} w-full`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Edit draft
                </Link>
                {emailReady && (
                  <ActionButton action={sendInvoiceEmailAction.bind(null, invoice.id)} variant="primary" confirm={`Email ${invoice.number} to ${invoice.client.email}?`}>
                    Email to {invoice.client.email}
                  </ActionButton>
                )}
                <ActionButton action={markInvoiceSentAction.bind(null, invoice.id)}>Mark as sent (I&apos;ll share the link)</ActionButton>
                {!emailReady && <p className="text-xs text-muted-foreground">Email isn&apos;t configured, so mark it as sent and share the client link below (WhatsApp, email, Upwork…).</p>}
                <ActionButton action={deleteInvoiceAction.bind(null, invoice.id)} variant="danger" confirm="Delete this draft invoice?">
                  Delete draft
                </ActionButton>
              </div>
            </Card>
          )}

          {canWrite && invoice.status === "sent" && (
            <Card title="Record payment">
              <div className="p-5">
                <RecordPaymentForm invoiceId={invoice.id} today={toDateInput(new Date())} />
              </div>
            </Card>
          )}

          <Card title="Client link">
            <div className="space-y-3 p-5">
              {invoice.status === "draft" ? (
                <p className="text-sm text-muted-foreground">The client link works once the invoice is sent.</p>
              ) : (
                <>
                  <p className="break-all rounded-lg bg-surface-muted/60 p-2 font-mono text-xs text-foreground">{publicUrl}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <CopyButton value={publicUrl} />
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={linkButtonOutline}>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">The client can view, pay (via your payment link) and save the invoice as PDF from this page.</p>
                </>
              )}
            </div>
          </Card>

          {canWrite && invoice.status === "sent" && (
            <Card title="Follow up">
              <div className="space-y-3 p-5">
                {emailReady && (
                  <ActionButton action={sendInvoiceEmailAction.bind(null, invoice.id)} confirm={`Email ${invoice.number} again to ${invoice.client.email}?`}>
                    Email reminder to client
                  </ActionButton>
                )}
                <ActionButton action={voidInvoiceAction.bind(null, invoice.id)} variant="danger" confirm="Void this invoice? The client link will show it as void.">
                  Void invoice
                </ActionButton>
              </div>
            </Card>
          )}

          <Card title="Details">
            <dl className="space-y-4 p-5">
              <Row label="Created">{formatDateTime(invoice.createdAt)}</Row>
              <Row label="Sent">{invoice.sentAt ? formatDateTime(invoice.sentAt) : "—"}</Row>
              <Row label="Paid">{invoice.paidAt ? `${formatDateTime(invoice.paidAt)} · ${invoice.paymentMethod ?? ""}` : "—"}</Row>
              {invoice.paymentReference && <Row label="Payment reference">{invoice.paymentReference}</Row>}
              <Row label="Payment link">{invoice.paymentLink ? <span className="break-all">{invoice.paymentLink}</span> : "None — add one in Settings or on the client"}</Row>
            </dl>
            {canWrite && invoice.status === "paid" && (
              <div className="border-t border-border p-5">
                <ActionButton action={markInvoiceUnpaidAction.bind(null, invoice.id)} confirm="Undo the recorded payment?">
                  Mark as unpaid
                </ActionButton>
              </div>
            )}
            {canWrite && !open && invoice.status === "void" && <p className="border-t border-border p-5 text-xs text-muted-foreground">Void invoices are kept for your records.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
