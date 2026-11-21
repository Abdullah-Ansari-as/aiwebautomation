"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { addLeadNoteAction, updateLeadStatusAction, type LeadActionState } from "@/lib/actions/leads";
import { LEAD_STATUSES, LIMITS, type LeadStatus } from "@/lib/inquiry-options";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";

function Feedback({ state }: { state: LeadActionState }) {
  if (state.error) return <p role="alert" className="text-sm text-danger">{state.error}</p>;
  if (state.ok && state.message) return <p role="status" className="text-sm text-success">{state.message}</p>;
  return null;
}

const submitClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60 dark:text-primary-foreground";

export function LeadStatusForm({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [state, formAction, pending] = useActionState<LeadActionState, FormData>(updateLeadStatusAction.bind(null, leadId), {});
  const [value, setValue] = useState<LeadStatus>(status);

  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="lead-status" className="block text-sm font-medium text-foreground">
        Lead status
      </label>
      <div className="flex gap-2">
        <select id="lead-status" name="status" value={value} onChange={(e) => setValue(e.target.value as LeadStatus)} className={cn(fieldClass, "h-10 flex-1")}>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending || value === status} className={submitClass}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState<LeadActionState, FormData>(addLeadNoteAction.bind(null, leadId), {});
  const [note, setNote] = useState("");

  // Clear the draft only once the note is saved, so nothing is lost on errors.
  useEffect(() => {
    if (state.ok) setNote(""); // eslint-disable-line react-hooks/set-state-in-effect -- reset after a confirmed save
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="lead-note" className="sr-only">
        Internal note
      </label>
      <textarea
        id="lead-note"
        name="note"
        rows={4}
        maxLength={LIMITS.note}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an internal note — call summary, next step, quote sent…"
        className={cn(fieldClass, "py-3 leading-relaxed")}
      />
      <div className="flex items-center justify-between gap-3">
        <Feedback state={state} />
        <button type="submit" disabled={pending || !note.trim()} className={cn(submitClass, "ml-auto")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Add note
        </button>
      </div>
    </form>
  );
}
