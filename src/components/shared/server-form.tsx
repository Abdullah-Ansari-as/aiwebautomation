"use client";

import { AnimatePresence, m } from "framer-motion";
import { CircleAlert, CircleCheck, Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { PublicFormState } from "@/lib/actions/types";
import { cn } from "@/lib/utils";

export interface FormFieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  half?: boolean;
  hint?: string;
}

type Values = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(fields: FormFieldConfig[], values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (!value) continue;
    if (field.type === "email" && !EMAIL.test(value)) errors[field.name] = "Enter a valid email address.";
    if (field.type === "url" && !/^(https?:\/\/)?[^\s/$.?#].[^\s]*\.[^\s]{2,}/i.test(value)) errors[field.name] = "Enter a valid URL, e.g. https://example.com";
    if (field.minLength && value.length < field.minLength) errors[field.name] = `Please write at least ${field.minLength} characters.`;
  }
  return errors;
}

/**
 * Accessible form that validates in the browser, then submits to a Server
 * Action (which validates again — the server is the source of truth).
 * Includes the honeypot + render-time fields checked by `looksAutomated`.
 */
export function ServerForm({
  fields,
  action,
  submitLabel,
  successTitle,
  successNote,
  footer,
  onSuccess,
}: {
  fields: FormFieldConfig[];
  action: (previous: PublicFormState, formData: FormData) => Promise<PublicFormState>;
  submitLabel: string;
  successTitle: string;
  successNote: ReactNode;
  footer?: ReactNode;
  onSuccess?: () => void;
}) {
  const id = useId();
  const mountedAt = useRef(0);
  const empty = Object.fromEntries(fields.map((f) => [f.name, ""]));
  const [values, setValues] = useState<Values>(empty);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [state, formAction, pending] = useActionState<PublicFormState, FormData>(action, { status: "idle" });
  // The success panel shows for the latest result until "Send another" dismisses it.
  const [dismissed, setDismissed] = useState<PublicFormState | null>(null);
  const showSuccess = state.status === "success" && state !== dismissed;

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
    if (state.status === "error" && state.fieldErrors) {
      const first = fields.find((f) => state.fieldErrors?.[f.name]);
      if (first) document.getElementById(`${id}-${first.name}`)?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to a new action result
  }, [state]);

  const serverErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errorFor = (name: string) => clientErrors[name] || (cleared[name] ? undefined : serverErrors[name]);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setClientErrors((e) => ({ ...e, [name]: "" }));
    setCleared((c) => ({ ...c, [name]: true }));
  };

  const submit = (formData: FormData) => {
    const found = validate(fields, values);
    setClientErrors(found);
    const firstError = fields.find((f) => found[f.name]);
    if (firstError) {
      document.getElementById(`${id}-${firstError.name}`)?.focus();
      return;
    }
    formData.set("startedAt", String(mountedAt.current || Date.now()));
    formData.set("sourcePath", window.location.pathname);
    setCleared({});
    formAction(formData);
  };

  const base =
    "w-full rounded-xl border bg-surface px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:outline-none";

  if (showSuccess && state.status === "success") {
    return (
      <m.div
        role="status"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-semibold text-foreground">{successTitle}</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {successNote}
          {state.reference && state.reference !== "received" && (
            <>
              {" "}
              Your reference is <strong className="font-mono text-foreground">{state.reference}</strong>.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(empty);
            setDismissed(state);
          }}
          className="mt-6 text-sm font-medium text-primary hover:underline"
        >
          Send another
        </button>
      </m.div>
    );
  }

  return (
    <form action={submit} noValidate className="relative space-y-5" aria-describedby={state.status === "error" ? `${id}-form-error` : undefined}>
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-0 h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="hp_extra_info" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <AnimatePresence>
        {state.status === "error" && (
          <m.p
            id={`${id}-form-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-foreground"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
            <span>{state.message}</span>
          </m.p>
        )}
      </AnimatePresence>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const fieldId = `${id}-${field.name}`;
          const error = errorFor(field.name);
          const describedBy = [error ? `${fieldId}-error` : "", field.hint ? `${fieldId}-hint` : ""].filter(Boolean).join(" ") || undefined;
          const common = {
            id: fieldId,
            name: field.name,
            value: values[field.name],
            maxLength: field.maxLength,
            "aria-invalid": Boolean(error),
            "aria-describedby": describedBy,
            "aria-required": field.required,
          };
          return (
            <div key={field.name} className={field.half ? "" : "sm:col-span-2"}>
              <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-foreground">
                {field.label}
                {field.required ? <span className="text-danger"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  {...common}
                  rows={6}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                  className={cn(base, "py-3 leading-relaxed", error ? "border-danger" : "border-border-strong")}
                />
              ) : field.type === "select" ? (
                <select {...common} onChange={(e) => set(field.name, e.target.value)} className={cn(base, "h-11", error ? "border-danger" : "border-border-strong")}>
                  <option value="">Select…</option>
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  type={field.type === "url" ? "text" : (field.type ?? "text")}
                  inputMode={field.type === "url" ? "url" : undefined}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  onChange={(e) => set(field.name, e.target.value)}
                  className={cn(base, "h-11", error ? "border-danger" : "border-border-strong")}
                />
              )}
              {field.hint && !error && (
                <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                  {field.hint}
                </p>
              )}
              {error && (
                <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {footer ? <div className="text-xs text-muted-foreground">{footer}</div> : <span />}
        <m.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgb(109_74_255/0.7)] transition-colors hover:bg-primary-hover disabled:opacity-70 dark:text-primary-foreground"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          {pending ? "Sending…" : submitLabel}
        </m.button>
      </div>
    </form>
  );
}
