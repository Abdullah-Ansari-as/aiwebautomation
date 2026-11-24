"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/actions/types";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SubmitButton, useAdminAction } from "./controls";

/** A select + Save button bound to a Server Action that reads `status` from the form. */
export function StatusSelectForm({
  action,
  options,
  current,
  label,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  options: readonly { value: string; label: string }[];
  current: string;
  label: string;
}) {
  const { state, onSubmit, pending } = useAdminAction(action);
  const [value, setValue] = useState(current);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="status-select" className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <select id="status-select" name="status" value={value} onChange={(e) => setValue(e.target.value)} className={cn(fieldClass, "h-10 flex-1")}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <SubmitButton pending={pending} className={value === current ? "opacity-60" : undefined}>
          Save
        </SubmitButton>
      </div>
      <ActionFeedback state={state} />
    </form>
  );
}
