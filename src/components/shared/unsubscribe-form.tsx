"use client";

import { CircleCheck, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { unsubscribeAction } from "@/lib/actions/newsletter";
import type { PublicFormState } from "@/lib/actions/types";

export function UnsubscribeForm({ token, maskedEmail, alreadyUnsubscribed }: { token: string; maskedEmail: string; alreadyUnsubscribed: boolean }) {
  const [state, formAction, pending] = useActionState<PublicFormState, FormData>(unsubscribeAction, { status: "idle" });

  if (alreadyUnsubscribed || state.status === "success") {
    return (
      <div role="status">
        <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <CircleCheck className="h-5 w-5 text-success" aria-hidden="true" /> You&apos;re unsubscribed
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{maskedEmail} won&apos;t receive the newsletter any more. Sorry to see you go!</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <h2 className="text-lg font-semibold text-foreground">Unsubscribe {maskedEmail}?</h2>
      <p className="mt-2 text-sm text-muted-foreground">You&apos;ll stop receiving the weekly brief. You can subscribe again at any time.</p>
      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70 dark:text-primary-foreground"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Unsubscribe
      </button>
    </form>
  );
}
