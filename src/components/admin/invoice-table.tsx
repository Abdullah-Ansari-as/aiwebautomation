import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { periodLabel } from "@/lib/billing-options";
import { formatMoney } from "@/lib/money";
import type { InvoiceItem } from "@/lib/server/invoices";
import { formatDay } from "@/lib/utils";
import { InvoiceStatusBadge } from "./admin-kit";

export function InvoiceTable({ invoices, showClient = true }: { invoices: InvoiceItem[]; showClient?: boolean }) {
  return (
    <ul className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="border-b border-border last:border-b-0">
          <Link href={`/admin/invoices/${invoice.id}`} className="group grid gap-2 px-5 py-4 transition-colors hover:bg-surface-muted/60 md:grid-cols-[9rem_minmax(0,1.3fr)_8rem_8rem_6rem_1rem] md:items-center">
            <p className="font-mono text-sm font-medium text-foreground group-hover:text-primary">{invoice.number}</p>
            <div className="min-w-0 text-sm">
              {showClient && <p className="truncate font-medium text-foreground">{invoice.client.name}</p>}
              <p className="truncate text-muted-foreground">{invoice.period ? `Retainer · ${periodLabel(invoice.period)}` : invoice.items[0]?.description}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="md:hidden">Due </span>
              {formatDay(invoice.dueDate)}
            </p>
            <p className="text-sm font-semibold tabular-nums text-foreground">{formatMoney(invoice.total, invoice.currency)}</p>
            <div>
              <InvoiceStatusBadge status={invoice.displayStatus} />
            </div>
            <ChevronRight className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
