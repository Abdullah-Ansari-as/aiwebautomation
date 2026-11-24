"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { saveInvoiceAction } from "@/lib/actions/billing";
import { BILLING_LIMITS, periodLabel } from "@/lib/billing-options";
import { CURRENCIES, formatMoney, moneyToInput, parseMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SubmitButton, buttonStyles, useAdminAction } from "./controls";

export interface InvoiceFormClient {
  id: string;
  name: string;
  currency: Currency;
  plan: string;
  monthlyFee: number;
}

export interface InvoiceFormValues {
  clientId: string;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  period: string;
  notes: string;
  paymentLink: string;
  items: { description: string; quantity: string; unitAmount: string }[];
}

let rowKey = 0;
const withKey = (item: InvoiceFormValues["items"][number]) => ({ ...item, key: ++rowKey });

export function InvoiceForm({ invoiceId, clients, values }: { invoiceId: string | null; clients: InvoiceFormClient[]; values: InvoiceFormValues }) {
  const { state, submitWith, pending, errors } = useAdminAction(saveInvoiceAction.bind(null, invoiceId));
  const [clientId, setClientId] = useState(values.clientId);
  const [currency, setCurrency] = useState<Currency>(values.currency);
  const [period, setPeriod] = useState(values.period);
  const [items, setItems] = useState(() => (values.items.length > 0 ? values.items : [{ description: "", quantity: "1", unitAmount: "" }]).map(withKey));

  const client = clients.find((c) => c.id === clientId);
  const total = useMemo(() => items.reduce((sum, i) => sum + Math.round((Number(i.quantity) || 0) * (parseMoney(i.unitAmount) ?? 0)), 0), [items]);

  const update = (key: number, field: "description" | "quantity" | "unitAmount", value: string) => setItems((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const addRetainerLine = () => {
    if (!client || client.monthlyFee <= 0) return;
    const label = period ? periodLabel(period) : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const line = withKey({ description: `${client.plan} — monthly retainer (${label})`, quantity: "1", unitAmount: moneyToInput(client.monthlyFee) });
    setItems((rows) => (rows.length === 1 && !rows[0].description && !rows[0].unitAmount ? [line] : [...rows, line]));
  };

  return (
    <form
      onSubmit={submitWith((formData) => {
        formData.set("items", JSON.stringify(items.map(({ description, quantity, unitAmount }) => ({ description, quantity, unitAmount }))));
      })}
      className="space-y-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="inv-client" className="mb-1.5 block text-sm font-medium text-foreground">
            Client
          </label>
          <select
            id="inv-client"
            name="clientId"
            value={clientId}
            disabled={Boolean(invoiceId)}
            onChange={(e) => {
              setClientId(e.target.value);
              const next = clients.find((c) => c.id === e.target.value);
              if (next) setCurrency(next.currency);
            }}
            className={cn(fieldClass, "h-11", errors.clientId && "border-danger")}
          >
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {invoiceId && <input type="hidden" name="clientId" value={clientId} />}
          {errors.clientId && <p className="mt-1.5 text-sm text-danger">{errors.clientId}</p>}
        </div>
        <div>
          <label htmlFor="inv-currency" className="mb-1.5 block text-sm font-medium text-foreground">
            Currency
          </label>
          <select id="inv-currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={cn(fieldClass, "h-11")}>
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-period" className="mb-1.5 block text-sm font-medium text-foreground">
            Retainer month <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="inv-period" name="period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className={cn(fieldClass, "h-11", errors.period && "border-danger")} />
          <p className="mt-1.5 text-xs text-muted-foreground">Set for monthly invoices — prevents billing the same month twice.</p>
        </div>
        <div>
          <label htmlFor="inv-issue" className="mb-1.5 block text-sm font-medium text-foreground">
            Invoice date
          </label>
          <input id="inv-issue" name="issueDate" type="date" defaultValue={values.issueDate} className={cn(fieldClass, "h-11", errors.issueDate && "border-danger")} />
        </div>
        <div>
          <label htmlFor="inv-due" className="mb-1.5 block text-sm font-medium text-foreground">
            Due date
          </label>
          <input id="inv-due" name="dueDate" type="date" defaultValue={values.dueDate} className={cn(fieldClass, "h-11", errors.dueDate && "border-danger")} />
          {errors.dueDate && <p className="mt-1.5 text-sm text-danger">{errors.dueDate}</p>}
        </div>
        <div>
          <label htmlFor="inv-link" className="mb-1.5 block text-sm font-medium text-foreground">
            Payment link <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="inv-link" name="paymentLink" defaultValue={values.paymentLink} placeholder="Uses the client's or default link" className={cn(fieldClass, "h-11", errors.paymentLink && "border-danger")} />
          {errors.paymentLink && <p className="mt-1.5 text-sm text-danger">{errors.paymentLink}</p>}
        </div>
      </div>

      <fieldset>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-semibold text-foreground">Line items</legend>
          {client && client.monthlyFee > 0 && (
            <button type="button" onClick={addRetainerLine} className={cn(buttonStyles.outline, "h-9 text-xs")}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add monthly retainer ({formatMoney(client.monthlyFee, client.currency)})
            </button>
          )}
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.key} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[minmax(0,1fr)_6rem_9rem_8rem_2.5rem] sm:items-center">
              <input aria-label={`Line ${index + 1} description`} value={item.description} maxLength={BILLING_LIMITS.itemDescription} onChange={(e) => update(item.key, "description", e.target.value)} placeholder="Description, e.g. AI chatbot setup" className={cn(fieldClass, "h-10")} />
              <input aria-label={`Line ${index + 1} quantity`} value={item.quantity} inputMode="decimal" onChange={(e) => update(item.key, "quantity", e.target.value)} placeholder="Qty" className={cn(fieldClass, "h-10")} />
              <input aria-label={`Line ${index + 1} unit price`} value={item.unitAmount} inputMode="decimal" onChange={(e) => update(item.key, "unitAmount", e.target.value)} placeholder="Unit price" className={cn(fieldClass, "h-10")} />
              <p className="text-right text-sm font-medium tabular-nums text-foreground">{formatMoney(Math.round((Number(item.quantity) || 0) * (parseMoney(item.unitAmount) ?? 0)), currency)}</p>
              <button
                type="button"
                onClick={() => setItems((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== item.key) : rows))}
                disabled={items.length === 1}
                aria-label={`Remove line ${index + 1}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        {errors.items && <p className="mt-2 text-sm text-danger">{errors.items}</p>}
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={() => setItems((rows) => (rows.length < BILLING_LIMITS.maxItems ? [...rows, withKey({ description: "", quantity: "1", unitAmount: "" })] : rows))} className={cn(buttonStyles.outline, "h-9 text-xs")}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add line
          </button>
          <p className="text-lg font-semibold tabular-nums text-foreground">Total {formatMoney(total, currency)}</p>
        </div>
      </fieldset>

      <div>
        <label htmlFor="inv-notes" className="mb-1.5 block text-sm font-medium text-foreground">
          Notes to client <span className="font-normal text-muted-foreground">(optional, shown on the invoice)</span>
        </label>
        <textarea id="inv-notes" name="notes" rows={3} defaultValue={values.notes} maxLength={BILLING_LIMITS.invoiceNotes} className={cn(fieldClass, "py-3")} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <ActionFeedback state={state} />
        <SubmitButton pending={pending}>{invoiceId ? "Save draft" : "Create draft invoice"}</SubmitButton>
      </div>
    </form>
  );
}
