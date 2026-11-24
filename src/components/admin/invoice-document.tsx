import { periodLabel } from "@/lib/billing-options";
import { formatMoney } from "@/lib/money";
import type { InvoiceItem } from "@/lib/server/invoices";
import type { BusinessSettings } from "@/lib/server/settings";
import { formatDay } from "@/lib/utils";

/** The invoice itself — used in the admin preview and on the client-facing page (and when printing). */
export function InvoiceDocument({ invoice, business }: { invoice: InvoiceItem; business: BusinessSettings }) {
  const status = invoice.displayStatus;
  return (
    <article className="invoice-sheet rounded-[var(--radius-card)] border border-border bg-surface p-6 text-foreground shadow-soft sm:p-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xl font-semibold tracking-tight">{business.businessName}</p>
          {business.address && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{business.address}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{business.email}</p>
          {business.website && <p className="text-sm text-muted-foreground">{business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-3xl font-semibold uppercase tracking-tight text-primary">Invoice</p>
          <p className="mt-1 font-mono text-sm">{invoice.number}</p>
          <p
            className={
              status === "paid"
                ? "mt-3 inline-block rounded-full bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success"
                : status === "overdue"
                  ? "mt-3 inline-block rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-danger"
                  : status === "void"
                    ? "mt-3 inline-block rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    : "mt-3 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
            }
          >
            {status === "sent" ? "Due" : status}
          </p>
        </div>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill to</p>
          <p className="mt-2 font-medium">{invoice.client.name}</p>
          <p className="text-sm text-muted-foreground">{invoice.client.contactName}</p>
          <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
          {invoice.client.address && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{invoice.client.address}</p>}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
          <dt className="text-muted-foreground">Invoice date</dt>
          <dd className="font-medium">{formatDay(invoice.issueDate)}</dd>
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="font-medium">{formatDay(invoice.dueDate)}</dd>
          {invoice.period && (
            <>
              <dt className="text-muted-foreground">Period</dt>
              <dd className="font-medium">{periodLabel(invoice.period)}</dd>
            </>
          )}
          {invoice.paidAt && (
            <>
              <dt className="text-muted-foreground">Paid on</dt>
              <dd className="font-medium text-success">{formatDay(invoice.paidAt)}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 font-semibold">Description</th>
              <th scope="col" className="py-2 text-right font-semibold">Qty</th>
              <th scope="col" className="py-2 text-right font-semibold">Unit price</th>
              <th scope="col" className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 pr-4">{item.description}</td>
                <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatMoney(item.unitAmount, invoice.currency)}</td>
                <td className="py-3 text-right font-medium tabular-nums">{formatMoney(Math.round(item.quantity * item.unitAmount), invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={3} className="pt-4 text-right font-semibold">
                Total ({invoice.currency})
              </td>
              <td className="pt-4 text-right text-lg font-semibold tabular-nums">{formatMoney(invoice.total, invoice.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.notes && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-2 whitespace-pre-line text-sm">{invoice.notes}</p>
        </div>
      )}

      {status !== "paid" && status !== "void" && business.paymentInstructions && (
        <div className="mt-8 rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How to pay</p>
          <p className="mt-2 whitespace-pre-line text-sm">{business.paymentInstructions}</p>
          <p className="mt-2 text-sm text-muted-foreground">Payment reference: {invoice.number}</p>
        </div>
      )}

      {business.invoiceFooter && <p className="mt-10 text-center text-sm text-muted-foreground">{business.invoiceFooter}</p>}
    </article>
  );
}
