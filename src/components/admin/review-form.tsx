"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { reviewSubmissionAction } from "@/lib/actions/inbox";
import { FORM_LIMITS, type SubmissionStatus } from "@/lib/form-options";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, buttonStyles, useAdminAction } from "./controls";

export function ReviewForm({ id, status, note }: { id: string; status: SubmissionStatus; note: string | null }) {
  const { state, onSubmit, pending } = useAdminAction(reviewSubmissionAction.bind(null, id));
  const [draft, setDraft] = useState(note ?? "");
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor={`note-${id}`} className="sr-only">
        Review note
      </label>
      <textarea id={`note-${id}`} name="note" rows={2} value={draft} maxLength={FORM_LIMITS.reviewNote} onChange={(e) => setDraft(e.target.value)} placeholder="Internal note (optional), e.g. why it was rejected" className={cn(fieldClass, "py-2.5")} />
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <>
            <button type="submit" name="status" value="approved" disabled={pending} className={buttonStyles.success}>
              <Check className="h-4 w-4" aria-hidden="true" /> Approve
            </button>
            <button type="submit" name="status" value="rejected" disabled={pending} className={buttonStyles.outline}>
              <X className="h-4 w-4" aria-hidden="true" /> Reject
            </button>
          </>
        ) : (
          <button type="submit" name="status" value="pending" disabled={pending} className={buttonStyles.outline}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Move back to pending
          </button>
        )}
      </div>
      <ActionFeedback state={state} />
    </form>
  );
}
