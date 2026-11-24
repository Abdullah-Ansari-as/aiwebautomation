"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { saveSettingsAction } from "@/lib/actions/billing";
import { CURRENCIES } from "@/lib/money";
import { applyTheme, readThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SubmitButton, useAdminAction } from "./controls";

export interface SettingsFormValues {
  businessName: string;
  email: string;
  address: string;
  website: string;
  paymentInstructions: string;
  defaultPaymentLink: string;
  bookingUrl: string;
  invoicePrefix: string;
  dueDays: number;
  defaultCurrency: string;
  invoiceFooter: string;
}

function F({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SettingsForm({ values, readOnly }: { values: SettingsFormValues; readOnly: boolean }) {
  const { state, onSubmit, pending, errors } = useAdminAction(saveSettingsAction);
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <fieldset disabled={readOnly} className="grid gap-5 sm:grid-cols-2">
        <F id="s-name" label="Business name" error={errors.businessName} hint="Shown on invoices.">
          <input id="s-name" name="businessName" defaultValue={values.businessName} maxLength={120} className={cn(fieldClass, "h-11")} />
        </F>
        <F id="s-email" label="Billing email" error={errors.email} hint="Clients reply to this address.">
          <input id="s-email" name="email" type="email" defaultValue={values.email} className={cn(fieldClass, "h-11")} />
        </F>
        <F id="s-address" label="Business address" error={errors.address} hint="Printed on invoices (city and country is enough for freelancers).">
          <textarea id="s-address" name="address" rows={3} defaultValue={values.address} maxLength={500} className={cn(fieldClass, "py-3")} />
        </F>
        <F id="s-website" label="Website" error={errors.website}>
          <input id="s-website" name="website" defaultValue={values.website} className={cn(fieldClass, "h-11")} />
        </F>
        <div className="sm:col-span-2">
          <F id="s-instructions" label="Payment instructions" error={errors.paymentInstructions} hint="Shown on every unpaid invoice — e.g. Payoneer, Wise or bank details for US/UK/AU clients.">
            <textarea id="s-instructions" name="paymentInstructions" rows={4} defaultValue={values.paymentInstructions} maxLength={1500} className={cn(fieldClass, "py-3")} />
          </F>
        </div>
        <F id="s-paylink" label="Default “Pay now” link" error={errors.defaultPaymentLink} hint="e.g. a Payoneer or Wise payment request link. Each client can have their own.">
          <input id="s-paylink" name="defaultPaymentLink" defaultValue={values.defaultPaymentLink} placeholder="https://" className={cn(fieldClass, "h-11")} />
        </F>
        <F id="s-booking" label="Booking link" error={errors.bookingUrl} hint="Calendly / Cal.com link for consultation calls.">
          <input id="s-booking" name="bookingUrl" defaultValue={values.bookingUrl} placeholder="https://cal.com/you/30min" className={cn(fieldClass, "h-11")} />
        </F>
        <F id="s-prefix" label="Invoice number prefix" error={errors.invoicePrefix} hint="Numbers look like INV-2026-0001.">
          <input id="s-prefix" name="invoicePrefix" defaultValue={values.invoicePrefix} maxLength={8} className={cn(fieldClass, "h-11 font-mono uppercase")} />
        </F>
        <F id="s-due" label="Payment terms (days)" error={errors.dueDays} hint="Due date = invoice date + this many days.">
          <input id="s-due" name="dueDays" type="number" min={0} max={90} defaultValue={values.dueDays} className={cn(fieldClass, "h-11")} />
        </F>
        <F id="s-currency" label="Main currency" error={errors.defaultCurrency} hint="Used for dashboard charts and new clients.">
          <select id="s-currency" name="defaultCurrency" defaultValue={values.defaultCurrency} className={cn(fieldClass, "h-11")}>
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </F>
        <F id="s-footer" label="Invoice footer" error={errors.invoiceFooter}>
          <input id="s-footer" name="invoiceFooter" defaultValue={values.invoiceFooter} maxLength={300} className={cn(fieldClass, "h-11")} />
        </F>
      </fieldset>
      {!readOnly && (
        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <ActionFeedback state={state} />
          <SubmitButton pending={pending}>Save settings</SubmitButton>
        </div>
      )}
    </form>
  );
}

function subscribeTheme(cb: () => void) {
  window.addEventListener("themechange", cb);
  return () => window.removeEventListener("themechange", cb);
}

const themes: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemePicker() {
  const theme = useSyncExternalStore(subscribeTheme, readThemePreference, () => "system" as ThemePreference);
  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={theme === t.id}
          onClick={() => applyTheme(t.id)}
          className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5", theme === t.id ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40")}
        >
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", theme === t.id ? "bg-primary text-white dark:text-primary-foreground" : "bg-surface-muted text-muted-foreground")}>
            <t.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-medium text-foreground">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
