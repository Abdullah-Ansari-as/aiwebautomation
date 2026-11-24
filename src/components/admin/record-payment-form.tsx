"use client";

import { markInvoicePaidAction } from "@/lib/actions/billing";
import { BILLING_LIMITS, PAYMENT_METHODS } from "@/lib/billing-options";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SubmitButton, useAdminAction } from "./controls";

export function RecordPaymentForm({ invoiceId, today }: { invoiceId: string; today: string }) {
  const { state, onSubmit, pending, errors } = useAdminAction(markInvoicePaidAction.bind(null, invoiceId));
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="pay-method" className="mb-1.5 block text-sm font-medium text-foreground">
          Paid via
        </label>
        <select id="pay-method" name="method" defaultValue="Payoneer" className={cn(fieldClass, "h-10", errors.method && "border-danger")}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pay-date" className="mb-1.5 block text-sm font-medium text-foreground">
          Payment date
        </label>
        <input id="pay-date" name="paidAt" type="date" defaultValue={today} className={cn(fieldClass, "h-10")} />
      </div>
      <div>
        <label htmlFor="pay-ref" className="mb-1.5 block text-sm font-medium text-foreground">
          Transaction reference <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input id="pay-ref" name="reference" maxLength={BILLING_LIMITS.paymentReference} className={cn(fieldClass, "h-10")} />
      </div>
      <SubmitButton pending={pending} variant="success" className="w-full">
        Record payment
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
