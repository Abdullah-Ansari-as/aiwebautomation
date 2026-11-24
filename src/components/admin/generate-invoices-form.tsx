"use client";

import { CalendarPlus } from "lucide-react";
import { generateMonthlyInvoicesAction } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SubmitButton, useAdminAction } from "./controls";

export function GenerateInvoicesForm({ defaultPeriod }: { defaultPeriod: string }) {
  const { state, onSubmit, pending } = useAdminAction(generateMonthlyInvoicesAction);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="gen-period" className="mb-1.5 block text-sm font-medium text-foreground">
            Month
          </label>
          <input id="gen-period" name="period" type="month" defaultValue={defaultPeriod} required className={cn(fieldClass, "h-10")} />
        </div>
        <SubmitButton pending={pending}>
          <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Generate monthly invoices
        </SubmitButton>
      </div>
      <p className="text-xs text-muted-foreground">Creates a draft for every active client with a monthly fee that doesn&apos;t have one for this month yet. Safe to click again.</p>
      <ActionFeedback state={state} />
    </form>
  );
}
