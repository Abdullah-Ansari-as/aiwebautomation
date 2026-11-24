"use client";

import { saveClientAction } from "@/lib/actions/billing";
import { BILLING_LIMITS, CLIENT_STATUSES, PLAN_SUGGESTIONS } from "@/lib/billing-options";
import { CURRENCIES } from "@/lib/money";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SubmitButton, useAdminAction } from "./controls";

export interface ClientFormValues {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  address: string;
  plan: string;
  currency: string;
  monthlyFee: string;
  setupFee: string;
  billingDay: string;
  status: string;
  startDate: string;
  paymentLink: string;
  notes: string;
}

function F({ label, name, error, hint, children, wide }: { label: string; name: string; error?: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={`client-${name}`} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function ClientForm({ clientId, values, leadId, readOnly = false }: { clientId: string | null; values: ClientFormValues; leadId?: string; readOnly?: boolean }) {
  const { state, onSubmit, pending, errors } = useAdminAction(saveClientAction.bind(null, clientId));
  const input = (name: keyof ClientFormValues, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`client-${name}`} name={name} defaultValue={values[name]} aria-invalid={Boolean(errors[name])} disabled={readOnly} className={cn(fieldClass, "h-11", errors[name] && "border-danger")} {...props} />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      <fieldset className="grid gap-5 sm:grid-cols-2" disabled={readOnly}>
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Client</legend>
        <F label="Company / client name" name="name" error={errors.name}>
          {input("name", { required: true, maxLength: BILLING_LIMITS.clientName, autoComplete: "organization" })}
        </F>
        <F label="Contact person" name="contactName" error={errors.contactName}>
          {input("contactName", { required: true, maxLength: BILLING_LIMITS.contactName })}
        </F>
        <F label="Billing email" name="email" error={errors.email} hint="Invoices are sent here.">
          {input("email", { type: "email", required: true, maxLength: 254 })}
        </F>
        <F label="Phone / WhatsApp" name="phone" error={errors.phone}>
          {input("phone", { type: "tel", maxLength: 32, placeholder: "+1 555 123 4567" })}
        </F>
        <F label="Country" name="country" error={errors.country}>
          {input("country", { maxLength: 60, placeholder: "United States" })}
        </F>
        <F label="Website" name="website" error={errors.website}>
          {input("website", { maxLength: 300, placeholder: "https://" })}
        </F>
        <F label="Billing address" name="address" error={errors.address} hint="Optional — printed on invoices." wide>
          <textarea id="client-address" name="address" rows={2} defaultValue={values.address} maxLength={BILLING_LIMITS.address} className={cn(fieldClass, "py-3")} />
        </F>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2" disabled={readOnly}>
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Plan & billing</legend>
        <F label="Plan / service" name="plan" error={errors.plan}>
          {input("plan", { required: true, maxLength: BILLING_LIMITS.plan, list: "plan-suggestions" })}
          <datalist id="plan-suggestions">
            {PLAN_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </F>
        <F label="Currency" name="currency" error={errors.currency}>
          <select id="client-currency" name="currency" defaultValue={values.currency} className={cn(fieldClass, "h-11")}>
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </F>
        <F label="Monthly fee" name="monthlyFee" error={errors.monthlyFee} hint="Recurring amount billed every month. Use 0 for one-off projects.">
          {input("monthlyFee", { inputMode: "decimal", placeholder: "299.00" })}
        </F>
        <F label="One-time setup fee" name="setupFee" error={errors.setupFee} hint="Added to the client's first monthly invoice.">
          {input("setupFee", { inputMode: "decimal", placeholder: "0.00" })}
        </F>
        <F label="Billing day of month" name="billingDay" error={errors.billingDay} hint="Monthly invoices are dated on this day (1–28).">
          {input("billingDay", { type: "number", min: 1, max: 28 })}
        </F>
        <F label="Start date" name="startDate" error={errors.startDate}>
          {input("startDate", { type: "date", required: true })}
        </F>
        <F label="Status" name="status" error={errors.status}>
          <select id="client-status" name="status" defaultValue={values.status} className={cn(fieldClass, "h-11")}>
            {CLIENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </F>
        <F label="Payment link for this client" name="paymentLink" error={errors.paymentLink} hint="Optional — e.g. a Payoneer request link. Overrides the default from Settings.">
          {input("paymentLink", { maxLength: 500, placeholder: "https://" })}
        </F>
        <F label="Internal notes" name="notes" error={errors.notes} wide>
          <textarea id="client-notes" name="notes" rows={4} defaultValue={values.notes} maxLength={BILLING_LIMITS.notes} className={cn(fieldClass, "py-3")} placeholder="Scope, access details location, renewal reminders…" />
        </F>
      </fieldset>

      {!readOnly && (
        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <ActionFeedback state={state} />
          <SubmitButton pending={pending}>{clientId ? "Save changes" : "Create client"}</SubmitButton>
        </div>
      )}
    </form>
  );
}
