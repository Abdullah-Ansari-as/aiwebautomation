"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { ActionState } from "@/lib/actions/types";
import { cn } from "@/lib/utils";

/** Inline success / error line for an action result. */
export function ActionFeedback({ state, className }: { state: ActionState; className?: string }) {
  if (state.error) {
    return (
      <p role="alert" className={cn("text-sm text-danger", className)}>
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className={cn("text-sm text-success", className)}>
        {state.message}
      </p>
    );
  }
  return null;
}

/** Shows a one-time secret (e.g. a generated password) with a copy button. */
export function SecretBox({ secret }: { secret: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
      <code className="flex-1 break-all font-mono text-sm text-foreground">{secret}</code>
      <CopyButton value={secret} label="Copy" />
    </div>
  );
}

export const buttonStyles = {
  primary: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60 dark:text-primary-foreground",
  outline: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60",
  danger: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60",
  success: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-success px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-[#04120c]",
} as const;

/**
 * A button that runs a bound Server Action (no form fields), with optional
 * confirmation, a pending state, inline feedback and redirect on success.
 */
export function ActionButton({
  action,
  children,
  variant = "outline",
  confirm,
  className,
  showFeedback = true,
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  confirm?: string;
  className?: string;
  showFeedback?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({});

  const run = () => {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      const result = await action();
      setState(result);
      if (result.ok && result.redirectTo) router.push(result.redirectTo);
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button type="button" onClick={run} disabled={pending} className={cn(buttonStyles[variant], "w-full")}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
      {showFeedback && <ActionFeedback state={state} />}
      {state.secret && <SecretBox secret={state.secret} />}
    </div>
  );
}

export function CopyButton({ value, label = "Copy link", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy this:", value);
        }
      }}
      className={cn(buttonStyles.outline, className)}
    >
      {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}

/**
 * `useActionState` wrapper for admin forms: navigates to `redirectTo` after a
 * successful save and exposes field errors.
 */
export function useAdminAction(action: (previous: ActionState, formData: FormData) => Promise<ActionState>) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);
  /**
   * Submit handler that calls the action WITHOUT React's automatic form reset
   * (which would wipe what the admin typed whenever validation fails).
   * `extend` can add computed fields (e.g. JSON line items) before sending.
   */
  const submitWith =
    (extend?: (formData: FormData) => void) =>
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const formData = new FormData(event.currentTarget, submitter);
      extend?.(formData);
      startTransition(() => formAction(formData));
    };
  return { state, onSubmit: submitWith(), submitWith, pending, errors: state.fieldErrors ?? {} };
}

export function SubmitButton({ pending, children, variant = "primary", className }: { pending: boolean; children: ReactNode; variant?: keyof typeof buttonStyles; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={cn(buttonStyles[variant], className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
